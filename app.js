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
			scope.interchange = function(person, oldIndex, newIndex, $element)
			{				
				var list = person.preferences.list;
				
				var aux = list[oldIndex];
				var oldHash = list[oldIndex].$$hashKey;
				var newHash = list[newIndex].$$hashKey;

				list[oldIndex] = list[newIndex];
				list[oldIndex].$$hashKey = oldHash;
				list[oldIndex].index = oldIndex;
				person.preferences.index[list[oldIndex].name] = list[oldIndex].index;

				list[newIndex] = aux;
				list[newIndex].$$hashKey = newHash;
				list[newIndex].index = newIndex; 
				person.preferences.index[list[newIndex].name] = list[newIndex].index;
				
				person.preferences.list = list;

				console.log($element);
			}
		}
	};
})

app.controller("ctrl", 
			["$scope", "$timeout", "$q",
	function($scope, $timeout, $q)
	{
		$scope.size = 5;
		$scope.timeout = 500;
		$scope.stepByStep = false;
		var boysIndex = {};
		var girlsIndex = {};

		$scope.generate = function()
		{
		        mPromise = metaPromise();
			backup = [];
			$scope.editable = true;
			$scope.labels = (function(n){ var list = []; for (var i = 0; i < n; i++) { list.push( "#" + (i + 1))}; return list;})($scope.size);
			var boynames = names.boys.slice(0, $scope.size);
			var girlnames = names.girls.slice(0, $scope.size);

			$scope.boys = generateRows(boynames, girlnames);
			boysIndex = buildIndex($scope.boys);
			$scope.girls = generateRows(girlnames, boynames);
			girlsIndex = buildIndex($scope.girls);
		};

	        $scope.clean = function()
	        {		       
		    mPromise = metaPromise();
		    backup = [];
		    $scope.editable = true;
		    $scope.boys = cleanRows($scope.boys);
		    $scope.girls = cleanRows($scope.girls);
		}

                var cleanRows = function(persons)
                {
                    persons.forEach(function(person){
			person.last = -1;
			var names = _.map(person.preferences.list, function(p){ return p.name; });
                        names = _.sortBy(names, function(n){ return person.preferences.index[n]; });
			person.preferences = createPreferences(names);
		    });

                    return persons;
                }

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

			$timeout(matchThem, 0);
		};

		var backup;

		var matchThem = function()
		{
			backup = _.clone($scope.boys).reverse();
			var boy = backup.splice(_.random(0, backup.length - 1), 1)[0];
			matchBoy(boy);			
		}

		var metaPromise = function()
		{
			var meta = new $q.defer();
		        meta.trigger = meta.resolve;
			return meta;
		}; 

		var mPromise = metaPromise();

		$scope.nextStep = function()
		{
			mPromise.trigger();
			mPromise = metaPromise();
		};

		var matchBoy = function(boy)
		{
 				boy.last = boy.last+1;
				var preference = boy.preferences.list[boy.last];

				var girl = $scope.girls[girlsIndex[preference.name]];
				var girlpreference = girl.preferences.list[girl.preferences.index[boy.name]];
                                var algo = $q.defer();
			
						preference.state = "current";
						girlpreference.state = "current";

						if($scope.stepByStep){
							mPromise.promise.then(algo.resolve);
						}
						else
						{
							$timeout(algo.resolve, $scope.timeout);
						}
				algo.promise
				.then(function()
					{
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
							backup.push(oldBoy);	
						}
						else
						{
							preference.state = "unavailable";
							girlpreference.state = "unavailable";
							backup.push(boy);
						}						
					})
				.then(function()
					{
						var callback = function()
							{ 
								var newboy = backup.splice(_.random(0, backup.length - 1), 1)[0]; 
								if(newboy)
								{
									matchBoy(newboy);
								}
							};

						if($scope.stepByStep)
						{
							mPromise.promise.then(callback);
						}
						else{
							$timeout(callback, $scope.timeout);
						}
					});
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
