angular.module('models').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('/templates/admin/deleteModalAsk.html',
    "<div class=modal-header>\n" +
    "    <h3 class=modal-title>Are you sure?</h3>\n" +
    "</div>\n" +
    "<div class=modal-body>\n" +
    "\t<p>Are you sure you want to delete this {{modelInfo.proper_name}}?</p>\n" +
    "</div>\n" +
    "<div class=modal-footer>\n" +
    "\t<button class=\"btn btn-default cancel\" ng-click=cancel()>No</button>\n" +
    "\t<button class=\"btn btn-danger\" ng-click=ok()>Yes</button>\n" +
    "</div>"
  );


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
    "\t\t\t\t\t\t\t<input name={{property.name}} class=\"form-control date\" ui-date=datepickerOptions ng-model=model[property.name]>\n" +
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
    "</div>"
  );

}]);
