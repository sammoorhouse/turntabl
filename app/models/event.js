module.exports = function (client) {

  var createNewEvent = function (id, name, creationDate,
    duration, sessionDate, leader,
    clientName, clientPaid, leaderPaid,
    openTokSessionId, sessionCcy, sessionPrice, sessionStarted, success, failure) {
    client.query('INSERT INTO sessions(session_id, \
    session_name, creation_date, duration, session_date, \
    leader_account_id, client_name, \
    client_paid, leader_paid, opentok_session_id, session_ccy, \
    session_price, session_started) \
    values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, \
    $13)', [id, name, creationDate, duration,
      sessionDate, leader, clientName, clientPaid, leaderPaid, openTokSessionId,
      sessionCcy, sessionPrice, sessionStarted
    ], function (err, results) {
      if (err) {
        failure(err)
      } else {
        success(results)
      }
    })
  };

  var eventExists = function (id, success, failure) {
    client.query('SELECT COUNT(session_id) as cnt FROM sessions WHERE session_id = $1::text', [id], function (err, result) {
      if (err) {
        failure(err);
      } else {
        (result.rows[0].cnt == 0) ? success(): failure()
      }
    })
  }

  var getEventById = function (id, success, failure) {
    client.query('SELECT session_id, \
    session_name, creation_date, duration, session_date, \
    leader_account_id, client_name, \
    client_paid, leader_paid, opentok_session_id, session_ccy, \
    session_price \
    FROM sessions \
    WHERE session_id = $1::text', [id], function (err, result) {
      if (err) {
        failure(err)
      } else {
        var row = result.rows[0];
        success({
          sessionId: row.account_id,
          sessionName: row.session_name,
          creationDate: row.creation_date,
          duration: row.duration,
          clientName: row.client_name,
          sessionData: row.session_date,
          clientPaid: row.client_paid,
          leaderPaid: row.leader_paid,
          openTokSessionId: row.opentok_session_id,
          sessionCcy: row.session_ccy,
          sessionPrice: row.session_price
        })
      }
    })
  }

  getPendingEventsByAccountId = function (accountId, success, failure) {
    client.query('SELECT session_id, \
    session_name, creation_date, duration, session_date, \
    leader_account_id, client_name, \
    client_paid, leader_paid, opentok_session_id, session_ccy, \
    session_price \
    FROM sessions \
    WHERE leader_account_id = $1::text \
    AND session_started = false \
    ORDER BY session_date ASC', [accountId], function (err, results) {
      if (err) {
        failure(err)
      } else {
        var events = results.rows.map(function (row) {
          return {
            sessionId: row.session_id,
            sessionName: row.session_name,
            creationDate: row.creation_date,
            duration: row.duration,
            clientName: row.client_name,
            sessionDate: row.session_date,
            clientPaid: row.client_paid,
            leaderPaid: row.leader_paid,
            openTokSessionId: row.opentok_session_id,
            sessionCcy: row.session_ccy,
            sessionPrice: row.session_price
          }
        })
        success(events)
      }
    })
  }

  getHistoricEventsByAccountId = function (accountId, success, failure) {
    client.query('SELECT session_id, \
    session_name, creation_date, duration, session_date, \
    leader_account_id, client_name, \
    client_paid, leader_paid, opentok_session_id, session_ccy, \
    session_price \
    FROM sessions \
    WHERE leader_account_id = $1::text \
    AND session_started = true \
    ORDER BY session_date ASC', [accountId], function (err, results) {
      if (err) {
        failure(err)
      } else {
        var events = results.rows.map(function (row) {
          return {
            sessionId: row.session_id,
            sessionName: row.session_name,
            creationDate: row.creation_date,
            duration: row.duration,
            clientName: row.client_name,
            sessionDate: row.session_date,
            clientPaid: row.client_paid,
            leaderPaid: row.leader_paid,
            openTokSessionId: row.opentok_session_id,
            sessionCcy: row.session_ccy,
            sessionPrice: row.session_price
          }
        })
        success(events)
      }
    })
  }

  getTodaysEvents = function(accountId, success, failure){
        client.query('SELECT session_id, \
    session_name, creation_date, duration, session_date, \
    leader_account_id, client_name, \
    client_paid, leader_paid, opentok_session_id, session_ccy, \
    session_price \
    FROM sessions \
    WHERE leader_account_id = $1::text \
    AND session_date >= now()::date - interval \'1d\' \
    AND session_date < now()::date + interval \'1d\' \
    AND session_started = false', [accountId], function (err, results) {
      if (err) {
        failure(err)
      } else {
        var events = results.rows.map(function (row) {
          return {
            sessionId: row.session_id,
            sessionName: row.session_name,
            creationDate: row.creation_date,
            duration: row.duration,
            clientName: row.client_name,
            sessionDate: row.session_date,
            clientPaid: row.client_paid,
            leaderPaid: row.leader_paid,
            openTokSessionId: row.opentok_session_id,
            sessionCcy: row.session_ccy,
            sessionPrice: row.session_price
          }
        })
        success(events)
      }
    })
  }

  startEvent = function(id, success, failure){
    client.query('UPDATE sessions SET session_started=true WHERE session_id = $1', [id], function(err, results){
      if(err){
        failure(err)
      }else{
        success()
      }
    })
  }

  return {
    "eventExists": eventExists,
    "createNewEvent": createNewEvent,
    "getEventById": getEventById,
    "getHistoricEventsByAccountId": getHistoricEventsByAccountId,
    "getPendingEventsByAccountId": getPendingEventsByAccountId,
    "getTodaysEvents": getTodaysEvents,
    "startEvent": startEvent
  }

}