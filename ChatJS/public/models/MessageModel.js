var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var message = new Schema({
  author:   { type: String, require: true },
  text:   { type: String, require: true },
  dia : { type: String, require: true },
  horas : { type: String, require: true },
  destinatario:   { type: String, require: true }
});

module.exports = mongoose.model('message', message);
