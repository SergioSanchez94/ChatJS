angular.module('app', []);

angular.module('app').controller("MainController", function($scope, $window, $http) {
	
	/*
	 * Busca un usuario
	 */
	$scope.user = function() {
		
		var user = document.getElementById("login").value;
		var password = document.getElementById("password").value;
		var respuesta = [];

		if(user!="" && password!=""){
			
			var respuesta;
			
			$http.get('/user/' + user + '/' + password).success(function(response) {			
				if(response[0] != null){
					window.open("chat.html?user="+response[0].user,'_self',false);
				}else{
					window.alert("Algo fue mal :(");
				}
			});
		}else{
			window.alert("Faltan campos por rellenar.");
		}
	}
	
});