var chai = require('chai');
var expect = chai.expect;

var mockEvent = function () {
  this.save = function (cb) {
      cb(false)
    } 
}

var mongooseMock = {
  "Schema": () => {},
  "model": () => {
    return mockEvent;
  }
}

var EventModule = require('./../../../app/models/event')(mongooseMock);

describe('Event', function(){
  describe('createEvent', function () {
    it('should create an event with the given id', (done) => {
      var acc = EventModule.createNewEvent(12, (acc) => {
        expect(acc.id).to.equal(12);
        done()
      }, () => {
        throw "error"
      })

    })
  })

  describe('getEventById', function () {
    it('should get an existing event by ID', (done) => {
      mockEvent.findOne = function (_, cb) {
        cb(false, {
          name: "foo"
        })
      }
      EventModule.getEventById(12, (acc) => {
        expect(acc.name).to.equal("foo")
        done()
      }, () => {
        throw "error"
      })

    })
  })

  describe('addEventResource')
  describe('updateEndTime')
})