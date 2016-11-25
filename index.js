/**
 * Created by Rachel on 9/4/2016.
 */

var express = require('express');
var app = express();

var passport = require('passport');
var Strategy = require('passport-local').Strategy;
var RetroBoardDb = require('./app/retroboarddb');
var User = require('./app/models/user');
var flash    = require('connect-flash');
var UserConnection = require('./app/models/userConnection');
var Board = require('./app/models/board');


var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var methodOverride = require('method-override');


var port = process.env.PORT || 8080;

app.use(morgan('dev')); // log every request to the console
app.use( cookieParser() );
app.use(bodyParser()); // get information from html forms
app.use(bodyParser.urlencoded({'extended':'true'}));            // parse application/x-www-form-urlencoded
app.use(bodyParser.json());                                     // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
app.use(methodOverride());
// override with the X-HTTP-Method-Override header in the request. simulate DELETE/PUT
app.use(methodOverride('X-HTTP-Method-Override'));

// Configure the local strategy for use by Passport.
//
// The local strategy require a `verify` function which receives the credentials
// (`username` and `password`) submitted by the user.  The function must verify
// that the password is correct and then invoke `cb` with a user object, which
// will be set at `req.user` in route handlers after authentication.
passport.use('local-login', new Strategy({
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true
    },
    function(req, email, password, cb) {
        var db = new RetroBoardDb();
        db.findByEmail(email, function(err, user) {
            if (err) { return cb(err); }
            if (!user) { return cb(null, false, req.flash('loginMessage', 'Invalid username or password'));}
            if (!user.validPassword(password)) { return cb(null, false, req.flash('loginMessage', 'Invalid username or password'));}
            return cb(null, user);
        });
    }));

passport.use('local-signup', new Strategy(
    {
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true
    },
    function(req, email, password, cb) {
        var db = new RetroBoardDb();
        db.findByEmail(email, function(err, user) {
            if (err) { return cb(err); }
            if (user) { return cb(null, false, req.flash('signupMessage', 'That email is already taken.')); }
            else {
                db.findByUsername(req.body.username, function(err, user) {
                    if (user) { return cb(null, false, req.flash('signupMessage', 'That username is already taken.')); }
                    else {
                        var user = new User(email, password, req.body.username, req.body.firstname, req.body.lastname);
                        db.insertUser(user, function (err) {
                            if (err) {
                                return cb(err);
                            }
                            return cb(null, user);
                        });
                    }
                });
            }
        });
    }
));

// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  The
// typical implementation of this is as simple as supplying the user ID when
// serializing, and querying the user record by ID from the database when
// deserializing.
passport.serializeUser(function(user, cb) {
    cb(null, user.id);
});

passport.deserializeUser(function(id, cb) {
    var db = new RetroBoardDb();
    db.findById(id, function (err, user) {
        if (err) { return cb(err); }
        cb(null, user);
    });
});


