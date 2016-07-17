var Event = require('../app/models/event');
var OpenTok = require('opentok');
var path = require('path')
var os = require('os')
var fs = require('fs')
var opentok = new OpenTok(process.env.tokboxAuth_apiKey, process.env.tokboxAuth_clientSecret)
var stormpath = require('express-stormpath');
var request = require('request');
var Pusher = require('pusher');

var util = require('util');

var pusher = new Pusher({
  appId: process.env.pusher_AppId,
  key: process.env.pusher_Key,
  secret: process.env.pusher_Secret,
  encrypted: true
});

module.exports = function (app, log) {
  var s3 = require('./3rd/s3.js');
  var typeform = require('./3rd/typeform.js')(log);
  
  app.get('/', stormpath.getUser, function (req, res) {
    var user = req.user
    res.render('index.ejs', {
      user: user
    });
  });

  // create-event SECTION =========================
  app.get('/create-event', stormpath.loginRequired, function (req, res) {
    log.info('GET /create-event')
    
    var user = req.user
    var eventId = generateID(8)
    var formData = typeform.generateForm(user, eventId)

    typeform.createAndRenderForm(formData,
      function (formUrl) {
        res.render('create-event.ejs', {
          typeformUrl: formUrl,
          eventId: eventId,
          user: user
        });
      },
      function (err) {
        return console.error(err);
      })
  })

  app.post('/form/create-event', function (formSubmissionRequest, formSubmissionResponse) {

    log.info("form submission webhook invoked")
    var formId = formSubmissionRequest.body.uid;
    log.info("form id: " + formId)

    var newEvent = new Event();

    //get form structure https://api.typeform.io/v0.4/forms/:form_id
    var typeform_structure_url = "https://api.typeform.io/" + typeformVersionString + "/forms/" + formId

    request.get({
      uri: typeform_structure_url,
      headers: {
        "X-API-TOKEN": process.env.TYPEFORM_APIKEY
      }
    }, function (err, formStructureResponse) {
      if (!err) {

        var formSubmission = formSubmissionRequest.body
        var formStructure = JSON.parse(formStructureResponse.body)
        var eventId = formStructure.tags[0]
        log.info("found eventId: " + eventId)
        var leaderEmail = typeform.resolveLeaderEmail(formSubmission, formStructure)
        var eventTitle = typeform.resolveField(eventTitleRef, formSubmission, formStructure)
        var eventDuration = typeform.resolveField(eventDurationRef, formSubmission, formStructure)
        var eventPrice = typeform.resolveField(eventPriceRef, formSubmission, formStructure)

        newEvent.id = eventId
        newEvent.name = eventTitle
        newEvent.creationDate = new Date()
        newEvent.durationMins = eventDuration
        newEvent.leader = leaderEmail
        newEvent.clientPaid = false
        newEvent.leaderPaid = false
        newEvent.attended = false
        newEvent.eventPrice = eventPrice
        newEvent.resources = []

        //create openTok session
        opentok.createSession(function (err, session) {
          if (err) {
            console.error("sessionId creation error: " + err)
          } else {
            log.info("sessionId: " + session.sessionId)
            newEvent.openTokSessionId = session.sessionId

            newEvent.save(function (err) {
              if (err) {
                console.error('triggering failure message to client')
                pusher.trigger("event-creation-" + eventId, 'failure', {
                  "reason": "err"
                });
                formSubmissionResponse.writeHead(400, {
                  'Content-Type': 'application/json'
                });
                formSubmissionResponse.end()
              } else {
                log.info("sending success message to client")
                log.info("pusher eventid: " + eventId)
                pusher.trigger("event-creation-" + eventId, 'success', {});

                formSubmissionResponse.writeHead(200, {
                  'Content-Type': 'application/json'
                });
                formSubmissionResponse.end()
              }
            });
          }
        });
      } else {
        log.info("fail: " + err)
      }
    })
  })

  app.get("/sign-s3", (req, res) => {
    log.info('GET /sign-s3')
    var filename = generateID(8)
    var firstChar = filename[0]
    var secondChar = filename[1]
    var filePath = firstChar + "/" + secondChar + "/" + filename
    var acl = "public-read"
    var p = policy({
      acl: acl,
      secret: process.env.AWS_SECRET_ACCESS_KEY,
      bucket: s3.bucketName,
      key: filePath,
      expires: new Date(Date.now() + 600000),
    })
    var result = {
      'AWSAccessKeyId': process.env.AWS_ACCESS_KEY_ID,
      'key': filePath,
      'policy': p.policy,
      'signature': p.signature
    }
    res.write(JSON.stringify(result));
    res.end()
  })

  app.delete('/sessionResource', function (req, res) {
    log.info('DELETE /sessionResource')
    var eventId = req.query.eventId
    var resourceKey = req.query.resourceKey

    //update events table
    Event.findOne({
      'id': eventId
    }, function (err, event) {
      if (!err) {
        event.resources.filter(function (res) {
          res.resourceKey === resourceKey
        }).forEach(function (res) {
          res.active = false
        })
        event.save(function (error) {
          if (error) {
            log.info("error updating event " + eventId + ": " + error)
            res.writeHead(400);
            res.end()
          } else {
            res.writeHead(200);
            res.end()
          }
        })
      } else {
        res.writeHead(400);
        res.end()
      }
    })
  })

  app.post('/addSessionResource', function (req, res) {
    log.info('POST /addSessionResource')

    var eventId = req.query.eventId
    var uploadError = false

    //update events table
    Event.findOne({
      'id': eventId
    }, function (err, event) {
      if (!err) {
        event.resources.push({
          name: filename,
          url: s3.bucketUrl + s3Key,
          resourceKey: generatedId,
          active: true
        })
        event.save(function (error) {
          log.info("saved event " + eventId)
          if (error) {
            log.info("error updating event " + eventId + ": " + error)
            uploadError = "error updating event " + eventId + ": " + error
          }
        })
      }
    })
  })

  app.post('/beginSession', function (req, res) {
    log.info('POST /beginSession')
    var eventId = req.body.eventId

    //update events table
    Event.findOne({
      'id': eventId
    }, function (err, event) {
      if (!err) {
        var proposedStartTimeMillis = Date.now()
        var proposedEndTimeMillis = proposedStartTimeMillis + event.durationMins * 60 * 1000

        if (typeof event.endTime == "undefined") {
          //never started!
          event.endTime = proposedEndTimeMillis

          //writeBack
          event.save(function (error) {
            if (error) {
              log.info("error updating event " + eventId + ": " + error)
            }
          })
        }
        if ((typeof event.endTime != "undefined") && (proposedStartTimeMillis > event.endTime)) {
          //already over
          var result = {
            'result': 'alreadyCompleted',
          };
          res.write(JSON.stringify(result));
        } else {
          var result = {
            'result': 'begin',
            'proposedStartTimeMillis': proposedStartTimeMillis
          };
          res.write(JSON.stringify(result));
        }
      } else {
        log.info("error retrieving event " + eventId + ": " + err)
      }
    })
    res.end()
  })

  app.get('/event/:id', stormpath.loginRequired, function (req, res) {
    log.info('GET /event')

    var evtId = req.params['id']
    var fakeclient = req.params['fakeclient']
    log.info("evtId: " + evtId)
    Event.findOne({
      'id': evtId
    }, function (err, event) {
      // if there are any errors, return the error
      if (err) {
        log.info("err: " + err)
        res.redirect('/');
      }

      // if no event is found, return the message
      if (!event) {
        log.info("no evt")
        res.redirect('/');
      }
      // all is well, render event
      else {
        var user = req.user
        var userEmail = user.email
        var sessionId = event.openTokSessionId
        var token = opentok.generateToken(sessionId)
        var eventValue = event.eventValue
        return res.render('event.ejs', {
          s3Bucket: s3.bucketUrl,
          isLeader: event.leader === userEmail,
          user: req.user,
          event: event,
          openTokApiKey: process.env.tokboxAuth_apiKey,
          openTokSessionId: sessionId,
          openTokToken: token,
          eventValue: eventValue,
          generateID: generateID
        });
        //}
      }
    });
  })


  function generateID(length) {
    var ALPHABET = '23456789abdegjkmnpqrvwxyz';
    var rtn = '';
    for (var i = 0; i < length; i++) {
      rtn += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
    }
    return rtn;
  }

  function censor(censor) {
    var i = 0;

    return function (key, value) {
      if (i !== 0 && typeof (censor) === 'object' && typeof (value) == 'object' && censor == value)
        return '[Circular]';

      if (i >= 29) // seems to be a harded maximum of 30 serialized objects?
        return '[Unknown]';

      ++i; // so we know we aren't using the original object anymore

      return value;
    }
  }

}
