var mongoose = require('mongoose');

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

  app.post('/create_session', stormpath.loginRequired, function (req, res) {
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

  app.get('/account', (req, res) => {
    res.redirect('/account/main')
  })

  app.get("/account/profile", stormpath.loginRequired, (req, res) => {
    log.info('GET /account/profile')
    var user = req.user
    var accountId = user.customData.accountId;
    Account.getAccountById(accountId,
      (account) => {
        if (account.stripeAccountNumber != undefined) {
          console.log("found stripe account number " + account.stripeAccountNumber + " for account " + accountId)
          stripe.accounts.retrieve(
            account.stripeAccountNumber,
            function (err, accountDetails) {
              if (err) {
                console.error("error retrieving account details: " + err)
                res.redirect('/')
              } else {
                console.log("retrieved details for stripe account " + accountDetails.id)
                if ((typeof accountDetails.verification != "undefined") &&
                  (accountDetails.verification.disabled_reason == "fields_needed")) {
                  console.log("account is disabled; fields needed: " + accountDetails.verification.fields_needed)
                  var requiredFields = accountDetails.verification.fields_needed
                }
                res.render('account-profile.ejs', {
                  utils: utils,
                  countries: supportedCountries,
                  fullName: utils.toTitleCase(user.fullName),
                  email: user.email,
                  stripeAccountNumber: account.stripeAccountNumber,
                  transfers_enabled: accountDetails.transfers_enabled,
                  required_fields: requiredFields,
                })
              }
            }
          );
        } else {
          console.error("couldn't find stripe account for account " + accountId)
          res.render('account-profile.ejs', {
            utils: utils,
            countries: supportedCountries,
            fullName: utils.toTitleCase(user.fullName),
            email: user.email,
            stripeAccountNumber: account.stripeAccountNumber
          })
        }
      },
      (err) => {
        console.error(err)
        res.redirect('/')
      })
  })

  app.get("/account/main", stormpath.loginRequired, (req, res) => {
    log.info('GET /account/main')
    var user = req.user;
    var accountId = user.customData.accountId;
    res.render('account-main.ejs', {
      currencies: currencies,
      since: user.createdAt,
      accountId: accountId,
      fullName: utils.toTitleCase(user.fullName)
    })
  })

  app.get("/account/pending", stormpath.loginRequired, (req, res) => {
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

  app.get("/account/history", stormpath.loginRequired, (req, res) => {
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
      () => {
        res.redirect('/')
      })
  })

  app.get("/account/clients", stormpath.loginRequired, (req, res) => {
    log.info('GET /account/clients')
    var user = req.user
    var events = user.customData.events;
    res.render('account-clients.ejs', {
      fullName: utils.toTitleCase(user.fullName),
      events: events
    })
  })

  app.get("/account/payment", stormpath.loginRequired, (req, res) => {
    log.info('GET /account/payment')
    var user = req.user
    res.render('account-payment.ejs', {
      user: user,
      fullName: utils.toTitleCase(user.fullName)
    })
  })

  app.post('/update_basic_details', stormpath.loginRequired, (req, res) => {
    //get required fields
    var accountId = req.user.customData.accountId
    var country = req.body.country
    var firstName = req.body.first_name
    var lastName = req.body.last_name
    var dob = req.body.dob.split(/[.,\/ -]/)
    var stripeaccount = stripe.accounts.create({
        "country": "US",
        "managed": true,
        "legal_entity": {
          "first_name": firstName,
          "last_name": lastName,
          "dob": {
            "year": dob[0],
            "month": dob[1],
            "day": dob[2]
          }
        }
      }).then(
        function (result) {
          console.log(result)
          var stripeAccountId = result.id
          Account.addStripeAccount(accountId, stripeAccountId, () => {
              console.log("successfully added stripe ID " + stripeAccountId + " to account " + accountId)
              res.redirect('/account/profile')
            },
            (err) => {
              console.error("failed to add stripe ID " + stripeAccountId + " to account " + accountId)
              res.redirect('/')
            })
        },
        function (err) {
          console.log(err)
        }
      )
      /*
          if(typeof country != undefined){
            //set the country in the db

            //then create a new stripe account

            //then set the stripe account in the db.
          }
          //we don't handle other fields just yet.
          Account.getRequiredFieldsById(accountId,
            (requiredFields) =>{
              var formData = requiredFields.map(field =>{
                var fieldName = field.field_name
                var fieldValue = req.data[fieldName]
                return (fieldName, fieldValue)
              })
              //update stripe
              //Account.createStripeAccount(accountId, )

              //update db
              removeRequiredFieldsById(req.user.customData.accountId, formData.map(fd => fd.fieldName), ()=>{
                res.redirect('/account/profile')
              }, (err)=>{
                console.error(err)
                res.redirect('/')
              })
            },
            (err)=>{
              console.error(err)
              res.redirect('/')
            })*/
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

  app.get('/event/:id', stormpath.loginRequired, function (req, res) {
    log.info('GET /event')

    var evtId = req.params['id']
    var fakeclient = req.params['fakeclient']
    log.info("evtId: " + evtId)
    Event.getEventById(evtId, (event) => {
      var user = req.user
      var userEmail = user.email
      var sessionId = event.openTokSessionId
      var token = opentok.generateToken(sessionId)
      var eventValue = event.eventValue
      return res.render('session.ejs', {
        sessionName: event.sessionName,
        s3Bucket: s3.bucketUrl,
        isLeader: event.leader === userEmail,
        user: req.user,
        event: event,
        openTokApiKey: process.env.tokboxAuth_apiKey,
        openTokSessionId: sessionId,
        openTokToken: token,
        eventValue: eventValue,
      });
    }, (err) => {
      log.info("err: " + err)
      res.redirect('/');
    })
  })
}