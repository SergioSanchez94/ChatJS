angular.module('app', []);

angular.module('app').controller("MainController", function($scope, $window, $http) {
	
	var conversaciones;
	var messages = [];
	
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
	
	var socket = io.connect('10.6.17.155', {
		'forceNew' : true
	});
	
	socket.on('messages'+user, function(data) {
		//Almacenamos los datos en local
		messages = data;
		
		render(data);
	});
	
	socket.on('renderImg'+user, function(file) {
		
		var nombreArchivo = file[2];
	    
	    //En caso de que sea .image
	    if((nombreArchivo.indexOf(".png") > -1)||(nombreArchivo.indexOf(".jpg") > -1)||(nombreArchivo.indexOf(".ico") > -1)){
	    	renderImg(file);
	    }
	    
	    //En caso de que sea .text
	    if(nombreArchivo.indexOf(".txt") > -1){
	    	renderTxt(file,"txt");
	    }
	    
	    if(nombreArchivo.indexOf(".docx") > -1){
	    	renderTxt(file,"word");
	    }
	    
	    if(nombreArchivo.indexOf(".pptx") > -1){
	    	renderTxt(file,"powerpoint");
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
					}else if(elem.author == user){
						//Mensaje Mio
						return ('<div class="MensajeMio"><strong>      ' + elem.author
								+ '</strong>:         ' + elem.text
								+ '      <br><fechaMensaje class="fechaMensaje">'
								+ elem.horas + '</fechaMensaje></div><br/><br/>');
					}	
	
				}).join("");
		
		document.getElementById('messages').innerHTML = html;
		document.getElementById("texto").focus();
		divMessages.scrollTop = divMessages.scrollHeight;	
		
	}
	
	function renderTxt(file, extension){
		
		var idAleatorio = textoAleatotio();
		
		//Div Descarga
		var campo = document.createElement('a');
		
		if(file[0]==user){
			campo.setAttribute('class','imgMio');
		}else{
			campo.setAttribute('class','imgDestinatario');
		}
		campo.setAttribute('id',idAleatorio);
		campo.setAttribute('download',file[2]);
		campo.setAttribute('href',file[1]);
		
		//Div Imagen de Descarga
		var iDiv = document.createElement('img');
		iDiv.setAttribute('alt',file[2]);
		iDiv.setAttribute('title',file[2]);
		iDiv.id = 'file';
		
		if(file[0]==user){
			iDiv.className = 'imgMio';
		}else{
			iDiv.className = 'imgDestinatario';
		}	

		iDiv.src = "/img/file.png";

		iDiv.setAttribute('height', '25%');
		iDiv.setAttribute('width', '17%');
		
		//Animaciones jQuery
		var $new = $(campo).hide().fadeIn(500);
		var $iDiv = $(iDiv);
		
		$('#messages').append($new);
		$('#'+idAleatorio).append($iDiv);
		
		//Salto de linea
		var br = document.createElement('br');	
		document.getElementById('messages').appendChild(br);
		
		divMessages.scrollTop = divMessages.scrollHeight;
	}
	
	function renderImg(img){
		
		//Div IMG
		var iDiv = document.createElement('img');
		iDiv.id = 'imagen';
		
		if(img[0]==user){
			iDiv.className = 'imgMio';
		}else{
			iDiv.className = 'imgDestinatario';
		}	
		
		iDiv.src = img[1];
		iDiv.setAttribute('height', '50%');
		iDiv.setAttribute('width', '50%');
		
		//Animaciones jQuery
		var $iDiv = $(iDiv).hide().fadeIn(500);
		
		$('#messages').append($iDiv);
		
		//Salto de linea
		var br = document.createElement('br');	
		document.getElementById('messages').appendChild(br);
		
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
				console.log("USUARIO AL AÑADIR:" + user);
				socket.emit('new-message', message, messages, user);
				socket.emit('new-message', message, messages, destinatarioScope);
				divMessages.scrollTop = divMessages.scrollHeight;
			}
		});

		document.getElementById('texto').value = "";
		
		return false;
	}
	
	/**
	 * Valida el Formulario para crear una nueva conversación
	 */
	$scope.validateFormNewConversation = function() {
		var retorno = true;
		
		try{
			
			if(document.getElementById('textoNewConversation').value != "" && document.getElementById('textoNewConversation').value != null){
				var form = document.getElementById("listaBusqueda");
				var destinatarioForm = form.options[form.selectedIndex].value;
				
				if(destinatarioForm != "" && destinatarioForm != null){
					retorno = false;
				}
			}
		
		}catch(e){
			retorno = true;
		}
		return retorno;
	}
	
	/**
	 * Inicia una nueva conversacion
	 */
	$scope.addNewConversation = function() {
		
		try{
			
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
					socket.emit('new-message', message, messages, user);
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
					socket.emit('load-conver', historial, user);
					divMessages.scrollTop = divMessages.scrollHeight;
					
					//Visibilidad
					defaultView.style.display = "none";
					chatConversation.style.display = "block";
				}
			});	
	
			document.getElementById('textoNewConversation').value = "";
			document.getElementById('nuevoDestinatario').value = "";
			form.value = [];
			$scope.busquedaUsuarios = [];
			listaBusqueda.style.display = "none";
			
			destinatarioScope = destinatarioForm;
		
		}catch(e){
			console.log(e);
		}
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
				socket.emit('load-conver', historial, user);
				divMessages.scrollTop = divMessages.scrollHeight;
				
				//Visibilidad
				defaultView.style.display = "none";
				chatConversation.style.display = "block";
				
				//Animacion
				$('#messages').hide().fadeIn(500);
			}
		});	
	}
	
	/**
	 * Muestra la vista de conversaciones y bloquea la ventana por defecto
	 */
	$scope.showNuevoDestinatario = function() {
		if(defaultView.style.display == "block"){
			defaultView.style.display = "none";
			chatConversation.style.display = "block";
		}
	}
	
	/**
	 * Realiza una busqueda de usuarios.
	 */
	$scope.searchUser = function(user){
		try{
			var busqueda = document.getElementById("nuevoDestinatario").value;
			
			if(busqueda != "" && busqueda != null){
			
					$http.get('/getUsers/'+busqueda).success(function(response,err){
						if(!err){
							console.log("ERROR");
						}else{
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
			}else{
				$scope.busquedaUsuarios = [];
				listaBusqueda.style.display = "none";
			}
			 
		}catch(e){
			$scope.busquedaUsuarios = [];
			listaBusqueda.style.display = "none";
		}
		
	}
	
	/**
	 * 
	 * Envío de archivos por socket
	 */
	$('#sendFile').on('change', function(e){

	    var file = e.originalEvent.target.files[0],
	        reader = new FileReader();

	    reader.onload = function(evt){
	    	var array=[]
	    	array.push(user);
	    	array.push(evt.target.result);
	    	array.push(file.name);
	        socket.emit('send-image', array, messages, user, destinatarioScope);
	    };
	    reader.readAsDataURL(file);  
	});
	
	function textoAleatotio()
	{
	    var text = "";
	    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	    for( var i=0; i < 5; i++ )
	        text += possible.charAt(Math.floor(Math.random() * possible.length));

	    return text;
	}

});