var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var users = new Schema({
  user: {type: String, index: {unique: true, dropDups: true}},
  password : {type: String},
  profile : {type: String}
});

module.exports = mongoose.model('Users', users);