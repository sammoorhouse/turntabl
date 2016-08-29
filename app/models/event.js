var mongoose = require('mongoose');

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

module.exports = mongoose.model('Event', eventSchema);
