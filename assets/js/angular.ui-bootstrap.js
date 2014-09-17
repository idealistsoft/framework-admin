
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