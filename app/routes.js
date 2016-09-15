/**
 * Created by Rachel on 9/4/2016.
 */

var RetroBoardDb = require('./retroboarddb');
var db = new RetroBoardDb();
var validator = require('validator');
var UserUniquenessChecker = require('./models/userUniquenessChecker');
var User = require('./models/user');

module.exports = function (app, passport) {

    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    app.get('/', function (req, res) {
        res.render('pages/index');
    });


    // =====================================
    // LOGIN ===============================
    // =====================================
    // show the login form
    app.get('/login', function (req, res) {
        // render the page and pass in any flash data if it exists
        res.render('pages/login.ejs', {message: req.flash('loginMessage'),
            email: req.flash("email")});
    });

    app.post('/login', function (req, res, next) {
        passport.authenticate('local-login', function (err, user, info) {
            req.flash("email", req.body.email);
            if (err) {
                return next(err);
            }
            if (!user) {
                return res.redirect('/login' );
            }
            req.logIn(user, function (err) {
                if (err) {
                    return next(err);
                }
                return res.redirect('/');
            });
        })(req, res, next);
    });

    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/logout', function (req, res) {
        req.logout();
        res.redirect('/');
    });


    // =====================================
    // SIGNUP ==============================
    // =====================================

    app.get('/signup', function (req, res) {

        // render the page and pass in any flash data if it exists
        res.render('pages/signup.ejs', {message: req.flash('signupMessage'),
            firstname: req.flash("firstname"),
            lastname: req.flash("lastname"),
            username: req.flash("username"),
            email: req.flash("email")
        });
    });

    app.post('/signup', function (req, res, next) {
        passport.authenticate('local-signup', function (err, user, info) {
            req.flash("firstname", req.body.firstname);
            req.flash("lastname", req.body.lastname);
            req.flash("username", req.body.username);
            req.flash("email", req.body.email);
            if (err) {
                return next(err);
            }
            if (!user) {
                return res.redirect('/signup' );
            }
            req.logIn(user, function (err) {
                if (err) {
                    return next(err);
                }
                return res.redirect('/');
            });
        })(req, res, next);
    });

    // =====================================
    // PROFILE ==============================
    // =====================================

    app.get('/profile', isLoggedIn, function (req, res) {
        var user = req.user;
        var firstname = user.firstname;
        var lastname = user.lastname;
        var username = user.username;
        var email = user.email;
        if (req.flash("profile_submit").toString() == "true") {
            firstname = req.flash("firstname");
            lastname = req.flash("lastname");
            username = req.flash("username");
            email = req.flash("email");
        }

        res.render('pages/profile.ejs', {message: req.flash('profileMessage'),
            firstname: firstname,
            lastname: lastname,
            username:username,
            email: email,
            error_firstname: req.flash('error_firstname'),
            error_lastname: req.flash('error_lastname'),
            error_username: req.flash('error_username'),
            error_email: req.flash('error_email'),
            error_password: req.flash('error_password'),
            id: req.user.id
        });
    });

    app.post('/profile', isLoggedIn, function (req, res, next) {
        var user = req.user;
        req.flash("profile_submit", "true");
        req.flash("firstname", req.body.firstname);
        req.flash("lastname", req.body.lastname);
        req.flash("username", req.body.username);
        req.flash("email", req.body.email);


        var valid = validateProfile(req);

        if (!valid) {
            res.redirect("/profile");
        } else {
            var firstname = req.body.firstname.trim();
            var lastname = req.body.lastname.trim();
            var username = req.body.username.trim();
            var email = req.body.email.trim();
            var password = req.body.password.trim();
            var userUniquenessChecker = new UserUniquenessChecker(user, username, email);
            userUniquenessChecker.run(function(error) {
                if (error) {
                    req.flash("profileMessage", error);
                    res.redirect("/profile");
                    return;
                }
                user = new User(email, password, username, firstname, lastname, user.id);
                db.updateUser(user, function(error, user) {
                    if (error) {
                        req.flash("profileMessage", error);
                        res.redirect("/profile");
                        return;
                    }
                    req.logIn(user, function (err) {
                        if (err) {
                            req.flash("profileMessage", err);
                            res.redirect("/profile");
                            return;
                        }
                        res.redirect('/profile');
                    });
                });
            });

        }
    });

    function validateProfile(req) {
        var firstname = req.body.firstname.trim();
        var lastname = req.body.lastname.trim();
        var username = req.body.username.trim();
        var email = req.body.email.trim();
        var password = req.body.password.trim();
        var confirmPassword = req.body.confirm_password.trim();

        console.log("firstname: " + firstname);
        console.log("lastname: " + lastname);
        console.log("username: " + username);
        console.log("email: " + email);

        var valid = true;

        if (firstname.length < 2) {
            req.flash("error_firstname", "Your firstname must consist of at least 2 characters");
            valid = false;
        }
        if (lastname.length < 2) {
            req.flash("error_lastname", "Your lastname must consist of at least 2 characters");
            valid = false;
        }
        if (username.length < 6) {
            req.flash("error_username", "Your username must consist of at least 6 characters");
            valid = false;
        }

        if (password.length > 0 || confirmPassword.length > 0) {
            if (password.length < 8) {
                req.flash("error_password", "Your password must consist of at least 8 characters");
                valid = false;
            } else if (password != confirmPassword) {
                req.flash("error_password", "Your password and confirm password do not match");
                valid = false;
            }
        }

        if (!validator.isEmail(email)) {
            req.flash("error_email", "Please enter a valid email address");
            valid = false;
        }

        return valid;
    }

    // route middleware to make sure a user is logged in
    function isLoggedIn(req, res, next) {
        // if user is authenticated in the session, carry on
        if (req.isAuthenticated())
            return next();

        // if they aren't redirect them to the home page
        res.redirect('/');
    }

}
