var mongoose = require('mongoose');

var accountSchema = mongoose.Schema({
  id: String,
  bio: String,
  creationDate: Date,
  sessions: []
});

module.exports = mongoose.model('Account', accountSchema);
