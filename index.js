/**
 * Created by Rachel on 9/4/2016.
 */

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');

var passport = require('passport');
var session = require('express-session');
var flash    = require('connect-flash');



var morgan = require('morgan');


var port = process.env.PORT || 8080;

app.use(morgan('dev')); // log every request to the console
app.use( cookieParser() );
app.use(session({
    secret: 'appsecret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: true,
        maxAge: new Date(Date.now() + 3600000)
    }
}));

app.use(flash()); // use connect-flash for flash messages stored in session

app.use(express.static(__dirname + '/public'));

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');


require('./app/routes.js')(app, passport);

app.listen(port, function () {
    console.log('Example app listening on port ' + port + '!');
});
