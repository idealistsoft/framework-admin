/**
 * JS for models in admin dashboard
 * 
 * @author Jared King <j@jaredtking.com>
 * @link http://jaredtking.com
 * @version 1.0
 * @copyright 2013 Jared King
 * @license MIT
	Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
	associated documentation files (the "Software"), to deal in the Software without restriction,
	including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
	and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so,
	subject to the following conditions:
	
	The above copyright notice and this permission notice shall be included in all copies or
	substantial portions of the Software.
	
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
	LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
	IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
	WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
	SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
 
if (typeof angular != 'undefined') {
	
	var app = angular.module('models', ['ngResource','ngRoute','ngSanitize','ui.bootstrap','ui.date']);
	
	app.factory('Model', ['$resource', function ($resource) {
		var Model = $resource(
			'/api/' + module + '/' + modelInfo.plural_key + '/:modelId',
			{ modelId : '@modelId' },
			{
				findAll: { method: 'GET', headers: { Accept: 'application/json'} },
				find: { method: 'GET', headers: { Accept: 'application/json'} },
				delete: { method: 'DELETE', headers: { Accept: 'application/json'} },
				edit: { method: 'PUT', headers: { Accept: 'application/json'} },
				create: { method: 'POST', headers: { Accept: 'application/json'} }
			}
		);
		
		return Model;
	}]);
	
	app.config(['$routeProvider',function($routeProvider) {
			$routeProvider.
			when('/', {
				controller: ModelCntl,
				templateUrl: '/templates/admin/models.html'
			}).
			when('/new', {
				controller: ModelCntl,
				templateUrl: '/templates/admin/editModel.html'
			}).
			when('/:id', {
				controller: ModelCntl,
				templateUrl: '/templates/admin/model.html'
			}).
			when('/:id/edit', {
				controller: ModelCntl,
				templateUrl: '/templates/admin/editModel.html'
			}).
			otherwise({redirectTo:'/'});
	}]);
	
	/* Directives */
	
	app.directive('eatClick', function() {
	    return function(scope, element, attrs) {
	        $(element).click(function(event) {
	            event.preventDefault();
	        });
	    };
	});
	
	app.directive('expandingTextarea', function() {
	    return {
	        restrict: 'A',
	        link: function (scope, element, attrs) {
	       		$(element).expandingTextarea();
	       		
	       		scope.$watch(attrs.ngModel, function (v) {
	       			$(element).expandingTextarea('resize');
	       		});
	        }
	    };
	});

	app.directive('jsonEditor', ['$parse', function($parse) {
	    return {
	        restrict: 'A',
	        require: 'ngModel',
	        link: function (scope, element, attrs, ngModel) {
	        	var model = $parse(attrs.ngModel);

	        	var opt = {
	        		change: function(data) {
	        			scope.$apply(function() {
	        				ngModel.$setViewValue(data);
	        			});
	        		}
	        	};
	       		
	       		scope.$watch(model, function (data) {
	       			if (typeof data != 'object')
	       				return;

	       			$(element).jsonEditor(data, opt);
	       		});
	        }
	    };
	}]);
	
	/* Filters */
	
	app.filter('modelValue', function() {
		return function (model, properties, property, truncate) {
			
			// apply admin html
			if (typeof(property.admin_html) == 'string')
			{
				value = property.admin_html;
				
				for (var i in properties)
				{
					// replace placeholders with values
					var search = '{' + properties[i].name + '}';
					
					if (value.indexOf(search) != -1)
						value = value.replace(
							new RegExp(search, "g"),
							parseModelValue(model, properties[i], truncate));
				}
				
				return value;
			}
			// no admin html
			else
				return parseModelValue(model, property, truncate);
		};
	});
	
	var ModelCntl = ['$scope', '$routeParams', '$location', '$modal', 'Model',
		function($scope, $routeParams, $location, $modal, Model) {
			
			$scope.module = module;
			$scope.modelInfo = modelInfo;
			$scope.page = 1;
			$scope.limit = 10;	
			$scope.deleteModel = false;
			$scope.models = [];
			$scope.loading = false;
			$scope.sort = [];
			$scope.sortStates = {'0':'1','1':'-1','-1':'0'};
			$scope.sortMap = {'1':'asc','-1':'desc'};
			$scope.filter = {};
			$scope.hasFilter = {};
			$scope.visibleProperties = {};
			// O(N^2)...
			for (var i in $scope.modelInfo.properties) {
				var property = $scope.modelInfo.properties[i].name;
				var found = false;
				for (var j in $scope.modelInfo.visibleProperties) {
					if ($scope.modelInfo.visibleProperties[j].name == property) {
						found = true;
						break;
					}
				}
				$scope.visibleProperties[property] = found;
			}

			$scope.loadModels = function(keepPage) {
				if (!keepPage)
					$scope.page = 1;

				var start = ($scope.page - 1) * $scope.limit;
			
				$scope.loading = true;
				
				var params = {
					search: $scope.query,
					start: start,
					limit: $scope.limit
				};
				
				// convert $scope.sort array into a properly formatted string
				var sorted = [];
				for (var i in $scope.sort)
					sorted.push($scope.sort[i].name + ' ' + $scope.sortMap[$scope.sort[i].direction]);
				params.sort = sorted.join(',');
				
				// find out which properties are filtered
				for (var i in $scope.hasFilter) {
					if ($scope.hasFilter[i] && $scope.filter[i])
						params['filter[' + i + ']'] = $scope.filter[i];
				}
			
				Model.findAll(params, function(result) {
				
					$scope.filtered_count = result.filtered_count,
					$scope.links = result.links,
					$scope.page = result.page,
					$scope.page_count = result.page_count,
					$scope.per_page = result.per_page,
					$scope.total_count = result.total_count
					
					$scope.models = result[$scope.modelInfo.plural_key];
					
					// massage data for client side use
					for (var i in $scope.models)
						massageModelForClient ($scope.models[i], $scope.modelInfo);
					
					$scope.loading = false;
					
				}, function(error) {
				
					$scope.loading = false;
					
				});
			};

			$scope.noModels = function() {
				if ($scope.models.length > 0)
					return false;

				for (var i in $scope.hasFilter)
				{
					if ($scope.hasFilter[i])
						return false;
				}

				return true;
			};

			$scope.toggleVisibility = function(property) {
				if ($scope.visibleProperties[property.name]) {
					$scope.modelInfo.visibleProperties.push(property);
				} else {
					for (var i in $scope.modelInfo.visibleProperties) {
						if ($scope.modelInfo.visibleProperties[i].name == property.name) {
							$scope.modelInfo.visibleProperties.splice(i, 1);
							break;
						}
					}
				}
			}
			
			$scope.sortDirection = function(property) {
				for (var i in $scope.sort) {
					if ($scope.sort[i].name == property.name)
						return $scope.sort[i].direction;
				}
				
				return 0;
			};
			
			$scope.toggleSort = function(property) {
				var current = $scope.sortDirection(property);
				
				// add to the sort list
				var nextState = $scope.sortStates[current];
				
				if (current == 0)
					$scope.sort.push({name:property.name, direction:nextState});
				else
				{
					// find the index of the property
					var index = -1;
					for (var i in $scope.sort) {
						if ($scope.sort[i].name == property.name) {
							index = i;
							break;
						}
					}
					
					// remove
					if (nextState == 0)
						$scope.sort.splice(index, 1);
					// update
					else
						$scope.sort[index].direction = nextState;
				}
				
				$scope.loadModels();
			};
			
			$scope.showFilter = function(property) {
				$scope.hasFilter[property.name] = true;
				$scope.loadModels();
			};
			
			$scope.hideFilter = function(property) {
				$scope.hasFilter[property.name] = false;
				$scope.loadModels();
			};
				
			$scope.currentPages = function(n) {
				var pages = [];
				
				var i = 0;
				var start = $scope.page - Math.floor(n/2);
				
				if ($scope.page_count - $scope.page < Math.floor(n/2))
					start -= Math.floor(n/2) - ($scope.page_count - $scope.page);
				
				start = Math.max(start, 1);
				
				var p = start;
		
				while (i < n && p <= $scope.page_count) {
					pages.push(p);
					i++;
					p++;
				}
				
				return pages;
			};
			
			$scope.prevPage = function() {
				$scope.goToPage($scope.page-1);
			};
			
			$scope.nextPage = function() {
				$scope.goToPage($scope.page+1);
			};
			
			$scope.goToPage = function(p) {
				if (p < 1 || p > $scope.page_count)
					return;
				
				if ($scope.page != p) {
					$scope.page = p;
					$scope.loadModels(true);
				}
			};
			
			$scope.findModel = function(id) {
				$scope.loading = false;
				
				Model.find({
					modelId: id
				}, function (result) {
				
					$scope.model = result[$scope.modelInfo.singular_key];
					
					// the model needs to be massaged
					massageModelForClient ($scope.model, $scope.modelInfo);
					
					$scope.loading = true;
					
				}, function(error) {
				
					if (error.status == 404)
						$location.path('/');
	
					$scope.loading = false;
	
				});
			};
			
			$scope.deleteModelAsk = function(model) {
				$scope.deleteModel = model;

				var modalInstance = $modal.open({
					controller: DeleteModalCntl,
					resolve: {
						modelInfo: function() {
							return $scope.modelInfo;
						}
					},
					templateUrl: 'deleteModalAsk.html'
				});

				modalInstance.result.then(
					$scope.deleteModelConfirm,
					function() {
						$scope.deleteModel = false;
					});
			};
			
			$scope.deleteModelConfirm = function() {
				
				Model.delete({
					modelId: $scope.deleteModel.id
				}, function(result) {
					if (result.success) {
						if ($routeParams.id)
							$location.path('/');
						else
							$scope.loadModels(true);
					} else if (result.error && result.error instanceof Array) {
		    			$scope.errors = result.error;
		    		}
				});
				
				$scope.deleteModel = false;
			}
			
			$scope.saveModel = function() {
			
				$scope.saving = true;
				
				var modelData = clone($scope.model);
				
				// some properties need massaging before being sent to the server
				massageModelForServer(modelData, $scope.modelInfo.properties);
	
				//console.log(modelData);
				
				if ($scope.newModel) {
	
					Model.create(modelData, function(result) {
						$scope.saving = false;
						
						//console.log(result);
		
			    		if (result.success) {
			    			$location.path('/');
						} else if (result.error && result.error instanceof Array) {
			    			$scope.errors = result.error;
			    		}
					});
					
				} else {
				
					modelData.modelId = $scope.model.id;
				
					Model.edit(modelData, function(result) {
						$scope.saving = false;
						
						//console.log(result);
		
			    		if (result.success) {
			    			$location.path('/' + modelData.id);
						} else if (result.error && result.error instanceof Array) {
			    			$scope.errors = result.error;
			    		}
					});
				
				}
				
			};
			
			if( $routeParams.id )
			{
				$scope.findModel($routeParams.id);
			}
			else
			{
				// new model
				if ($location.$$path.indexOf('/new') !== -1) {
					$scope.newModel = true;
					
					$scope.model = {};
					
					// setup default values
					for (var i in $scope.modelInfo.properties) {
						var property = $scope.modelInfo.properties[i];
						
						$scope.model[property.name] = (typeof property.default != 'undefined') ? property.default : '';
						
						// enums cannot have an empty value, grab first value
						if (property.admin_type == 'enum' && typeof property.default == 'undefined') {
							var kyz = Object.keys(property.admin_enum);
							$scope.model[property.name] = property.admin_enum[kyz[0]];
						}
					}
					
					// the model needs to be massaged
					massageModelForClient ($scope.model, $scope.modelInfo);
				
				// browsing all models
				} else {
					$scope.loadModels();
				}
			}
	}];

	var DeleteModalCntl = ['$scope','$modalInstance','modelInfo',
		function($scope, $modalInstance, modelInfo) {

		$scope.modelInfo = modelInfo;

		$scope.ok = function() {
			$modalInstance.close();
		};

		$scope.cancel = function() {
			$modalInstance.dismiss('cancel');
		};
	}];
	
	function nl2br(input) {
		return (input + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1<br />$2');
	}
	
	function htmlentities(str) {
		return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
	}
	
	function parseModelValue (model, property, truncate) {
	
		if (typeof model == 'undefined')
			return '';
		
		var value = '';
		
		if (typeof model[property.name] != 'undefined')
			value = model[property.name];
		else if (property.default)
			value = property.default;
		
		if (value === null)
			return '<em>null</em>';
	
		switch(property.admin_type)
		{
		case 'text':
		case 'textarea':
		break;
		case 'checkbox':
			value = (value > 0) ? 'Yes' : 'No';
		break;
		case 'datepicker':
			if (value != null)
				value = moment(value).format("M/D/YYYY h:mm a");
		break;
		case 'enum':
			if (property.admin_enum)
			{
				if (property.admin_enum[value])
					value = property.admin_enum[value];
				else if (property.default)
					value = property.admin_enum[property.default];
			}		
		break;
		case 'password':
			return '<em>hidden</em>';
		break;
		case 'json':
			value = JSON.stringify(value);
		break;
		case 'html':
			return value;
		break;
		}
		
		// truncation
		if (truncate && property.admin_truncate && value.length > 40)
			value = value.substring(0, 40) + '...';
		
		// convert new lines to breaks and escape html characters
		value = nl2br(htmlentities(value));

		// link relationships
		if (property.relation) {
			var pieces = property.relation.split('\\');
			var module = pieces[2];
			var model = pieces[4];
			value = '<a href="/admin/' + module + '/' + model + '#/' + value + '">' + value + '</a>';
		}

		return value;
	}
	
	function massageModelForClient (model, modelInfo) {
	
		for (var i in modelInfo.properties) {
			var property = modelInfo.properties[i];
			var value = model[property.name];
			
			switch (property.admin_type)
			{
			case 'datepicker':
				if (value == 0)
					model[property.name] = null;
				else
					model[property.name] = moment.unix(value).toDate();
			break;
			case 'password':
				model[property.name] = '';
			break;
			case 'checkbox':
				model[property.name] = (value > 0) ? true : false;
			break;
			}
		}
		
		// multiple ids
		if (angular.isArray(modelInfo.idProperty))
		{
			var ids = [];
			
			for (var i in modelInfo.idProperty)
			{
				if (model[modelInfo.idProperty[i]] === '')
				{
					ids = false;
					break;
				}
				
				ids.push(model[modelInfo.idProperty[i]]);
			}
						
			if (ids)
				model.id = ids.join(',');
		}
		// single id
		else
			model.id = model[modelInfo.idProperty];			
	}
	
	function massageModelForServer (model, properties) {
	
		for (var i in properties) {
			var property = properties[i];
			var value = model[property.name];
		
			switch (property.admin_type)
			{
			case 'datepicker':
				if (value != null)
					model[property.name] = moment(value).unix();
				else if (typeof property.null == 'undefined' || !property.null)
					model[property.name] = 0;
				else
					model[property.name] = null;
			break;
			case 'password':
				if (value.length == 0)
					delete model[property.name];
			break;
			}
		}
	
	}
	
	// props to http://my.opera.com/GreyWyvern/blog/show.dml/1725165
	
	function clone(obj) {
	    // Handle the 3 simple types, and null or undefined
	    if (null == obj || "object" != typeof obj) return obj;
	
	    // Handle Date
	    if (obj instanceof Date) {
	        var copy = new Date();
	        copy.setTime(obj.getTime());
	        return copy;
	    }
	
	    // Handle Array
	    if (obj instanceof Array) {
	        var copy = [];
	        for (var i = 0, len = obj.length; i < len; i++) {
	            copy[i] = clone(obj[i]);
	        }
	        return copy;
	    }
	
	    // Handle Object
	    if (obj instanceof Object) {
	        var copy = {};
	        for (var attr in obj) {
	            if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
	        }
	        return copy;
	    }
	
	    throw new Error("Unable to copy obj! Its type isn't supported.");
	}
};if (typeof angular != 'undefined') {
	angular.module("ui.bootstrap", ["ui.bootstrap.tpls", "ui.bootstrap.transition","ui.bootstrap.modal"]);
	angular.module("ui.bootstrap.tpls", ["template/modal/backdrop.html","template/modal/window.html"]);

  angular.module("template/modal/backdrop.html", []).run(["$templateCache", function($templateCache) {
	$templateCache.put("template/modal/backdrop.html",
	  "<div class=\"modal-backdrop fade\"\n" +
	  "     ng-class=\"{in: animate}\"\n" +
	  "     ng-style=\"{'z-index': 1040 + (index && 1 || 0) + index*10}\"\n" +
	  "></div>\n" +
	  "");
  }]);

  angular.module("template/modal/window.html", []).run(["$templateCache", function($templateCache) {
	$templateCache.put("template/modal/window.html",
	  "<div tabindex=\"-1\" role=\"dialog\" class=\"modal fade\" ng-class=\"{in: animate}\" ng-style=\"{'z-index': 1050 + index*10, display: 'block'}\" ng-click=\"close($event)\">\n" +
	  "    <div class=\"modal-dialog\" ng-class=\"{'modal-sm': size == 'sm', 'modal-lg': size == 'lg'}\"><div class=\"modal-content\" ng-transclude></div></div>\n" +
	  "</div>");
  }]);
};/*global angular */
/*
 jQuery UI Datepicker plugin wrapper

 @note If ² IE8 make sure you have a polyfill for Date.toISOString()
 @param [ui-date] {object} Options to pass to $.fn.datepicker() merged onto uiDateConfig
 */
