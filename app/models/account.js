module.exports = function (mongoose) {

  var accountSchema = mongoose.Schema({
    id: String,
    bio: String,
    creationDate: Date,
    sessions: []
  });

  var AccountModel = mongoose.model('Account', accountSchema);

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
  }
}