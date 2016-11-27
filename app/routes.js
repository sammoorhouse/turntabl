var mongoose = require('mongoose');

var Event = require('../app/models/event')(mongoose);
var Account = require('../app/models/account')(mongoose)

var OpenTok = require('opentok');
var fs = require('fs')
var opentok = new OpenTok(process.env.tokboxAuth_apiKey, process.env.tokboxAuth_clientSecret)
var stormpath = require('express-stormpath');
var request = require('request');
var stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
var currencies = require('./config/currencies.json');
var supportedCountries = require('./config/supportedCountries.json');

//var util = require('util');

module.exports = function (app, log, stormpathApp) {
  var s3 = require('./3rd/s3.js');
  var utils = require('./utils.js');

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

  app.post('/create_session', stormpath.loginRequired, function(req, res){
    var id = utils.generateID(8);
    var openTokSessionId = 3; //TODO OBVIOUSLY
    var user = req.user
    user.getCustomData(function(err, customData){
      var leaderAccountId = customData.accountId;

      var body = req.body;

      var sessionName = body.session_name;
      var creationDate = new Date();//now
      var sessionDuration = body.session_duration;
      var sessionDate = body.session_date;
      var sessionClientFirstName = body.session_client_firstName;
      var sessionClientLastName = body.session_client_lastName;
      var sessionClientEmail = body.session_client_email;
      var clientPaid = false;
      var leaderPaid = false;
      var sessionCostCcy = body.session_cost_ccy;
      var sessionCostValue = body.session_cost_value;
      
      Event.createEvent(id, sessionName, creationDate, sessionDuration,
      sessionDate, leaderAccountId, sessionClientFirstName, sessionClientLastName,
      sessionClientEmail, clientPaid, leaderPaid, openTokSessionId,
      sessionCostCcy, sessionCostValue, ()=>{
        response.redirect('/session/' + id)
      }, ()=>{
        response.redirect('/sessionCreationFailure/' + id)
      })
    })
  })

  app.get('/session', stormpath.loginRequired, function (req, res) {
    log.info('GET /session')

    res.render('session.ejs', {});
  });

  app.get('/account', (req, res) => {
    res.redirect('/account/main')
  })

  app.get("/account/profile", stormpath.loginRequired, (req, res) => {
    log.info('GET /account/profile')
    var user = req.user
    Account.ensureAccount(user, () => {
        res.render('account-profile.ejs', {
          fullName: utils.toTitleCase(user.fullName)
        })
      },
      () => {
        res.redirect('/')
      })
  })

  app.get("/account/main", stormpath.loginRequired, (req, res) => {
    log.info('GET /account/main')
    var user = req.user
    Account.ensureAccount(user, () => {
        user.getCustomData(function(err, customData){
          var events = customData.events;
          var accountId = customData.accountId;
          res.render('account-main.ejs', {
            currencies: currencies,
            since: user.createdAt,
            accountId: accountId,
            fullName: utils.toTitleCase(user.fullName)
          })
        });
      },
      () => {
        res.redirect('/')
      })
  })

  app.get("/account/pending", stormpath.loginRequired, (req, res) => {
    log.info('GET /account/pending')
    var user = req.user
    Account.ensureAccount(user, () => {
        var customData = user.getCustomData();
        var events = customData.events;
        res.render('account-pending.ejs', {
          fullName: utils.toTitleCase(user.fullName),
          events: events
        })
      },
      () => {
        res.redirect('/')
      })
  })

  app.get("/account/history", stormpath.loginRequired, (req, res) => {
    log.info('GET /account/history')
    var user = req.user
    Account.ensureAccount(user, () => {
        var customData = user.getCustomData();
        var events = customData.events;
        res.render('account-history.ejs', {
          fullName: utils.toTitleCase(user.fullName),
          events: events
        })
      },
      () => {
        res.redirect('/')
      })
  })

  app.get("/account/clients", stormpath.loginRequired, (req, res) => {
    log.info('GET /account/clients')
    var user = req.user
    Account.ensureAccount(user, () => {
        var customData = user.getCustomData();
        var events = customData.events;
        res.render('account-clients.ejs', {
          fullName: utils.toTitleCase(user.fullName),
          events: events
        })
      },
      () => {
        res.redirect('/')
      })
  })

  app.get("/account/payment", stormpath.loginRequired, (req, res) => {
    log.info('GET /account/payment')
    var user = req.user
    Account.ensureAccount(user, () => {
        res.render('account-payment.ejs', {
          user: user,
          fullName: utils.toTitleCase(user.fullName)
        })
      },
      () => {
        res.redirect('/')
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

  app.post('/beginSession', function (req, res) {
    log.info('POST /beginSession')
    var eventId = req.body.eventId

    //update events table
    Event.getById(eventId, (event) => {

      var proposedStartTimeMillis = Date.now()
      var proposedEndTimeMillis = proposedStartTimeMillis + event.durationMins * 60 * 1000

      if (typeof event.endTime == "undefined") {
        //never started!
        var endTime = proposedEndTimeMillis

        Event.updateEndTime(eventId, endTime, () => {}, (error) => {
          log.info("error updating event " + eventId + ": " + error)
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
    }, () => {
      log.info("error retrieving event " + eventId + ": " + err)
    })
    res.end()
  })

  app.post('/stripe/update', function (req, res) {
    console.log("STRIPE UPDATE RECEIVED")
    console.log(JSON.stringify(req.body))
    res.writeHead(200);
    res.end()
  })

  app.post('/account/init', stormpath.loginRequired, function (req, res) {
    //this is called for new accounts. All we need
    //at this stage is the country for stripe
    var user = req.user
    var countryCode = req.country;
    //one from https://stripe.com/global
    var stripeResponse = stripe.accounts.create({
      country: countryCode,
      managed: true
    });

    user.getCustomData(function (err, customData) {
      customData.stripeAccountId = stripeResponse.id;
      customData.save(function (err) {
        if (!err) {
          console.log("user custom data saved with id " + stripeResponse.id);
        } else {
          console.error("failed to save custom data for id " + stripeResponse.id);
        }
      })
    })

    res.redirect("/account-newevent")
  })

  app.get('/account-newevent', stormpath.loginRequired, function (req, res) {
    //on first login, once the stripe account is setup.
    //subsequently, whenever the client creates a new event.

  })

  app.get('/event/:id', stormpath.loginRequired, function (req, res) {
    log.info('GET /event')

    var evtId = req.params['id']
    var fakeclient = req.params['fakeclient']
    log.info("evtId: " + evtId)
    Event.getById(evtId, (event) => {
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
    }, (error) => {
      log.info("err: " + err)
      res.redirect('/');
    })
  })
}