if (typeof angular != 'undefined') {
  angular.module('ui.date', [])

  .constant('uiDateConfig', {})

  .directive('uiDate', ['uiDateConfig', '$timeout', function (uiDateConfig, $timeout) {
    'use strict';
    var options;
    options = {};
    angular.extend(options, uiDateConfig);
    return {
      require:'?ngModel',
      link:function (scope, element, attrs, controller) {
        var getOptions = function () {
          return angular.extend({}, uiDateConfig, scope.$eval(attrs.uiDate));
        };
        var initDateWidget = function () {
          var opts = getOptions();

          // If we have a controller (i.e. ngModelController) then wire it up
          if (controller) {
            // Override ngModelController's $setViewValue
            // so that we can ensure that a Date object is being pass down the $parsers
            // This is to handle the case where the user types directly into the input box
            var _$setViewValue = controller.$setViewValue;
            var settingValue = false;
            controller.$setViewValue = function () {
              if ( !settingValue ) {
                settingValue = true;
                element.datepicker("setDate", element.datepicker("getDate"));
                _$setViewValue.call(controller, element.datepicker("getDate"));
                $timeout(function() {settingValue = false;});
              }
            };

            // Set the view value in a $apply block when users selects
            // (calling directive user's function too if provided)
            var _onSelect = opts.onSelect || angular.noop;
            opts.onSelect = function (value, picker) {
              scope.$apply(function() {
                controller.$setViewValue(value);
                _onSelect(value, picker);
                element.blur();
              });
            };

            // Don't show if we are already setting the value in $setViewValue()
            // (calling directive user's function too if provided)
            var _beforeShow = opts.beforeShow || angular.noop;
            opts.beforeShow = function(input, inst) {
              return !settingValue && _beforeShow(input, inst);
            };

            // Update the date picker when the model changes
            controller.$render = function () {
              var date = controller.$viewValue;
              if ( angular.isDefined(date) && date !== null && !angular.isDate(date) ) {
                throw new Error('ng-Model value must be a Date object - currently it is a ' + typeof date + ' - use ui-date-format to convert it from a string');
              }
              element.datepicker("setDate", date);
            };
          }
          // If we don't destroy the old one it doesn't update properly when the config changes
          element.datepicker('destroy');
          // Create the new datepicker widget
          element.datepicker(opts);
          if ( controller ) {
            // Force a render to override whatever is in the input text box
            controller.$render();
          }
        };
        // Watch for changes to the directives options
        scope.$watch(getOptions, initDateWidget, true);
      }
    };
  }
  ])

  .constant('uiDateFormatConfig', '')

  .directive('uiDateFormat', ['uiDateFormatConfig', function(uiDateFormatConfig) {
    var directive = {
      require:'ngModel',
      link: function(scope, element, attrs, modelCtrl) {
        var dateFormat = attrs.uiDateFormat || uiDateFormatConfig;
        if ( dateFormat ) {
          // Use the datepicker with the attribute value as the dateFormat string to convert to and from a string
          modelCtrl.$formatters.push(function(value) {
            if (angular.isString(value) ) {
              return jQuery.datepicker.parseDate(dateFormat, value);
            }
            return null;
          });
          modelCtrl.$parsers.push(function(value){
            if (value) {
              return jQuery.datepicker.formatDate(dateFormat, value);
            }
            return null;
          });
        } else {
          // Default to ISO formatting
          modelCtrl.$formatters.push(function(value) {
            if (angular.isString(value) ) {
              return new Date(value);
            }
            return null;
          });
          modelCtrl.$parsers.push(function(value){
            if (value) {
              return value.toISOString();
            }
            return null;
          });
        }
      }
    };
    return directive;
  }]);
};if (typeof angular != 'undefined') {
angular.module('ui.bootstrap.transition', [])

/**
 * $transition service provides a consistent interface to trigger CSS 3 transitions and to be informed when they complete.
 * @param  {DOMElement} element  The DOMElement that will be animated.
 * @param  {string|object|function} trigger  The thing that will cause the transition to start:
 *   - As a string, it represents the css class to be added to the element.
 *   - As an object, it represents a hash of style attributes to be applied to the element.
 *   - As a function, it represents a function to be called that will cause the transition to occur.
 * @return {Promise}  A promise that is resolved when the transition finishes.
 */
.factory('$transition', ['$q', '$timeout', '$rootScope', function($q, $timeout, $rootScope) {

  var $transition = function(element, trigger, options) {
    options = options || {};
    var deferred = $q.defer();
    var endEventName = $transition[options.animation ? 'animationEndEventName' : 'transitionEndEventName'];

    var transitionEndHandler = function(event) {
      $rootScope.$apply(function() {
        element.unbind(endEventName, transitionEndHandler);
        deferred.resolve(element);
      });
    };

    if (endEventName) {
      element.bind(endEventName, transitionEndHandler);
    }

    // Wrap in a timeout to allow the browser time to update the DOM before the transition is to occur
    $timeout(function() {
      if ( angular.isString(trigger) ) {
        element.addClass(trigger);
      } else if ( angular.isFunction(trigger) ) {
        trigger(element);
      } else if ( angular.isObject(trigger) ) {
        element.css(trigger);
      }
      //If browser does not support transitions, instantly resolve
      if ( !endEventName ) {
        deferred.resolve(element);
      }
    });

    // Add our custom cancel function to the promise that is returned
    // We can call this if we are about to run a new transition, which we know will prevent this transition from ending,
    // i.e. it will therefore never raise a transitionEnd event for that transition
    deferred.promise.cancel = function() {
      if ( endEventName ) {
        element.unbind(endEventName, transitionEndHandler);
      }
      deferred.reject('Transition cancelled');
    };

    return deferred.promise;
  };

  // Work out the name of the transitionEnd event
  var transElement = document.createElement('trans');
  var transitionEndEventNames = {
    'WebkitTransition': 'webkitTransitionEnd',
    'MozTransition': 'transitionend',
    'OTransition': 'oTransitionEnd',
    'transition': 'transitionend'
  };
  var animationEndEventNames = {
    'WebkitTransition': 'webkitAnimationEnd',
    'MozTransition': 'animationend',
    'OTransition': 'oAnimationEnd',
    'transition': 'animationend'
  };
  function findEndEventName(endEventNames) {
    for (var name in endEventNames){
      if (transElement.style[name] !== undefined) {
        return endEventNames[name];
      }
    }
  }
  $transition.transitionEndEventName = findEndEventName(transitionEndEventNames);
  $transition.animationEndEventName = findEndEventName(animationEndEventNames);
  return $transition;
}]);
};if (typeof angular != 'undefined') {
  angular.module('ui.bootstrap.modal', ['ui.bootstrap.transition'])

/**
 * A helper, internal data structure that acts as a map but also allows getting / removing
 * elements in the LIFO order
 */
  .factory('$$stackedMap', function () {
    return {
      createNew: function () {
        var stack = [];

        return {
          add: function (key, value) {
            stack.push({
              key: key,
              value: value
            });
          },
          get: function (key) {
            for (var i = 0; i < stack.length; i++) {
              if (key == stack[i].key) {
                return stack[i];
              }
            }
          },
          keys: function() {
            var keys = [];
            for (var i = 0; i < stack.length; i++) {
              keys.push(stack[i].key);
            }
            return keys;
          },
          top: function () {
            return stack[stack.length - 1];
          },
          remove: function (key) {
            var idx = -1;
            for (var i = 0; i < stack.length; i++) {
              if (key == stack[i].key) {
                idx = i;
                break;
              }
            }
            return stack.splice(idx, 1)[0];
          },
          removeTop: function () {
            return stack.splice(stack.length - 1, 1)[0];
          },
          length: function () {
            return stack.length;
          }
        };
      }
    };
  })

/**
 * A helper directive for the $modal service. It creates a backdrop element.
 */
  .directive('modalBackdrop', ['$timeout', function ($timeout) {
    return {
      restrict: 'EA',
      replace: true,
      templateUrl: 'template/modal/backdrop.html',
      link: function (scope, element, attrs) {
        scope.backdropClass = attrs.backdropClass || '';

        scope.animate = false;

        //trigger CSS transitions
        $timeout(function () {
          scope.animate = true;
        });
      }
    };
  }])

  .directive('modalWindow', ['$modalStack', '$timeout', function ($modalStack, $timeout) {
    return {
      restrict: 'EA',
      scope: {
        index: '@',
        animate: '='
      },
      replace: true,
      transclude: true,
      templateUrl: function(tElement, tAttrs) {
        return tAttrs.templateUrl || 'template/modal/window.html';
      },
      link: function (scope, element, attrs) {
        element.addClass(attrs.windowClass || '');
        scope.size = attrs.size;

        $timeout(function () {
          // trigger CSS transitions
          scope.animate = true;

          /**
           * Auto-focusing of a freshly-opened modal element causes any child elements
           * with the autofocus attribute to loose focus. This is an issue on touch
           * based devices which will show and then hide the onscreen keyboard.
           * Attempts to refocus the autofocus element via JavaScript will not reopen
           * the onscreen keyboard. Fixed by updated the focusing logic to only autofocus
           * the modal element if the modal does not contain an autofocus element.
           */
          if (!element[0].querySelectorAll('[autofocus]').length) {
            element[0].focus();
          }
        });

        scope.close = function (evt) {
          var modal = $modalStack.getTop();
          if (modal && modal.value.backdrop && modal.value.backdrop != 'static' && (evt.target === evt.currentTarget)) {
            evt.preventDefault();
            evt.stopPropagation();
            $modalStack.dismiss(modal.key, 'backdrop click');
          }
        };
      }
    };
  }])

  .directive('modalTransclude', function () {
    return {
      link: function($scope, $element, $attrs, controller, $transclude) {
        $transclude($scope.$parent, function(clone) {
          $element.empty();
          $element.append(clone);
        });
      }
    };
  })

  .factory('$modalStack', ['$transition', '$timeout', '$document', '$compile', '$rootScope', '$$stackedMap',
    function ($transition, $timeout, $document, $compile, $rootScope, $$stackedMap) {

      var OPENED_MODAL_CLASS = 'modal-open';

      var backdropDomEl, backdropScope;
      var openedWindows = $$stackedMap.createNew();
      var $modalStack = {};

      function backdropIndex() {
        var topBackdropIndex = -1;
        var opened = openedWindows.keys();
        for (var i = 0; i < opened.length; i++) {
          if (openedWindows.get(opened[i]).value.backdrop) {
            topBackdropIndex = i;
          }
        }
        return topBackdropIndex;
      }

      $rootScope.$watch(backdropIndex, function(newBackdropIndex){
        if (backdropScope) {
          backdropScope.index = newBackdropIndex;
        }
      });

      function removeModalWindow(modalInstance) {

        var body = $document.find('body').eq(0);
        var modalWindow = openedWindows.get(modalInstance).value;

        //clean up the stack
        openedWindows.remove(modalInstance);

        //remove window DOM element
        removeAfterAnimate(modalWindow.modalDomEl, modalWindow.modalScope, 300, function() {
          modalWindow.modalScope.$destroy();
          body.toggleClass(OPENED_MODAL_CLASS, openedWindows.length() > 0);
          checkRemoveBackdrop();
        });
      }

      function checkRemoveBackdrop() {
          //remove backdrop if no longer needed
          if (backdropDomEl && backdropIndex() == -1) {
            var backdropScopeRef = backdropScope;
            removeAfterAnimate(backdropDomEl, backdropScope, 150, function () {
              backdropScopeRef.$destroy();
              backdropScopeRef = null;
            });
            backdropDomEl = undefined;
            backdropScope = undefined;
          }
      }

      function removeAfterAnimate(domEl, scope, emulateTime, done) {
        // Closing animation
        scope.animate = false;

        var transitionEndEventName = $transition.transitionEndEventName;
        if (transitionEndEventName) {
          // transition out
          var timeout = $timeout(afterAnimating, emulateTime);

          domEl.bind(transitionEndEventName, function () {
            $timeout.cancel(timeout);
            afterAnimating();
            scope.$apply();
          });
        } else {
          // Ensure this call is async
          $timeout(afterAnimating);
        }

        function afterAnimating() {
          if (afterAnimating.done) {
            return;
          }
          afterAnimating.done = true;

          domEl.remove();
          if (done) {
            done();
          }
        }
      }

      $document.bind('keydown', function (evt) {
        var modal;

        if (evt.which === 27) {
          modal = openedWindows.top();
          if (modal && modal.value.keyboard) {
            evt.preventDefault();
            $rootScope.$apply(function () {
              $modalStack.dismiss(modal.key, 'escape key press');
            });
          }
        }
      });

      $modalStack.open = function (modalInstance, modal) {

        openedWindows.add(modalInstance, {
          deferred: modal.deferred,
          modalScope: modal.scope,
          backdrop: modal.backdrop,
          keyboard: modal.keyboard
        });

        var body = $document.find('body').eq(0),
            currBackdropIndex = backdropIndex();

        if (currBackdropIndex >= 0 && !backdropDomEl) {
          backdropScope = $rootScope.$new(true);
          backdropScope.index = currBackdropIndex;
          var angularBackgroundDomEl = angular.element('<div modal-backdrop></div>');
          angularBackgroundDomEl.attr('backdrop-class', modal.backdropClass);
          backdropDomEl = $compile(angularBackgroundDomEl)(backdropScope);
          body.append(backdropDomEl);
        }

        var angularDomEl = angular.element('<div modal-window></div>');
        angularDomEl.attr({
          'template-url': modal.windowTemplateUrl,
          'window-class': modal.windowClass,
          'size': modal.size,
          'index': openedWindows.length() - 1,
          'animate': 'animate'
        }).html(modal.content);

        var modalDomEl = $compile(angularDomEl)(modal.scope);
        openedWindows.top().value.modalDomEl = modalDomEl;
        body.append(modalDomEl);
        body.addClass(OPENED_MODAL_CLASS);
      };

      $modalStack.close = function (modalInstance, result) {
        var modalWindow = openedWindows.get(modalInstance);
        if (modalWindow) {
          modalWindow.value.deferred.resolve(result);
          removeModalWindow(modalInstance);
        }
      };

      $modalStack.dismiss = function (modalInstance, reason) {
        var modalWindow = openedWindows.get(modalInstance);
        if (modalWindow) {
          modalWindow.value.deferred.reject(reason);
          removeModalWindow(modalInstance);
        }
      };

      $modalStack.dismissAll = function (reason) {
        var topModal = this.getTop();
        while (topModal) {
          this.dismiss(topModal.key, reason);
          topModal = this.getTop();
        }
      };

      $modalStack.getTop = function () {
        return openedWindows.top();
      };

      return $modalStack;
    }])

  .provider('$modal', function () {

    var $modalProvider = {
      options: {
        backdrop: true, //can be also false or 'static'
        keyboard: true
      },
      $get: ['$injector', '$rootScope', '$q', '$http', '$templateCache', '$controller', '$modalStack',
        function ($injector, $rootScope, $q, $http, $templateCache, $controller, $modalStack) {

          var $modal = {};

          function getTemplatePromise(options) {
            return options.template ? $q.when(options.template) :
              $http.get(angular.isFunction(options.templateUrl) ? (options.templateUrl)() : options.templateUrl,
                {cache: $templateCache}).then(function (result) {
                  return result.data;
              });
          }

          function getResolvePromises(resolves) {
            var promisesArr = [];
            angular.forEach(resolves, function (value) {
              if (angular.isFunction(value) || angular.isArray(value)) {
                promisesArr.push($q.when($injector.invoke(value)));
              }
            });
            return promisesArr;
          }

          $modal.open = function (modalOptions) {

            var modalResultDeferred = $q.defer();
            var modalOpenedDeferred = $q.defer();

            //prepare an instance of a modal to be injected into controllers and returned to a caller
            var modalInstance = {
              result: modalResultDeferred.promise,
              opened: modalOpenedDeferred.promise,
              close: function (result) {
                $modalStack.close(modalInstance, result);
              },
              dismiss: function (reason) {
                $modalStack.dismiss(modalInstance, reason);
              }
            };

            //merge and clean up options
            modalOptions = angular.extend({}, $modalProvider.options, modalOptions);
            modalOptions.resolve = modalOptions.resolve || {};

            //verify options
            if (!modalOptions.template && !modalOptions.templateUrl) {
              throw new Error('One of template or templateUrl options is required.');
            }

            var templateAndResolvePromise =
              $q.all([getTemplatePromise(modalOptions)].concat(getResolvePromises(modalOptions.resolve)));


            templateAndResolvePromise.then(function resolveSuccess(tplAndVars) {

              var modalScope = (modalOptions.scope || $rootScope).$new();
              modalScope.$close = modalInstance.close;
              modalScope.$dismiss = modalInstance.dismiss;

              var ctrlInstance, ctrlLocals = {};
              var resolveIter = 1;

              //controllers
              if (modalOptions.controller) {
                ctrlLocals.$scope = modalScope;
                ctrlLocals.$modalInstance = modalInstance;
                angular.forEach(modalOptions.resolve, function (value, key) {
                  ctrlLocals[key] = tplAndVars[resolveIter++];
                });

                ctrlInstance = $controller(modalOptions.controller, ctrlLocals);
                if (modalOptions.controller) {
                  modalScope[modalOptions.controllerAs] = ctrlInstance;
                }
              }

              $modalStack.open(modalInstance, {
                scope: modalScope,
                deferred: modalResultDeferred,
                content: tplAndVars[0],
                backdrop: modalOptions.backdrop,
                keyboard: modalOptions.keyboard,
                backdropClass: modalOptions.backdropClass,
                windowClass: modalOptions.windowClass,
                windowTemplateUrl: modalOptions.windowTemplateUrl,
                size: modalOptions.size
              });

            }, function resolveError(reason) {
              modalResultDeferred.reject(reason);
            });

            templateAndResolvePromise.then(function () {
              modalOpenedDeferred.resolve(true);
            }, function () {
              modalOpenedDeferred.reject(false);
            });

            return modalInstance;
          };

          return $modal;
        }]
    };

    return $modalProvider;
  });
};// Expanding Textareas
// https://github.com/bgrins/ExpandingTextareas

