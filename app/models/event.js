// load the things we need
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

// define the schema for our user model
var eventSchema = mongoose.Schema({

  id: String,
  name: String,
  creationDate: Date,
  durationMins: Number,
  leader: String,
  clientPaid: Boolean,
  leaderPaid: Boolean,
  attended: Boolean,
  openTokSessionId: String,
  eventPrice: Number
});

// create the model for users and expose it to our app
module.exports = mongoose.model('Event', eventSchema);
