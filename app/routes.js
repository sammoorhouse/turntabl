var Event = require('../app/models/event');
var OpenTok = require('opentok');
var opentok = new OpenTok(process.env.tokboxAuth_apiKey, process.env.tokboxAuth_clientSecret)
var stormpath = require('express-stormpath');
var request = require('request');
var typeformVersionString = 'v0.4'

module.exports = function(app) {
  app.get('/', function(req, res) {
    var user = req.user
    if (typeof user != "undefined") {
      console.log("USEREMAIL: " + user.email)
    }
    res.render('index.ejs', {
      user: user
    });
  });

  // create-event SECTION =========================
  app.get('/create-event', stormpath.loginRequired, function(req, res) {
    var user = req.user
    console.log("USEREMAIL: " + user.email)

    //generate typeform
    var typeformUrl = "https://api.typeform.io/" + typeformVersionString + "/forms"
    console.log('typeformUrl: ' + typeformUrl)
    var formData = generateForm(user)
    console.log("data: " + formData)
    request.post({
      url: typeformUrl,
      headers: {
        "X-API-TOKEN": process.env.TYPEFORM_APIKEY
      },
      form: formData
    }, function(err, httpResponse, body) {
      if (err) {
        return console.error('typeform upload failed:', err);
      }
      console.log('typeform Upload successful: ' + body);
var formLink = body['links'].find(function(el){el.rel === "form_render"}).href
console.log('typeform url: ' + formLink)

      res.render('create-event.ejs', {
        formUrl: body['_links'],
        user: user
      });
    });


  });

  app.post('/form/create-event', stormpath.loginRequired, function(req, res) {
    var newEvent = new Event();
    var id = generateID()
    var user = req.user
    var leaderEmail = user.email

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
        var user = req.user
        var userEmail = user.email
        var sessionId = event.openTokSessionId
        var token = opentok.generateToken(sessionId)
        console.log("USEREMAIL: " + user.email)
        if ((event.leader === userEmail) && (!fakeclient)) { // it's the leader
          return res.render('event.ejs', {
            user: user,
            event: event,
            apiKey: process.env.tokboxAuth_apiKey,
            sessionId: sessionId,
            token: token
          });
        } else {
          var eventValue = event.eventValue
          return res.render('event-client.ejs', {
            user: req.user,
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

  function generateForm(user) {
    console.log('generating user form for ' + user.givenName)
    var formData =  {
      "title": "My first typeform",
      "fields": [{
        "type": "short_text",
        "question": "What is your name?"
      }]
    }

    console.log("data after generation: " + formData)
    return formData
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
}
