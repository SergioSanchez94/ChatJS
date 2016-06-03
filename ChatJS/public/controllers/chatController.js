angular.module('app', []);

angular.module('app').controller("MainController", function($scope, $window, $http) {
	
	var conversaciones;
	var messages = [];
	
	var user;
	
	var paramstr = window.location.search.substr(1);
	var paramarr = paramstr.split("&");
	var params = {};
	var maps = [];
	
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
	
	//Carga de Perfil
	getProfile();
	
	var socket = io.connect('10.6.17.75', {
		'forceNew' : true
	});
	
	//Permiso de notificaciones
	document.addEventListener('DOMContentLoaded', function () {
	  if (Notification.permission !== "granted")
	    Notification.requestPermission();
	});
	
	socket.on('loadConversation'+user, function(data) {	
		messages = data;
		render(data);
		
		if(maps.length != 0){
			renderMaps();
		}	
	});
	
	socket.on('messages'+user, function(data) {
		
		//Almacenamos los datos en local
		messages = data;
		
		render(data);
		
		if(maps.length != 0){
			renderMaps();
		}
		
		var ultimoMensaje = messages[messages.length-1];
		console.log(ultimoMensaje);
	
		if(ultimoMensaje.destinatario == user){
			//Permiso de notificaciones
			document.addEventListener('DOMContentLoaded', function () {
			  if (Notification.permission !== "granted")
			    Notification.requestPermission();
			});
	
			  if (!Notification) {
			    alert('Las notificaciones están desactivadas.'); 
			    return;
			  }
	
			  if (Notification.permission !== "granted")
			    Notification.requestPermission();
			  else {
				  
				  var cabecera;
				  var cuerpo;
				  var imagen;
				  
				  if(ultimoMensaje.tipo == "text"){
					  cabecera = capitalizeFirstLetter(ultimoMensaje.author) + ' dice:';
					  cuerpo = ultimoMensaje.text;
					  imagen = 'img/icono.ico'; 
				  }else if(ultimoMensaje.tipo == "ocupacion"){
					  cabecera = capitalizeFirstLetter(ultimoMensaje.author) + ' te ha enviado la ocupación';
					  cuerpo = "Está a un " + ultimoMensaje.text + '%';
					  imagen = 'img/coffee.png';
				  }else if(ultimoMensaje.tipo == "file"){
					  cuerpo = "Te ha enviado un archivo adjunto";
				  }else if(ultimoMensaje.tipo == "ocupacion"){
					  cuerpo = "Te ha enviado su ubicación.";
				  }  
				  
			    var notification = new Notification(cabecera, {
			      icon: imagen,
			      body: cuerpo,
			    });
	
			    notification.onclick = function () {
			    	notification.close();
			    	window.focus();  
			    };
			    
			    setTimeout(function() { notification.close() }, 5000);
			}
		}
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
	    
	    if(nombreArchivo.indexOf(".pdf") > -1){
	    	renderTxt(file,"pdf");
	    }
	    
	});
	
	$http.get('/getDifferentConversations/' + user).success(function(response,err){
		if(!err){
			console.log("ERROR");
		}else{
			
			var users = [];
			var profiles = [];
			
			$scope.convers = response;
			
			users = response;
			
			for(var i=0; i<users.length; i++){
				$http.get('/getUsers/' + users[i]).success(function(response,err){
					if(!err){
						console.log("ERROR");
					}else{
						console.log(response[0].profile);
						profiles.push(response[0].profile);
					}
				});
			}
			
			$scope.profiles = profiles;
		}
	});

	/*
	 * Renderiza la vista con los nuevos mensajes
	 */
	function render(data) {
		
		var html = data.map(
				function(elem, index) {
					
					if(elem.tipo == "text"){
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
									+ elem.horas + '</fechaMensaje></div></div><br/><br/>');
						}
					}
					if(elem.tipo == "map"){
						//Mapa
						addMap(elem._id, elem.text);
						
						if(elem.author != user){
							//Mapa Destinatario
							return ('<div id="'+elem._id+'" class="mapDestinatario" style="height: 50%; width: 50%;"></div><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/>');
						}else{
							//Mapa Mio
							return ('<div id="'+elem._id+'" class="mapMio" style="height: 50%; width: 50%;"></div><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/>');
						}
					}
					if(elem.tipo == "file"){
						//Archivo
						console.log("Archivo encontrado");
					}
					if(elem.tipo == "weather"){
						//Weather
						var data = JSON.parse(elem.text);
						
						if(elem.author != user){
							//Weather Destinatario
							return ('<div id="'+elem._id+'" class="WeatherDestinatario"><div style="float: left;"><img src="img/weather/mostly cloudy day.ico" alt="Smiley face" height="42" width="42"></div><div style="float: right; padding-left: 10px;">'+ data.query.results.channel.location.city + ", " + data.query.results.channel.location.country + "</br>" + data.query.results.channel.item.condition.temp + ' °C</div></div><br/><br/><br/>');
						}else{
							//Weather Mio
							return ('<div id="'+elem._id+'" class="WeatherMio"><div style="float: left;"><img src="img/weather/mostly cloudy day.ico" alt="Smiley face" height="42" width="42"></div><div style="float: right; padding-left: 10px;">'+ data.query.results.channel.location.city + ", " + data.query.results.channel.location.country + "</br>" + data.query.results.channel.item.condition.temp +' °C</div></div><br/><br/><br/>');
						}
					}
					if(elem.tipo == "ocupacion"){
						
						var numero = parseInt(elem.text);

						//VERDE
						if(numero < 40){
							if(elem.author != user){
								//Ocupacion Destinatario
								return ('<div class="OcupacionDestinatario" style="background-color:#58FA58;"><div class="ocupacionText">' +  elem.text
										+ '%</div></div><br/><br/><br/><br/>');
							}else{
								//Ocupacion Mio
								return ('<div class="OcupacionMio" style="background-color:#58FA58;"><div class="ocupacionText">' + elem.text
										+ '%</div></div></div><br/><br/><br/><br/>');
							}
						//NARANJA
						}else if(numero > 40 && numero < 80){
							if(elem.author != user){
								//Ocupacion Destinatario
								return ('<div class="OcupacionDestinatario"  style="background-color:#FE9A2E;"><div class="ocupacionText">' +  elem.text
										+ '%</div></div><br/><br/><br/><br/>');
							}else{
								//Ocupacion Mio
								return ('<div class="OcupacionMio" style="background-color:#FE9A2E;"><div class="ocupacionText">' + elem.text
										+ '%</div></div></div><br/><br/><br/><br/>');
							}
						//ROJO
						}else if(numero > 80){
							if(elem.author != user){
								//Ocupacion Destinatario
								return ('<div class="OcupacionDestinatario"  style="background-color:#FF0000;"><div class="ocupacionText">' +  elem.text
										+ '%</div></div><br/><br/><br/><br/>');
							}else{
								//Ocupacion Mio
								return ('<div class="OcupacionMio" style="background-color:#FF0000;"><div class="ocupacionText">' + elem.text
										+ '%</div></div></div><br/><br/><br/><br/>');
							}
						}
					}
				}).join("");
		
		document.getElementById('messages').innerHTML = html;
		document.getElementById("texto").focus();
		
		divMessages.scrollTop = divMessages.scrollHeight;	
	}
	
	function addMap(id, coord){
		var map = [];
		
		map.push(id);
		map.push(coord);
		maps.push(map);
	}
	
	function renderMaps(){
		for(var i = 0; i < maps.length; i++){
			
			var map = maps[i];

			var coords = map[1].split(",");
			
			var myLatLng = {lat : parseFloat(coords[0]), lng : parseFloat(coords[1])};
			
			var styled = [{"featureType":"administrative.country","elementType":"labels.text","stylers":[{"lightness":"29"}]},{"featureType":"administrative.province","elementType":"labels.text.fill","stylers":[{"lightness":"-12"},{"color":"#796340"}]},{"featureType":"administrative.locality","elementType":"labels.text.fill","stylers":[{"lightness":"15"},{"saturation":"15"}]},{"featureType":"landscape.man_made","elementType":"geometry","stylers":[{"visibility":"on"},{"color":"#fbf5ed"}]},{"featureType":"landscape.natural","elementType":"geometry","stylers":[{"visibility":"on"},{"color":"#fbf5ed"}]},{"featureType":"poi","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"poi.attraction","elementType":"all","stylers":[{"visibility":"on"},{"lightness":"30"},{"saturation":"-41"},{"gamma":"0.84"}]},{"featureType":"poi.attraction","elementType":"labels","stylers":[{"visibility":"on"}]},{"featureType":"poi.business","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"poi.business","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"poi.medical","elementType":"geometry","stylers":[{"color":"#fbd3da"}]},{"featureType":"poi.medical","elementType":"labels","stylers":[{"visibility":"on"}]},{"featureType":"poi.park","elementType":"geometry","stylers":[{"color":"#b0e9ac"},{"visibility":"on"}]},{"featureType":"poi.park","elementType":"labels","stylers":[{"visibility":"on"}]},{"featureType":"poi.park","elementType":"labels.text.fill","stylers":[{"hue":"#68ff00"},{"lightness":"-24"},{"gamma":"1.59"}]},{"featureType":"poi.sports_complex","elementType":"all","stylers":[{"visibility":"on"}]},{"featureType":"poi.sports_complex","elementType":"geometry","stylers":[{"saturation":"10"},{"color":"#c3eb9a"}]},{"featureType":"road","elementType":"geometry.stroke","stylers":[{"visibility":"on"},{"lightness":"30"},{"color":"#e7ded6"}]},{"featureType":"road","elementType":"labels","stylers":[{"visibility":"on"},{"saturation":"-39"},{"lightness":"28"},{"gamma":"0.86"}]},{"featureType":"road.highway","elementType":"geometry.fill","stylers":[{"color":"#ffe523"},{"visibility":"on"}]},{"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"visibility":"on"},{"saturation":"0"},{"gamma":"1.44"},{"color":"#fbc28b"}]},{"featureType":"road.highway","elementType":"labels","stylers":[{"visibility":"on"},{"saturation":"-40"}]},{"featureType":"road.arterial","elementType":"geometry","stylers":[{"color":"#fed7a5"}]},{"featureType":"road.arterial","elementType":"geometry.fill","stylers":[{"visibility":"on"},{"gamma":"1.54"},{"color":"#fbe38b"}]},{"featureType":"road.local","elementType":"geometry.fill","stylers":[{"color":"#ffffff"},{"visibility":"on"},{"gamma":"2.62"},{"lightness":"10"}]},{"featureType":"road.local","elementType":"geometry.stroke","stylers":[{"visibility":"on"},{"weight":"0.50"},{"gamma":"1.04"}]},{"featureType":"transit.station.airport","elementType":"geometry.fill","stylers":[{"color":"#dee3fb"}]},{"featureType":"water","elementType":"geometry","stylers":[{"saturation":"46"},{"color":"#a4e1ff"}]}];
			
			var map = new google.maps.Map(document.getElementById(map[0]), {
				center : myLatLng,
				zoom : 15
			});
			
			map.setOptions({styles: styled});
			
			var image = {
				    url: 'img/marker.png',
				    size: new google.maps.Size(71, 71),
				    origin: new google.maps.Point(0, 0),
				    anchor: new google.maps.Point(17, 34),
				    scaledSize: new google.maps.Size(50, 50)
				  };
			
			var marker = new google.maps.Marker({
			    position: myLatLng,
			    map: map,
			    icon: image,
			    title: 'Aqui!',
			    animation: google.maps.Animation.DROP
			  });	
		}
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
		var $new = $(campo).hide().fadeIn(200);
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
		var $iDiv = $(iDiv).hide().fadeIn(200);
		
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
			tipo: "text",
			dia : dia,
			horas : horas,
			destinatario : destinatarioScope,
			leido: false
		};
		
		$http.post('/addMessage', message).success(function(response,err){
			if(!err){
				console.log("ERROR: " + err);
			}else{
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
				tipo: "text",
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
		maps = [];
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
				$('#messages').hide().fadeIn(200);
				
				document.getElementById("ChatBar").innerHTML = "Chat con " + destinatarioScope;

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
	    
	    var array=[];

	    reader.onload = function(evt){
	    	
	    	array.push(user);
	    	array.push(evt.target.result);
	    	array.push(file.name);
	        socket.emit('send-image', array, messages, user, destinatarioScope);
	    };
	    reader.readAsDataURL(file);
	});
	
	/*
	 * Utilidad para crear IDs unicos para los elementos del formulario
	 */
	function textoAleatotio()
	{
	    var text = "";
	    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	    for( var i=0; i < 5; i++ )
	        text += possible.charAt(Math.floor(Math.random() * possible.length));

	    return text;
	}
	
	/*
	 * Envia la ubicación actual del dispositivo
	 */
	$scope.sendLocation = function(){
		
		if (navigator.geolocation) {
		    navigator.geolocation.getCurrentPosition(function(position) {
		        var text = position.coords.latitude + "," + position.coords.longitude;
		        console.log("Location: " + text);
		      }
		    );
		}
	}
	
	/*
	 * Obtiene la ocupacion del servicio del comedor
	 */
	$scope.getOcupacion = function(req, res){
		
		var ocupacion;
		
		$.getJSON("https://sig.altran.es/a/ontrace/ontrace.api.asp",
		        function(data){
				   if (data.status == "OK"){
					 var sitios = data.placements;
					 if (sitios.length > 0){
						ocupacion = sitios[0].flow;
						
						if(ocupacion==""||ocupacion==null){
							ocupacion = "0";
						}

						var fecha = new Date();
						
						var dia = fecha.getDay();
						var horas = fecha.getHours() + ":" + fecha.getMinutes();
						
						var message = {
							author : user,
							text : ocupacion,
							tipo: "ocupacion",
							dia : dia,
							horas : horas,
							destinatario : destinatarioScope,
							leido: false
						};
						
						$http.post('/addMessage', message).success(function(response,err){
							if(!err){
								console.log("ERROR: " + err);
							}else{
								socket.emit('new-message', message, messages, user);
								socket.emit('new-message', message, messages, destinatarioScope);
								divMessages.scrollTop = divMessages.scrollHeight;
							}
						});
					 }
				   }
		        });		
	};
	
	function capitalizeFirstLetter(string) {
	    return string.charAt(0).toUpperCase() + string.slice(1);
	}
	
	$scope.sendWeather = function() {
		
		var localizacion  = document.getElementById("textoWeather").value;
		
	    $.get('https://query.yahooapis.com/v1/public/yql?q=select * from weather.forecast ' +
	          'where woeid in (select woeid from geo.places(1) where text="'+localizacion+'") and u="c" &format=json', function (data) {
	        
	    	var fecha = new Date();
			
			var dia = fecha.getDay();
			var horas = fecha.getHours() + ":" + fecha.getMinutes();
			
			var message = {
				author : user,
				text : JSON.stringify(data),
				tipo: "weather",
				dia : dia,
				horas : horas,
				destinatario : destinatarioScope,
				leido: false
			};
			
			$http.post('/addMessage', message).success(function(response,err){
				if(!err){
					console.log("ERROR: " + err);
				}else{
					socket.emit('new-message', message, messages, user);
					socket.emit('new-message', message, messages, destinatarioScope);
					divMessages.scrollTop = divMessages.scrollHeight;
				}
			});
			
	    });
	}
	
	/*
	 * Carga la foto de perfil
	 */
	function getProfile(){
		
		$http.get('/getUsers/' + $scope.user).success(function(response,err){
			if(!err){
				console.log("ERROR: " + err);
			}else{
				//document.getElementById("profile").src = response[0].profile;
				$scope.imgProfileUser = response[0].profile;
			}
		});
		
	}
	
	/*
	 * Almacena una foto seleccionada en el scope
	 */
	$('#updatePhoto').on('change', function(e){

	    var file = e.originalEvent.target.files[0],
	        reader = new FileReader();
	    
	    var array=[];

	    reader.onload = function(evt){
	    	
	    	 $('#profileUpdate').attr('src', evt.target.result);
	    	
	    	//console.log(evt.target.result);
	    	$scope.imgProfileUser = evt.target.result;
	    	
	    };
	    reader.readAsDataURL(file);
	});
	
	
	/*
	 * Actualiza la foto de perfil seleccionada previamente
	 */
	$scope.guardarCambiosPerfil = function(){
		
		$http.post('/updateProfilePhoto', {"user": user, "photo" : $scope.imgProfileUser}).success(function(response,err){
			if(!err){
				console.log("ERROR");
			}else{
				console.log("OK");
			}
		});
	}
	
});