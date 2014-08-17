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
	
	/* Filters */
	
	app.filter('modelValue', function() {
		return function (model, properties, property, truncate) {
					
			// apply filter
			if (typeof(property.filter) == 'string')
			{
				value = property.filter;
				
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
			// no filter
			else
				return parseModelValue(model, property, truncate);
		};
	});
	
	var ModelCntl = ['$scope', '$routeParams', '$location', 'Model',
		function($scope, $routeParams, $location, Model) {
			
			$scope.module = module;
			$scope.modelInfo = modelInfo;
			$scope.page = 1;
			$scope.limit = 10;	
			$scope.dialogOptions = {
				backdropFade: true,
				dialogFade:true
			};
			$scope.deleteModel = false;
			$scope.models = [];
			$scope.loading = false;
			$scope.sort = [];
			$scope.sortStates = {'0':'1','1':'-1','-1':'0'};
			$scope.sortMap = {'1':'asc','-1':'desc'};
			$scope.filter = {};
			$scope.hasFilter = {};
			
			$scope.loadModels = function() {
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
					$scope.loadModels();
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
			};
			
			$scope.deleteModelConfirm = function() {
				
				Model.delete({
					modelId: $scope.deleteModel.id
				}, function(result) {
					if (result.success) {
						if ($routeParams.id)
							$location.path('/');
						else
							$scope.loadModels();
					} else if (result.error && result.error instanceof Array) {
		    			$scope.errors = result.error;
		    		}
				});
				
				$scope.deleteModel = false;
			}
			
			$scope.closeDeleteModal = function() {
				$scope.deleteModel = false;
			};
			
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
						if (property.type == 'enum' && typeof property.default == 'undefined') {
							var kyz = Object.keys(property.enum);
							$scope.model[property.name] = property.enum[kyz[0]];
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
	
		switch(property.type)
		{
		case 'id':
		case 'number':		
		case 'hidden':
		case 'custom':
		case 'text':
		case 'longtext':
		break;
		case 'boolean':
			value = (value > 0) ? 'Yes' : 'No';
		break;
		case 'enum':
			if (property.enum)
			{
				if (property.enum[value])
					value = property.enum[value];
				else if (property.default)
					value = property.enum[property.default];
			}		
		break;
		case 'password':
			return '<em>hidden</em>';
		break;
		case 'date':
			value = moment(value).format("M/D/YYYY h:mm a");
		break;
		case 'html':
			return value;
		break;
		}
		
		// truncation
		if (truncate && property.truncate && value.length > 40)
			value = value.substring(0, 40) + '...';
		
		return nl2br(htmlentities(value));
	}
	
	function massageModelForClient (model, modelInfo) {
	
		for (var i in modelInfo.properties) {
			var property = modelInfo.properties[i];
			var value = model[property.name];
			
			switch (property.type)
			{
			case 'date':
				if (value == 0)
					model[property.name] = new Date();
				else
					model[property.name] = moment.unix(value).toDate();
			break;
			case 'password':
				model[property.name] = '';
			break;
			case 'boolean':
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
		
			switch (property.type)
			{
			case 'date':
				model[property.name] = moment(value).unix();
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
	angular.module("ui.bootstrap",["ui.bootstrap.transition","ui.bootstrap.collapse","ui.bootstrap.accordion","ui.bootstrap.alert","ui.bootstrap.buttons","ui.bootstrap.carousel","ui.bootstrap.datepicker","ui.bootstrap.dialog","ui.bootstrap.dropdownToggle","ui.bootstrap.modal","ui.bootstrap.pagination","ui.bootstrap.position","ui.bootstrap.tooltip","ui.bootstrap.popover","ui.bootstrap.progressbar","ui.bootstrap.rating","ui.bootstrap.tabs","ui.bootstrap.timepicker","ui.bootstrap.typeahead"]),angular.module("ui.bootstrap.transition",[]).factory("$transition",["$q","$timeout","$rootScope",function(e,t,n){function a(e){for(var t in e)if(void 0!==i.style[t])return e[t]}var o=function(a,i,r){r=r||{};var l=e.defer(),s=o[r.animation?"animationEndEventName":"transitionEndEventName"],u=function(){n.$apply(function(){a.unbind(s,u),l.resolve(a)})};return s&&a.bind(s,u),t(function(){angular.isString(i)?a.addClass(i):angular.isFunction(i)?i(a):angular.isObject(i)&&a.css(i),s||l.resolve(a)}),l.promise.cancel=function(){s&&a.unbind(s,u),l.reject("Transition cancelled")},l.promise},i=document.createElement("trans"),r={WebkitTransition:"webkitTransitionEnd",MozTransition:"transitionend",OTransition:"oTransitionEnd",transition:"transitionend"},l={WebkitTransition:"webkitAnimationEnd",MozTransition:"animationend",OTransition:"oAnimationEnd",transition:"animationend"};return o.transitionEndEventName=a(r),o.animationEndEventName=a(l),o}]),angular.module("ui.bootstrap.collapse",["ui.bootstrap.transition"]).directive("collapse",["$transition",function(e){var t=function(e,t,n){t.removeClass("collapse"),t.css({height:n}),t[0].offsetWidth,t.addClass("collapse")};return{link:function(n,a,o){var i,r=!0;n.$watch(function(){return a[0].scrollHeight},function(){0!==a[0].scrollHeight&&(i||(r?t(n,a,a[0].scrollHeight+"px"):t(n,a,"auto")))}),n.$watch(o.collapse,function(e){e?c():u()});var l,s=function(t){return l&&l.cancel(),l=e(a,t),l.then(function(){l=void 0},function(){l=void 0}),l},u=function(){r?(r=!1,i||t(n,a,"auto")):s({height:a[0].scrollHeight+"px"}).then(function(){i||t(n,a,"auto")}),i=!1},c=function(){i=!0,r?(r=!1,t(n,a,0)):(t(n,a,a[0].scrollHeight+"px"),s({height:"0"}))}}}}]),angular.module("ui.bootstrap.accordion",["ui.bootstrap.collapse"]).constant("accordionConfig",{closeOthers:!0}).controller("AccordionController",["$scope","$attrs","accordionConfig",function(e,t,n){this.groups=[],this.closeOthers=function(a){var o=angular.isDefined(t.closeOthers)?e.$eval(t.closeOthers):n.closeOthers;o&&angular.forEach(this.groups,function(e){e!==a&&(e.isOpen=!1)})},this.addGroup=function(e){var t=this;this.groups.push(e),e.$on("$destroy",function(){t.removeGroup(e)})},this.removeGroup=function(e){var t=this.groups.indexOf(e);-1!==t&&this.groups.splice(this.groups.indexOf(e),1)}}]).directive("accordion",function(){return{restrict:"EA",controller:"AccordionController",transclude:!0,replace:!1,templateUrl:"template/accordion/accordion.html"}}).directive("accordionGroup",["$parse","$transition","$timeout",function(e){return{require:"^accordion",restrict:"EA",transclude:!0,replace:!0,templateUrl:"template/accordion/accordion-group.html",scope:{heading:"@"},controller:["$scope",function(){this.setHeading=function(e){this.heading=e}}],link:function(t,n,a,o){var i,r;o.addGroup(t),t.isOpen=!1,a.isOpen&&(i=e(a.isOpen),r=i.assign,t.$watch(function(){return i(t.$parent)},function(e){t.isOpen=e}),t.isOpen=i?i(t.$parent):!1),t.$watch("isOpen",function(e){e&&o.closeOthers(t),r&&r(t.$parent,e)})}}}]).directive("accordionHeading",function(){return{restrict:"EA",transclude:!0,template:"",replace:!0,require:"^accordionGroup",compile:function(e,t,n){return function(e,t,a,o){o.setHeading(n(e,function(){}))}}}}).directive("accordionTransclude",function(){return{require:"^accordionGroup",link:function(e,t,n,a){e.$watch(function(){return a[n.accordionTransclude]},function(e){e&&(t.html(""),t.append(e))})}}}),angular.module("ui.bootstrap.alert",[]).directive("alert",function(){return{restrict:"EA",templateUrl:"template/alert/alert.html",transclude:!0,replace:!0,scope:{type:"=",close:"&"},link:function(e,t,n){e.closeable="close"in n}}}),angular.module("ui.bootstrap.buttons",[]).constant("buttonConfig",{activeClass:"active",toggleEvent:"click"}).directive("btnRadio",["buttonConfig",function(e){var t=e.activeClass||"active",n=e.toggleEvent||"click";return{require:"ngModel",link:function(e,a,o,i){i.$render=function(){a.toggleClass(t,angular.equals(i.$modelValue,e.$eval(o.btnRadio)))},a.bind(n,function(){a.hasClass(t)||e.$apply(function(){i.$setViewValue(e.$eval(o.btnRadio)),i.$render()})})}}}]).directive("btnCheckbox",["buttonConfig",function(e){var t=e.activeClass||"active",n=e.toggleEvent||"click";return{require:"ngModel",link:function(e,a,o,i){var r=e.$eval(o.btnCheckboxTrue),l=e.$eval(o.btnCheckboxFalse);r=angular.isDefined(r)?r:!0,l=angular.isDefined(l)?l:!1,i.$render=function(){a.toggleClass(t,angular.equals(i.$modelValue,r))},a.bind(n,function(){e.$apply(function(){i.$setViewValue(a.hasClass(t)?l:r),i.$render()})})}}}]),angular.module("ui.bootstrap.carousel",["ui.bootstrap.transition"]).controller("CarouselController",["$scope","$timeout","$transition","$q",function(e,t,n){function a(){function n(){i?(e.next(),a()):e.pause()}o&&t.cancel(o);var r=+e.interval;!isNaN(r)&&r>=0&&(o=t(n,r))}var o,i,r=this,l=r.slides=[],s=-1;r.currentSlide=null,r.select=function(o,i){function u(){r.currentSlide&&angular.isString(i)&&!e.noTransition&&o.$element?(o.$element.addClass(i),o.$element[0].offsetWidth=o.$element[0].offsetWidth,angular.forEach(l,function(e){angular.extend(e,{direction:"",entering:!1,leaving:!1,active:!1})}),angular.extend(o,{direction:i,active:!0,entering:!0}),angular.extend(r.currentSlide||{},{direction:i,leaving:!0}),e.$currentTransition=n(o.$element,{}),function(t,n){e.$currentTransition.then(function(){c(t,n)},function(){c(t,n)})}(o,r.currentSlide)):c(o,r.currentSlide),r.currentSlide=o,s=p,a()}function c(t,n){angular.extend(t,{direction:"",active:!0,leaving:!1,entering:!1}),angular.extend(n||{},{direction:"",active:!1,leaving:!1,entering:!1}),e.$currentTransition=null}var p=l.indexOf(o);void 0===i&&(i=p>s?"next":"prev"),o&&o!==r.currentSlide&&(e.$currentTransition?(e.$currentTransition.cancel(),t(u)):u())},r.indexOfSlide=function(e){return l.indexOf(e)},e.next=function(){var t=(s+1)%l.length;return e.$currentTransition?void 0:r.select(l[t],"next")},e.prev=function(){var t=0>s-1?l.length-1:s-1;return e.$currentTransition?void 0:r.select(l[t],"prev")},e.select=function(e){r.select(e)},e.isActive=function(e){return r.currentSlide===e},e.slides=function(){return l},e.$watch("interval",a),e.play=function(){i||(i=!0,a())},e.pause=function(){e.noPause||(i=!1,o&&t.cancel(o))},r.addSlide=function(t,n){t.$element=n,l.push(t),1===l.length||t.active?(r.select(l[l.length-1]),1==l.length&&e.play()):t.active=!1},r.removeSlide=function(e){var t=l.indexOf(e);l.splice(t,1),l.length>0&&e.active?t>=l.length?r.select(l[t-1]):r.select(l[t]):s>t&&s--}}]).directive("carousel",[function(){return{restrict:"EA",transclude:!0,replace:!0,controller:"CarouselController",require:"carousel",templateUrl:"template/carousel/carousel.html",scope:{interval:"=",noTransition:"=",noPause:"="}}}]).directive("slide",["$parse",function(e){return{require:"^carousel",restrict:"EA",transclude:!0,replace:!0,templateUrl:"template/carousel/slide.html",scope:{},link:function(t,n,a,o){if(a.active){var i=e(a.active),r=i.assign,l=t.active=i(t.$parent);t.$watch(function(){var e=i(t.$parent);return e!==t.active&&(e!==l?l=t.active=e:r(t.$parent,e=l=t.active)),e})}o.addSlide(t,n),t.$on("$destroy",function(){o.removeSlide(t)}),t.$watch("active",function(e){e&&o.select(t)})}}}]),angular.module("ui.bootstrap.datepicker",[]).constant("datepickerConfig",{dayFormat:"dd",monthFormat:"MMMM",yearFormat:"yyyy",dayHeaderFormat:"EEE",dayTitleFormat:"MMMM yyyy",monthTitleFormat:"yyyy",showWeeks:!0,startingDay:0,yearRange:20}).directive("datepicker",["dateFilter","$parse","datepickerConfig",function(e,t,n){return{restrict:"EA",replace:!0,scope:{model:"=ngModel",dateDisabled:"&"},templateUrl:"template/datepicker/datepicker.html",link:function(a,o,r){function l(e,t,n){a.rows=e,a.labels=t,a.title=n}function s(){a.showWeekNumbers="day"===a.mode&&p}function u(e,t){return"year"===a.mode?t.getFullYear()-e.getFullYear():"month"===a.mode?new Date(t.getFullYear(),t.getMonth())-new Date(e.getFullYear(),e.getMonth()):"day"===a.mode?new Date(t.getFullYear(),t.getMonth(),t.getDate())-new Date(e.getFullYear(),e.getMonth(),e.getDate()):void 0}function c(e){return d&&u(e,d)>0||f&&0>u(e,f)||a.dateDisabled&&a.dateDisabled({date:e,mode:a.mode})}a.mode="day";var p,d,f,m=new Date,g={};g.day=angular.isDefined(r.dayFormat)?a.$eval(r.dayFormat):n.dayFormat,g.month=angular.isDefined(r.monthFormat)?a.$eval(r.monthFormat):n.monthFormat,g.year=angular.isDefined(r.yearFormat)?a.$eval(r.yearFormat):n.yearFormat,g.dayHeader=angular.isDefined(r.dayHeaderFormat)?a.$eval(r.dayHeaderFormat):n.dayHeaderFormat,g.dayTitle=angular.isDefined(r.dayTitleFormat)?a.$eval(r.dayTitleFormat):n.dayTitleFormat,g.monthTitle=angular.isDefined(r.monthTitleFormat)?a.$eval(r.monthTitleFormat):n.monthTitleFormat;var h=angular.isDefined(r.startingDay)?a.$eval(r.startingDay):n.startingDay,v=angular.isDefined(r.yearRange)?a.$eval(r.yearRange):n.yearRange;r.showWeeks?a.$parent.$watch(t(r.showWeeks),function(e){p=!!e,s()}):(p=n.showWeeks,s()),r.min&&a.$parent.$watch(t(r.min),function(e){d=new Date(e),w()}),r.max&&a.$parent.$watch(t(r.max),function(e){f=new Date(e),w()});var $=function(e,t){for(var n=[];e.length>0;)n.push(e.splice(0,t));return n},b=function(e,t){return new Date(e,t+1,0).getDate()},y={day:function(){function t(t,a,i){for(var r=0;a>r;r++)n.push({date:new Date(t),isCurrent:i,isSelected:k(t),label:e(t,g.day),disabled:c(t)}),t.setDate(t.getDate()+1);o=t}var n=[],a=[],o=null,r=new Date(m);r.setDate(1);var s=h-r.getDay(),u=s>0?7-s:-s;for(u>0&&(r.setDate(-u+1),t(r,u,!1)),t(o||r,b(m.getFullYear(),m.getMonth()),!0),t(o,(7-n.length%7)%7,!1),i=0;7>i;i++)a.push(e(n[i].date,g.dayHeader));l($(n,7),a,e(m,g.dayTitle))},month:function(){for(var t=[],n=0,a=m.getFullYear();12>n;){var o=new Date(a,n++,1);t.push({date:o,isCurrent:!0,isSelected:k(o),label:e(o,g.month),disabled:c(o)})}l($(t,3),[],e(m,g.monthTitle))},year:function(){for(var t=[],n=parseInt((m.getFullYear()-1)/v,10)*v+1,a=0;v>a;a++){var o=new Date(n+a,0,1);t.push({date:o,isCurrent:!0,isSelected:k(o),label:e(o,g.year),disabled:c(o)})}var i=t[0].label+" - "+t[t.length-1].label;l($(t,5),[],i)}},w=function(){y[a.mode]()},k=function(e){if(a.model&&a.model.getFullYear()===e.getFullYear()){if("year"===a.mode)return!0;if(a.model.getMonth()===e.getMonth())return"month"===a.mode||"day"===a.mode&&a.model.getDate()===e.getDate()}return!1};a.$watch("model",function(e,t){angular.isDate(e)&&(m=angular.copy(e)),angular.equals(e,t)||w()}),a.$watch("mode",function(){s(),w()}),a.select=function(e){m=new Date(e),"year"===a.mode?(a.mode="month",m.setFullYear(e.getFullYear())):"month"===a.mode?(a.mode="day",m.setMonth(e.getMonth())):"day"===a.mode&&(a.model=new Date(m))},a.move=function(e){"day"===a.mode?m.setMonth(m.getMonth()+e):"month"===a.mode?m.setFullYear(m.getFullYear()+e):"year"===a.mode&&m.setFullYear(m.getFullYear()+e*v),w()},a.toggleMode=function(){a.mode="day"===a.mode?"month":"month"===a.mode?"year":"day"},a.getWeekNumber=function(e){if("day"===a.mode&&a.showWeekNumbers&&7===e.length){var t=h>4?11-h:4-h,n=new Date(e[t].date);return n.setHours(0,0,0),Math.ceil(((n-new Date(n.getFullYear(),0,1))/864e5+1)/7)}}}}}]);var dialogModule=angular.module("ui.bootstrap.dialog",["ui.bootstrap.transition"]);dialogModule.controller("MessageBoxController",["$scope","dialog","model",function(e,t,n){e.title=n.title,e.message=n.message,e.buttons=n.buttons,e.close=function(e){t.close(e)}}]),dialogModule.provider("$dialog",function(){var e={backdrop:!0,dialogClass:"modal",backdropClass:"modal-backdrop",transitionClass:"fade",triggerClass:"in",resolve:{},backdropFade:!1,dialogFade:!1,keyboard:!0,backdropClick:!0},t={},n={value:0};this.options=function(e){t=e},this.$get=["$http","$document","$compile","$rootScope","$controller","$templateCache","$q","$transition","$injector",function(a,o,i,r,l,s,u,c,p){function d(e){var t=angular.element("<div>");return t.addClass(e),t}function f(n){var a=this,o=this.options=angular.extend({},e,t,n);this._open=!1,this.backdropEl=d(o.backdropClass),o.backdropFade&&(this.backdropEl.addClass(o.transitionClass),this.backdropEl.removeClass(o.triggerClass)),this.modalEl=d(o.dialogClass),o.dialogFade&&(this.modalEl.addClass(o.transitionClass),this.modalEl.removeClass(o.triggerClass)),this.handledEscapeKey=function(e){27===e.which&&(a.close(),e.preventDefault(),a.$scope.$apply())},this.handleBackDropClick=function(e){a.close(),e.preventDefault(),a.$scope.$apply()},this.handleLocationChange=function(){a.close()}}var m=o.find("body");return f.prototype.isOpen=function(){return this._open},f.prototype.open=function(e,t){var n=this,a=this.options;if(e&&(a.templateUrl=e),t&&(a.controller=t),!a.template&&!a.templateUrl)throw Error("Dialog.open expected template or templateUrl, neither found. Use options or open method to specify them.");return this._loadResolves().then(function(e){var t=e.$scope=n.$scope=e.$scope?e.$scope:r.$new();if(n.modalEl.html(e.$template),n.options.controller){var a=l(n.options.controller,e);n.modalEl.children().data("ngControllerController",a)}i(n.modalEl)(t),n._addElementsToDom(),setTimeout(function(){n.options.dialogFade&&n.modalEl.addClass(n.options.triggerClass),n.options.backdropFade&&n.backdropEl.addClass(n.options.triggerClass)}),n._bindEvents()}),this.deferred=u.defer(),this.deferred.promise},f.prototype.close=function(e){function t(e){e.removeClass(a.options.triggerClass)}function n(){a._open&&a._onCloseComplete(e)}var a=this,o=this._getFadingElements();if(o.length>0)for(var i=o.length-1;i>=0;i--)c(o[i],t).then(n);else this._onCloseComplete(e)},f.prototype._getFadingElements=function(){var e=[];return this.options.dialogFade&&e.push(this.modalEl),this.options.backdropFade&&e.push(this.backdropEl),e},f.prototype._bindEvents=function(){this.options.keyboard&&m.bind("keydown",this.handledEscapeKey),this.options.backdrop&&this.options.backdropClick&&this.backdropEl.bind("click",this.handleBackDropClick)},f.prototype._unbindEvents=function(){this.options.keyboard&&m.unbind("keydown",this.handledEscapeKey),this.options.backdrop&&this.options.backdropClick&&this.backdropEl.unbind("click",this.handleBackDropClick)},f.prototype._onCloseComplete=function(e){this._removeElementsFromDom(),this._unbindEvents(),this.deferred.resolve(e)},f.prototype._addElementsToDom=function(){m.append(this.modalEl),this.options.backdrop&&(0===n.value&&m.append(this.backdropEl),n.value++),this._open=!0},f.prototype._removeElementsFromDom=function(){this.modalEl.remove(),this.options.backdrop&&(n.value--,0===n.value&&this.backdropEl.remove()),this._open=!1},f.prototype._loadResolves=function(){var e,t=[],n=[],o=this;return this.options.template?e=u.when(this.options.template):this.options.templateUrl&&(e=a.get(this.options.templateUrl,{cache:s}).then(function(e){return e.data})),angular.forEach(this.options.resolve||[],function(e,a){n.push(a),t.push(angular.isString(e)?p.get(e):p.invoke(e))}),n.push("$template"),t.push(e),u.all(t).then(function(e){var t={};return angular.forEach(e,function(e,a){t[n[a]]=e}),t.dialog=o,t})},{dialog:function(e){return new f(e)},messageBox:function(e,t,n){return new f({templateUrl:"template/dialog/message.html",controller:"MessageBoxController",resolve:{model:function(){return{title:e,message:t,buttons:n}}}})}}}]}),angular.module("ui.bootstrap.dropdownToggle",[]).directive("dropdownToggle",["$document","$location",function(e){var t=null,n=angular.noop;return{restrict:"CA",link:function(a,o){a.$watch("$location.path",function(){n()}),o.parent().bind("click",function(){n()}),o.bind("click",function(a){var i=o===t;a.preventDefault(),a.stopPropagation(),t&&n(),i||(o.parent().addClass("open"),t=o,n=function(a){a&&(a.preventDefault(),a.stopPropagation()),e.unbind("click",n),o.parent().removeClass("open"),n=angular.noop,t=null},e.bind("click",n))})}}}]),angular.module("ui.bootstrap.modal",["ui.bootstrap.dialog"]).directive("modal",["$parse","$dialog",function(e,t){return{restrict:"EA",terminal:!0,link:function(n,a,o){var i,r=angular.extend({},n.$eval(o.uiOptions||o.bsOptions||o.options)),l=o.modal||o.show;r=angular.extend(r,{template:a.html(),resolve:{$scope:function(){return n}}});var s=t.dialog(r);a.remove(),i=o.close?function(){e(o.close)(n)}:function(){angular.isFunction(e(l).assign)&&e(l).assign(n,!1)},n.$watch(l,function(e){e?s.open().then(function(){i()}):s.isOpen()&&s.close()})}}}]),angular.module("ui.bootstrap.pagination",[]).controller("PaginationController",["$scope",function(e){e.noPrevious=function(){return 1===e.currentPage},e.noNext=function(){return e.currentPage===e.numPages},e.isActive=function(t){return e.currentPage===t},e.selectPage=function(t){!e.isActive(t)&&t>0&&e.numPages>=t&&(e.currentPage=t,e.onSelectPage({page:t}))}}]).constant("paginationConfig",{boundaryLinks:!1,directionLinks:!0,firstText:"First",previousText:"Previous",nextText:"Next",lastText:"Last",rotate:!0}).directive("pagination",["paginationConfig",function(e){return{restrict:"EA",scope:{numPages:"=",currentPage:"=",maxSize:"=",onSelectPage:"&"},controller:"PaginationController",templateUrl:"template/pagination/pagination.html",replace:!0,link:function(t,n,a){function o(e,t,n,a){return{number:e,text:t,active:n,disabled:a}}var i=angular.isDefined(a.boundaryLinks)?t.$eval(a.boundaryLinks):e.boundaryLinks,r=angular.isDefined(a.directionLinks)?t.$eval(a.directionLinks):e.directionLinks,l=angular.isDefined(a.firstText)?t.$parent.$eval(a.firstText):e.firstText,s=angular.isDefined(a.previousText)?t.$parent.$eval(a.previousText):e.previousText,u=angular.isDefined(a.nextText)?t.$parent.$eval(a.nextText):e.nextText,c=angular.isDefined(a.lastText)?t.$parent.$eval(a.lastText):e.lastText,p=angular.isDefined(a.rotate)?t.$eval(a.rotate):e.rotate;t.$watch("numPages + currentPage + maxSize",function(){t.pages=[];var e=1,n=t.numPages,a=angular.isDefined(t.maxSize)&&t.maxSize<t.numPages;a&&(p?(e=Math.max(t.currentPage-Math.floor(t.maxSize/2),1),n=e+t.maxSize-1,n>t.numPages&&(n=t.numPages,e=n-t.maxSize+1)):(e=(Math.ceil(t.currentPage/t.maxSize)-1)*t.maxSize+1,n=Math.min(e+t.maxSize-1,t.numPages)));for(var d=e;n>=d;d++){var f=o(d,d,t.isActive(d),!1);t.pages.push(f)}if(a&&!p){if(e>1){var m=o(e-1,"...",!1,!1);t.pages.unshift(m)}if(t.numPages>n){var g=o(n+1,"...",!1,!1);t.pages.push(g)}}if(r){var h=o(t.currentPage-1,s,!1,t.noPrevious());t.pages.unshift(h);var v=o(t.currentPage+1,u,!1,t.noNext());t.pages.push(v)}if(i){var $=o(1,l,!1,t.noPrevious());t.pages.unshift($);var b=o(t.numPages,c,!1,t.noNext());t.pages.push(b)}t.currentPage>t.numPages&&t.selectPage(t.numPages)})}}}]).constant("pagerConfig",{previousText:"Ç Previous",nextText:"Next È",align:!0}).directive("pager",["pagerConfig",function(e){return{restrict:"EA",scope:{numPages:"=",currentPage:"=",onSelectPage:"&"},controller:"PaginationController",templateUrl:"template/pagination/pager.html",replace:!0,link:function(t,n,a){function o(e,t,n,a,o){return{number:e,text:t,disabled:n,previous:l&&a,next:l&&o}}var i=angular.isDefined(a.previousText)?t.$parent.$eval(a.previousText):e.previousText,r=angular.isDefined(a.nextText)?t.$parent.$eval(a.nextText):e.nextText,l=angular.isDefined(a.align)?t.$parent.$eval(a.align):e.align;t.$watch("numPages + currentPage",function(){t.pages=[];var e=o(t.currentPage-1,i,t.noPrevious(),!0,!1);t.pages.unshift(e);var n=o(t.currentPage+1,r,t.noNext(),!1,!0);t.pages.push(n),t.currentPage>t.numPages&&t.selectPage(t.numPages)})}}}]),angular.module("ui.bootstrap.position",[]).factory("$position",["$document","$window",function(e,t){function n(e,n){return e.currentStyle?e.currentStyle[n]:t.getComputedStyle?t.getComputedStyle(e)[n]:e.style[n]}function a(e){return"static"===(n(e,"position")||"static")}var o,i;e.bind("mousemove",function(e){o=e.pageX,i=e.pageY});var r=function(t){for(var n=e[0],o=t.offsetParent||n;o&&o!==n&&a(o);)o=o.offsetParent;return o||n};return{position:function(t){var n=this.offset(t),a={top:0,left:0},o=r(t[0]);return o!=e[0]&&(a=this.offset(angular.element(o)),a.top+=o.clientTop,a.left+=o.clientLeft),{width:t.prop("offsetWidth"),height:t.prop("offsetHeight"),top:n.top-a.top,left:n.left-a.left}},offset:function(n){var a=n[0].getBoundingClientRect();return{width:n.prop("offsetWidth"),height:n.prop("offsetHeight"),top:a.top+(t.pageYOffset||e[0].body.scrollTop),left:a.left+(t.pageXOffset||e[0].body.scrollLeft)}},mouse:function(){return{x:o,y:i}}}}]),angular.module("ui.bootstrap.tooltip",["ui.bootstrap.position"]).provider("$tooltip",function(){function e(e){var t=/[A-Z]/g,n="-";return e.replace(t,function(e,t){return(t?n:"")+e.toLowerCase()})}var t={placement:"top",animation:!0,popupDelay:0},n={mouseenter:"mouseleave",click:"click",focus:"blur"},a={};this.options=function(e){angular.extend(a,e)},this.setTriggers=function(e){angular.extend(n,e)},this.$get=["$window","$compile","$timeout","$parse","$document","$position","$interpolate",function(o,i,r,l,s,u,c){return function(o,p,d){function f(e){var t,a;return t=e||m.trigger||d,a=angular.isDefined(m.trigger)?n[m.trigger]||t:n[t]||t,{show:t,hide:a}}var m=angular.extend({},t,a),g=e(o),h=f(void 0),v=c.startSymbol(),$=c.endSymbol(),b="<"+g+"-popup "+'title="'+v+"tt_title"+$+'" '+'content="'+v+"tt_content"+$+'" '+'placement="'+v+"tt_placement"+$+'" '+'animation="tt_animation()" '+'is-open="tt_isOpen"'+">"+"</"+g+"-popup>";return{restrict:"EA",scope:!0,link:function(e,t,n){function a(){e.tt_isOpen?d():c()}function c(){e.tt_popupDelay?y=r(g,e.tt_popupDelay):e.$apply(g)}function d(){e.$apply(function(){v()})}function g(){var n,a,o,i;if(e.tt_content){switch($&&r.cancel($),k.css({top:0,left:0,display:"block"}),x?(w=w||s.find("body"),w.append(k)):t.after(k),n=m.appendToBody?u.offset(t):u.position(t),a=k.prop("offsetWidth"),o=k.prop("offsetHeight"),e.tt_placement){case"mouse":var l=u.mouse();i={top:l.y,left:l.x};break;case"right":i={top:n.top+n.height/2-o/2,left:n.left+n.width};break;case"bottom":i={top:n.top+n.height,left:n.left+n.width/2-a/2};break;case"left":i={top:n.top+n.height/2-o/2,left:n.left-a};break;default:i={top:n.top-o,left:n.left+n.width/2-a/2}}i.top+="px",i.left+="px",k.css(i),e.tt_isOpen=!0}}function v(){e.tt_isOpen=!1,r.cancel(y),angular.isDefined(e.tt_animation)&&e.tt_animation()?$=r(function(){k.remove()},500):k.remove()}var $,y,w,k=i(b)(e),x=angular.isDefined(m.appendToBody)?m.appendToBody:!1;e.tt_isOpen=!1,n.$observe(o,function(t){e.tt_content=t}),n.$observe(p+"Title",function(t){e.tt_title=t}),n.$observe(p+"Placement",function(t){e.tt_placement=angular.isDefined(t)?t:m.placement}),n.$observe(p+"Animation",function(t){e.tt_animation=angular.isDefined(t)?l(t):function(){return m.animation}}),n.$observe(p+"PopupDelay",function(t){var n=parseInt(t,10);e.tt_popupDelay=isNaN(n)?m.popupDelay:n}),n.$observe(p+"Trigger",function(e){t.unbind(h.show),t.unbind(h.hide),h=f(e),h.show===h.hide?t.bind(h.show,a):(t.bind(h.show,c),t.bind(h.hide,d))}),n.$observe(p+"AppendToBody",function(t){x=angular.isDefined(t)?l(t)(e):x}),x&&e.$on("$locationChangeSuccess",function(){e.tt_isOpen&&v()}),e.$on("$destroy",function(){e.tt_isOpen?v():k.remove()})}}}}]}).directive("tooltipPopup",function(){return{restrict:"E",replace:!0,scope:{content:"@",placement:"@",animation:"&",isOpen:"&"},templateUrl:"template/tooltip/tooltip-popup.html"}}).directive("tooltip",["$tooltip",function(e){return e("tooltip","tooltip","mouseenter")}]).directive("tooltipHtmlUnsafePopup",function(){return{restrict:"E",replace:!0,scope:{content:"@",placement:"@",animation:"&",isOpen:"&"},templateUrl:"template/tooltip/tooltip-html-unsafe-popup.html"}}).directive("tooltipHtmlUnsafe",["$tooltip",function(e){return e("tooltipHtmlUnsafe","tooltip","mouseenter")}]),angular.module("ui.bootstrap.popover",["ui.bootstrap.tooltip"]).directive("popoverPopup",function(){return{restrict:"EA",replace:!0,scope:{title:"@",content:"@",placement:"@",animation:"&",isOpen:"&"},templateUrl:"template/popover/popover.html"}}).directive("popover",["$compile","$timeout","$parse","$window","$tooltip",function(e,t,n,a,o){return o("popover","popover","click")}]),angular.module("ui.bootstrap.progressbar",["ui.bootstrap.transition"]).constant("progressConfig",{animate:!0,autoType:!1,stackedTypes:["success","info","warning","danger"]}).controller("ProgressBarController",["$scope","$attrs","progressConfig",function(e,t,n){function a(e){return r[e]}var o=angular.isDefined(t.animate)?e.$eval(t.animate):n.animate,i=angular.isDefined(t.autoType)?e.$eval(t.autoType):n.autoType,r=angular.isDefined(t.stackedTypes)?e.$eval("["+t.stackedTypes+"]"):n.stackedTypes;this.makeBar=function(e,t,n){var r=angular.isObject(e)?e.value:e||0,l=angular.isObject(t)?t.value:t||0,s=angular.isObject(e)&&angular.isDefined(e.type)?e.type:i?a(n||0):null;return{from:l,to:r,type:s,animate:o}},this.addBar=function(t){e.bars.push(t),e.totalPercent+=t.to},this.clearBars=function(){e.bars=[],e.totalPercent=0},this.clearBars()}]).directive("progress",function(){return{restrict:"EA",replace:!0,controller:"ProgressBarController",scope:{value:"=percent",onFull:"&",onEmpty:"&"},templateUrl:"template/progressbar/progress.html",link:function(e,t,n,a){e.$watch("value",function(e,t){if(a.clearBars(),angular.isArray(e))for(var n=0,o=e.length;o>n;n++)a.addBar(a.makeBar(e[n],t[n],n));else a.addBar(a.makeBar(e,t))},!0),e.$watch("totalPercent",function(t){t>=100?e.onFull():0>=t&&e.onEmpty()},!0)}}}).directive("progressbar",["$transition",function(e){return{restrict:"EA",replace:!0,scope:{width:"=",old:"=",type:"=",animate:"="},templateUrl:"template/progressbar/bar.html",link:function(t,n){t.$watch("width",function(a){t.animate?(n.css("width",t.old+"%"),e(n,{width:a+"%"})):n.css("width",a+"%")})}}}]),angular.module("ui.bootstrap.rating",[]).constant("ratingConfig",{max:5}).directive("rating",["ratingConfig","$parse",function(e,t){return{restrict:"EA",scope:{value:"="},templateUrl:"template/rating/rating.html",replace:!0,link:function(n,a,o){var i=angular.isDefined(o.max)?n.$eval(o.max):e.max;n.range=[];for(var r=1;i>=r;r++)n.range.push(r);n.rate=function(e){n.readonly||(n.value=e)},n.enter=function(e){n.readonly||(n.val=e)},n.reset=function(){n.val=angular.copy(n.value)},n.reset(),n.$watch("value",function(e){n.val=e}),n.readonly=!1,o.readonly&&n.$parent.$watch(t(o.readonly),function(e){n.readonly=!!e})}}}]),angular.module("ui.bootstrap.tabs",[]).directive("tabs",function(){return function(){throw Error("The `tabs` directive is deprecated, please migrate to `tabset`. Instructions can be found at http://github.com/angular-ui/bootstrap/tree/master/CHANGELOG.md")}}).controller("TabsetController",["$scope","$element",function(e){var t=this,n=t.tabs=e.tabs=[];t.select=function(e){angular.forEach(n,function(e){e.active=!1}),e.active=!0},t.addTab=function(e){n.push(e),1==n.length&&t.select(e)},t.removeTab=function(e){var a=n.indexOf(e);if(e.active&&n.length>1){var o=a==n.length-1?a-1:a+1;t.select(n[o])}n.splice(a,1)}}]).directive("tabset",function(){return{restrict:"EA",transclude:!0,scope:{},controller:"TabsetController",templateUrl:"template/tabs/tabset.html",link:function(e,t,n){e.vertical=angular.isDefined(n.vertical)?e.$eval(n.vertical):!1,e.type=angular.isDefined(n.type)?e.$parent.$eval(n.type):"tabs"}}}).directive("tab",["$parse","$http","$templateCache","$compile",function(e){return{require:"^tabset",restrict:"EA",replace:!0,templateUrl:"template/tabs/tab.html",transclude:!0,scope:{heading:"@",onSelect:"&select"},controller:function(){},compile:function(t,n,a){return function(t,n,o,i){var r,l;t.active=!1,o.active?(r=e(o.active),l=r.assign,t.$parent.$watch(r,function(e){e&&t.disabled?l(t.$parent,!1):t.active=!!e})):l=r=angular.noop,t.$watch("active",function(e){l(t.$parent,e),e&&(i.select(t),t.onSelect())}),t.disabled=!1,o.disabled&&t.$parent.$watch(e(o.disabled),function(e){t.disabled=!!e}),t.select=function(){t.disabled||(t.active=!0)},i.addTab(t),t.$on("$destroy",function(){i.removeTab(t)}),t.active&&l(t.$parent,!0),a(t.$parent,function(e){var n,a=[];angular.forEach(e,function(e){e.tagName&&(e.hasAttribute("tab-heading")||e.hasAttribute("data-tab-heading")||"tab-heading"==e.tagName.toLowerCase()||"data-tab-heading"==e.tagName.toLowerCase())?n=e:a.push(e)}),n&&(t.headingElement=angular.element(n)),t.contentElement=angular.element(a)})}}}}]).directive("tabHeadingTransclude",[function(){return{restrict:"A",require:"^tab",link:function(e,t){e.$watch("headingElement",function(e){e&&(t.html(""),t.append(e))})}}}]).directive("tabContentTransclude",["$parse",function(e){return{restrict:"A",require:"^tabset",link:function(t,n,a){t.$watch(e(a.tabContentTransclude),function(e){n.html(""),e&&n.append(e.contentElement)})}}}]),angular.module("ui.bootstrap.timepicker",[]).filter("pad",function(){return function(e){return angular.isDefined(e)&&2>(""+e).length&&(e="0"+e),e}}).constant("timepickerConfig",{hourStep:1,minuteStep:1,showMeridian:!0,meridians:["AM","PM"],readonlyInput:!1,mousewheel:!0}).directive("timepicker",["padFilter","$parse","timepickerConfig",function(e,t,n){return{restrict:"EA",require:"ngModel",replace:!0,templateUrl:"template/timepicker/timepicker.html",scope:{model:"=ngModel"},link:function(a,o,i){function r(){var e=parseInt(a.hours,10),t=a.showMeridian?e>0&&13>e:e>=0&&24>e;return t?(a.showMeridian&&(12===e&&(e=0),a.meridian===c[1]&&(e+=12)),e):void 0}function l(){var t=u.getHours();a.showMeridian&&(t=0===t||12===t?12:t%12),a.hours="h"===$?t:e(t),a.validHours=!0;var n=u.getMinutes();a.minutes="m"===$?n:e(n),a.validMinutes=!0,a.meridian=a.showMeridian?12>u.getHours()?c[0]:c[1]:"",$=!1}function s(e){var t=new Date(u.getTime()+6e4*e);t.getDate()!==u.getDate()&&t.setDate(t.getDate()-1),u.setTime(t.getTime()),a.model=new Date(u)}var u=new Date,c=n.meridians,p=n.hourStep;i.hourStep&&a.$parent.$watch(t(i.hourStep),function(e){p=parseInt(e,10)});var d=n.minuteStep;i.minuteStep&&a.$parent.$watch(t(i.minuteStep),function(e){d=parseInt(e,10)}),a.showMeridian=n.showMeridian,i.showMeridian&&a.$parent.$watch(t(i.showMeridian),function(e){if(a.showMeridian=!!e,a.model)l();else{var t=new Date(u),n=r();angular.isDefined(n)&&t.setHours(n),a.model=new Date(t)}});var f=o.find("input"),m=f.eq(0),g=f.eq(1),h=angular.isDefined(i.mousewheel)?a.$eval(i.mousewheel):n.mousewheel;if(h){var v=function(e){return e.originalEvent&&(e=e.originalEvent),e.detail||e.wheelDelta>0};m.bind("mousewheel",function(e){a.$apply(v(e)?a.incrementHours():a.decrementHours()),e.preventDefault()}),g.bind("mousewheel",function(e){a.$apply(v(e)?a.incrementMinutes():a.decrementMinutes()),e.preventDefault()})}var $=!1;a.readonlyInput=angular.isDefined(i.readonlyInput)?a.$eval(i.readonlyInput):n.readonlyInput,a.readonlyInput?(a.updateHours=angular.noop,a.updateMinutes=angular.noop):(a.updateHours=function(){var e=r();angular.isDefined(e)?($="h",null===a.model&&(a.model=new Date(u)),a.model.setHours(e)):(a.model=null,a.validHours=!1)},m.bind("blur",function(){a.validHours&&10>a.hours&&a.$apply(function(){a.hours=e(a.hours)})}),a.updateMinutes=function(){var e=parseInt(a.minutes,10);e>=0&&60>e?($="m",null===a.model&&(a.model=new Date(u)),a.model.setMinutes(e)):(a.model=null,a.validMinutes=!1)},g.bind("blur",function(){a.validMinutes&&10>a.minutes&&a.$apply(function(){a.minutes=e(a.minutes)})})),a.$watch(function(){return+a.model},function(e){!isNaN(e)&&e>0&&(u=new Date(e),l())}),a.incrementHours=function(){s(60*p)},a.decrementHours=function(){s(60*-p)},a.incrementMinutes=function(){s(d)},a.decrementMinutes=function(){s(-d)},a.toggleMeridian=function(){s(720*(12>u.getHours()?1:-1))}}}}]),angular.module("ui.bootstrap.typeahead",["ui.bootstrap.position"]).factory("typeaheadParser",["$parse",function(e){var t=/^\s*(.*?)(?:\s+as\s+(.*?))?\s+for\s+(?:([\$\w][\$\w\d]*))\s+in\s+(.*)$/;
return{parse:function(n){var a=n.match(t);if(!a)throw Error("Expected typeahead specification in form of '_modelValue_ (as _label_)? for _item_ in _collection_' but got '"+n+"'.");return{itemName:a[3],source:e(a[4]),viewMapper:e(a[2]||a[1]),modelMapper:e(a[1])}}}}]).directive("typeahead",["$compile","$parse","$q","$timeout","$document","$position","typeaheadParser",function(e,t,n,a,o,i,r){var l=[9,13,27,38,40];return{require:"ngModel",link:function(s,u,c,p){var d,f=s.$eval(c.typeaheadMinLength)||1,m=s.$eval(c.typeaheadWaitMs)||0,g=r.parse(c.typeahead),h=s.$eval(c.typeaheadEditable)!==!1,v=t(c.typeaheadLoading).assign||angular.noop,$=t(c.typeaheadOnSelect),b=angular.element("<typeahead-popup></typeahead-popup>");b.attr({matches:"matches",active:"activeIdx",select:"select(activeIdx)",query:"query",position:"position"});var y=s.$new();s.$on("$destroy",function(){y.$destroy()});var w=function(){y.matches=[],y.activeIdx=-1},k=function(e){var t={$viewValue:e};v(s,!0),n.when(g.source(y,t)).then(function(n){if(e===p.$viewValue){if(n.length>0){y.activeIdx=0,y.matches.length=0;for(var a=0;n.length>a;a++)t[g.itemName]=n[a],y.matches.push({label:g.viewMapper(y,t),model:n[a]});y.query=e,y.position=i.position(u),y.position.top=y.position.top+u.prop("offsetHeight")}else w();v(s,!1)}},function(){w(),v(s,!1)})};w(),y.query=void 0,p.$parsers.push(function(e){var t;return w(),d?e:(e&&e.length>=f&&(m>0?(t&&a.cancel(t),t=a(function(){k(e)},m)):k(e)),h?e:void 0)}),p.$render=function(){var e={};e[g.itemName]=d||p.$viewValue,u.val(g.viewMapper(y,e)||p.$viewValue),d=void 0},y.select=function(e){var t,n,a={};a[g.itemName]=n=d=y.matches[e].model,t=g.modelMapper(y,a),p.$setViewValue(t),p.$render(),$(y,{$item:n,$model:t,$label:g.viewMapper(y,a)}),u[0].focus()},u.bind("keydown",function(e){0!==y.matches.length&&-1!==l.indexOf(e.which)&&(e.preventDefault(),40===e.which?(y.activeIdx=(y.activeIdx+1)%y.matches.length,y.$digest()):38===e.which?(y.activeIdx=(y.activeIdx?y.activeIdx:y.matches.length)-1,y.$digest()):13===e.which||9===e.which?y.$apply(function(){y.select(y.activeIdx)}):27===e.which&&(e.stopPropagation(),w(),y.$digest()))}),o.bind("click",function(){w(),y.$digest()}),u.after(e(b)(y))}}}]).directive("typeaheadPopup",function(){return{restrict:"E",scope:{matches:"=",query:"=",active:"=",position:"=",select:"&"},replace:!0,templateUrl:"template/typeahead/typeahead.html",link:function(e){e.isOpen=function(){return e.matches.length>0},e.isActive=function(t){return e.active==t},e.selectActive=function(t){e.active=t},e.selectMatch=function(t){e.select({activeIdx:t})}}}}).filter("typeaheadHighlight",function(){function e(e){return e.replace(/([.?*+^$[\]\\(){}|-])/g,"\\$1")}return function(t,n){return n?t.replace(RegExp(e(n),"gi"),"<strong>$&</strong>"):n}});
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
    
}));;// moment.js
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
