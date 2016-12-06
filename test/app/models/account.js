/*

var chai = require('chai');
var expect = chai.expect;

var sinon = require('sinon');

var mockClient = function () {
  this.query = sinon.stub().yields(false)
}


var AccountModule = require('./../../../app/models/account')(mockClient);

describe('Account', function () {
  describe('createAccount', function () {
    it('should create an account with the given id', (done) => {
      var acc = AccountModule.createNewAccount(12, (acc) => {
        expect(acc.id).to.equal(12);
        done()
      }, () => {
        done(new Error("fail"))
      })
    })
  })

  describe('accountExists', function () {
    it('should return true if an account with the given id exists in the database', (done) => {
      mockAccount.count = sinon.stub().callsArgWith(1, false, 1) //stub out database
      AccountModule.accountExists(12, () => {
        done()
      }, () => {
        done(new Error("fail"))
      })
    })

    it('should return false if an account with the given id does not exist', (done) => {
      mockAccount.count = sinon.stub().callsArgWith(1, false, 0) //stub out database
      AccountModule.accountExists(12, () => {
        done(new Error("fail"))
      }, () => {
        done()
      })
    })
  })

  describe('getAccountById', function () {
    it('should get an existing account by ID', (done) => {
      mockAccount.findOne = sinon.stub().callsArgWith(1, false, {
        name: "foo"
      }); //return a mock account
      AccountModule.getAccountById(12, (acc) => {
        expect(acc.name).to.equal("foo")
        done()
      }, () => {
        done(new Error("fail"))
      })
    })
  })
})

*/