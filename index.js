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

app.listen(port, function () {
    console.log('Example app listening on port ' + port + '!');
});
