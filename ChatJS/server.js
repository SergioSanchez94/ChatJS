/**
 * @app Restaurants
 * @version 1.0
 * @author Sergio Sanchez
 */

//Dependencias
var express = require('express');  
var app = express();  
var server = require('http').Server(app);  
var io = require('socket.io')(server);
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var session = require('client-sessions');
var log4js = require('log4js');
var socketUsers = require('socket.io.users');
var fs = require('fs');

//Cookies
var cookieParser = require("cookie-parser");
var cookieSession = require("cookie-session");

//Configuración del Log
log4js.loadAppender('file');
log4js.addAppender(log4js.appenders.file('logs/log.log'), 'CHAT');
var logger = log4js.getLogger('CHAT');
logger.setLevel('ALL');

//Especificamos las rutas
var routes = require('./public/routes/users')(app)
var routes = require('./public/routes/messages')(app)

//Conexión a la BBDD
mongoose.connect('mongodb://localhost/users', function(err, res) {
if(err) {
  console.log('ERROR: connecting to Database. ' + err);
} else {
  console.log('Connected to Database');
}
});

//Mensajes
var messages = [];

//Contenido estatico de la app
app.use(express.static('public'));

//Acceso a peticiones request
app.use(express.bodyParser());

app.get('/hello', function(req, res) {  
  res.status(200).send("Hello World!");
});

io.on('connection', function(socket) {  
  console.log('Alguien se ha conectado con Sockets: ' + socket.id);
  logger.info("------------------- NEW CONNECTION FROM " + socket.id);
  
  messages = [];
  
  socket.emit('messages', messages);

  socket.on('new-message', function(data) {
    messages.push(data);

    io.sockets.emit('messages', messages);
  });
  
  socket.on('load-conver', function(data){  
	  messages = data;
	  
	  io.sockets.emit('messages', data);
  });
  
});

server.listen(80, function() {  
  console.log("Servidor corriendo en http://localhost:8080");
});
 