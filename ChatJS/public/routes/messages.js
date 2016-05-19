module.exports = function(app) {

	//Modelos de BBDD
	var Message = require('../models/MessageModel.js');
	
	//Modulos
	var express = require('express');  
	app.use(express.bodyParser());
	var log4js = require('log4js'); 
	var logger = log4js.getLogger('CHAT');
	
	/*
	 * POST - Insert a new Message in the DB
	 */
	addMessage = function(req, res) {

		var message = new Message({
			  author: req.body.author,
			  text: req.body.text,
			  tipo: req.body.tipo,
			  dia : req.body.dia,
			  horas : req.body.horas,
			  destinatario : req.body.destinatario
		});

		message.save(function(err) {
			if (!err) {
				logger.info("POST /addMessage - OK" + " | from " + req.body.author + " to " + req.body.destinatario + "\n" + message);
				return res.send({
					status : 'OK',
					message : message
				});
			} else {
				logger.error('POST /addMessage - ' + err + "\n"+ message);
				if (err.name == 'ValidationError') {
					res.statusCode = 400;
					res.send({
						error : 'Validation error'
					});
				} else {
					res.statusCode = 500;
					res.send({
						error : 'Server error'
					});
				}
			}
		});
		res.send(message);
	};
	
	/*
	 * GET Messages from DB
	 */
	getMessages = function(req, res){
		try{
			Message.find(function(err, docs) {
				res.json(docs);
				if(err){
					logger.error("GET /getMessages - " + err);
				}else{
					logger.info("GET /getMessages - OK");
				}	
			});
		}catch(e){
			res.json(e);
			logger.error("GET /getMessages - " + e);
		}
	};
	
	/*
	 * DELETE all messages from DB
	 */
	deleteAllMessages = function(req, res){
		try{
			var author = req.params.author;
			var destinatario = req.params.destinatario;
			
			Message.remove({
			    "$or": [{
			        "author": author,
			        "destinatario" : destinatario
			    }, {
			        "author": destinatario,
			        "destinatario": author
			    }]
			},function(err,removed) {
				res.json(removed)
				if(err){
					logger.error("DELETE /deleteAllMessages - " + err);
				}else{
					logger.info("DELETE /deleteAllMessages - OK");
				}	
			});
		}catch(e){
			res.json(e);
			logger.error("DELETE /deleteAllMessages - " + e);
		}
	};
	
	/*
	 * GET Messages by Author and Destinatario
	 */
	getMessageByAuthorDestinatario = function(req, res){
		try{
			var author = req.params.author;
			var destinatario = req.params.destinatario;
			
			console.log(author + ":"+ destinatario);
			Message.find({
			    "$or": [{
			        "author": author,
			        "destinatario" : destinatario
			    }, {
			        "author": destinatario,
			        "destinatario": author
			    }]
			},function(err, docs) {
				res.json(docs);
				
				console.log(docs.toString());
				
				if(err){
					logger.error("GET /getMessageByAuthorDestinatario - " + err);
				}else{
					logger.info("GET /getMessageByAuthorDestinatario - OK | Conversation: " + author + "&" + destinatario);
				}	
			});	
			
		}catch(e){
			res.json(e);
			logger.error("GET /getMessageByAuthorDestinatario - " + e);
		}
	};
	
	/*
	 * GET Different Conversations
	 */
	getDifferentConversations = function(req, res){
		try{
			var author = req.params.author;
			var conversaciones = [];
			
			Message.find({
			    "$or": [{
			        "author": author
			    }, {
			        "destinatario": author
			    }]
			},function(err, docs) {
				
				for(var i = 0; i<docs.length; i++){
					
					if(docs[i].author == author){
						if(!comprobarConversaciones(conversaciones,docs[i].destinatario)){
							conversaciones.push(docs[i].destinatario);					
						}
					}else if(docs[i].destinatario == author){
						if(!comprobarConversaciones(conversaciones,docs[i].author)){
							conversaciones.push(docs[i].author);
						}
					}
				}
				
				res.json(conversaciones);
				
				if(err){
					logger.error("GET /getDifferentConversations - " + err);
				}else{
					logger.info("GET /getDifferentConversations - OK | Conversation: " + author);
				}	
			});	
			
		}catch(e){
			res.json(e);
			logger.error("GET /getDifferentConversations - " + e);
		}
	};
	
	function comprobarConversaciones(conversaciones, comprobante){
		
		var retorno = false;
		
		for(var i = 0; i<conversaciones.length; i++){
			if(conversaciones[i]==comprobante){
				retorno = true;
			}
		}
		
		return retorno;
	}

	//Links routes and functions
	app.post('/addMessage', addMessage);
	app.get('/getMessages', getMessages);
	app.delete('/deleteAllMessages/:author/:destinatario', deleteAllMessages);
	app.get('/getMessageByAuthorDestinatario/:author/:destinatario', getMessageByAuthorDestinatario);
	app.get('/getDifferentConversations/:author', getDifferentConversations);
}