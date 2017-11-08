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

  app.use (function(req, res, next) {
    if (req.header ['x-forwarded-proto'] != 'https'){
      var host = req.header['host']
      var url = req.url
      res.redirect ("https://" + host + url)
    }      
    else{
      next()
    }
  })
}

var bunyan = require('bunyan')
var log = bunyan.createLogger({
  name: process.env.APP_NAME
});

var express = require('express');
var compression = require('compression')

pg.connect(process.env.DATABASE_URL, function (err, pgClient) {
  if (err) throw err;
  console.log('Connected to postgres.');

  var app = express();

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