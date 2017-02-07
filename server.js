var env = process.env.NODE_ENV || 'dev';

var pg = require('pg');
var util = require('./app/utils.js');

var path = require('path')

if (env === "dev") {
  console.log('loading .env')
  require('dotenv').config({
    silent: true
  });
  pg.defaults.ssl = false;
} else {
  pg.defaults.ssl = true;
}

var bunyan = require('bunyan')
var log = bunyan.createLogger({
  name: process.env.APP_NAME
});

var express = require('express');
var stormpath = require('express-stormpath');
var compression = require('compression')

pg.connect(process.env.DATABASE_URL, function (err, pgClient) {
  if (err) throw err;
  console.log('Connected to postgres.');

  var app = express();
  var stormpathApp = stormpath.init(app, {
    debug: 'debug',
    website: true,
    expand: {
      customData: true,
    },
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
        nextUri: '/account/main'
      },
      login: {
        nextUri: '/account/main',
        //view: path.join(__dirname,'app/views/stormpath','login.jade') // My custom login view
      },
      me: {
        enabled: false,
      },
      oauth2: {
        enabled: false,
      }
    },
    postRegistrationHandler: function (account, req, res, next) {
      var TTAccount = require('./app/models/account.js')(pgClient);

      account.getCustomData(function (err, customData) {
        if (err) return next(err);
        var newAccountId = util.generateID(8);
        console.log("creating new account for " + newAccountId)
        var newAccount = TTAccount.createNewAccount(newAccountId, (acc) => {
            customData.accountId = newAccountId;
            console.log("saving account data")
            customData.save(next)
          },
          (err) => {
            return next(err)
          }
        )

      })



    }
  })
  app.use(stormpathApp);

  var port = process.env.PORT || 8080;
  var cookieParser = require('cookie-parser');
  var bodyParser = require('body-parser');
  var busboy = require('connect-busboy');

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
  app.set('view engine', 'jade');

  require('./app/routes.js')(app, log, pgClient);

  app.listen(port);
  console.log('The magic happens on port ' + port);
});