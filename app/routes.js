var s3 = require('./3rd/s3.js');
var utils = require('./utils.js');
var OpenTok = require('opentok');
var fs = require('fs')
var opentok = new OpenTok(process.env.tokboxAuth_apiKey, process.env.tokboxAuth_clientSecret)
var stormpath = require('express-stormpath');
var request = require('request');
var stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
var currencies = require('./config/currencies.json');
var supportedCountries = require('./config/supportedCountries.json');

module.exports = function (app, log, pgClient) {

  var Event = require('../app/models/event')(pgClient);
  var Account = require('../app/models/account')(pgClient);

  app.get('/', stormpath.getUser, function (req, res) {
    var user = req.user
    if (typeof user == "undefined") {
      res.render('index.ejs', {
        user: user
      });
    } else {
      res.redirect('/account/main');
    }
  });

  app.post('/create_session', stormpath.authenticationRequired, function (req, res) {
    var id = utils.generateID(8);

    opentok.createSession({
      mediaMode: "routed"
    }, function (error, session) {
      if (error) {
        console.log("Error creating session:", error)
        res.redirect('/sessionCreationFailure/' + id)
      } else {
        var openTokSessionId = session.sessionId;
        console.log("Session ID: " + openTokSessionId);

        var user = req.user
        var leaderAccountId = user.customData.accountId;

        var body = req.body;

        var sessionName = body.session_name;
        var creationDate = new Date(); //now
        var sessionDuration = body.session_duration;
        var sessionLeaderEmail = body.session_leader_email;
        var sessionDate = body.session_date;
        var sessionClientName = body.client_name;
        var clientPaid = false;
        var leaderPaid = false;
        var sessionCostCcy = body.session_cost_ccy;
        var sessionCostValue = body.session_cost_value;
        var sessionStarted = false;

        Event.createNewEvent(id, sessionName, creationDate, sessionDuration,
          sessionDate, leaderAccountId, sessionClientName,
          clientPaid, leaderPaid, openTokSessionId,
          sessionCostCcy, sessionCostValue, sessionStarted, () => {
            res.redirect('/event/' + id)
          }, (err) => {
            console.log(err)
            res.redirect('/sessionCreationFailure/' + id)
          })
      }
    });
  })

  app.get('/account', stormpath.authenticationRequired, (req, res) => {
    res.redirect('/account/main')
  })

  app.get("/account/profile", stormpath.authenticationRequired, (req, res) => {
    log.info('GET /account/profile')
    var user = req.user
    var accountId = user.customData.accountId;
    Account.getAccountById(accountId,
      (account) => {
        res.render('account-profile.ejs', {
          utils: utils,
          fullName: utils.toTitleCase(user.fullName),
          email: user.email,
        })
      },
      (err) => {
        console.error(err)
        res.redirect('/')
      })
  })

  app.get("/account/main", stormpath.authenticationRequired, (req, res) => {
    log.info('GET /account/main')
    var user = req.user;
    var accountId = user.customData.accountId;
    Event.getTodaysEvents(accountId,
      (events) => {
        res.render('account-main.ejs', {
          currencies: currencies,
          since: user.createdAt,
          accountId: accountId,
          fullName: utils.toTitleCase(user.fullName),
          todaysEvents: events
        })
      },
      () => {
        res.render('account-main.ejs', {
          currencies: currencies,
          since: user.createdAt,
          accountId: accountId,
          fullName: utils.toTitleCase(user.fullName),
          todaysEvents: []
        })
      })

  })

  app.get("/account/pending", stormpath.authenticationRequired, (req, res) => {
    log.info('GET /account/pending')
    var user = req.user
    var accountId = user.customData.accountId;
    Event.getPendingEventsByAccountId(accountId,
      (events) => {
        res.render('account-pending.ejs', {
          fullName: utils.toTitleCase(user.fullName),
          events: events
        })
      },
      () => {
        res.redirect('/')
      })
  })

  app.get("/account/history", stormpath.authenticationRequired, (req, res) => {
    log.info('GET /account/history')
    var user = req.user
    var accountId = user.customData.accountId;
    Event.getHistoricEventsByAccountId(accountId,
      (events) => {
        res.render('account-history.ejs', {
          fullName: utils.toTitleCase(user.fullName),
          events: events
        })
      },
      (err) => {
        console.log(err)
        res.redirect('/')
      })
  })

  app.get("/account/clients", stormpath.authenticationRequired, (req, res) => {
    log.info('GET /account/clients')
    var user = req.user
    var events = user.customData.events;
    res.render('account-clients.ejs', {
      fullName: utils.toTitleCase(user.fullName),
      events: events
    })
  })

  app.get("/account/payment", stormpath.authenticationRequired, (req, res) => {
      log.info('GET /account/payment')
      var user = req.user
      res.render('account-payment.ejs', {
        user: user,
        fullName: utils.toTitleCase(user.fullName)
      })
    })
    /*
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

        //update event
        Event.removeEventResource(eventId, resourceKey,
          () => {
            res.writeHead(200);
            res.end()
          },
          (err) => {
            log.info("error updating event " + eventId + ": " + err)
            res.writeHead(400);
            res.end()
          })
      })

      app.post('/addSessionResource', function (req, res) {
        log.info('POST /addSessionResource')

        console.log("body: " + JSON.stringify(req.body))

        var eventId = req.body.eventId
        var name = req.body.name
        var s3Key = req.body.s3Key

        //update events table
        Event.addEventResource(eventId, name, s3Key, resourceKey, () => {
          res.writeHead(200);
          res.end();
        }, () => {
          log.error("error updating event " + eventId + ": " + error)
          res.writeHead(400);
          res.end();
        })
      })
      */

  app.post('/beginSession', function (req, res) {
    log.info('POST /beginSession')
    var eventId = req.body.eventId

    //update events table
    Event.startEvent(eventId, () => {
        res.writeHead(200)
        res.end()
      },
      () => {
        res.redirect('/')
      })
  })

  app.post('/stripe/update', function (req, res) {
    console.log("STRIPE UPDATE RECEIVED")
    console.log(JSON.stringify(req.body))
    res.writeHead(200);
    res.end()
  })

  app.post('/end-session', function (req, res) {
    //cleanup etc
    res.redirect('/')
  })

  app.get('/mustPay/:id', function (req, res) {
    log.info('GET /mustPay')

    var sessionId = req.params['id']
    Event.getEventById(sessionId, (event) => {
        res.render('client-payment.ejs', {
          sessionId: sessionId,
          sessionName: event.sessionName
        })
      },
      (err) => {
        console.log(err)
        res.redirect('/')
      })
  })

  app.get('/event/:id', stormpath.getUser, function (req, res) {
    log.info('GET /event')

    var user = req.user
    var evtId = req.params['id']
    Event.getEventById(evtId, (event) => {


      var fakeclient = req.params['fakeclient']

      var openTokSessionId = event.openTokSessionId
      var token = opentok.generateToken(openTokSessionId)
      var eventValue = event.eventValue
      var clientPaid = event.clientPaid

      if (typeof user != "undefined") {
        var userAccountId = user.customData.accountId
        var isLeader = event.leaderAccountId === userAccountId
        log.info("evtId: " + evtId)
        console.log('isLeader: ' + isLeader)
        if (isLeader) {
          console.log("leader " + userAccountId + " entering session " + evtId)
          res.render('session.ejs', {
            sessionName: event.sessionName,
            sessionId: evtId,
            s3Bucket: s3.bucketUrl,
            isLeader: isLeader,
            user: req.user,
            event: event,
            openTokApiKey: process.env.tokboxAuth_apiKey,
            openTokSessionId: openTokSessionId,
            openTokToken: token,
            eventValue: eventValue,
          });
        } else {
          //client
          console.log("client attempting to enter session " + evtId)
          if (!clientPaid) {
            console.log("client hasn't paid yet")
            res.redirect('/mustPay/' + evtId);
          } else {
            console.log("client paid; entering session " + evtId)
            res.render('session-client.ejs', {
              sessionName: event.sessionName,
              sessionId: evtId,
              s3Bucket: s3.bucketUrl,
              isLeader: isLeader,
              user: req.user,
              event: event,
              openTokApiKey: process.env.tokboxAuth_apiKey,
              openTokSessionId: openTokSessionId,
              openTokToken: token,
              eventValue: eventValue,
            })
          }
        }
      } else {
        console.log("client (not logged in) attempting to enter session " + evtId)
        res.redirect('/mustPay/' + evtId);
      }
    }, (err) => {
      log.info("err: " + err)
      res.redirect('/');
    })
  })
}