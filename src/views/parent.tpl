<!DOCTYPE HTML>
<html {if isset($ngApp)}ng-app="{$ngApp}"{/if}>
<head>
	<title>{$title} :: {$smarty.const.SITE_TITLE} Administration</title>
	
	<meta name="robots" content="noindex, nofollow" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0">

	<link href="//netdna.bootstrapcdn.com/bootstrap/3.2.0/css/bootstrap.min.css" rel="stylesheet">
	<link href="//code.jquery.com/ui/1.10.3/themes/smoothness/jquery-ui.css" rel="stylesheet" type="text/css" />
	<link rel="stylesheet" href="/css/admin.css" type="text/css" />
	
	<script type="text/javascript" src="//ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js"></script>
	<script type="text/javascript" src="//ajax.googleapis.com/ajax/libs/jqueryui/1.9.2/jquery-ui.min.js"></script>
	<script type="text/javascript" src="//ajax.googleapis.com/ajax/libs/angularjs/1.2.22/angular.min.js"></script>
	<script type="text/javascript" src="//ajax.googleapis.com/ajax/libs/angularjs/1.2.22/angular-resource.min.js"></script>
	<script type="text/javascript" src="//ajax.googleapis.com/ajax/libs/angularjs/1.2.22/angular-route.min.js"></script>
	<script type="text/javascript" src="//ajax.googleapis.com/ajax/libs/angularjs/1.2.22/angular-sanitize.min.js"></script>
	<script src="//netdna.bootstrapcdn.com/bootstrap/3.2.0/js/bootstrap.min.js"></script>
	<script type="text/javascript" src="/js/admin.js"></script>

	{block name=header}{/block}
</head>
<body>
	<nav class="navbar navbar-default navbar-fixed-top" role="navigation">
		<div class="navbar-header">
			<button type="button" class="navbar-toggle" data-toggle="collapse" data-target="#infuse-navbar-collapse-1">
				<span class="sr-only">Toggle navigation</span>
				<span class="icon-bar"></span>
				<span class="icon-bar"></span>
				<span class="icon-bar"></span>
			</button>
			<a class="navbar-brand" href="/">
				{$smarty.const.SITE_TITLE}
			</a>
		</div>

		<div class="collapse navbar-collapse" id="infuse-navbar-collapse-1">
			<ul class="nav navbar-nav navbar-right">
				<li>
					<a href="/">
						<i class="glyphicon glyphicon-home"></i>
					</a>
				</li>
				<li class="dropdown">
					<a class="dropdown-toggle" data-toggle="dropdown" href="#">
						<img src="{$app.user->profilePicture()}" alt="{$app.user->name()}" class="img-circle" height="20" width="20" />
						{$app.user->name()}
						<b class="caret"></b>
					</a>
					<ul class="dropdown-menu">
						<li>
							<a href="/users/account">
								<i class="glyphicon glyphicon-user"></i> Account
							</a>
						</li>
						<li>
							<a href="/users/logout">
								<i class="glyphicon glyphicon-log-out"></i> Log Out
							</a>
						</li>
					</ul>
				</li>
			</ul>
		</div>
	</nav>

	<div class="subnavbar clearfix">
		<ul>
			{foreach from=$modulesWithAdmin item=module}
				<li class="{if $module.name == $selectedModule}active{/if}"><a href="/admin/{$module.name}">{$module.title}</a></li>
			{/foreach}
		</ul>
	</div>

	<div id="main">
		{block name=main}{/block}
	</div>
	
	<footer>
		<p>Powered by <a href="https://github.com/idealistsoft/framework" target="_blank">Idealist Framework</a></p>
	</footer>
</body>
</html>