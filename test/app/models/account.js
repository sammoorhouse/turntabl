var chai = require('chai');
var expect = chai.expect;

var sinon = require('sinon');

var mockAccount = function () {
  this.save = sinon.stub().yields(false)
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
        throw new Error("fail")
      })

    })
  })

  describe('accountExists', function () {
    it('should return true if an account with the given id exists in the database', (done) => {
      mockAccount.findOne = sinon.stub().callsArgWith(1, false, {}) //stub out database
      AccountModule.accountExists(12, () => {
        done()
      }, () => {
        throw new Error("fail")
      })
    })

    it('should return false if an account with the given id does not exist', (done) => {
      mockAccount.findOne = sinon.stub().callsArgWith(1, true, {}) //stub out database
      AccountModule.accountExists(12, () => {
        throw new Error("fail")
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
        throw new Error("fail")
      })

    })
  })
})