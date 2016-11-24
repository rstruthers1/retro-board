/**
 * Created by Rachel on 9/6/2016.
 */
var mysql = require("mysql2");
var bcrypt = require("bcrypt-nodejs");
var pool = mysql.createPool(process.env.CLEARDB_DATABASE_URL);
var moment = require('moment');

var User = require('./models/user');
var Board = require('./models/board');
var Note = require('./models/note');


function RetroBoardDb() {

}

RetroBoardDb.prototype.findById = function(id, callback) {
    pool.getConnection(function(error, connection) {
        if (error) {
            callback(error, null);
            return;
        }
        connection.query('SELECT * FROM user WHERE id = ?', [id], function(error, results, fields) {
            var user = createUserFromDatabaseResults(results);
            callback(error, user);
            connection.release();
        });
    });
};


RetroBoardDb.prototype.findByEmail = function(email, callback) {
    pool.getConnection(function(error, connection) {
        if (error) {
            console.log("error: " + error.toString());
            callback(error, null);
        }
        connection.query('SELECT * FROM user WHERE email = ?', [email], function(error, results, fields) {
            var user = createUserFromDatabaseResults(results);
            callback(error, user);
            connection.release();
        });
    });
};

RetroBoardDb.prototype.findByUsername = function(username, callback) {
    pool.getConnection(function(error, connection) {
        if (error) {
            callback(error, null);
            return;
        }
        connection.query('SELECT * FROM user WHERE username = ?', [username], function(error, results, fields) {
            var user = createUserFromDatabaseResults(results);
            callback(error, user);
            connection.release();
        });
    });
};


RetroBoardDb.prototype.findByUsernameStartingWith = function(username, callback) {
    pool.getConnection(function(error, connection) {
        if (error) {
            callback(error, null);
            return;
        }
        connection.query('SELECT * FROM user WHERE username like ?', username + '%', function(error, results, fields) {
            var users = createUsersFromDatabaseResults(results);
            callback(error, users);
            connection.release();
        });
    });
};

RetroBoardDb.prototype.findByUsernameContains = function(username, callback) {
    pool.getConnection(function(error, connection) {
        if (error) {
            callback(error, null);
            return;
        }
        connection.query('SELECT * FROM user WHERE username like ?', '%' + username + '%', function(error, results, fields) {
            var users = createUsersFromDatabaseResults(results);
            callback(error, users);
            connection.release();
        });
    });
};

RetroBoardDb.prototype.findByFirstNameOrLastNameStartsWithNotAddedToBoard = function(boardId, query, limit, callback) {
    pool.getConnection(function(error, connection) {
        if (error) {
            callback(error, null);
            return;
        }
        connection.query(
            'SELECT u.id, u.email, u.username, u.password_hash, ' +
            'u.first_name, u.last_name, u.reset_password_token, u.reset_password_expires ' +
            'FROM user u ' +
                'left join ' +
                'board_user bu on bu.user_id = u.id and bu.board_id = ? ' +
                'where bu.user_id IS NULL and (u.first_name like ? OR u.last_name like ?)' +
                'order by u.first_name, u.last_name limit ?',
            [boardId, query + '%', query + '%', limit],
            function(error, results, fields) {
            var users = createUsersFromDatabaseResults(results);
            callback(error, users);
            connection.release();
        });
    });
};

RetroBoardDb.prototype.findByResetPasswordToken = function(resetPasswordToken, callback) {
    pool.getConnection(function(error, connection) {
        if (error) {
            callback(error, null);
            return;
        }
        connection.query('SELECT * FROM user WHERE reset_password_token = ?', [resetPasswordToken], function(error, results, fields) {
            var user = createUserFromDatabaseResults(results);
            callback(error, user);
            connection.release();
        });
    });
};

RetroBoardDb.prototype.insertUser = function(user, callback) {
    var userValues = {email: user.email, password_hash: user.password_hash, username: user.username,
        first_name: user.firstname, last_name: user.lastname};

    pool.getConnection(function(error, connection) {
        if (error) {
            callback(error, null);
            return;
        }
        connection.query('INSERT INTO user SET ?', userValues, function(error, results, fields) {
            if (results) {
                user.id = results.insertId;
            }
            callback(error, user);
            connection.release();
        });
    });
};

RetroBoardDb.prototype.updateUser = function(user, callback) {
    var error = null;
    var update = "UPDATE user SET " +
        "first_name = '" + user.firstname + "', " +
        "last_name = '" + user.lastname + "', " +
        "username = '" + user.username  + "', " +
        "email = '" + user.email  + "' ";
    if (user.password_hash && user.password_hash.length > 0) {
        update += ", password_hash = '" + user.password_hash + "' ";
    }

    update += " WHERE id = " + user.id;

    pool.getConnection(function(error, connection) {
        if (error) {
            callback(error, null);
            return;
        }
        connection.query(update, function(error, results, fields) {
            if (error) {
                console.log("--- error: " + error);
            }
            callback(error, user);
            connection.release();
        });
    });
};

