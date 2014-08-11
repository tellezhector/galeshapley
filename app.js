var app = angular.module("app", []);

app.directive("personsTable", function($timeout)
{
	return {
		restrict : "E",
		templateUrl : "/tableTemplate.html",
		scope : 
		{
			persons : "=",
			labels : "=",
			editable : "="
		},
		link : function(scope, element)
		{


			scope.interchange = function(person, indexChanged, newIndex)
			{				
				var list = person.preferences.list;
				
				var aux = list[indexChanged];
				list[indexChanged] = list[newIndex];
				list[indexChanged].index = indexChanged;
				person.preferences.index[list[indexChanged].name] = list[indexChanged].index;

				list[newIndex] = aux;
				list[newIndex].index = newIndex; 
				person.preferences.index[list[newIndex].name] = list[newIndex].index;
				
				person.preferences.list = list;
			}
		}
	};
})

app.controller("ctrl", 
			["$scope", "$timeout", 
	function($scope, $timeout)
	{
		$scope.size = 5;
		$scope.timeout = 500;
		$scope.stepByStep = false;
		var boysIndex = {};
		var girlsIndex = {};

		$scope.generate = function()
		{
			$scope.editable = true;
			$scope.labels = (function(n){ var list = []; for (var i = 0; i < n; i++) { list.push( "#" + (i + 1))}; return list;})($scope.size);
			var boynames = names.boys.slice(0, $scope.size);
			var girlnames = names.girls.slice(0, $scope.size);

			$scope.boys = generateRows(boynames, girlnames);
			boysIndex = buildIndex($scope.boys);
			$scope.girls = generateRows(girlnames, boynames);
			girlsIndex = buildIndex($scope.girls);
		};

		var buildIndex = function(persons)
		{
			var index = {}; 
			var counter = 0; 
			persons.forEach(function(boy){
					index[boy.name] = counter; 
					counter = counter+1;
				}); 
			return index;
		};

		var generateRows = function(names1, names2)
		{
			var rows = [];

			names1.forEach(
				function(name)
				{
					var subject = { 'name' : name, 'preferences' : createPreferences(_.shuffle(names2)), 'last' : -1 };
					rows.push(subject);
				}
			);

			return rows;
		};

		var createPreferences = function(names)
		{
			var preferences = {};
			preferences.list = [];
			preferences.index = {};
			var counter = 0;

			names.forEach(function(name)
			{
				var preference = {};
				preference.name = name;
				preference.state = "available";
				preference.index = counter;
				preferences.list.push(preference);
				preferences.index[name] = counter;
				counter = counter + 1;
			})

			return preferences;
		};

		$scope.galeSapley = function()
		{
			$scope.editable = false;
			if($scope.stepByStep)
			{
				$scope.showNextStep = true;
			}

			matchBoy($scope.boys[0]);
		};

		var matchBoy = function(boy)
		{
			var preference = boy.preferences.list[boy.last];

			if(typeof preference != "undefined" && preference.state == "matched")
			{
				return;
			}

			boy.last = boy.last+1;
			preference = boy.preferences.list[boy.last];			
			preference.state = "current";

			var girl = $scope.girls[girlsIndex[preference.name]];

			var girlpreference = girl.preferences.list[girl.preferences.index[boy.name]];
			girlpreference.state = "current";

			if(girl.last == -1)
			{
				girl.last = girlpreference.index;
				girlpreference.state = "matched";
				preference.state = "matched";
			}
			else if(girl.last > girlpreference.index)
			{
				var oldPrefernce = girl.preferences.list[girl.last];
				
				girl.last = girlpreference.index;
				girlpreference.state = "matched";
				preference.state = "matched";
			
				var oldBoy = $scope.boys[boysIndex[oldPrefernce.name]];
				oldPrefernce.state = "unavailable";
				oldBoy.preferences.list[oldBoy.last].state = "unavailable";
				matchBoy(oldBoy);
				
			}
			else
			{
				preference.state = "unavailable";
				girlpreference.state = "unavailable";
				matchBoy(boy);
			}

			matchNextBoy(boy);
		}

		var matchNextBoy = function(boy)
		{
			var boyIndex = boysIndex[boy.name];
			if(boyIndex == $scope.size - 1)
			{
				return;
			}

			matchBoy($scope.boys[boyIndex + 1]);
		}

		$scope.generate();
	}]);