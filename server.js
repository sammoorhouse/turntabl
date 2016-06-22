// load the auth variables
require('dotenv').config({
  silent: true
}); //for dev. In production, variables are in the environment.

var express = require('express');
var stormpath = require('express-stormpath');

var app = express();
app.use(stormpath.init(app, {
  website: true,
  sessionDuration: 1000 * 60 * 60 * 24 * 30, //30 days
  enableAccountVerification: false, //don't require email validation
  enableForgotPassword: true, //allow password reset workflow
  enableFacebook: true,
  social: {
    facebook: {
      appId: process.env.facebookAuth_clientID,
      appSecret: process.env.facebookAuth_clientSecret
    }
  },
  web: {
    register: {
      nextUri: '/create-event'
    },
    login: {
      nextUri: '/create-event'
    }
  }
}));

var port = process.env.PORT || 8080;
var mongoose = require('mongoose');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

mongoose.connect(process.env.mongodb_connectionURL);

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

//app.use(morgan('dev'));
app.use(bodyParser());
app.set('view engine', 'ejs');

require('./app/routes.js')(app);

app.on('stormpath.ready', function() {
  app.listen(port);
  console.log('The magic happens on port ' + port);
});
