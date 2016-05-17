angular.module('app', []);

angular.module('app').controller("MainController", function($scope, $window, $http) {
	
	/*
	 * Obtiene el historial de mensajes de la BBDD
	 */
	/*
	$http.get('/getMessages').success(function(response,err){
		if(!err){
			console.log("ERROR");
		}else{
			var mensajes = [];
			mensajes = response;
			for(var i = 0; i<mensajes.length; i++){
				socket.emit('new-message', mensajes[i]);
			}
			socket.emit('load-conver',mensajes);
		}
	});
	*/
	var conversaciones;
	
	var socket = io.connect('10.6.17.155', {
		'forceNew' : true
	});
	
	socket.on('messages', function(data) {
		render(data);
	})
	
	var user;
	
	var paramstr = window.location.search.substr(1);
	var paramarr = paramstr.split("&");
	var params = {};
	
	for (var i = 0; i < paramarr.length; i++) {
		var tmparr = paramarr[i].split("=");
		params[tmparr[0]] = tmparr[1];
	}
	if (params['user']) {
		user = params['user'];
		$scope.user = user;
	} else {
		console.log('No se envió el parámetro variable');
	}
	
	var destinatarioScope;
	
	//Scroll
	var divMessages = document.getElementById("messages");
	divMessages.scrollTop = divMessages.scrollHeight;
	
	//Vista CHAT por defecto
	var defaultView = document.getElementById("defaultChat");
	defaultView.style.display = "block";
	
	//Vista Chats
	var chatConversation = document.getElementById("chatConversation");
	chatConversation.style.display = "none";
	
	//Vista Nuevo Chat
	var listaBusqueda = document.getElementById("listaBusqueda");
	listaBusqueda.style.display = "none";
	
	$http.get('/getDifferentConversations/' + user).success(function(response,err){
		if(!err){
			console.log("ERROR");
		}else{
			conversaciones = response;
			$scope.convers = conversaciones;
		}
	});

	/*
	 * Renderiza la vista con los nuevos mensajes
	 */
	function render(data) {
		
		var html = data.map(
				function(elem, index) {
					
					if(elem.author != user){
						//Mensaje del destinatario
						return ('<div class="MensajeDestinatario"><strong>      ' + elem.author
								+ '</strong>:         ' + elem.text
								+ '      <br><fechaMensaje class="fechaMensaje">'
								+ elem.horas + '</fechaMensaje></div><br/><br/>');
					}else{
						//Mensaje Mio
						if(elem.text == "map"){
							return ('<div id="map"></div>');
						}else{
							return ('<div class="MensajeMio"><strong>      ' + elem.author
									+ '</strong>:         ' + elem.text
									+ '      <br><fechaMensaje class="fechaMensaje">'
									+ elem.horas + '</fechaMensaje></div><br/><br/>');
						}
					}
					
	
				}).join("");
		
		document.getElementById('messages').innerHTML = html;
		document.getElementById("texto").focus();
		divMessages.scrollTop = divMessages.scrollHeight;
	}
	
	/*
	 * Añade un nuevo mensaje a la BBDD
	 */
	$scope.addMessage = function(e) {
	
		var fecha = new Date();
	
		var dia = fecha.getDay();
		var horas = fecha.getHours() + ":" + fecha.getMinutes();
		
		var message = {
			author : user,
			text : document.getElementById('texto').value,
			dia : dia,
			horas : horas,
			destinatario : destinatarioScope
		};
		
		$http.post('/addMessage', message).success(function(response,err){
			if(!err){
				console.log("ERROR: " + err);
			}else{
				socket.emit('new-message', message);
				divMessages.scrollTop = divMessages.scrollHeight;
			}
		});

		document.getElementById('texto').value = "";
		
		return false;
	}
	
	$scope.addNewConversation = function() {

		var form = document.getElementById("listaBusqueda");
		var destinatarioForm = form.options[form.selectedIndex].value;
		
		var fecha = new Date();
	
		var dia = fecha.getDay();
		var horas = fecha.getHours() + ":" + fecha.getMinutes();
		
		var message = {
			author : user,
			text : document.getElementById('textoNewConversation').value,
			dia : dia,
			horas : horas,
			destinatario : destinatarioForm
		};
		
		$http.post('/addMessage', message).success(function(response,err){
			if(!err){
				console.log("ERROR: " + err);
			}else{
				socket.emit('new-message', message);
				divMessages.scrollTop = divMessages.scrollHeight;
			}
		});
		
		$http.get('/getDifferentConversations/' + user).success(function(response,err){
			if(!err){
				console.log("ERROR");
			}else{
				conversaciones = response;
				$scope.convers = conversaciones;
			}
		});
		
		$http.get('/getMessageByAuthorDestinatario/'+user+'/'+destinatarioForm).success(function(response,err){
			if(!err){
				console.log("ERROR");
			}else{
				historial = response;
				socket.emit('load-conver', historial);
				divMessages.scrollTop = divMessages.scrollHeight;
				
				//Visibilidad
				defaultView.style.display = "none";
				chatConversation.style.display = "block";
			}
		});	

		document.getElementById('textoNewConversation').value = "";
		document.getElementById('nuevoDestinatario').value = "";
		form.value = [];
		
		destinatarioScope = destinatarioForm;
		
		return false;
	}
	
	/*
	 * Llama al servicio para borrar todo el historial de Mensajes de la BBDD
	 */
	$scope.deleteAllMessages = function() {
		
		$http.delete('/deleteAllMessages/' + user + '/' + destinatarioScope).success(function(response,err){
			if(!err){
				console.log("ERROR: " + err);
			}
		});
		
		$http.get('/getDifferentConversations/' + user).success(function(response,err){
			if(!err){
				console.log("ERROR");
			}else{
				conversaciones = response;
				$scope.convers = conversaciones;
			}
		});
		
		defaultView.style.display = "block";
		chatConversation.style.display = "none";
	}
	
	/*
	 * Comprueba el campo del mensaje
	 */
	$scope.validate = function(){
		if($scope.texto=="" || $scope.texto==null){
			return true;
		}else{
			return false;
		}
	}
	
	/*
	 * Devuelve un array necesario para mostrar las valoraciones mediante estrellas
	 */
	$scope.recorrer = function(numberinString){
		var numberinNumber = parseInt(numberinString);
		var numberArray = [];
		numberArray.length = numberinNumber;
		return numberArray;
	}
	
	/*
	 * Obtiene una conversacion determinada
	 */
	$scope.getConversation = function(destinatario){
		
		destinatarioScope = destinatario;
		var author = user;
		var historial;
		
		$http.get('/getMessageByAuthorDestinatario/'+user+'/'+destinatario).success(function(response,err){
			if(!err){
				console.log("ERROR");
			}else{
				historial = response;
				socket.emit('load-conver', historial);
				divMessages.scrollTop = divMessages.scrollHeight;
				
				//Visibilidad
				defaultView.style.display = "none";
				chatConversation.style.display = "block";
			}
		});	
	}
	
	$scope.showNuevoDestinatario = function() {
		if(defaultView.style.display == "block"){
			defaultView.style.display = "none";
			chatConversation.style.display = "block";
		}
	}
	
	$scope.searchUser = function(user){
		
		try{
			var busqueda = document.getElementById("nuevoDestinatario").value;
			
			 $http.get('/getUsers/'+busqueda).success(function(response,err){
					if(!err){
						console.log("ERROR");
					}else{
						console.log("GET - BUSQUEDA USERS CON: " + busqueda);
						var usuarios = [];
						for(var i = 0; i<response.length; i++){
							if(response[i].user != $scope.user){
								usuarios.push(response[i].user);
							}	
						}	
						$scope.busquedaUsuarios = usuarios;
					}
				});
			 
			 listaBusqueda.style.display = "block";
			 
		}catch(e){
			$scope.busquedaUsuarios = [];
			listaBusqueda.style.display = "none";
		}
		
	}
});