/**
 * Created by Rachel on 9/4/2016.
 */

var express = require('express');
var app = express();

var port = process.env.PORT || 8080;


app.get('/', function (req, res) {
    res.send('Hello World! I was deployed from github! Test autodeploy');
});

app.listen(port, function () {
    console.log('Example app listening on port 8080!');
});
