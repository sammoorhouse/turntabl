var Event = require('../app/models/event');
var Account = require('../app/models/account')
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

module.exports = function (app, log, stormpathApp) {
  var s3 = require('./3rd/s3.js')(log);
  var typeform = require('./3rd/typeform.js')(log);
  var utils = require('./utils.js')(log);

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
    var eventId = utils.generateID(8)
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
    var typeform_structure_url = "https://api.typeform.io/" + typeform.versionString + "/forms/" + formId

    request.get({
      uri: typeform_structure_url,
      headers: {
        "X-API-TOKEN": process.env.TYPEFORM_APIKEY
      }
    }, function (err, formStructureResponse) {
      if (!err) {

        var submission = formSubmissionRequest.body
        var structure = JSON.parse(formStructureResponse.body)
        var eventId = structure.tags[0]
        log.info("found eventId: " + eventId)

        var formDetails = typeform.resolveFormSubmissionWebhook(submission, structure)

        newEvent.id = eventId
        newEvent.name = formDetails.eventTitle
        newEvent.creationDate = new Date()
        newEvent.durationMins = formDetails.eventDuration
        newEvent.leader = formDetails.leaderEmail
        newEvent.clientPaid = false
        newEvent.leaderPaid = false
        newEvent.attended = false
        newEvent.eventPrice = formDetails.eventPrice
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

  function ensureAccount(user) {
    var accountId = user.getCustomData(function (err, customData) {
      var accountId = customData.accountId;
      Account.findOne({
        'id': accountId
      }, function (err, acc) {
        if (!acc || err) {
          //generate new Account
          var newAccountId = util.generateID(8);
          var newAccount = new Account();
          newAccount.id = newAccountId();
          customData.accountId = newAccountId();
          newAccount.save(function (err) {
            console.error("failed to save account " + newAccountId + ": " + err);
          })
          //var newEvent = new Event();
          //create new account, link stormpath ID
          //return newacc
        }
        return acc
      })
    })

  }

  app.get("/account/profile", stormpath.loginRequired, (req, res) => {
    log.info('GET /account/profile')
    var user = req.user
    var account = ensureAccount(user)

    return res.render('account-profile.ejs', {
      user: user
    })
  })

  app.get("/account/sessions", stormpath.loginRequired, (req, res) => {
    log.info('GET /account/sessions')
    var user = req.user
    var account = ensureAccount(user)

    return res.render('account-sessions.ejs', {
      user: user
    })

  })

  app.get("/account/payment", stormpath.loginRequired, (req, res) => {
    log.info('GET /account/payment')
    var user = req.user
    var account = ensureAccount(user)

    return res.render('account-payment.ejs', {
      user: user
    })

  })

  app.get("/sign-s3", (req, res) => {
    log.info('GET /sign-s3')
    var sig = s3.generateSignature(utils.generateID(8))
    res.write(JSON.stringify(sig));
    res.end()
  })

  app.delete('/sessionResource', function (req, res) {
    log.info('DELETE /sessionResource')
    var eventId = req.params['eventId']
    var resourceKey = req.params['resourceKey']

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

    console.log("body: " + JSON.stringify(req.body))

    var eventId = req.body.eventId
    var name = req.body.name
    var s3Key = req.body.s3Key

    //update events table
    Event.findOne({
      'id': eventId
    }, function (err, event) {
      if (!err) {
        event.resources.push({
          name: name,
          url: s3Key,
          resourceKey: utils.generateID(8),
          active: true
        })
        event.save(function (error) {
          log.info("saved event " + eventId)
          if (error) {
            log.error("error updating event " + eventId + ": " + error)
          }
        })
      }
      res.end();
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

  app.post('/stripe/update', function (req, res) {
    console.log("STRIPE UPDATE RECEIVED")
    console.log(res.body)
    res.writeHead(200);
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
        });
      }
    });
  })
}