app.use(express.static(__dirname + '/public'));

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(session({ secret: 'ilovescotchscotchyscotchscotch' })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

app.use(function(req,res,next){
    res.locals.login = req.isAuthenticated();
    res.locals.user = req.user;
    next();
});


require('./app/routes.js')(app, passport);
var db = new RetroBoardDb();
var io = require('socket.io').listen(
    app.listen(port, function() {
        console.log('Node app is running on port', port);
    }));

var boards = [];

function findBoardById(boardId) {
  for (var i = 0; i < boards.length; i++) {
      if (boardId == boards[i].id) {
          return boards[i];
      }
  }
  return null;
};

function idFoundInUserConnections(userId, userConnections) {
    for (var i = 0; i < userConnections.length; i++) {
        if (userId == userConnections[i].userId) {
            return true;
        }
    }
    return false;
}

function createUserWithStatus(user) {
    var userWithStatus = {};
    userWithStatus.id = user.id;
    userWithStatus.firstname = user.firstname;
    userWithStatus.lastname = user.lastname;
    userWithStatus.username = user.username;
    userWithStatus.connected = false;
    return userWithStatus;
}

function createUsersWithConnectionStatusList(users, userConnections) {
    var connectedUsers = [];
    var disconnectedUsers = [];
    for (var i = 0; i < users.length; i++) {
        var user = users[i];
        var userWithStatus = createUserWithStatus(user);
        if (idFoundInUserConnections(user.id, userConnections)) {
            userWithStatus.connected = true;
            connectedUsers.push(userWithStatus);
        } else {
            userWithStatus.connected = false;
            disconnectedUsers.push(userWithStatus);
        }
    }
    var usersWithStatus = [];
    for (var i = 0; i < connectedUsers.length; i++) {
        usersWithStatus.push(connectedUsers[i]);
    }

    for (var i = 0; i < disconnectedUsers.length; i++) {
        usersWithStatus.push(disconnectedUsers[i]);
    }

    return usersWithStatus;
}

io.sockets.on('connection', function (socket) {
    console.log("connection, socket id: " + socket.id);
    var boardId = null;
    var boardUser = null;



    socket.on('user joined', function(data) {
        // User connected to board
        //console.log("data %j", data);
        console.log("socket id: " + socket.id.toString());
        boardId = data.board_id;
        socket.join(data.board_id);

        var board = findBoardById(boardId);
        if (board == null) {
            board = new Board();
            board.id = boardId;
            boards.push(board);
        }

        var userConnection = new UserConnection(data.user_id, socket.id.toString());
        board.addUserConnection(userConnection);

        var userConnections = board.getUserConnections();

        db.findBoardNotes(boardId, function(error, notes) {

            if (error) {
                console.log(error.toString());
            } else {

               console.log("notes: " + JSON.stringify(notes));
                socket.emit("initial notes", notes);
                db.findBoardUsers(boardId, 500, function (error, users) {
                    if (error) {
                        console.log(error.toString());
                    } else {
                        var data = {};
                        data.usersWithConnectionStatus = createUsersWithConnectionStatusList(users, userConnections);
                        //console.log(JSON.stringify(data));
                        io.sockets.in(boardId).emit('user joined', data);
                    }
                });
            }
        });

    });

    socket.on('sticky added', function(data) {
        console.log("data %j", data);
        console.log("socket id: " + socket.id.toString());
       // io.sockets.in(boardId).emit('sticky added', data);

        db.addNoteToBoard(data.user_id, data.board_id, data.sticky_message, data.top, data.left, data.sticky_id, function(error) {
            if (error) {
                console.log(error);
            }
        });
    });

    socket.on('sticky deleted', function(data) {
        console.log("data %j", data);
        console.log("socket id: " + socket.id.toString());


        db.deleteNote(data.sticky_id, function(error) {
            if (error) {
                console.log(error);
            }
            io.sockets.in(boardId).emit('sticky deleted', data);
        });
    });

    socket.on('sticky dropped', function(data) {
        console.log("sticky dropped: data: %j", data);
        console.log("socket id: " + socket.id.toString());

        db.updateNotePosition(data.top, data.left, data.sticky_id, data.section_name, function(error) {
            if (error) {
                console.log(error);
            }
            io.sockets.in(boardId).emit('sticky dropped', data);
        });

    });

    socket.on('sticky message updated', function(data) {
        console.log("sticky message updated: data: %j", data);
        console.log("socket id: " + socket.id.toString());
        db.updateNoteMessage(data.message, data.sticky_id, function(error) {
            if (error) {
                console.log(error);
            }
            io.sockets.in(boardId).emit('sticky message updated', data);
        });

    });

    socket.on('sticky upvote', function(data) {
        console.log("sticky upvote: data: %j", data);
        console.log("socket id: " + socket.id.toString());
        db.insertUserNoteVote(data.user_id, data.sticky_id, function(error) {
            if (error) {
                console.log(error);
                return;
            }

            db.getUserNoteVotes(data.sticky_id, function(error, results) {
                if (error) {
                    console.log(error);
                    return;
                }
                console.log("got results for getUserNoteVotes: %j", results);
                var votesForSticky = {sticky_id: data.sticky_id, votes: results};
                io.sockets.in(boardId).emit('sticky upvote', votesForSticky);
            });
        });

    });

    socket.on('sticky downvote', function(data) {
        console.log("sticky downvote: data: %j", data);
        console.log("socket id: " + socket.id.toString());
        db.deleteUserNoteVote(data.user_id, data.sticky_id, function(error) {
            if (error) {
                console.log(error);
                return;
            }

            db.getUserNoteVotes(data.sticky_id, function(error, results) {
                if (error) {
                    console.log(error);
                    return;
                }
                console.log("got results for getUserNoteVotes: %j", results);
                var votesForSticky = {sticky_id: data.sticky_id, votes: results};
                io.sockets.in(boardId).emit('sticky upvote', votesForSticky);
            });
        });

    });

    socket.on('disconnect', function() {
        if (boardId) {
            var board = findBoardById(boardId);
            board.removeUserConnection(socket.id.toString());
            board.printUserConnections();

            var userConnections = board.getUserConnections();
            db.findBoardUsers(boardId, 500, function(error, users) {
                if (error) {
                    console.log(error.toString());
                } else {
                    var data = {};
                    data.usersWithConnectionStatus = createUsersWithConnectionStatusList(users, userConnections);
                    console.log(JSON.stringify(data));
                    io.sockets.in(boardId).emit('user left', data);
                }
            });
        }
    });

});


