var Event = require('../app/models/event');
var OpenTok = require('opentok');
var opentok = new OpenTok(process.env.tokboxAuth_apiKey, process.env.tokboxAuth_clientSecret)
var stormpath = require('express-stormpath');

module.exports = function(app) {
  app.get('/', function(req, res) {
    res.render('index.ejs');
  });

  // create-event SECTION =========================
  app.get('/create-event', stormpath.loginRequired, function(req, res) {
    res.render('create-event.ejs', {
      user: req.user
    });
  });

  app.get('/form/create-event', stormpath.loginRequired, function(req, res) {
    // if there is no user, create them
    var newEvent = new Event();
    var id = generateID()
    var leaderEmail = resolveEmail(req.user)

    console.log("reqbody: " + req.body.eventTitle)

    newEvent.id = id
    newEvent.name = req.eventTitle
    newEvent.starts = req.eventDateTime
    newEvent.durationMins = 60
    newEvent.leader = leaderEmail
    newEvent.client = req.eventClient
    newEvent.clientPaid = false
    newEvent.leaderPaid = false
    newEvent.attended = false
    newEvent.eventValue = req.eventValue

    //create openTok session
    opentok.createSession(function(err, session) {
      if (err) {
        console.log("sessionId creation error: " + err)
        throw err;
      } else {
        console.log("sessionId: " + session.sessionId)
        newEvent.openTokSessionId = session.sessionId

        newEvent.save(function(err) {
          if (err) {
            throw err;
            res.redirect('/')
          } else {
            console.log("newEvent.id = " + newEvent.id)
            res.redirect('/event/' + newEvent.id)
          }
        });
      }
    });
  })

  app.get('/event/:id', stormpath.loginRequired, function(req, res) {
    var evtId = req.param('id')
      var fakeclient = req.param('fakeclient')
    console.log("evtId: " + evtId)
    Event.findOne({
      'id': evtId
    }, function(err, event) {
      // if there are any errors, return the error
      if (err) {
        console.log("err: " + err)
        res.redirect('/');
      }

      // if no event is found, return the message
      if (!event) {
        console.log("no evt")
        res.redirect('/');
      }
      // all is well, render event
      else {
        var userEmail = resolveEmail(req.user)
        var sessionId = event.openTokSessionId
        var token = opentok.generateToken(sessionId)
        if ((event.leader === userEmail) && (!fakeclient)) { // it's the leader
          return res.render('event.ejs', {
            event: event,
            apiKey: process.env.tokboxAuth_apiKey,
            sessionId: sessionId,
            token: token
          });
        } else {
          var eventValue = event.eventValue
          return res.render('event-client.ejs', {
            event: event,
            apiKey: process.env.tokboxAuth_apiKey,
            sessionId: sessionId,
            token: token,
            eventValue: eventValue
          });
        }
      }
    });
  })

  app.get('/form/create-event', function(req, res) {
    var event = req.user;
    user.google.token = undefined;
    user.save(function(err) {
      res.redirect('/create-event');
    });
  });
};

function resolveEmail(user) {
  console.log("resolving email")
  if (user.facebook.token) {
    console.log("fb")
    return user.facebook.email
  } else if (user.google.token) {
    console.log("ggl")
    return user.google.email
  }
}

function generateID() {
  var ALPHABET = '23456789abdegjkmnpqrvwxyz';
  var ID_LENGTH = 8;
  var rtn = '';
  for (var i = 0; i < ID_LENGTH; i++) {
    rtn += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
  }
  return rtn;
}
