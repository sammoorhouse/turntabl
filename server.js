// load the auth variables
require('dotenv').config({silent: true}); //for dev. In production, variables are in the environment.

// set up ======================================================================
// get all the tools we need
var express  = require('express');
var app      = express();
var port     = process.env.PORT || 8080;
var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');

var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');

// configuration ===============================================================
mongoose.connect(process.env.mongodb_connectionURL); // connect to our database

require('./config/passport')(passport); // pass passport for configuration

//js,css
app.use('/js', express.static('js'));
app.use('/css', express.static('css'));
app.use('/bootstrap3', express.static('bootstrap3'));
app.use('/bootstrap', express.static('bootstrap'));
app.use('/fontawesome', express.static('fontawesome'));
app.use('/font-awesome', express.static('font-awesome'));
app.use('/bower_components', express.static('bower_components'));
app.use('/fonts', express.static('fonts'));
app.use('/img', express.static('img'));


// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser()); // get information from html forms

app.set('view engine', 'ejs'); // set up ejs for templating

// required for passport
app.use(session({ secret: 'ilovescotchscotchyscotchscotch' })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

// routes ======================================================================
require('./app/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport

// launch ======================================================================
app.listen(port);
console.log('The magic happens on port ' + port);