RetroBoardDb.prototype.updateUserResetInfo = function(email, resetPasswordToken, resetPasswordExpires, callback) {
    var error = null;
    var dateTimeString = resetPasswordExpires.format("YYYY-MM-DD HH:mm:ss");
    console.log("dateTimeString: " + dateTimeString);
    var update = "UPDATE user SET " +
        "reset_password_token = '" + resetPasswordToken + "', " +
        "reset_password_expires = '" + dateTimeString + "' " +
        "WHERE email = '" + email + "'";

    pool.getConnection(function(error, connection) {
        if (error) {
            callback(error, null);
            return;
        }
        connection.query(update, function(error, results, fields) {
            if (error) {
                console.log("--- error: " + error);
            }
            callback(error);
            connection.release();
        });
    });
};

RetroBoardDb.prototype.clearUserResetInfoAndSetPassword = function(user, callback) {
    var error = null;

    var update = "UPDATE user SET " +
        "reset_password_token = null, " +
        "reset_password_expires = null, " +
            "password_hash = '" + user.password_hash + "' " +
        "WHERE email = '" + user.email + "'";

    pool.getConnection(function(error, connection) {
        if (error) {
            callback(error, null);
            return;
        }
        connection.query(update, function(error, results, fields) {
            if (error) {
                console.log("--- error: " + error);
            }
            callback(error);
            connection.release();
        });
    });
};

RetroBoardDb.prototype.insertBoard = function(boardName, ownerId, callback) {
    var now = moment();
    var dateTimeString = now.format("YYYY-MM-DD HH:mm:ss");
    var boardValues = {name: boardName, owner_id: ownerId, create_date_time: dateTimeString};

    pool.getConnection(function(error, connection) {
        if (error) {
            callback(error, null);
            return;
        }
        connection.query('INSERT INTO board SET ?', boardValues, function(error, results, fields) {
            var board = new Board();
            if (results) {
                board.id = results.insertId;
                board.name = boardName;
                board.ownerId = ownerId;
                board.create_date_time = now.toDate();
            }
            callback(error, board);
            connection.release();
        });
    });
};

RetroBoardDb.prototype.findBoardsByOwnerId = function(ownerId, callback) {
    pool.getConnection(function(error, connection) {
        if (error) {
            callback(error, null);
            return;
        }
        connection.query('SELECT * FROM board WHERE owner_id = ?', [ownerId], function(error, results, fields) {
            var boards = createBoardsFromDatabaseResults(results);
            callback(error, boards);
            connection.release();
        });
    });
};

RetroBoardDb.prototype.findBoardsByUserId = function(userId, callback) {
    console.log("userId: " + userId);
    pool.getConnection(function(error, connection) {
        if (error) {
            console.log(error.toString());
            callback(error, null);
            return;
        }
        connection.query('SELECT b.id, b.name, b.owner_id, b.create_date_time ' +
            'FROM board b ' +
            'LEFT JOIN board_user bu on b.id = bu.board_id ' +
            'WHERE bu.user_id = ?',
            [userId], function(error, results, fields) {
                console.log("query callback");
                console.log("error: " + error);
                console.log(JSON.stringify(results));
                var boards = createBoardsFromDatabaseResults(results);
                callback(error, boards);
                connection.release();
        });
    });
};

RetroBoardDb.prototype.findBoardById = function(id, callback) {
    pool.getConnection(function(error, connection) {
        if (error) {
            callback(error, null);
            return;
        }
        connection.query('SELECT * FROM board WHERE id = ?', [id], function(error, results, fields) {
            var board = createBoardFromDatabaseResults(results);
            callback(error, board);
            connection.release();
        });
    });
};

RetroBoardDb.prototype.hasPermissionToView = function(userId, boardId, callback) {
    pool.getConnection(function(error, connection) {
        if (error) {
            callback(error, null);
            return;
        }
        connection.query('SELECT * FROM board_user WHERE board_id = ? and user_id = ?', [boardId, userId], function(error, results, fields) {

            var hasPermission = results.length;
            callback(error, hasPermission);
            connection.release();
        });
    });
};

RetroBoardDb.prototype.hasBoardAdminPermission = function(userId, boardId, callback) {
    pool.getConnection(function(error, connection) {
        if (error) {
            callback(error, null);
            return;
        }
        connection.query('SELECT * FROM board WHERE id = ? and owner_id = ?', [boardId, userId], function(error, results, fields) {
            var board = createBoardFromDatabaseResults(results);
            var hasPermission = (board != null);
            callback(error, hasPermission);
            connection.release();
        });
    });
};

