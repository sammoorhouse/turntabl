module.exports = function (mongoose) {


  var eventSchema = mongoose.Schema({
    id: String,
    name: String,
    creationDate: Date,
    duration: String,
    sessionDate: Date,
    leader: String,
    clientFirstname: String,
    clientLastname: String,
    clientEmail: String,
    clientPaid: Boolean,
    leaderPaid: Boolean,
    openTokSessionId: String,
    sessionCcy: Number,
    sessionPrice: Number,
    resources: []
  });

  var EventModel = mongoose.model('Event', eventSchema);

  var createNewEvent = function (id, name, creationDate,
  duration, sessionDate, leader, clientFirstname,
  clientLastname, clientEmail, clientPaid, leaderPaid,
  openTokSessionId, sessionCcy, sessionPrice, success, failure) {
    var newEvent = new EventModel();
    newEvent.id = id;
    newEvent.name = name;
    newEvent.creationDate = creationDate;
    newEvent.duration = duration;
    newEvent.sessionDate = sessionDate;
    newEvent.leader = leader;
    newEvent.clientFirstname = clientFirstname;
    newEvent.clientLastname = clientLastname;
    newEvent.clientEmail = clientEmail;
    newEvent.clientPaid = clientPaid;
    newEvent.leaderPaid = leaderPaid;
    newEvent.openTokSessionId = openTokSessionId;
    newEvent.sessionCcy = sessionCcy;
    newEvent.sessionPrice = sessionPrice;
    newEvent.resources = [];
    
    newEvent.save(function (err) {
      if (err) {
        failure(err)
      } else {
        success(newEvent)
      }
    })
  }

  var eventExists = function (id, success, failure) {
    EventModel.count({
      "id": id
    }, (err, count) => {
      if (!err && count > 0) {
        success()
      } else {
        failure()
      }
    });
  }

  var getEventById = function (id, success, failure) {
    EventModel.findOne({
      "id": id
    }, (err, evt) => {
      if (!err && evt) {
        success(evt)
      } else {
        failure(err)
      }
    })
  }

  var addEventResource = function (eventId, name, url, resourceKey, success, failure) {
    getEventById(eventId, (event) => {
      event.resources.push({
        "name": name,
        "url": url,
        "resourceKey": resourceKey,
        "active": true,
      })
      event.save(function (error) {
        if (error) {
          failure(error)
        } else {
          success()
        }
      })
    }, () => {
      failure()
    })
  }

  var removeEventResource = function (eventId, resourceKey, success, failure) {
    EventModel.findOne({
      "id": eventId
    }, (err, event) => {
      if (!err && event) {
        var resources = event.resources.filter(r => r.resourceKey == resourceKey)

        resources.forEach(resource => {
          resource.active = false;
        });
        
        event.save(function (error) {
          if (error) {
            failure(error)
          } else
            success()
        })
      } else {
        failure(error)
      }
    })
  }

  var updateEndTime = function (id, endTime, success, failure) {
    EventModel.findOne({
      "id": id
    }, (err, evt) => {
      if (!err && evt) {
        evt.endTime = endTime
        evt.save(function (error) {
          if (error) {
            failure(error)
          } else {
            success()
          }
        })
      } else {
        failure()
      }
    })
  }

  return {
    "eventExists": eventExists,
    "createNewEvent": createNewEvent,
    "getEventById": getEventById,
    "addEventResource": addEventResource,
    "removeEventResource": removeEventResource
  }

}