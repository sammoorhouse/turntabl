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
      }
    })
  }

  var setCountryCode = function(id, countryCode, success, failure){
    client.query("UPDATE accounts SET country_code=$1::text WHERE account_id=$2::text", [countryCode, id],
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
          accountId: results.rows[0].account_id,
          bio: results.rows[0].bio,
          countryCode: results.rows[0].country_code,
        })
      }
    })
  }

  var createStripeAccount = function(id, country, success, failure){
    //do the stripe business here; link to account
            stripe.accounts.update(
          req.user.customData.stripe_id,
          formData)
  }

  return {
    "createNewAccount": createNewAccount,
    "accountExists": accountExists,
    "getAccountById": getAccountById,
    "createStripeAccount": createStripeAccount,
  }
}