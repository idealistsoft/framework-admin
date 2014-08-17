{extends file="$adminViewsDir/parent.tpl"}
{block name=header}
<script type="text/javascript">
	{if isset($modelJSON)}var modelInfo = {$modelJSON};{/if}
	var module = '{$moduleName}';
</script>
{/block}
{block name=main}

	<ul class="nav nav-tabs">
		{foreach from=$models item=model}
			<li class="{if $model.model == $modelInfo.model}active{/if}">
				<a href="/admin/{$moduleName}/{$model.model}#/">{$model.proper_name_plural}</a>
			</li>
		{/foreach}
	</ul>
	<br/>

	{block name=content}{/block}
	
	<div ng-view></div>
{/block}