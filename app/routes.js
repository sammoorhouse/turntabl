var Event = require('../app/models/event');
var OpenTok = require('opentok');
var configAuth = require('../config/auth');
var opentok = new OpenTok(configAuth.tokboxAuth.apiKey, configAuth.tokboxAuth.clientSecret)

module.exports = function(app, passport) {

  // normal routes ===============================================================

  // show the home page (will also have our login links)
  app.get('/', function(req, res) {
    res.render('index.ejs');
  });

  // create-event SECTION =========================
  app.get('/create-event', isLoggedIn, function(req, res) {
    res.render('create-event.ejs', {
      user: req.user
    });
  });

  app.get('/form/create-event', isLoggedIn, function(req, res) {
    // if there is no user, create them
    var newEvent = new Event();
    var id = generateID()
    var leaderEmail = resolveEmail(req.user)
    newEvent.id = id
    newEvent.name = req.eventName
    newEvent.starts = req.eventDateTime
    newEvent.durationMins = 60
    newEvent.leader = leaderEmail
    newEvent.client = req.client
    newEvent.clientPaid = false
    newEvent.leaderPaid = false
    newEvent.attended = false

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

  app.get('/event/:id', isLoggedIn, function(req, res) {
    var evtId = req.param('id')
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
console.log("token: " + token)
        if (event.leader === userEmail) { // it's the leader
          return res.render('event.ejs', {
            event: event,
            apiKey: configAuth.tokboxAuth.apiKey,
            sessionId: sessionId,
            token: token
          });
        } else {
          return res.render('event-client.ejs', {
            event: event,
            apiKey: configAuth.tokboxAuth.apiKey,
            sessionId: sessionId,
            token: token
          });
        }
      }
    });
  })

  // profile SECTION =========================
  app.get('/profile', isLoggedIn, function(req, res) {
    res.render('profile.ejs', {
      user: req.user
    });
  });

  // LOGOUT ==============================
  app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
  });

  // =============================================================================
  // AUTHENTICATE (FIRST LOGIN) ==================================================
  // =============================================================================

  // locally --------------------------------
  // LOGIN ===============================
  // show the login form
  app.get('/login', function(req, res) {
    res.render('login.ejs', {
      message: req.flash('loginMessage')
    });
  });

  // process the login form
  app.post('/login', passport.authenticate('local-login', {
    successRedirect: '/create-event', // redirect to the secure create-event section
    failureRedirect: '/login', // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages
  }));

  // SIGNUP =================================
  // show the signup form
  app.get('/signup', function(req, res) {
    res.render('signup.ejs', {
      message: req.flash('loginMessage')
    });
  });

  // process the signup form
  app.post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/create-event', // redirect to the secure create-event section
    failureRedirect: '/signup', // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages
  }));

  // facebook -------------------------------

  // send to facebook to do the authentication
  app.get('/auth/facebook', passport.authenticate('facebook', {
    scope: 'email'
  }));

  // handle the callback after facebook has authenticated the user
  app.get('/auth/facebook/callback',
    passport.authenticate('facebook', {
      successRedirect: '/create-event',
      failureRedirect: '/'
    }));

  // twitter --------------------------------

  // send to twitter to do the authentication
  app.get('/auth/twitter', passport.authenticate('twitter', {
    scope: 'email'
  }));

  // handle the callback after twitter has authenticated the user
  app.get('/auth/twitter/callback',
    passport.authenticate('twitter', {
      successRedirect: '/create-event',
      failureRedirect: '/'
    }));


  // google ---------------------------------

  // send to google to do the authentication
  app.get('/auth/google', passport.authenticate('google', {
    scope: ['profile', 'email']
  }));

  // the callback after google has authenticated the user
  app.get('/auth/google/callback',
    passport.authenticate('google', {
      successRedirect: '/create-event',
      failureRedirect: '/'
    }));

  // =============================================================================
  // AUTHORIZE (ALREADY LOGGED IN / CONNECTING OTHER SOCIAL ACCOUNT) =============
  // =============================================================================

  // locally --------------------------------
  app.get('/connect/local', function(req, res) {
    res.render('connect-local.ejs', {
      message: req.flash('loginMessage')
    });
  });
  app.post('/connect/local', passport.authenticate('local-signup', {
    successRedirect: '/create-event', // redirect to the secure create-event section
    failureRedirect: '/connect/local', // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages
  }));

  // facebook -------------------------------

  // send to facebook to do the authentication
  app.get('/connect/facebook', passport.authorize('facebook', {
    scope: 'email'
  }));

  // handle the callback after facebook has authorized the user
  app.get('/connect/facebook/callback',
    passport.authorize('facebook', {
      successRedirect: '/create-event',
      failureRedirect: '/'
    }));

  // twitter --------------------------------

  // send to twitter to do the authentication
  app.get('/connect/twitter', passport.authorize('twitter', {
    scope: 'email'
  }));

  // handle the callback after twitter has authorized the user
  app.get('/connect/twitter/callback',
    passport.authorize('twitter', {
      successRedirect: '/create-event',
      failureRedirect: '/'
    }));


  // google ---------------------------------

  // send to google to do the authentication
  app.get('/connect/google', passport.authorize('google', {
    scope: ['profile', 'email']
  }));

  // the callback after google has authorized the user
  app.get('/connect/google/callback',
    passport.authorize('google', {
      successRedirect: '/create-event',
      failureRedirect: '/'
    }));

  // =============================================================================
  // UNLINK ACCOUNTS =============================================================
  // =============================================================================
  // used to unlink accounts. for social accounts, just remove the token
  // for local account, remove email and password
  // user account will stay active in case they want to reconnect in the future

  // local -----------------------------------
  app.get('/unlink/local', function(req, res) {
    var user = req.user;
    user.local.email = undefined;
    user.local.password = undefined;
    user.save(function(err) {
      res.redirect('/create-event');
    });
  });

  // facebook -------------------------------
  app.get('/unlink/facebook', function(req, res) {
    var user = req.user;
    user.facebook.token = undefined;
    user.save(function(err) {
      res.redirect('/create-event');
    });
  });

  // twitter --------------------------------
  app.get('/unlink/twitter', function(req, res) {
    var user = req.user;
    user.twitter.token = undefined;
    user.save(function(err) {
      res.redirect('/create-event');
    });
  });

  // google ---------------------------------
  app.get('/unlink/google', function(req, res) {
    var user = req.user;
    user.google.token = undefined;
    user.save(function(err) {
      res.redirect('/create-event');
    });
  });
  //===
  //form submission
  //===
  // google ---------------------------------
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

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated())
    return next();

  res.redirect('/');
}
