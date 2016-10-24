var chai = require('chai');
var expect = chai.expect;

var mockAccount = function () {
  this.save = function (cb) {
      cb(false)
    } 
}

var mongooseMock = {
  "Schema": () => {},
  "model": () => {
    return mockAccount;
  }
}

var AccountModule = require('./../../../app/models/account')(mongooseMock);

describe('Account', function () {
  describe('createAccount', function () {
    it('should create an account with the given id', (done) => {
      var acc = AccountModule.createNewAccount(12, (acc) => {
        expect(acc.id).to.equal(12);
        done()
      }, () => {
        throw "error"
      })

    })
  })

  describe('accountExists', function () {
    it('should return true if an account with the given id exists in the database', (done) => {
      mockAccount.findOne = function (_, cb) {
        cb(false, {})
      }
      AccountModule.accountExists(12, () => {
        done()
      }, () => {
        throw "error"
      })
    })

    it('should return false if an account with the given id does not exist', (done) => {
      mockAccount.findOne = function (_, cb) {
        cb(true, {})
      };
      AccountModule.accountExists(12, () => {
        throw "error"
      }, () => {
        done()
      })
    })
  })

  describe('getAccountById', function () {
    it('should get an existing account by ID', (done) => {
      mockAccount.findOne = function (_, cb) {
        cb(false, {
          name: "foo"
        })
      }
      AccountModule.getAccountById(12, (acc) => {
        expect(acc.name).to.equal("foo")
        done()
      }, () => {
        throw "error"
      })

    })
  })
})