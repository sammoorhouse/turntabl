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
        success()
      }
    })
  }

  var addStripeAccount = function(id, stripeAccountId, success, failure){
    client.query("UPDATE accounts SET stripe_account_id=$1::text WHERE account_id=$2::text", [stripeAccountId, id],
    function(err, result){
      if(err){
        failure(err)
      }else{
        success()
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
          accountId: result.rows[0].account_id,
          bio: result.rows[0].bio,
        })
      }
    })
  }

  return {
    "createNewAccount": createNewAccount,
    "accountExists": accountExists,
    "getAccountById": getAccountById,
    "addStripeAccount": addStripeAccount,
  }
}