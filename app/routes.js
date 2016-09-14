/**
 * Created by Rachel on 9/4/2016.
 */

var RetroBoardDb = require('./retroboarddb');
var db = new RetroBoardDb();


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

        res.render('pages/profile.ejs', {message: req.flash('profileMessage'),
            firstname: req.user.firstname,
            lastname: req.user.lastname,
            username: req.user.username,
            email: req.user.email,
            id: req.user.id
        });
    });

    app.post('/profile', isLoggedIn, function (req, res, next) {
        var user = req.user;
        res.redirect("/profile");
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
