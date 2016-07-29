// load the things we need
var mongoose = require('mongoose');

// define the schema for our user model
var accountSchema = mongoose.Schema({

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

// create the model for users and expose it to our app
module.exports = mongoose.model('Account', accountSchema);
