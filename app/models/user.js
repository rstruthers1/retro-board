/**
 * Created by Rachel on 9/6/2016.
 */

var bcrypt   = require('bcrypt-nodejs');

function User(email, password, username, firstname, lastname, id) {
    this.email = email;
    this.password_hash = bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
    this.username = username;
    this.firstname = firstname;
    this.lastname = lastname;
    this.id = id;
}

User.prototype.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password_hash);
};

module.exports = User;