module.exports = function (client) {

  var createNewEvent = function (id, name, creationDate,
    duration, sessionDate, leader, clientFirstname,
    clientLastname, clientEmail, clientPaid, leaderPaid,
    openTokSessionId, sessionCcy, sessionPrice, success, failure) {
    client.query('INSERT INTO sessions(session_id, \
    session_name, creation_date, duration, session_date, \
    leader_account_id, client_firstname, client_lastname, client_email, \
    client_paid, leader_paid, opentok_session_id, session_ccy, \
    session_price, session_started) \
    values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, \
    $13, $14, $15)', [id, name, creationDate, duration,
      sessionDate, leader, clientFirstname, clientLastname,
      clientEmail, clientPaid, leaderPaid, openTokSessionId,
      sessionCcy, sessionPrice, false
    ], function (err, results) {
      if (err) {
        failure(err)
      } else {
        success(newEvent)
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
    leader_account_id, client_firstname, client_lastname, client_email, \
    client_paid, leader_paid, opentok_session_id, session_ccy, \
    session_price \
    FROM sessions \
    WHERE session_id = $1::text', [id], function (err, result) {
      if (err) {
        failure(err)
      } else {
        var row = results.rows[0];
        success({
          sessionId: row.account_id,
          sessionName: row.session_name,
          creationDate: row.creation_date,
          duration: row.duration,
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
    leader_account_id, client_firstname, client_lastname, client_email, \
    client_paid, leader_paid, opentok_session_id, session_ccy, \
    session_price \
    FROM sessions \
    WHERE leader_account_id = $1::text \
    AND session_started = false', [accountId], function (err, results) {
      if (err) {
        failure(err)
      } else {
        var events = results.rows.map(function (row) {
          return {
            sessionId: row.account_id,
            sessionName: row.session_name,
            creationDate: row.creation_date,
            duration: row.duration,
            sessionData: row.session_date,
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
    leader_account_id, client_firstname, client_lastname, client_email, \
    client_paid, leader_paid, opentok_session_id, session_ccy, \
    session_price \
    FROM sessions \
    WHERE leader_account_id = $1::text \
    AND session_started = true', [accountId], function (err, results) {
      if (err) {
        failure(err)
      } else {
        var events = results.rows.map(function (row) {
          return {
            sessionId: row.account_id,
            sessionName: row.session_name,
            creationDate: row.creation_date,
            duration: row.duration,
            sessionData: row.session_date,
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

  return {
    "eventExists": eventExists,
    "createNewEvent": createNewEvent,
    "getEventById": getEventById,
    "getHistoricEventsByAccountId": getHistoricEventsByAccountId,
    "getPendingEventsByAccountId": getPendingEventsByAccountId
  }

}