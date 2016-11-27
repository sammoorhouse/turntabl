var env = process.env.NODE_ENV || 'dev';

if (env === "dev") {
  console.log('loading .env')
  require('dotenv').config({
    silent: true
  });
}

var bunyan = require('bunyan')
var log = bunyan.createLogger({
  name: process.env.APP_NAME
});

var express = require('express');
var stormpath = require('express-stormpath');
var compression = require('compression')

var app = express();
var stormpathApp = stormpath.init(app,
  {

  debug: 'debug',
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
        nextUri: '/account/profile'
      },
      login: {
        nextUri: '/account/profile',
      }
    }
  }

)
app.use(stormpathApp);

var port = process.env.PORT || 8080;
var mongoose = require('mongoose');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var busboy = require('connect-busboy');

mongoose.connect(process.env.MONGODB_URI);

//js,css
app.use('/js', express.static('static/js'));
app.use('/css', express.static('static/css'));
app.use('/font-awesome', express.static('static/fonts'));
app.use('/fonts', express.static('static/fonts'));
app.use('/img', express.static('static/img'));

// parse application/json
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
  "extended": "true"
}))
app.use(busboy());
app.use(compression())

//app local variables - for use in ejs templates
app.locals['name'] = "turntabl"
app.locals['url'] = "turntabl.io"
app.locals['url'] = "turntabl.io"
app.locals['description'] = "turntable is an online platform for mentors, teachers and coaches"
app.locals['tagline'] = "teach · mentor · advise"
app.locals['email-feedback'] = "feedback@turntabl.io"
app.locals['email-jobs'] = "jobs@turntabl.io"

app.set('views', './app/views')
app.set('view engine', 'ejs');

require('./app/routes.js')(app, log, stormpathApp);

app.listen(port);
console.log('The magic happens on port ' + port);