RetroBoardDb.prototype.addUserToBoard = function(userId, boardId, callback) {
    pool.getConnection(function(error, connection) {
        if (error) {
            callback(error, null);
            return;
        }
        var boardUserValues = {user_id: userId, board_id: boardId};
        connection.query('INSERT INTO board_user SET ?', boardUserValues, function(error, results, fields) {
            callback(error);
            connection.release();
        });
    });
};

RetroBoardDb.prototype.addUsersToBoard = function(boardAndUserIds, callback) {
    pool.getConnection(function(error, connection) {
        if (error) {
            callback(error, null);
            return;
        }
        console.log("boardAndUserIds: " + JSON.stringify(boardAndUserIds));
        connection.query('INSERT INTO board_user (board_id, user_id) VALUES ?', [boardAndUserIds], function(error, results, fields) {
            callback(error);
            connection.release();
        });
    });
};

RetroBoardDb.prototype.findBoardUsers = function(boardId, limit, callback) {
    pool.getConnection(function(error, connection) {
        if (error) {
            callback(error, null);
            return;
        }
        connection.query(
            'SELECT u.id, u.email, u.username, u.password_hash, ' +
            'u.first_name, u.last_name, u.reset_password_token, u.reset_password_expires ' +
            'FROM user u ' +
            'left join ' +
            'board_user bu on bu.user_id = u.id ' +
            'WHERE bu.board_id = ? ' +
            'order by u.first_name, u.last_name limit ?',
            [boardId, limit],
            function(error, results, fields) {
                var users = createUsersFromDatabaseResults(results);
                callback(error, users);
                connection.release();
            });
    });
};

RetroBoardDb.prototype.addNoteToBoard = function(userId, boardId, message, top, left, stickyId, callback) {
    pool.getConnection(function(error, connection) {
        if (error) {
            callback(error, null);
            return;
        }
        var now = moment();
        var dateTimeString = now.format("YYYY-MM-DD HH:mm:ss");
        var noteValues = {creator_id: userId, board_id: boardId, message: message, top_pos: top, left_pos: left,
            sticky_id: stickyId, create_date_time: dateTimeString};
        connection.query('INSERT INTO note SET ?', noteValues, function(error, results, fields) {
            callback(error);
            connection.release();
        });
    });
};

RetroBoardDb.prototype.findBoardNotes = function(boardId, callback) {
    pool.getConnection(function(error, connection) {
        if (error) {
            callback(error, null);
            return;
        }
        connection.query(
            'SELECT n.id, n.creator_id, n.create_date_time, n.board_id, ' +
            'n.message, n.top_pos, n.left_pos, n.sticky_id, unv.user_id  ' +
            'FROM note n ' +
            'left join ' +
            'board b on n.board_id = b.id ' +
            'left join user_note_vote unv on n.id = unv.note_id ' +
            'WHERE b.id = ? ',
            [boardId],
            function(error, results, fields) {
                var notes = createNotesWithVotesFromDatabaseResults(results);
                callback(error, notes);
                connection.release();
            });
    });
};

RetroBoardDb.prototype.updateNotePosition = function(top, left, stickyId, callback) {
    pool.getConnection(function(error, connection) {
        if (error) {
            callback(error, null);
            return;
        }

        var updateString = "UPDATE note SET top_pos = " + top +
            ", left_pos = " + left + " where sticky_id = '" + stickyId + "'";
        console.log("updateString: " + updateString);
        connection.query(updateString, function(error, results, fields) {
            callback(error);
            connection.release();
        });
    });
};

RetroBoardDb.prototype.updateNoteMessage = function(message, stickyId, callback) {
    pool.getConnection(function(error, connection) {
        if (error) {
            callback(error, null);
            return;
        }

        var updateString = "UPDATE note SET message = '" + message + "' "
            + " where sticky_id = '" + stickyId + "'";
        console.log("updateString: " + updateString);
        connection.query(updateString, function(error, results, fields) {
            callback(error);
            connection.release();
        });
    });
}

RetroBoardDb.prototype.insertUserNoteVote = function(userId, stickyId, callback) {
    pool.getConnection(function(error, connection) {
        if (error) {
            callback(error, null);
            return;
        }
        var selectQuery = "SELECT id FROM note WHERE sticky_id = ?";

        connection.query(selectQuery, [stickyId], function(error, results, fields) {
            if (error) {
                callback(error);
                return;
            }
            if (!results || results.length < 1) {
                callback("Unable to find sticky note with id: " + stickyId);
                return;
            }
            console.log("note results: %j", results);
            var noteId = results[0].id;
            console.log("note id: " + noteId);
            var userNoteVoteValues = {user_id: userId, note_id: noteId, sticky_id: stickyId};
            var insertQuery = "INSERT INTO user_note_vote SET ?";
            connection.query(insertQuery, userNoteVoteValues, function(error, results, fields) {
                if (error) {
                    callback(error);
                    return;
                }
                callback(null);
                connection.release();
            });

        });
    });
}

