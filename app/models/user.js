/**
 * Created by Rachel on 9/6/2016.
 */

var bcrypt   = require('bcrypt-nodejs');

function User(email, password, username, firstname, lastname, id) {
    this.email = email;
    if (password && password.length > 0) {
        this.password_hash = bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
    } else {
        this.password_hash = null;
    }
    this.username = username;
    this.firstname = firstname;
    this.lastname = lastname;
    this.id = id;
}

User.prototype.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password_hash);
};

User.prototype.setPassword = function(password) {
    this.password =  bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

module.exports = User;