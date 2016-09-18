/**
 * Created by Rachel on 9/14/2016.
 */

require("./user");
var RetroBoardDb = require("../retroboarddb");

function UserUniquenessChecker(user, username, email) {
    this.user = user;
    this.username = username;
    this.email = email;
};

UserUniquenessChecker.prototype.run = function(callback) {
    var db = new RetroBoardDb();
    if (this.user.email == this.email &&
            this.user.username == this.username) {
        callback(null);
        return;
    }
    var this2 = this;
    db.findByEmail(this.email, function(err, found_user) {

        if (err) {
            callback(err);
            return;
        }
        if (found_user && this2.user.email != this2.email) {
            callback("That email is already taken");
            return;
        } else {
            var this3 = this2;
            db.findByUsername(this3.username, function(err, found_user) {
                if (err) {
                    callback(err);
                    return;
                }
                if (found_user && this3.user.username != this3.username) {
                    callback("That username is already taken");
                    return;
                }
                callback(null);
            });
        }

    });

};

module.exports = UserUniquenessChecker;