(function(factory) {
    // Add jQuery via AMD registration or browser globals
    if (typeof define === 'function' && define.amd) {
        define([ 'jquery' ], factory);
    }
    else {
        factory(jQuery);
    }
}(function ($) {
    $.expandingTextarea = $.extend({
        autoInitialize: true,
        initialSelector: "textarea.expanding",
        opts: {
            resize: function() { }
        }
    }, $.expandingTextarea || {});
    
    var cloneCSSProperties = [
        'lineHeight', 'textDecoration', 'letterSpacing',
        'fontSize', 'fontFamily', 'fontStyle', 
        'fontWeight', 'textTransform', 'textAlign', 
        'direction', 'wordSpacing', 'fontSizeAdjust', 
        'wordWrap', 'word-break',
        'borderLeftWidth', 'borderRightWidth',
        'borderTopWidth','borderBottomWidth',
        'paddingLeft', 'paddingRight',
        'paddingTop','paddingBottom',
        'marginLeft', 'marginRight',
        'marginTop','marginBottom',
        'boxSizing', 'webkitBoxSizing', 'mozBoxSizing', 'msBoxSizing'
    ];
    
    var textareaCSS = {
        position: "absolute",
        height: "100%",
        resize: "none"
    };
    
    var preCSS = {
        visibility: "hidden",
        border: "0 solid",
        whiteSpace: "pre-wrap" 
    };
    
    var containerCSS = {
        position: "relative"
    };
    
    function resize() {
        $(this).closest('.expandingText').find("div").text(this.value.replace(/\r\n/g, "\n") + ' ');
        $(this).trigger("resize.expanding");
    }
    
    $.fn.expandingTextarea = function(o) {
        
        var opts = $.extend({ }, $.expandingTextarea.opts, o);
        
        if (o === "resize") {
            return this.trigger("input.expanding");
        }
        
        if (o === "destroy") {
            this.filter(".expanding-init").each(function() {
                var textarea = $(this).removeClass('expanding-init');
                var container = textarea.closest('.expandingText');
                
                container.before(textarea).remove();
                textarea
                    .attr('style', textarea.data('expanding-styles') || '')
                    .removeData('expanding-styles');
            });
            
            return this;
        }
        
        this.filter("textarea").not(".expanding-init").addClass("expanding-init").each(function() {
            var textarea = $(this);
            
            textarea.wrap("<div class='expandingText'></div>");
            textarea.after("<pre class='textareaClone'><div></div></pre>");
            
            var container = textarea.parent().css(containerCSS);
            var pre = container.find("pre").css(preCSS);
            
            // Store the original styles in case of destroying.
            textarea.data('expanding-styles', textarea.attr('style'));
            textarea.css(textareaCSS);
            
            $.each(cloneCSSProperties, function(i, p) {
                var val = textarea.css(p);
                
                // Only set if different to prevent overriding percentage css values.
                if (pre.css(p) !== val) {
                    pre.css(p, val);
                }
            });
            
            textarea.bind("input.expanding propertychange.expanding keyup.expanding", resize);
            resize.apply(this);
            
            if (opts.resize) {
                textarea.bind("resize.expanding", opts.resize);
            }
        });
        
        return this;
    };
    
    $(function () {
        if ($.expandingTextarea.autoInitialize) {
            $($.expandingTextarea.initialSelector).expandingTextarea();
        }
    });
    
}));;// Simple yet flexible JSON editor plugin.
// Turns any element into a stylable interactive JSON editor.

