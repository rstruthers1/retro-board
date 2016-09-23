/**
 * Created by Rachel on 9/6/2016.
 */
var mysql = require("mysql2");
var bcrypt = require("bcrypt-nodejs");
var pool = mysql.createPool(process.env.CLEARDB_DATABASE_URL);
var moment = require('moment');

var User = require('./models/user');


function RetroBoardDb() {

}

RetroBoardDb.prototype.findById = function(id, callback) {
    pool.getConnection(function(error, connection) {
        connection.query('SELECT * FROM user WHERE id = ?', [id], function(error, results, fields) {
            var user = createUserFromDatabaseResults(results);
            callback(error, user);
            connection.release();
        });
    });
};


RetroBoardDb.prototype.findByEmail = function(email, callback) {
    pool.getConnection(function(error, connection) {
        connection.query('SELECT * FROM user WHERE email = ?', [email], function(error, results, fields) {
            var user = createUserFromDatabaseResults(results);
            callback(error, user);
            connection.release();
        });
    });
};

RetroBoardDb.prototype.findByUsername = function(username, callback) {
    pool.getConnection(function(error, connection) {
        connection.query('SELECT * FROM user WHERE username = ?', [username], function(error, results, fields) {
            var user = createUserFromDatabaseResults(results);
            callback(error, user);
            connection.release();
        });
    });
};

RetroBoardDb.prototype.findByResetPasswordToken = function(resetPasswordToken, callback) {
    pool.getConnection(function(error, connection) {
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
        connection.query(update, function(error, results, fields) {
            if (error) {
                console.log("--- error: " + error);
            }
            callback(error);
            connection.release();
        });
    });
};

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

module.exports = RetroBoardDb;