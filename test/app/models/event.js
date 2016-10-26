var chai = require('chai');
var expect = chai.expect;

var sinon = require('sinon');

var mockEvent = function () {
  this.save = sinon.stub().yields(false)
}

var mongooseMock = {
  "Schema": () => {},
  "model": () => {
    return mockEvent;
  }
}

var EventModule = require('./../../../app/models/event')(mongooseMock);

describe('Event', function () {
  describe('createEvent', function () {
    it('should create an event with the given id', (done) => {
      var acc = EventModule.createNewEvent(12, (acc) => {
        expect(acc.id).to.equal(12);
        done()
      }, () => {
        throw new Error("fail")
      })

    })
  })

  describe('getEventById', function () {
    it('should get an existing event by ID', (done) => {
      mockEvent.findOne = sinon.stub().callsArgWith(1, false, {
        name: "foo"
      }); //return a mock account
      EventModule.getEventById(12, (acc) => {
        expect(acc.name).to.equal("foo")
        done()
      }, () => {
        throw new Error("fail")
      })

    })
  })

  //describe('addEventResource')
  //describe('updateEndTime')
})