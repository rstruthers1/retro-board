/**
 * Created by Rachel on 9/14/2016.
 */

require("./user");

function UserUniquenessChecker(user, username, email) {
    this.user = user;
    this.username = username;
    this.email = email;
    this.checkedEmail = false;
    this.checkedUsername = false;
};

UserUniquenessChecker.prototype.run = function(callback) {
    callback(null);
};

module.exports = UserUniquenessChecker;