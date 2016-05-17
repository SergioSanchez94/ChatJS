module.exports = function(app) {

	//Modelos de BBDD
	var Users = require('../models/UserModel.js');
	
	//Modulos
	var express = require('express');  
	app.use(express.bodyParser());

	/*
	 * Find User by ID
	 */
	findById = function(req, res) {
		return Users.findById(req.params.id, function(err, users) {
			if (!users) {
				res.statusCode = 404;
				return res.send({
					error : 'Not found'
				});
			}
			if (!err) {
				return res.send({
					status : 'OK',
					users : users
				});
			} else {
				res.statusCode = 500;
				console.log('Internal error(%d): %s', res.statusCode,
						err.message);
				return res.send({
					error : 'Server error'
				});
			}
		});
	};
	
	/*
	 * GET - Find User by User and password
	 */
	findByName = function(req, res) {
		
		try{
			var name = req.params.name;
			var pwd = req.params.pwd;
			
			Users.find({user: name, password: pwd},function(err, docs) {
				res.json(docs);
			});	
			
		}catch(e){
			res.json(e);
		}

	};

	/*
	 * POST - Add User 
	 */
	addUser = function(req, res) {
		
		console.log('POST - /addUser');
		console.log(req.body);

		var users = new Users({
			user : req.body.user,
			password : req.body.password,
			convers: req.body.convers
		});

		users.save(function(err) {
			if (!err) {
				console.log("Users created");
				return res.send({
					status : 'OK',
					users : users
				});
			} else {
				console.log(err);
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
				console.log('Internal error(%d): %s', res.statusCode,
						err.message);
			}
		});
	};
	
	deleteUser = function(req, res){
		
		try{
			var user = req.body.user;
			var password = req.body.password;
			
			Users.remove({user: user, password: password},function(err, docs) {
				res.json(docs);
				
				if(!err){
					console.log("OK - DELETE: " + user);
				}else{
					console.log("ERROR: " + err);
				}
			});	
			
		}catch(e){
			res.json(e);
		}
	}
	
	/*
	 * GET USERS
	 */
	getUsers = function(req, res){
		try{
			
			var user = req.params.user;
			
			Users.find({user : {'$regex': user}},function(err, docs) {
				res.json(docs);
				if(err){
					//logger.error("GET /getUsers - " + err);
				}else{
					//logger.info("GET /getUsers - OK");
				}	
			});
		}catch(e){
			res.json(e);
			//logger.error("GET /getUsers - " + e);
		}
	};

	// Link routes and functions
	app.get('/user/:name/:pwd', findByName);
	app.get('/userByID/:id', findById);
	app.post('/addUser', addUser);
	app.delete('/deleteUser', deleteUser);
	app.get('/getUsers/:user', getUsers);

}