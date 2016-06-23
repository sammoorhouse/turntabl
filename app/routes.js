var Event = require('../app/models/event');
var OpenTok = require('opentok');
var opentok = new OpenTok(process.env.tokboxAuth_apiKey, process.env.tokboxAuth_clientSecret)
var stormpath = require('express-stormpath');
var request = require('request');

var typeformVersionString = 'v0.4'
var eventTitleRef = "eventTitle"
var eventDurationRef = "eventDuration"
var eventPriceRef = "eventPrice"
var emailLogicJumpRef = "emailLogicJump"
  //var typeformVersionString = 'latest'

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

    //generate typeform
    var typeformUrl = "https://api.typeform.io/" + typeformVersionString + "/forms"
    var eventId = generateID()
    var formData = generateForm(user, eventId)
    request.post({
        url: typeformUrl,
        json: formData,
        headers: {
          "X-API-TOKEN": process.env.TYPEFORM_APIKEY
        }
      },
      function(err, resp) {
        if (!err && resp.statusCode == 201) { //201 CREATED
          console.log('typeform Upload successful: ' + JSON.stringify(resp.body, null, 2));
          var formLink = resp.body['_links'].find(function(el) {
            return el.rel === "form_render"
          }).href
          console.log('typeform url: ' + formLink)

          res.render('create-event.ejs', {
            typeformUrl: formLink,
            eventId: eventId,
            user: user
          });
        } else if (err) {
          return console.error('typeform upload failed:', err);
        } else {
          return console.error('typeform upload failed:', resp.body);
        }
      })
  })

  app.post('/form/create-event', function(formSubmissionRequest, res) {
    console.log("CREATE EVENT WAS CALLED!!")

    var newEvent = new Event();

    function censor(censor) {
      var i = 0;

      return function(key, value) {
        if (i !== 0 && typeof(censor) === 'object' && typeof(value) == 'object' && censor == value)
          return '[Circular]';

        if (i >= 29) // seems to be a harded maximum of 30 serialized objects?
          return '[Unknown]';

        ++i; // so we know we aren't using the original object anymore

        return value;
      }
    }



    console.log('req: ' + JSON.stringify(formSubmissionRequest.body, censor(formSubmissionRequest.body), 2))
    var formId = formSubmissionRequest.body.uid;
    console.log("form id: " + formId)
      //get form structure https://api.typeform.io/v0.4/forms/:form_id
    var typeform_structure_url = "https://api.typeform.io/" + typeformVersionString + "/forms/" + formId
    request.get({
      uri: typeform_structure_url,
      headers: {
        "X-API-TOKEN": process.env.TYPEFORM_APIKEY
      }
    }, function(err, formStructureResponse) {
      if (!err) {
        console.log("structure successfully received: " + formStructureResponse.body)
        var formStructure = JSON.parse(formStructureResponse.body)
        console.log("parsed structure: " + formStructure)
        var eventId = formStructure.tags[0]
        var leaderEmail = resolveLeaderEmail(formSubmissionRequest, formStructureResponse)
        var eventTitle = resolveField(eventTitleRef, formSubmissionRequest, formStructureResponse)
        var eventDuration = resolveField(eventDurationRef, formSubmissionRequest, formStructureResponse)
        var eventPrice = resolveField(eventPriceRef, formSubmissionRequest, formStructureResponse)


        newEvent.id = eventId
        newEvent.name = eventTitle
        newEvent.durationMins = eventDuration
        newEvent.leader = leaderEmail
        newEvent.clientPaid = false
        newEvent.leaderPaid = false
        newEvent.attended = false
        newEvent.eventPrice = eventPrice

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
                response.writeHead(400, {
                  'Content-Type': 'application/json'
                });
                response.end
              } else {
                console.log("newEvent.id = " + newEvent.id)
                response.writeHead(200, {
                  'Content-Type': 'application/json'
                });
                response.end
              }
            });
          }
        });
      } else {
        console.log("fail: " + err)
      }
    })
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

  function generateForm(user, eventId) {
    var formData = {
      "title": "turntable - teach, mentor, advise",
      "webhook_submit_url": process.env.typeform_webhook_submit_url, //"http://requestb.in/um9wh5um",//
      "tags": [eventId],
      "branding": false,
      "fields": [{
        type: "yes_no",
        required: true,
        ref: emailLogicJumpRef,
        question: "Hey " + user.givenName + ", we're going to get started! First, we think your email address is `" + user.email + "` - is that right?",
        description: "We promise not to give your address away, but we might need to get in touch if there's a payment issue"
      }, {
        type: "email",
        question: "Disaster! Looks like we messed up, sorry about that. So... what's your email?",
        description: "Seriously, we totally promise not to give away your email"
      }, {
        type: "short_text",
        ref: eventTitleRef,
        question: "Great! What do you want to call this session?",
        description: "Sam / George life coaching"
      }, {
        type: "number",
        ref: eventDurationRef,
        question: "How many minutes is the session going to last?",
        description: "We'll show you a warning when your time is almost up",
        min_value: 5
      }, {
        type: "number",
        ref: eventPriceRef,
        question: "How much are you charging for the session?",
        description: "USD. We take 5% and your client pays PayPal fees. You'll get paid once the session is over"
      }, {
        type: "legal",
        question: "Thanks!",
        description: "That's all for now. Your session will be available for 90 days from now."
      }],
      "logic_jumps": [{
        "from": emailLogicJumpRef,
        "to": eventTitleRef,
        "if": true
      }]
    }

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

  function resolveLeaderEmail(formSubmission, formStructure) {
    var emailFieldId = "formStructure."
  }

  function resolveField(refName, formSubmission, formStructure) {

  }


}
