var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');

var mockEvent = function () {
  this.save = sinon.mock().yields(false)
}

var mongooseMock = {
  "Schema": () => {},
  "model": () => {
    return mockEvent;
  }
}

var EventModule = require('./../../../app/models/event')(mongooseMock);

describe('Event', function () {
  describe('eventExists', function () {
    it('should return true if an event with the given id exists in the database', (done) => {
      mockEvent.count = sinon.stub().callsArgWith(1, false, 1)
      EventModule.eventExists(12,
        () => {
          done()
        },
        () => {
          done(new Error("fail"))
        }
      )
    })
    it('should return false if an event with the given id does not exist', (done) => {
      mockEvent.count = sinon.stub().callsArgWith(1, false, 0)
      EventModule.eventExists(12,
        () => {
          done(new Error("fail"))
        },
        () => {
          done()
        }
      )
    })
  })
  describe('createEvent', function () {
    it('should create an event with the given id', (done) => {
      var acc = EventModule.createNewEvent(12, (acc) => {
        expect(acc.id).to.equal(12);
        done()
      }, () => {
        done(new Error("fail"))
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
        done(new Error("fail"))
      })
    })
  })

  describe('addEventResource', function () {

    it('should add a resource to an existing event', (done) => {
      var saveFunction = sinon.stub().yields(false)
      var event = {
        resources: [],
        save: saveFunction
      }

      mockEvent.findOne = sinon.stub().callsArgWith(1, false, event)

      EventModule.addEventResource(12, "resourceName", "resourceUrl", "resourceKey",
        () => {
          expect(saveFunction.callCount).to.equal(1)
          expect(event.resources.length).to.equal(1)
          expect(event.resources[0].name).to.equal("resourceName")
          expect(event.resources[0].url).to.equal("resourceUrl")
          expect(event.resources[0].resourceKey).to.equal("resourceKey")
          expect(event.resources[0].active).to.equal(true)
          done()
        },
        (error) => {
          done(new Error("fail"))
        })
    })

    it('should fail to add a resource to an event which doesn\'t exist', (done) => {
      var saveFunction = sinon.mock().yields(false)
      mockEvent.findOne = sinon.stub().callsArgWith(1, true, {}) //doesn't exist

      EventModule.addEventResource(12, "resourceName", "resourceUrl", "resourceKey",
        () => {
          done(new Error("fail"))
        },
        (error) => {
          done()
        }
      )
    })
  })

  describe('removeEventResource', function () {
    it('should remove an existing resource from an event which exists', (done) => {
      var saveFunction = sinon.stub().yields(false)
      var event = {
        resources: [{
          "name": "foo",
          "resourceKey": "resourceKey",
          "url": "url",
          "active": true
        }],
        save: saveFunction
      }

      mockEvent.findOne = sinon.mock().callsArgWith(1, false, event)
      EventModule.removeEventResource(12, "resourceKey",
        () => {
          expect(saveFunction.callCount).to.equal(1)
          expect(event.resources.length).to.equal(1)
          expect(event.resources[0].active).to.equal(false)
          done()
        },
        (error) => {
          done(new Error("fail"))
        })
    })
  })
})