var env = process.env.NODE_ENV || 'dev';

if (env === "dev") {
  console.log('loading .env')
  require('dotenv').config({
    silent: true
  });
}

var bunyan = require('bunyan')
var log = bunyan.createLogger({
  name: process.env.APP_NAME,
  streams: [
    {
      type: 'rotating-file',
      level: 'debug',
      period: '1h',
      count: 200,
      path: '/var/tmp/' + process.env.APP_NAME + '-' + process.pid + '.log'  // log ERROR and above to a file
    }
  ]
});

var express = require('express');
var stormpath = require('express-stormpath');
var compression = require('compression')

var app = express();
app.use(stormpath.init(app,
  {
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
        nextUri: '/create-event',
      }
    }
  }

));

var port = process.env.PORT || 8080;
var mongoose = require('mongoose');
var morgan = require('morgan');
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
app.use(busboy());
app.use(compression())

app.locals['title'] = "turntabl"
app.locals['tagline'] = "teach · mentor · advise"

app.set('views', './app/views')
app.set('view engine', 'ejs');

require('./app/routes.js')(app, log);

app.listen(port);
console.log('The magic happens on port ' + port);
