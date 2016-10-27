module.exports = function (mongoose) {


  var eventSchema = mongoose.Schema({
    id: String,
    name: String,
    creationDate: Date,
    durationMins: Number,
    endTime: Date,
    leader: String,
    clientPaid: Boolean,
    leaderPaid: Boolean,
    openTokSessionId: String,
    eventPrice: Number,
    resources: []
  });

  var EventModel = mongoose.model('Event', eventSchema);

  var createNewEvent = function (id, success, failure) {
    var newEvent = new EventModel();
    newEvent.id = id;
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