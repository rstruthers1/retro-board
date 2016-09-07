/**
 * Created by Rachel on 9/6/2016.
 */
var mysql = require("mysql2");
var bcrypt = require("bcrypt-nodejs");
var User = require('./models/user');
var pool = mysql.createPool(process.env.CLEARDB_DATABASE_URL);


function RetroBoardDb() {

}

RetroBoardDb.prototype.findByEmail = function(email, callback) {

    pool.getConnection(function(error, connection) {
        connection.query('SELECT * FROM user WHERE email = ?', [email], function(error, results, fields) {

            var user = null;
            console.log(results);
            if (results && results.length > 0) {
                user = new User();
                user.email = results[0].email;
                user.password_hash = results[0].password_hash;
                user.id = results[0].id;
                user.username = results[0].username;
                user.firstname = results[0].first_name;
                user.lastname = results[0].last_name;
            }
            callback(error, user);
            connection.release();
        });
    });
};

RetroBoardDb.prototype.findByUsername = function(username, callback) {

    pool.getConnection(function(error, connection) {
        connection.query('SELECT * FROM user WHERE username = ?', [username], function(error, results, fields) {

            var user = null;
            console.log(results);
            if (results && results.length > 0) {
                user = new User();
                user.email = results[0].email;
                user.password_hash = results[0].password_hash;
                user.id = results[0].id;
                user.username = results[0].username;
                user.firstname = results[0].first_name;
                user.lastname = results[0].last_name;
            }
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
            callback(error, user);
            connection.release();
        });
    });
};

module.exports = RetroBoardDb;