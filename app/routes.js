/**
 * Created by Rachel on 9/4/2016.
 */

var validator = require('validator');
var async = require('async');
var crypto = require('crypto');
var moment = require('moment');
var nodemailer = require('nodemailer');

var RetroBoardDb = require('./retroboarddb');
var db = new RetroBoardDb();
var UserUniquenessChecker = require('./models/userUniquenessChecker');
var User = require('./models/user');
var Board = require('./models/board');



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
        console.log("app.get, var email: " + email);
        if (req.flash("profile_submit").toString() == "true") {
            firstname = req.flash("firstname");
            lastname = req.flash("lastname");
            username = req.flash("username");
            email = req.flash("email");
        }
        res.render('pages/profile.ejs', {message: req.flash('profileMessage'),
            error_message: req.flash('error_profileMessage'),
            firstname: firstname,
            lastname: lastname,
            username: username,
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
        req.flash("email", "");
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
                    req.flash("error_profileMessage", error);
                    res.redirect("/profile");
                    return;
                }
                user = new User(email, password, username, firstname, lastname, user.id);
                db.updateUser(user, function(error, user) {
                    if (error) {
                        req.flash("error_profileMessage", error.toString());
                        res.redirect("/profile");
                        return;
                    }
                    req.logIn(user, function (err) {
                        if (err) {
                            req.flash("error_profileMessage", err.toString());
                            res.redirect("/profile");
                            return;
                        }
                        req.flash("profileMessage", "Profile updated");
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

    // =====================================
    // FORGOT PASSWORD
    // =====================================
    app.get('/forgot', function (req, res) {

        res.render('pages/forgot', {error_message: req.flash('error_forgotMessage'),
            message: req.flash('forgotMessage'),
            email: req.flash('email')});
    });

    app.post('/forgot', function (req, res, next) {
        req.flash("email", "");
        req.flash("email", req.body.email);
        console.log("calling async.waterfall");

        async.waterfall([
            function(done) {
                crypto.randomBytes(20, function(err, buf) {
                    var token = buf.toString('hex');
                    done(err, token);
                });

            },
            function(token, done) {
                db.findByEmail(req.body.email, function(err, user) {
                    if (!user) {
                        req.flash('error_forgotMessage', 'No account with that email address exists.');
                        return res.redirect('/forgot');
                    }

                    var resetPasswordExpires = moment().add(1, 'hours');
                    db.updateUserResetInfo(req.body.email, token, resetPasswordExpires, function(err) {
                        done(err, token, user);
                    });
                });
            },
            function(token, user, done) {
                var smtpTransport = nodemailer.createTransport('SMTP', {
                    service: 'SendGrid',
                    auth: {
                        user: process.env.SENDGRID_USERNAME,
                        pass: process.env.SENDGRID_PASSWORD
                    }
                });
                var mailOptions = {
                    to: req.body.email,
                    from: 'do-not-reply@easy-retro-board.herokuapp.com',
                    subject: 'password reset',
                    text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                'http://' + req.headers.host + '/reset/' + token + '\n\n' +
                'If you did not request this, please ignore this email and your password will remain unchanged.\n'
                };
                smtpTransport.sendMail(mailOptions, function(err, info) {
                    done(err);
                });

            }
            ], function (err) {

                if (err) {
                    return next(err);
                }
                req.flash('forgotMessage', 'Email sent.');
                res.redirect('/forgot');
            }
        );

    });

    // =====================================
    // RESET PASSWORD
    // =====================================

    app.get('/reset/:token', function(req, res) {
        db.findByResetPasswordToken(req.params.token, function(err, user) {
            if (!user) {
                req.flash('error_forgotMessage', 'Password reset token is invalid or has expired.');
                return res.redirect('/forgot');
            }
            if (Date.now() > user.resetPasswordExpires) {
                req.flash('error_forgotMessage', 'Password reset token is invalid or has expired.');
                return res.redirect('/forgot');
            }
            res.render('pages/reset', {
                message: "",
                user: user
            });
        });
    });

    app.get('/reset', function(req, res) {
        req.flash('error_forgotMessage', 'Password reset token is invalid or has expired.');
        return res.redirect('/forgot');
    });

    app.post('/reset', function(req, res) {
        async.waterfall([
            function(done) {
                db.findByResetPasswordToken(req.body.token, function(err, user) {
                    if (!user) {
                        req.flash('error_forgotMessage', 'Password reset token is invalid or has expired. Bad token!');
                        return res.redirect('/forgot');
                    }
                    if (Date.now() > user.resetPasswordExpires) {
                        req.flash('error_forgotMessage', 'Password reset token is invalid or has expired. Expired!');
                        return res.redirect('/forgot');
                    }
                    user.setPassword(req.body.password);

                    db.clearUserResetInfoAndSetPassword(user, function(err) {
                        req.logIn(user, function(err) {
                            done(err, user);
                        });
                    });
                });
            },
            function(user, done) {
                var smtpTransport = nodemailer.createTransport('SMTP', {
                    service: 'SendGrid',
                    auth: {
                        user: process.env.SENDGRID_USERNAME,
                        pass: process.env.SENDGRID_PASSWORD
                    }
                });
                var mailOptions = {
                    to: user.email,
                    from: 'do-not-reply@easy-retro-board.herokuapp.com',
                    subject: 'Your password has been changed',
                    text: 'Hello,\n\n' +
                    'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
                };
                smtpTransport.sendMail(mailOptions, function(err) {
                    req.flash('success', 'Success! Your password has been changed.');
                    done(err);
                });
            }
        ], function(err) {
            res.redirect('/');
        });
    });

    // =====================================
    // Create Board
    // =====================================

    app.get('/board-create', isLoggedIn, function (req, res, next) {
        res.render('pages/board-create', {
            message: req.flash("createMessage"),
            error_message: req.flash("error_createMessage"),
            name: req.flash("board_name")
        });
    });

    app.post('/board-create', isLoggedIn, function (req, res, next) {
        req.flash("board_name", req.body.name);
        db.insertBoard(req.body.name, req.user.id, function(error, board) {
            if (error) {
                req.flash("error_createMessage", error.toString());
                res.redirect("/board-create");
                return;
            }
            req.flash("createMessage", 'Board "' + board.name + '" created successfully!');
            res.redirect('/board-created');
        });

    });

    app.get('/board-created', isLoggedIn, function (req, res, next) {
        res.render('pages/board-created', {
            message: req.flash("createMessage"),
            error_message: req.flash("error_createMessage"),
            name: req.flash("board_name")
        });
    });

    // route middleware to make sure a user is logged in
    function isLoggedIn(req, res, next) {
        // if user is authenticated in the session, carry on
        if (req.isAuthenticated())
            return next();

        // if they aren't redirect them to the home page
        res.redirect('/');
    }

}