// Copyright (c) 2013 David Durman

// Licensed under the MIT license (http://www.opensource.org/licenses/mit-license.php).

(function(e){function v(b,a,c,d,f,h){b={target:b,onchange:c,onpropertyclick:d,original:a,propertyElement:f,valueElement:h};r(b,a,b.target);e(b.target).on("blur focus",".property, .value",function(){e(this).toggleClass("editing")})}function l(b){return"[object Object]"==Object.prototype.toString.call(b)}function m(b){return"[object Array]"==Object.prototype.toString.call(b)}function n(b,a,c){var d=2==arguments.length;if(-1<a.indexOf(".")){for(var f=b,e=0,g=a.split("."),k=g.length;e<k-1;e++)f=f[g[e]];
d?delete f[g[k-1]]:f[g[k-1]]=c}else d?delete b[a]:b[a]=c;return b}function p(b){var a;try{a=JSON.parse(b)}catch(c){a=null,window.console&&console.error("JSON parse failed.")}return a}function q(b){var a;try{a=JSON.stringify(b)}catch(c){a="null",window.console&&console.error("JSON stringify failed.")}return a}function s(b){if(0==b.children(".expander").length){var a=e("<span>",{"class":"expander"});a.bind("click",function(){e(this).parent().toggleClass("expanded")});b.prepend(a)}}function w(b,a){var c=
e("<div>",{"class":"item appender"}),d=e("<button></button>",{"class":"property"});d.text("Add New Value");c.append(d);b.append(c);d.click(a);return c}function r(b,a,c,d){d=d||"";c.children(".item").remove();for(var f in a)if(a.hasOwnProperty(f)){var h=e("<div>",{"class":"item","data-path":d}),g=e(b.propertyElement||"<input>",{"class":"property"}),k=e(b.valueElement||"<input>",{"class":"value"});(l(a[f])||m(a[f]))&&s(h);h.append(g).append(k);c.append(h);g.val(f).attr("title",f);var n=q(a[f]);k.val(n).attr("title",
n);t(h,a[f]);g.change(x(b));k.change(y(b));g.click(z(b));(l(a[f])||m(a[f]))&&r(b,a[f],h,(d?d+".":"")+f)}(l(a)||m(a))&&w(c,function(){if(m(a))a.push(null);else if(l(a)){for(var e=1,f="newKey";a.hasOwnProperty(f);)f="newKey"+e,e++;a[f]=null}r(b,a,c,d);b.onchange(p(q(b.original)))})}function u(b,a){e(b).parentsUntil(a.target).each(function(){var b=e(this).data("path"),b=(b?b+".":b)+e(this).children(".property").val(),d;a:{d=a.original;for(var b=b.split("."),f=0;f<b.length;)if(void 0==(d=d[b[f++]])){d=
null;break a}}d=q(d);e(this).children(".value").val(d).attr("title",d)})}function z(b){return function(){var a=e(this).parent().data("path"),c=e(this).attr("title"),a=a?a.split(".").concat([c]).join("']['"):c;b.onpropertyclick("['"+a+"']")}}function x(b){return function(){var a=e(this).parent().data("path"),c=p(e(this).next().val()),d=e(this).val(),f=e(this).attr("title");e(this).attr("title",d);n(b.original,(a?a+".":"")+f);d&&n(b.original,(a?a+".":"")+d,c);u(this,b);d||e(this).parent().remove();
b.onchange(p(q(b.original)))}}function y(b){return function(){var a=e(this).prev().val(),c=p(e(this).val()||"null"),d=e(this).parent(),f=d.data("path");n(b.original,(f?f+".":"")+a,c);!l(c)&&!m(c)||e.isEmptyObject(c)?d.find(".expander, .item").remove():(r(b,c,d,(f?f+".":"")+a),s(d));t(d,c);u(this,b);b.onchange(p(q(b.original)))}}function t(b,a){var c="null";l(a)?c="object":m(a)?c="array":"[object Boolean]"==Object.prototype.toString.call(a)?c="boolean":"[object String]"==Object.prototype.toString.call(a)?
c="string":"[object Number]"==Object.prototype.toString.call(a)&&(c="number");b.removeClass(A);b.addClass(c)}e.fn.jsonEditor=function(b,a){a=a||{};b=p(q(b));var c=function(){},d=a.change||c,f=a.propertyclick||c;return this.each(function(){v(e(this),b,d,f,a.propertyElement,a.valueElement)})};var A="object array boolean number string null"})(jQuery);;// moment.js
// version : 2.0.0
// author : Tim Wood
// license : MIT
// momentjs.com
(function(e){function O(e,t){return function(n){return j(e.call(this,n),t)}}function M(e){return function(t){return this.lang().ordinal(e.call(this,t))}}function _(){}function D(e){H(this,e)}function P(e){var t=this._data={},n=e.years||e.year||e.y||0,r=e.months||e.month||e.M||0,i=e.weeks||e.week||e.w||0,s=e.days||e.day||e.d||0,o=e.hours||e.hour||e.h||0,u=e.minutes||e.minute||e.m||0,a=e.seconds||e.second||e.s||0,f=e.milliseconds||e.millisecond||e.ms||0;this._milliseconds=f+a*1e3+u*6e4+o*36e5,this._days=s+i*7,this._months=r+n*12,t.milliseconds=f%1e3,a+=B(f/1e3),t.seconds=a%60,u+=B(a/60),t.minutes=u%60,o+=B(u/60),t.hours=o%24,s+=B(o/24),s+=i*7,t.days=s%30,r+=B(s/30),t.months=r%12,n+=B(r/12),t.years=n}function H(e,t){for(var n in t)t.hasOwnProperty(n)&&(e[n]=t[n]);return e}function B(e){return e<0?Math.ceil(e):Math.floor(e)}function j(e,t){var n=e+"";while(n.length<t)n="0"+n;return n}function F(e,t,n){var r=t._milliseconds,i=t._days,s=t._months,o;r&&e._d.setTime(+e+r*n),i&&e.date(e.date()+i*n),s&&(o=e.date(),e.date(1).month(e.month()+s*n).date(Math.min(o,e.daysInMonth())))}function I(e){return Object.prototype.toString.call(e)==="[object Array]"}function q(e,t){var n=Math.min(e.length,t.length),r=Math.abs(e.length-t.length),i=0,s;for(s=0;s<n;s++)~~e[s]!==~~t[s]&&i++;return i+r}function R(e,t){return t.abbr=e,s[e]||(s[e]=new _),s[e].set(t),s[e]}function U(e){return e?(!s[e]&&o&&require("./lang/"+e),s[e]):t.fn._lang}function z(e){return e.match(/\[.*\]/)?e.replace(/^\[|\]$/g,""):e.replace(/\\/g,"")}function W(e){var t=e.match(a),n,r;for(n=0,r=t.length;n<r;n++)A[t[n]]?t[n]=A[t[n]]:t[n]=z(t[n]);return function(i){var s="";for(n=0;n<r;n++)s+=typeof t[n].call=="function"?t[n].call(i,e):t[n];return s}}function X(e,t){function r(t){return e.lang().longDateFormat(t)||t}var n=5;while(n--&&f.test(t))t=t.replace(f,r);return C[t]||(C[t]=W(t)),C[t](e)}function V(e){switch(e){case"DDDD":return p;case"YYYY":return d;case"YYYYY":return v;case"S":case"SS":case"SSS":case"DDD":return h;case"MMM":case"MMMM":case"dd":case"ddd":case"dddd":case"a":case"A":return m;case"X":return b;case"Z":case"ZZ":return g;case"T":return y;case"MM":case"DD":case"YY":case"HH":case"hh":case"mm":case"ss":case"M":case"D":case"d":case"H":case"h":case"m":case"s":return c;default:return new RegExp(e.replace("\\",""))}}function $(e,t,n){var r,i,s=n._a;switch(e){case"M":case"MM":s[1]=t==null?0:~~t-1;break;case"MMM":case"MMMM":r=U(n._l).monthsParse(t),r!=null?s[1]=r:n._isValid=!1;break;case"D":case"DD":case"DDD":case"DDDD":t!=null&&(s[2]=~~t);break;case"YY":s[0]=~~t+(~~t>68?1900:2e3);break;case"YYYY":case"YYYYY":s[0]=~~t;break;case"a":case"A":n._isPm=(t+"").toLowerCase()==="pm";break;case"H":case"HH":case"h":case"hh":s[3]=~~t;break;case"m":case"mm":s[4]=~~t;break;case"s":case"ss":s[5]=~~t;break;case"S":case"SS":case"SSS":s[6]=~~(("0."+t)*1e3);break;case"X":n._d=new Date(parseFloat(t)*1e3);break;case"Z":case"ZZ":n._useUTC=!0,r=(t+"").match(x),r&&r[1]&&(n._tzh=~~r[1]),r&&r[2]&&(n._tzm=~~r[2]),r&&r[0]==="+"&&(n._tzh=-n._tzh,n._tzm=-n._tzm)}t==null&&(n._isValid=!1)}function J(e){var t,n,r=[];if(e._d)return;for(t=0;t<7;t++)e._a[t]=r[t]=e._a[t]==null?t===2?1:0:e._a[t];r[3]+=e._tzh||0,r[4]+=e._tzm||0,n=new Date(0),e._useUTC?(n.setUTCFullYear(r[0],r[1],r[2]),n.setUTCHours(r[3],r[4],r[5],r[6])):(n.setFullYear(r[0],r[1],r[2]),n.setHours(r[3],r[4],r[5],r[6])),e._d=n}function K(e){var t=e._f.match(a),n=e._i,r,i;e._a=[];for(r=0;r<t.length;r++)i=(V(t[r]).exec(n)||[])[0],i&&(n=n.slice(n.indexOf(i)+i.length)),A[t[r]]&&$(t[r],i,e);e._isPm&&e._a[3]<12&&(e._a[3]+=12),e._isPm===!1&&e._a[3]===12&&(e._a[3]=0),J(e)}function Q(e){var t,n,r,i=99,s,o,u;while(e._f.length){t=H({},e),t._f=e._f.pop(),K(t),n=new D(t);if(n.isValid()){r=n;break}u=q(t._a,n.toArray()),u<i&&(i=u,r=n)}H(e,r)}function G(e){var t,n=e._i;if(w.exec(n)){e._f="YYYY-MM-DDT";for(t=0;t<4;t++)if(S[t][1].exec(n)){e._f+=S[t][0];break}g.exec(n)&&(e._f+=" Z"),K(e)}else e._d=new Date(n)}function Y(t){var n=t._i,r=u.exec(n);n===e?t._d=new Date:r?t._d=new Date(+r[1]):typeof n=="string"?G(t):I(n)?(t._a=n.slice(0),J(t)):t._d=n instanceof Date?new Date(+n):new Date(n)}function Z(e,t,n,r,i){return i.relativeTime(t||1,!!n,e,r)}function et(e,t,n){var i=r(Math.abs(e)/1e3),s=r(i/60),o=r(s/60),u=r(o/24),a=r(u/365),f=i<45&&["s",i]||s===1&&["m"]||s<45&&["mm",s]||o===1&&["h"]||o<22&&["hh",o]||u===1&&["d"]||u<=25&&["dd",u]||u<=45&&["M"]||u<345&&["MM",r(u/30)]||a===1&&["y"]||["yy",a];return f[2]=t,f[3]=e>0,f[4]=n,Z.apply({},f)}function tt(e,n,r){var i=r-n,s=r-e.day();return s>i&&(s-=7),s<i-7&&(s+=7),Math.ceil(t(e).add("d",s).dayOfYear()/7)}function nt(e){var n=e._i,r=e._f;return n===null||n===""?null:(typeof n=="string"&&(e._i=n=U().preparse(n)),t.isMoment(n)?(e=H({},n),e._d=new Date(+n._d)):r?I(r)?Q(e):K(e):Y(e),new D(e))}function rt(e,n){t.fn[e]=t.fn[e+"s"]=function(e){var t=this._isUTC?"UTC":"";return e!=null?(this._d["set"+t+n](e),this):this._d["get"+t+n]()}}function it(e){t.duration.fn[e]=function(){return this._data[e]}}function st(e,n){t.duration.fn["as"+e]=function(){return+this/n}}var t,n="2.0.0",r=Math.round,i,s={},o=typeof module!="undefined"&&module.exports,u=/^\/?Date\((\-?\d+)/i,a=/(\[[^\[]*\])|(\\)?(Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|YYYYY|YYYY|YY|a|A|hh?|HH?|mm?|ss?|SS?S?|X|zz?|ZZ?|.)/g,f=/(\[[^\[]*\])|(\\)?(LT|LL?L?L?|l{1,4})/g,l=/([0-9a-zA-Z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+)/gi,c=/\d\d?/,h=/\d{1,3}/,p=/\d{3}/,d=/\d{1,4}/,v=/[+\-]?\d{1,6}/,m=/[0-9]*[a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF]+\s*?[\u0600-\u06FF]+/i,g=/Z|[\+\-]\d\d:?\d\d/i,y=/T/i,b=/[\+\-]?\d+(\.\d{1,3})?/,w=/^\s*\d{4}-\d\d-\d\d((T| )(\d\d(:\d\d(:\d\d(\.\d\d?\d?)?)?)?)?([\+\-]\d\d:?\d\d)?)?/,E="YYYY-MM-DDTHH:mm:ssZ",S=[["HH:mm:ss.S",/(T| )\d\d:\d\d:\d\d\.\d{1,3}/],["HH:mm:ss",/(T| )\d\d:\d\d:\d\d/],["HH:mm",/(T| )\d\d:\d\d/],["HH",/(T| )\d\d/]],x=/([\+\-]|\d\d)/gi,T="Month|Date|Hours|Minutes|Seconds|Milliseconds".split("|"),N={Milliseconds:1,Seconds:1e3,Minutes:6e4,Hours:36e5,Days:864e5,Months:2592e6,Years:31536e6},C={},k="DDD w W M D d".split(" "),L="M D H h m s w W".split(" "),A={M:function(){return this.month()+1},MMM:function(e){return this.lang().monthsShort(this,e)},MMMM:function(e){return this.lang().months(this,e)},D:function(){return this.date()},DDD:function(){return this.dayOfYear()},d:function(){return this.day()},dd:function(e){return this.lang().weekdaysMin(this,e)},ddd:function(e){return this.lang().weekdaysShort(this,e)},dddd:function(e){return this.lang().weekdays(this,e)},w:function(){return this.week()},W:function(){return this.isoWeek()},YY:function(){return j(this.year()%100,2)},YYYY:function(){return j(this.year(),4)},YYYYY:function(){return j(this.year(),5)},a:function(){return this.lang().meridiem(this.hours(),this.minutes(),!0)},A:function(){return this.lang().meridiem(this.hours(),this.minutes(),!1)},H:function(){return this.hours()},h:function(){return this.hours()%12||12},m:function(){return this.minutes()},s:function(){return this.seconds()},S:function(){return~~(this.milliseconds()/100)},SS:function(){return j(~~(this.milliseconds()/10),2)},SSS:function(){return j(this.milliseconds(),3)},Z:function(){var e=-this.zone(),t="+";return e<0&&(e=-e,t="-"),t+j(~~(e/60),2)+":"+j(~~e%60,2)},ZZ:function(){var e=-this.zone(),t="+";return e<0&&(e=-e,t="-"),t+j(~~(10*e/6),4)},X:function(){return this.unix()}};while(k.length)i=k.pop(),A[i+"o"]=M(A[i]);while(L.length)i=L.pop(),A[i+i]=O(A[i],2);A.DDDD=O(A.DDD,3),_.prototype={set:function(e){var t,n;for(n in e)t=e[n],typeof t=="function"?this[n]=t:this["_"+n]=t},_months:"January_February_March_April_May_June_July_August_September_October_November_December".split("_"),months:function(e){return this._months[e.month()]},_monthsShort:"Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"),monthsShort:function(e){return this._monthsShort[e.month()]},monthsParse:function(e){var n,r,i,s;this._monthsParse||(this._monthsParse=[]);for(n=0;n<12;n++){this._monthsParse[n]||(r=t([2e3,n]),i="^"+this.months(r,"")+"|^"+this.monthsShort(r,""),this._monthsParse[n]=new RegExp(i.replace(".",""),"i"));if(this._monthsParse[n].test(e))return n}},_weekdays:"Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),weekdays:function(e){return this._weekdays[e.day()]},_weekdaysShort:"Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),weekdaysShort:function(e){return this._weekdaysShort[e.day()]},_weekdaysMin:"Su_Mo_Tu_We_Th_Fr_Sa".split("_"),weekdaysMin:function(e){return this._weekdaysMin[e.day()]},_longDateFormat:{LT:"h:mm A",L:"MM/DD/YYYY",LL:"MMMM D YYYY",LLL:"MMMM D YYYY LT",LLLL:"dddd, MMMM D YYYY LT"},longDateFormat:function(e){var t=this._longDateFormat[e];return!t&&this._longDateFormat[e.toUpperCase()]&&(t=this._longDateFormat[e.toUpperCase()].replace(/MMMM|MM|DD|dddd/g,function(e){return e.slice(1)}),this._longDateFormat[e]=t),t},meridiem:function(e,t,n){return e>11?n?"pm":"PM":n?"am":"AM"},_calendar:{sameDay:"[Today at] LT",nextDay:"[Tomorrow at] LT",nextWeek:"dddd [at] LT",lastDay:"[Yesterday at] LT",lastWeek:"[last] dddd [at] LT",sameElse:"L"},calendar:function(e,t){var n=this._calendar[e];return typeof n=="function"?n.apply(t):n},_relativeTime:{future:"in %s",past:"%s ago",s:"a few seconds",m:"a minute",mm:"%d minutes",h:"an hour",hh:"%d hours",d:"a day",dd:"%d days",M:"a month",MM:"%d months",y:"a year",yy:"%d years"},relativeTime:function(e,t,n,r){var i=this._relativeTime[n];return typeof i=="function"?i(e,t,n,r):i.replace(/%d/i,e)},pastFuture:function(e,t){var n=this._relativeTime[e>0?"future":"past"];return typeof n=="function"?n(t):n.replace(/%s/i,t)},ordinal:function(e){return this._ordinal.replace("%d",e)},_ordinal:"%d",preparse:function(e){return e},postformat:function(e){return e},week:function(e){return tt(e,this._week.dow,this._week.doy)},_week:{dow:0,doy:6}},t=function(e,t,n){return nt({_i:e,_f:t,_l:n,_isUTC:!1})},t.utc=function(e,t,n){return nt({_useUTC:!0,_isUTC:!0,_l:n,_i:e,_f:t})},t.unix=function(e){return t(e*1e3)},t.duration=function(e,n){var r=t.isDuration(e),i=typeof e=="number",s=r?e._data:i?{}:e,o;return i&&(n?s[n]=e:s.milliseconds=e),o=new P(s),r&&e.hasOwnProperty("_lang")&&(o._lang=e._lang),o},t.version=n,t.defaultFormat=E,t.lang=function(e,n){var r;if(!e)return t.fn._lang._abbr;n?R(e,n):s[e]||U(e),t.duration.fn._lang=t.fn._lang=U(e)},t.langData=function(e){return e&&e._lang&&e._lang._abbr&&(e=e._lang._abbr),U(e)},t.isMoment=function(e){return e instanceof D},t.isDuration=function(e){return e instanceof P},t.fn=D.prototype={clone:function(){return t(this)},valueOf:function(){return+this._d},unix:function(){return Math.floor(+this._d/1e3)},toString:function(){return this.format("ddd MMM DD YYYY HH:mm:ss [GMT]ZZ")},toDate:function(){return this._d},toJSON:function(){return t.utc(this).format("YYYY-MM-DD[T]HH:mm:ss.SSS[Z]")},toArray:function(){var e=this;return[e.year(),e.month(),e.date(),e.hours(),e.minutes(),e.seconds(),e.milliseconds()]},isValid:function(){return this._isValid==null&&(this._a?this._isValid=!q(this._a,(this._isUTC?t.utc(this._a):t(this._a)).toArray()):this._isValid=!isNaN(this._d.getTime())),!!this._isValid},utc:function(){return this._isUTC=!0,this},local:function(){return this._isUTC=!1,this},format:function(e){var n=X(this,e||t.defaultFormat);return this.lang().postformat(n)},add:function(e,n){var r;return typeof e=="string"?r=t.duration(+n,e):r=t.duration(e,n),F(this,r,1),this},subtract:function(e,n){var r;return typeof e=="string"?r=t.duration(+n,e):r=t.duration(e,n),F(this,r,-1),this},diff:function(e,n,r){var i=this._isUTC?t(e).utc():t(e).local(),s=(this.zone()-i.zone())*6e4,o,u;return n&&(n=n.replace(/s$/,"")),n==="year"||n==="month"?(o=(this.daysInMonth()+i.daysInMonth())*432e5,u=(this.year()-i.year())*12+(this.month()-i.month()),u+=(this-t(this).startOf("month")-(i-t(i).startOf("month")))/o,n==="year"&&(u/=12)):(o=this-i-s,u=n==="second"?o/1e3:n==="minute"?o/6e4:n==="hour"?o/36e5:n==="day"?o/864e5:n==="week"?o/6048e5:o),r?u:B(u)},from:function(e,n){return t.duration(this.diff(e)).lang(this.lang()._abbr).humanize(!n)},fromNow:function(e){return this.from(t(),e)},calendar:function(){var e=this.diff(t().startOf("day"),"days",!0),n=e<-6?"sameElse":e<-1?"lastWeek":e<0?"lastDay":e<1?"sameDay":e<2?"nextDay":e<7?"nextWeek":"sameElse";return this.format(this.lang().calendar(n,this))},isLeapYear:function(){var e=this.year();return e%4===0&&e%100!==0||e%400===0},isDST:function(){return this.zone()<t([this.year()]).zone()||this.zone()<t([this.year(),5]).zone()},day:function(e){var t=this._isUTC?this._d.getUTCDay():this._d.getDay();return e==null?t:this.add({d:e-t})},startOf:function(e){e=e.replace(/s$/,"");switch(e){case"year":this.month(0);case"month":this.date(1);case"week":case"day":this.hours(0);case"hour":this.minutes(0);case"minute":this.seconds(0);case"second":this.milliseconds(0)}return e==="week"&&this.day(0),this},endOf:function(e){return this.startOf(e).add(e.replace(/s?$/,"s"),1).subtract("ms",1)},isAfter:function(e,n){return n=typeof n!="undefined"?n:"millisecond",+this.clone().startOf(n)>+t(e).startOf(n)},isBefore:function(e,n){return n=typeof n!="undefined"?n:"millisecond",+this.clone().startOf(n)<+t(e).startOf(n)},isSame:function(e,n){return n=typeof n!="undefined"?n:"millisecond",+this.clone().startOf(n)===+t(e).startOf(n)},zone:function(){return this._isUTC?0:this._d.getTimezoneOffset()},daysInMonth:function(){return t.utc([this.year(),this.month()+1,0]).date()},dayOfYear:function(e){var n=r((t(this).startOf("day")-t(this).startOf("year"))/864e5)+1;return e==null?n:this.add("d",e-n)},isoWeek:function(e){var t=tt(this,1,4);return e==null?t:this.add("d",(e-t)*7)},week:function(e){var t=this.lang().week(this);return e==null?t:this.add("d",(e-t)*7)},lang:function(t){return t===e?this._lang:(this._lang=U(t),this)}};for(i=0;i<T.length;i++)rt(T[i].toLowerCase().replace(/s$/,""),T[i]);rt("year","FullYear"),t.fn.days=t.fn.day,t.fn.weeks=t.fn.week,t.fn.isoWeeks=t.fn.isoWeek,t.duration.fn=P.prototype={weeks:function(){return B(this.days()/7)},valueOf:function(){return this._milliseconds+this._days*864e5+this._months*2592e6},humanize:function(e){var t=+this,n=et(t,!e,this.lang());return e&&(n=this.lang().pastFuture(t,n)),this.lang().postformat(n)},lang:t.fn.lang};for(i in N)N.hasOwnProperty(i)&&(st(i,N[i]),it(i.toLowerCase()));st("Weeks",6048e5),t.lang("en",{ordinal:function(e){var t=e%10,n=~~(e%100/10)===1?"th":t===1?"st":t===2?"nd":t===3?"rd":"th";return e+n}}),o&&(module.exports=t),typeof ender=="undefined"&&(this.moment=t),typeof define=="function"&&define.amd&&define("moment",[],function(){return t})}).call(this);;angular.module('models').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('/templates/admin/editModel.html',
    "<h2 ng-show=newModel>New {{modelInfo.proper_name}}</h2>\n" +
    "<div ng-hide=newModel>\n" +
    "\t<h2 class=model-title>Edit {{modelInfo.proper_name}} # {{model.id}}</h2>\n" +
    "\t<p>\n" +
    "\t\t<a href=#/{{model.id}} class=\"btn btn-large\">&larr; Cancel</a>\n" +
    "\t</p>\n" +
    "</div>\n" +
    "\n" +
    "<div class=errors>\n" +
    "\t<p class=\"alert alert-danger\" ng-repeat=\"error in errors\">{{error}}</p>\n" +
    "</div>\n" +
    "\n" +
    "<form ng-submit=saveModel() class=form-horizontal>\t\n" +
    "\t<div class=models>\n" +
    "\t\t<div ng-repeat=\"property in modelInfo.properties\" class=model>\n" +
    "\t\t\t<div class=form-group ng-show=property.mutable>\n" +
    "\t\t\t\t<label class=\"control-label col-md-2\">{{property.title}}</label>\n" +
    "\n" +
    "\t\t\t\t<div class=\"value input col-md-10\">\n" +
    "\t\t\t\t\t<div ng-switch on=property.admin_type>\n" +
    "\t\t\t\t\t\t<div ng-switch-when=text>\n" +
    "\t\t\t\t\t\t\t<input class=form-control name={{property.name}} ng-model=model[property.name]>\n" +
    "\t\t\t\t\t\t</div>\n" +
    "\t\t\t\t\t\t<div ng-switch-when=textarea>\n" +
    "\t\t\t\t\t\t\t<textarea name={{property.name}} expanding-textarea ng-model=model[property.name] class=form-control></textarea>\n" +
    "\t\t\t\t\t\t</div>\n" +
    "\t\t\t\t\t\t<div ng-switch-when=checkbox>\n" +
    "\t\t\t\t\t\t\t<input type=checkbox class=checkbox value=1 name={{property.name}} ng-model=model[property.name]>\n" +
    "\t\t\t\t\t\t</div>\n" +
    "\t\t\t\t\t\t<div ng-switch-when=datepicker>\n" +
    "\t\t\t\t\t\t\t<input name={{property.name}} class=\"form-control date\" ui-date ng-model=model[property.name]>\n" +
    "\t\t\t\t\t\t</div>\n" +
    "\t\t\t\t\t\t<div ng-switch-when=enum>\n" +
    "\t\t\t\t\t\t\t<select class=form-control name={{property.name}} ng-options=\"key as value for (key,value) in property.admin_enum\" ng-model=model[property.name]></select>\n" +
    "\t\t\t\t\t\t</div>\n" +
    "\t\t\t\t\t\t<div ng-switch-when=password>\n" +
    "\t\t\t\t\t\t\t<input class=form-control type=password name={{property.name}} ng-model=model[property.name] autocomplete=off>\n" +
    "\t\t\t\t\t\t</div>\n" +
    "\t\t\t\t\t\t<div ng-switch-when=json>\n" +
    "\t\t\t\t\t\t\t<div class=json-editor ng-model=model[property.name] json-editor></div>\n" +
    "\t\t\t\t\t\t</div>\n" +
    "\t\t\t\t\t</div>\n" +
    "\t\t\t\t</div>\n" +
    "\t\t\t</div>\n" +
    "\t\t</div>\n" +
    "\t\t<div ng-show=newModel>\n" +
    "\t\t\t<div class=form-group>\n" +
    "\t\t\t\t<div class=\"col-md-10 col-md-offset-2\">\n" +
    "\t\t\t\t\t<input type=submit class=\"btn btn-success btn-lg\" value=Create ng-disabled=saving>\n" +
    "\t\t\t\t</div>\n" +
    "\t\t\t</div>\n" +
    "\t\t</div>\n" +
    "\t\t<div ng-hide=newModel>\n" +
    "\t\t\t<div class=form-group>\n" +
    "\t\t\t\t<div class=\"col-md-10 col-md-offset-2\">\n" +
    "\t\t\t\t\t<input type=submit class=\"btn btn-success btn-lg\" value=Save ng-disabled=saving>\n" +
    "\t\t\t\t</div>\n" +
    "\t\t\t</div>\n" +
    "\t\t</div>\n" +
    "\t</div>\n" +
    "</form>"
  );


  $templateCache.put('/templates/admin/model.html',
    "<div class=row>\n" +
    "\t<div class=col-md-8>\n" +
    "\t\t<h2 class=model-title>{{modelInfo.proper_name}} #{{model.id}}</h2>\n" +
    "\t</div>\n" +
    "\t<div class=col-md-4>\n" +
    "\t\t<div class=btn-group>\n" +
    "\t\t\t<a href=#/{{model.id}}/edit class=\"btn btn-success\" ng-show=modelInfo.permissions.edit>\n" +
    "\t\t\t\t<span class=\"glyphicon glyphicon-pencil\"></span>\n" +
    "\t\t\t</a>\n" +
    "\t\t\t<button class=\"btn btn-danger\" ng-click=deleteModelAsk(model)>\n" +
    "\t\t\t\t<span class=\"glyphicon glyphicon-remove\"></span>\n" +
    "\t\t\t</button>\n" +
    "\t\t</div>\n" +
    "\t</div>\n" +
    "</div>\n" +
    "<br>\n" +
    "\n" +
    "<div class=errors>\n" +
    "\t<p class=\"alert alert-danger\" ng-repeat=\"error in errors\">{{error}}</p>\n" +
    "</div>\n" +
    "\n" +
    "<div class=model>\n" +
    "\t<div class=\"properties form-horizontal\">\n" +
    "\t\t<div ng-repeat=\"property in modelInfo.properties\" class=property>\n" +
    "\t\t\t<div class=form-group>\n" +
    "\t\t\t\t<label class=\"control-label col-md-2\">\n" +
    "\t\t\t\t\t{{property.title}}\n" +
    "\t\t\t\t</label>\n" +
    "\t\t\t\t<div class=\"col-md-10 form-control-static\">\n" +
    "\t\t\t\t\t<div class=value ng-bind-html=model|modelValue:modelInfo.properties:property:false></div>\n" +
    "\t\t\t\t</div>\n" +
    "\t\t\t</div>\n" +
    "\t\t</div>\n" +
    "\t</div>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"modal fade\" modal=deleteModel close=closeDeleteModal() opts=dialogOptions>\n" +
    "\t<div class=modal-dialog>\n" +
    "\t\t<div class=modal-content>\n" +
    "\t\t\t<div class=modal-header>\n" +
    "\t\t\t\t<h3>Are you sure?</h3>\n" +
    "\t\t\t</div>\n" +
    "\t\t\t<div class=modal-body>\n" +
    "\t\t\t\t<p>Are you sure you want to delete this {{modelInfo.proper_name}}?</p>\n" +
    "\t\t\t</div>\n" +
    "\t\t\t<div class=modal-footer>\n" +
    "\t\t\t\t<button class=\"btn btn-default cancel\" ng-click=closeDeleteModal()>No</button>\n" +
    "\t\t\t\t<button class=\"btn btn-danger\" ng-click=deleteModelConfirm()>Yes</button>\n" +
    "\t\t\t</div>\n" +
    "\t\t</div>\n" +
    "\t</div>\n" +
    "</div>"
  );


  $templateCache.put('/templates/admin/models.html',
    "<div class=errors>\n" +
    "\t<p class=\"alert alert-danger\" ng-repeat=\"error in errors\">{{error}}</p>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"filter-bar hidden-xs\">\n" +
    "\t<div class=row>\n" +
    "\t\t<div class=col-md-2>\n" +
    "\t\t\t<div class=input-group>\n" +
    "\t\t\t\t<span class=input-group-addon>\n" +
    "\t\t\t\t\t<span class=\"glyphicon glyphicon-search\"></span>\n" +
    "\t\t\t\t</span>\n" +
    "\t\t\t\t<input class=form-control id=prependedInput placeholder=Search ng-model=query ng-change=loadModels()>\n" +
    "\t\t\t</div>\n" +
    "\t\t</div>\n" +
    "\t\t<div class=col-md-1>\n" +
    "\t\t\t<a href=# class=\"btn btn-link btn-block\" ng-click=\"showModelProperties=!showModelProperties\" eat-click>\n" +
    "\t\t\t\tProperties\n" +
    "\t\t\t\t<span class=glyphicon ng-class=\"{'glyphicon-chevron-right':!showModelProperties,'glyphicon-chevron-down':showModelProperties}\"></span>\n" +
    "\t\t\t</a>\n" +
    "\t\t</div>\n" +
    "\t\t<div class=col-md-1>\n" +
    "\t\t\t<select ng-model=limit ng-change=loadModels() class=form-control>\n" +
    "\t\t\t\t<option value=10>10</option>\n" +
    "\t\t\t\t<option value=25>25</option>\n" +
    "\t\t\t\t<option value=50>50</option>\n" +
    "\t\t\t\t<option value=100>100</option>\n" +
    "\t\t\t</select>\n" +
    "\t\t</div>\n" +
    "\t\t<div class=col-md-2 ng-show=modelInfo.permissions.create>\n" +
    "\t\t\t<a href=#/new class=\"btn btn-success btn-block\">\n" +
    "\t\t\t\t<span class=\"glyphicon glyphicon-plus glyphicon-white\"></span> {{modelInfo.proper_name}}\n" +
    "\t\t\t</a>\n" +
    "\t\t</div>\n" +
    "\t</div>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"filter-bar visible-xs\">\n" +
    "\t<div class=row>\n" +
    "\t\t<div class=col-xs-8>\n" +
    "\t\t\t<div class=input-group>\n" +
    "\t\t\t\t<span class=input-group-addon>\n" +
    "\t\t\t\t\t<span class=\"glyphicon glyphicon-search\"></span>\n" +
    "\t\t\t\t</span>\n" +
    "\t\t\t\t<input class=form-control id=prependedInput placeholder=Search ng-model=query ng-change=loadModels()>\n" +
    "\t\t\t</div>\n" +
    "\t\t</div>\n" +
    "\t\t<div class=col-xs-4>\n" +
    "\t\t\t<select ng-model=limit ng-change=loadModels() class=form-control>\n" +
    "\t\t\t\t<option value=10>10</option>\n" +
    "\t\t\t\t<option value=25>25</option>\n" +
    "\t\t\t\t<option value=50>50</option>\n" +
    "\t\t\t\t<option value=100>100</option>\n" +
    "\t\t\t</select>\n" +
    "\t\t</div>\n" +
    "\t</div>\n" +
    "\t<div class=row>\n" +
    "\t\t<div class=col-xs-6>\n" +
    "\t\t\t<a href=# class=\"btn btn-link btn-block\" ng-click=\"showModelProperties=!showModelProperties\" eat-click>\n" +
    "\t\t\t\tProperties\n" +
    "\t\t\t\t<span class=glyphicon ng-class=\"{'glyphicon-chevron-right':!showModelProperties,'glyphicon-chevron-down':showModelProperties}\"></span>\n" +
    "\t\t\t</a>\n" +
    "\t\t</div>\n" +
    "\t\t<div class=col-xs-6 ng-show=modelInfo.permissions.create>\n" +
    "\t\t\t<a href=#/new class=\"btn btn-success btn-block\">\n" +
    "\t\t\t\t<span class=\"glyphicon glyphicon-plus glyphicon-white\"></span> {{modelInfo.proper_name}}\n" +
    "\t\t\t</a>\n" +
    "\t\t</div>\n" +
    "\t</div>\n" +
    "</div>\n" +
    "\n" +
    "<div class=properties-holder ng-class={hidden:!showModelProperties}>\n" +
    "\t<div class=row>\n" +
    "\t\t<div class=col-sm-6>\n" +
    "\t\t\t<h4>Visible Properties</h4>\n" +
    "\t\t\t<table class=table>\n" +
    "\t\t\t\t<tr ng-repeat=\"property in modelInfo.properties\" class=property ng-show=visibleProperties[property.name]>\n" +
    "\t\t\t\t\t<td>\n" +
    "\t\t\t\t\t\t<input type=checkbox ng-model=visibleProperties[property.name] ng-change=toggleVisibility(property)>\n" +
    "\t\t\t\t\t</td>\n" +
    "\t\t\t\t\t<td>\n" +
    "\t\t\t\t\t\t<div class=row>\n" +
    "\t\t\t\t\t\t\t<div class=col-sm-5>\n" +
    "\t\t\t\t\t\t\t\t{{property.title}}\n" +
    "\t\t\t\t\t\t\t</div>\n" +
    "\t\t\t\t\t\t\t<div class=col-sm-1>\n" +
    "\t\t\t\t\t\t\t\t<button class=\"btn-link glyphicon glyphicon-white\" ng-class=\"{'glyphicon-sort':sortDirection(property)==0,'glyphicon-sort-by-attributes':sortDirection(property)==1,'glyphicon-sort-by-attributes-alt':sortDirection(property)==-1}\" ng-click=toggleSort(property) ng-hide=property.admin_no_sort>\n" +
    "\t\t\t\t\t\t\t\t</button>\n" +
    "\t\t\t\t\t\t\t</div>\n" +
    "\t\t\t\t\t\t\t<div class=col-sm-6>\n" +
    "\t\t\t\t\t\t\t\t<button class=btn-link ng-hide=hasFilter[property.name] ng-click=showFilter(property)>\n" +
    "\t\t\t\t\t\t\t\t\t<span class=\"glyphicon glyphicon-filter glyphicon-white\">\n" +
    "\t\t\t\t\t\t\t\t</span></button>\n" +
    "\t\t\t\t\t\t\t\t<div class=input-group ng-show=hasFilter[property.name]>\n" +
    "\t\t\t\t\t\t\t\t\t<input class=\"form-control input-sm\" placeholder=Filter... ng-model=filter[property.name]>\n" +
    "\t\t\t\t\t\t\t\t\t<span class=input-group-btn>\n" +
    "\t\t\t\t\t\t\t\t\t\t<button class=\"btn btn-success btn-sm\" type=button ng-click=loadModels()>\n" +
    "\t\t\t\t\t\t\t\t\t\t\t<i class=\"glyphicon glyphicon-ok glyphicon-white\"></i>\n" +
    "\t\t\t\t\t\t\t\t\t\t</button>\n" +
    "\t\t\t\t\t\t\t\t\t\t<button class=\"btn btn-danger btn-sm\" type=button ng-click=hideFilter(property)>\n" +
    "\t\t\t\t\t\t\t\t\t\t\t<i class=\"glyphicon glyphicon-remove glyphicon-white\"></i>\n" +
    "\t\t\t\t\t\t\t\t\t\t</button>\t\t\t\t\t\t\t\t\n" +
    "\t\t\t\t\t\t\t\t\t</span>\n" +
    "\t\t\t\t\t\t\t\t</div>\n" +
    "\t\t\t\t\t\t\t</div>\n" +
    "\t\t\t\t\t\t</div>\n" +
    "\t\t\t\t\t</td>\n" +
    "\t\t\t\t</tr>\n" +
    "\t\t\t</table>\n" +
    "\t\t</div>\n" +
    "\t\t<div class=col-sm-6>\n" +
    "\t\t\t<h4>Hidden Properties</h4>\n" +
    "\t\t\t<table class=table>\n" +
    "\t\t\t\t<tr ng-repeat=\"property in modelInfo.properties\" class=property ng-hide=visibleProperties[property.name]>\n" +
    "\t\t\t\t\t<td>\n" +
    "\t\t\t\t\t\t<input type=checkbox ng-model=visibleProperties[property.name] ng-change=toggleVisibility(property)>\n" +
    "\t\t\t\t\t</td>\n" +
    "\t\t\t\t\t<td>\n" +
    "\t\t\t\t\t\t{{property.title}}\n" +
    "\t\t\t\t\t</td>\n" +
    "\t\t\t\t\t<td>\n" +
    "\t\t\t\t\t\t<button class=\"btn-link glyphicon glyphicon-white\" ng-class=\"{'glyphicon-sort':sortDirection(property)==0,'glyphicon-sort-by-attributes':sortDirection(property)==1,'glyphicon-sort-by-attributes-alt':sortDirection(property)==-1}\" ng-click=toggleSort(property)>\n" +
    "\t\t\t\t\t\t</button>\n" +
    "\t\t\t\t\t</td>\n" +
    "\t\t\t\t\t<td>\n" +
    "\t\t\t\t\t\t<button class=btn-link ng-hide=hasFilter[property.name] ng-click=showFilter(property)>\n" +
    "\t\t\t\t\t\t\t<span class=\"glyphicon glyphicon-filter glyphicon-white\">\n" +
    "\t\t\t\t\t\t</span></button>\n" +
    "\t\t\t\t\t\t<div class=input-group ng-show=hasFilter[property.name]>\n" +
    "\t\t\t\t\t\t\t<input class=\"form-control input-sm\" placeholder=Filter... ng-model=filter[property.name]>\n" +
    "\t\t\t\t\t\t\t<span class=input-group-btn>\n" +
    "\t\t\t\t\t\t\t\t<button class=\"btn btn-success btn-sm\" type=button ng-click=loadModels()>\n" +
    "\t\t\t\t\t\t\t\t\t<i class=\"glyphicon glyphicon-ok glyphicon-white\"></i>\n" +
    "\t\t\t\t\t\t\t\t</button>\n" +
    "\t\t\t\t\t\t\t\t<button class=\"btn btn-danger btn-sm\" type=button ng-click=hideFilter(property)>\n" +
    "\t\t\t\t\t\t\t\t\t<i class=\"glyphicon glyphicon-remove glyphicon-white\"></i>\n" +
    "\t\t\t\t\t\t\t\t</button>\t\t\t\t\t\t\t\t\n" +
    "\t\t\t\t\t\t\t</span>\n" +
    "\t\t\t\t\t\t</div>\n" +
    "\t\t\t\t\t</td>\n" +
    "\t\t\t\t</tr>\n" +
    "\t\t\t</table>\n" +
    "\t\t</div>\n" +
    "\t</div>\n" +
    "</div>\n" +
    "\n" +
    "<div ng-hide=noModels()>\n" +
    "\t<div class=\"models-holder hidden-xs\">\n" +
    "\t\t<table class=\"table table-striped\" id=models-table>\n" +
    "\t\t\t<thead>\n" +
    "\t\t\t\t<tr class=title-bar>\n" +
    "\t\t\t\t\t<th></th>\n" +
    "\t\t\t\t\t<th></th>\n" +
    "\t\t\t\t\t<th ng-repeat=\"property in modelInfo.visibleProperties\">\n" +
    "\t\t\t\t\t\t{{property.title}}\n" +
    "\t\t\t\t\t</th>\n" +
    "\t\t\t\t</tr>\n" +
    "\t\t\t</thead>\n" +
    "\t\t\t<tbody>\n" +
    "\t\t\t\t<tr ng-repeat=\"model in models\">\n" +
    "\t\t\t\t\t<td class=\"controls nowrap\">\n" +
    "\t\t\t\t\t\t<div class=btn-group ng-show=model.id>\n" +
    "\t\t\t\t\t\t\t<a href=#/{{model.id}} class=\"btn btn-default\">\n" +
    "\t\t\t\t\t\t\t\t<span class=\"glyphicon glyphicon-eye-open\"></span>\n" +
    "\t\t\t\t\t\t\t</a>\n" +
    "\t\t\t\t\t\t\t<a href=#/{{model.id}}/edit class=\"btn btn-success\" ng-show=modelInfo.permissions.edit>\n" +
    "\t\t\t\t\t\t\t\t<i class=\"glyphicon glyphicon-pencil\"></i>\n" +
    "\t\t\t\t\t\t\t</a>\n" +
    "\t\t\t\t\t\t\t<a href=# class=\"btn btn-danger\" ng-click=deleteModelAsk(model) ng-show=modelInfo.permissions.delete eat-click>\n" +
    "\t\t\t\t\t\t\t\t<i class=\"glyphicon glyphicon-remove\"></i>\n" +
    "\t\t\t\t\t\t\t</a>\n" +
    "\t\t\t\t\t\t</div>\n" +
    "\t\t\t\t\t</td>\n" +
    "\t\t\t\t\t<td class=\"title nowrap\">\n" +
    "\t\t\t\t\t\t# {{model.id}}\n" +
    "\t\t\t\t\t</td>\n" +
    "\t\t\t\t\t<td ng-repeat=\"property in modelInfo.visibleProperties\" ng-bind-html=model|modelValue:modelInfo.properties:property:true ng-class={nowrap:property.admin_nowrap}></td>\n" +
    "\t\t\t\t</tr>\n" +
    "\t\t\t</tbody>\n" +
    "\t\t</table>\n" +
    "\t</div>\n" +
    "\n" +
    "\t<div class=\"models-holder visible-xs\">\n" +
    "\t\t<div ng-repeat=\"model in models\" class=model>\n" +
    "\t\t\t<div class=\"btn-toolbar pull-right\" ng-show=model.id>\n" +
    "\t\t\t\t<a href=#/{{model.id}} class=\"btn btn-default\">\n" +
    "\t\t\t\t\t<span class=\"glyphicon glyphicon-eye-open\"></span>\n" +
    "\t\t\t\t</a>\n" +
    "\t\t\t\t<a href=#/{{model.id}}/edit class=\"btn btn-success\" ng-show=modelInfo.permissions.edit>\n" +
    "\t\t\t\t\t<i class=\"glyphicon glyphicon-pencil\"></i>\n" +
    "\t\t\t\t</a>\n" +
    "\t\t\t\t<a href=# class=\"btn btn-danger\" ng-click=deleteModelAsk(model) ng-show=modelInfo.permissions.delete eat-click>\n" +
    "\t\t\t\t\t<i class=\"glyphicon glyphicon-remove\"></i>\n" +
    "\t\t\t\t</a>\n" +
    "\t\t\t</div>\n" +
    "\n" +
    "\t\t\t<div class=title>\n" +
    "\t\t\t\t# {{model.id}}\n" +
    "\t\t\t</div>\n" +
    "\n" +
    "\t\t\t<div class=property ng-repeat=\"property in modelInfo.visibleProperties\">\n" +
    "\t\t\t\t<table>\n" +
    "\t\t\t\t\t<tr>\n" +
    "\t\t\t\t\t\t<td>\n" +
    "\t\t\t\t\t\t\t{{property.title}}\n" +
    "\t\t\t\t\t\t</td>\n" +
    "\t\t\t\t\t\t<td ng-bind-html=model|modelValue:modelInfo.properties:property:true></td>\n" +
    "\t\t\t\t\t</tr>\n" +
    "\t\t\t\t</table>\n" +
    "\t\t\t</div>\n" +
    "\t\t</div>\n" +
    "\t</div>\n" +
    "\t\t\n" +
    "\t<ul class=\"pagination pull-right\" ng-show=\"page_count>1\">\n" +
    "\t\t<li ng-hide=\"page_count==1\" ng-class=\"{disabled:page==1}\">\n" +
    "\t\t\t<a href=# ng-click=goToPage(1) eat-click>\n" +
    "\t\t\t\t&laquo;\n" +
    "\t\t\t</a>\n" +
    "\t\t</li>\n" +
    "\t    <li ng-repeat=\"p in currentPages(5)\" ng-class=\"{active:page==p}\">\n" +
    "\t    \t<a href=# ng-click=goToPage(p) eat-click>{{p}}</a>\n" +
    "\t    </li>\n" +
    "\t\t<li ng-hide=\"page_count==1\" ng-class=\"{disabled:page==page_count}\">\n" +
    "\t\t\t<a href=# ng-click=goToPage(page_count) eat-click>\n" +
    "\t\t\t\t&raquo;\n" +
    "\t\t\t</a>\n" +
    "\t\t</li>\n" +
    "\t</ul>\n" +
    "\t\n" +
    "\t<p ng-show=\"models.length>0\">\n" +
    "\t\t<br>\n" +
    "\t\t<strong>{{total_count}} {{modelInfo.proper_name_plural}}</strong><br>\n" +
    "\t\t<span ng-show=\"models.length>0\">Showing <em>{{(page-1)*limit+1}}-{{((page-1)*limit)+models.length}}</em> of <em>{{filtered_count}}</em> found</span>\n" +
    "\t\t<span ng-show=\"models.length==0\"><em>None Found</em></span>\n" +
    "\t</p>\n" +
    "</div>\n" +
    "<div class=no-results ng-show=\"models.length==0&&!loading\">\n" +
    "\tUnable to find any {{modelInfo.proper_name_plural}}<span ng-show=\"query.length>0\"> matching <strong>{{query}}</strong></span>.\n" +
    "</div>\n" +
    "<div class=loading ng-show=loading>\n" +
    "\t<img src=/img/ajax-loader.gif>\n" +
    "</div>\n" +
    "\n" +
    "<script type=text/ng-template id=deleteModalAsk.html>\n" +
    "    <div class=\"modal-header\">\n" +
    "        <h3 class=\"modal-title\">Are you sure?</h3>\n" +
    "    </div>\n" +
    "    <div class=\"modal-body\">\n" +
    "\t\t<p>Are you sure you want to delete this {{modelInfo.proper_name}}?</p>\n" +
    "    </div>\n" +
    "    <div class=\"modal-footer\">\n" +
    "\t\t<button class=\"btn btn-default cancel\" ng-click=\"cancel()\">No</button>\n" +
    "\t\t<button class=\"btn btn-danger\" ng-click=\"ok()\">Yes</button>\n" +
    "    </div>\n" +
    "</script>"
  );

}]);
