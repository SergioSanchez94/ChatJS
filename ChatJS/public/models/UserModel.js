var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var users = new Schema({
  user: {type: String},
  password : {type: String},
  convers: {type: String}
});

module.exports = mongoose.model('Users', users);