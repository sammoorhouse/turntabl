module.exports = function (mongoose) {
  var util = require('../utils.js');

  var accountSchema = mongoose.Schema({
    id: String,
    bio: String,
    creationDate: Date,
    sessions: []
  });

  var AccountModel = mongoose.model('Account', accountSchema);

  function ensureAccount(user, success, failure) {
    user.getCustomData(function (err, customData) {
      var accountId = customData.accountId;
      console.log("accountid is " + accountId);
      accountExists(accountId, () => {
        //account does exist...
        success()
      }, () => {
        //account doesn't exist, create it
        var newAccountId = util.generateID(8);
        var newAccount = createNewAccount(newAccountId, (acc) => {
          customData.accountId = newAccountId;
          customData.save(function (err) {
            if (!err) {
              success()
            } else {
              failure()
            }
          });
        }, () => {
          console.error("failed to save account " + newAccountId + ": " + err);
          failure()
        });
      })
    })
  }

  var createNewAccount = function (id, success, failure) {
    var newAccount = new AccountModel();
    newAccount.id = id;
    newAccount.save(function (err) {
      if (err) {
        failure(err)
      } else {
        success(newAccount)
      }
    })
  }

  var accountExists = function (id, success, failure) {
    AccountModel.count({
      "id": id
    }, (err, count) => {
      if (!err && count > 0) {
        success()
      } else {
        failure()
      }
    });
  }

  var getAccountById = function (id, success, failure) {
    AccountModel.findOne({
      "id": id
    }, (err, acc) => {
      if (!err && acc) {
        success(acc)
      } else {
        failure(err)
      }
    })
  }

  return {
    "createNewAccount": createNewAccount,
    "accountExists": accountExists,
    "getAccountById": getAccountById,
    "ensureAccount": ensureAccount,
  }
}