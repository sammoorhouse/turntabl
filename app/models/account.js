module.exports = function (client) {
  var util = require('../utils.js');

  var createNewAccount = function (id, success, failure) {
    client.query('INSERT INTO accounts(account_id, bio) VALUES \
    ($1::text, $2::text)', [id, ""], function(err, result){
      if(err){
        console.log('INSERT failed: ' + err)
        failure(err)
      }else{
        console.log('INSERT succeeded for ' + id)
        console.log('adding country as a required_field for ' + id)
        client.query('INSERT INTO required_fields(account_id, field_name) VALUES \
        ($1::text, $2::text)', [id, 'country'], function(err, result){
          if(err){
            console.log('adding required_field failed for ' + id)
            failure(err)
          }else{
            console.log('adding required_field failed for ' + id)
            success()
          }
        })
      }
    })
  }

  var accountExists = function (id, success, failure) {
    client.query('SELECT COUNT(account_id) as cnt FROM accounts WHERE account_id = $1::text', [id], function(err, result){
      if(err){
        failure(err);
      }else{
        (result.rows[0].cnt == 0 ) ? failure() : success()
      }
    })
  }

  var getAccountById = function (id, success, failure) {
    client.query('SELECT account_id, bio \
    FROM accounts \
    WHERE account_id = $1::text', [id], function(err, result){
      if(err){
        failure(err)
      }else{
        success({
          accountId: results.rows[0].account_id,
          bio: results.rows[0].bio
        })
      }
    })
  }

  var getRequiredFieldsById = function(id, success, failure){
    client.query('SELECT field_name from required_fields where account_id = $1::text', [id], function(err, result){
      if(err){
        failure(err)
      }else{
        success(result.rows)
      }
    })
  }

  var createStripeAccount = function(id, country, success, failure){
    //do the stripe business here; link to account
  }

  return {
    "createNewAccount": createNewAccount,
    "accountExists": accountExists,
    "getAccountById": getAccountById,
  }
}