RetroBoardDb.prototype.deleteUserNoteVote = function(userId, stickyId, callback) {
    pool.getConnection(function(error, connection) {
        if (error) {
            callback(error, null);
            return;
        }

        var deleteQuery = "DELETE FROM user_note_vote WHERE " +
                "user_id = ? AND sticky_id = ?";
        connection.query(deleteQuery, [userId, stickyId], function(error, results, fields) {
            callback(error);
            connection.release();
        });
    });
}


RetroBoardDb.prototype.getUserNoteVotes = function(stickyId, callback) {
    pool.getConnection(function(error, connection) {
        if (error) {
            callback(error, null);
            return;
        }

        var selectQuery = "SELECT * FROM user_note_vote WHERE sticky_id = ?";
        connection.query(selectQuery, [stickyId], function(error, results, fields) {
            if (error) {
                callback(error, null);
                return;
            }
            callback(null, results);
            connection.release();
        });
    });
}

RetroBoardDb.prototype.deleteNote = function(stickyId, callback) {
    pool.getConnection(function(error, connection) {
        if (error) {
            callback(error, null);
            return;
        }

        var deleteString = "delete from note "
            + " where sticky_id = ?";
        console.log("deleteString: " + deleteString);
        connection.query(deleteString, [stickyId], function(error, results, fields) {
            callback(error);
            connection.release();
        });
    });
}



function createUserFromDatabaseResults(results) {
    var user = null;
    if (results && results.length > 0) {
        user = new User();
        user.email = results[0].email;
        user.password_hash = results[0].password_hash;
        user.id = results[0].id;
        user.username = results[0].username;
        user.firstname = results[0].first_name;
        user.lastname = results[0].last_name;
        user.resetPasswordToken = results[0].reset_password_token;
        user.resetPasswordExpires = results[0].reset_password_expires;
    }
    return user;
}

function createUsersFromDatabaseResults(results) {
    var users = [];
    if (results && results.length > 0) {
        for (var i = 0; i < results.length; i++) {
            var user = new User();
            user.email = results[i].email;
            user.password_hash = results[i].password_hash;
            user.id = results[i].id;
            user.username = results[i].username;
            user.firstname = results[i].first_name;
            user.lastname = results[i].last_name;
            user.resetPasswordToken = results[i].reset_password_token;
            user.resetPasswordExpires = results[i].reset_password_expires;
            users.push(user);
         }
    }
    return users;
}

function createNotesFromDatabaseResults(results) {
    var notes = [];

    if (results && results.length > 0) {
        for (var i = 0; i < results.length; i++) {
            var note = new Note(results[i].creator_id, results[i].create_date_time, results[i].board_id, results[i].message,
            results[i].top_pos, results[i].left_pos, results[i].sticky_id, results[i].id);
            notes.push(note);
        }
    }
    return notes;
};

function createNotesWithVotesFromDatabaseResults(results) {
    var notes = [];

    if (results && results.length > 0) {
        for (var i = 0; i < results.length; i++) {
            var foundNote = false;
            for (var j = 0; j < notes.length; j++) {
                if (results[i].sticky_id === notes[j].stickyId) {
                    if (results[i].user_id) {
                        if (!notes[j].userVotes) {
                            notes[j].userVotes = [];
                        }
                        notes[j].userVotes.push(results[i].user_id);
                    }
                    foundNote = true;
                    break;
                }
            }
            if (foundNote) {
                continue;
            }


            var note = new Note(results[i].creator_id, results[i].create_date_time, results[i].board_id, results[i].message,
                results[i].top_pos, results[i].left_pos, results[i].sticky_id, results[i].id);

            if (results[i].user_id) {
                note.userVotes = [];
                note.userVotes.push(results[i].user_id);
            }

            notes.push(note);
        }
    }
    return notes;
};

function createBoardsFromDatabaseResults(results) {
    var boards = null;
    if (results) {
        boards = [];
        for (var i = 0; i < results.length; i++) {
            var board = new Board(results[i].name, results[i].owner_id, results[i].create_date_time, results[i].id);
            boards.push(board);
        }
    }
    return boards;
}

function createBoardFromDatabaseResults(results) {
    var boards = createBoardsFromDatabaseResults(results);
    if (!boards || boards.length == 0) {
        return null;
    }
    return boards[0];
}


module.exports = RetroBoardDb;