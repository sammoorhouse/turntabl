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
    EventModel.findOne({
      "id": id
    }, (err, evt) => {
      if (!err && evt) {
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

  var addEventResource = function (id, name, url, resourceKey, success, failure) {
    EventModel.findOne({
      "id": id
    }, (err, evt) => {
      if (!err && evt) {
        evt.resources.push({
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
      } else {
        failure()
      }
    })
  }

  var updateEndTime = function(id, endTime, success, failure){
    EventModel.findOne({
      "id": id
    }, (err, evt)=>{
      if(!err && evt){
        evt.endTime = endTime
        evt.save(function (error){
          if(error){
            failure(error)
          }else{
            success()
          }
        })
      }else{
        failure()
      }
    })
  }

  return {
    "createNewEvent": createNewEvent,
    "getEventById": getEventById,
    "addEventResource": addEventResource,

  }

}