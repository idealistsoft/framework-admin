<?php

/**
 * @package infuse\framework
 * @author Jared King <j@jaredtking.com>
 * @link http://jaredtking.com
 * @version 0.1.16
 * @copyright 2013 Jared King
 * @license MIT
 */

namespace app\admin;

use infuse\Inflector;
use infuse\Util;

use App;
use app\admin\libs\Admin;

class Controller
{
	public static $properties = [
		'routes' => [
			'get /admin' => 'index',
			'get /admin/:module' => 'moduleIndex',
			'get /admin/:module/:model' => 'model',
			'get /admin/:module/:model/:id' => 'model', // not implemented
		],
	];

	private $app;

	function __construct( App $app )
	{
		$this->app = $app;
	}

	function index( $req, $res )
	{
		$res->redirect( '/admin/' . $this->app[ 'config' ]->get( 'modules.default-admin' ) );
	}

	function moduleIndex( $req, $res )
	{
		$controller = $this->getController( $req, $res );

		if( !is_object( $controller ) )
			return $controller;

		$properties = $controller::$properties;
		$properties[ 'name' ] = $this->name( $controller );

		$models = $this->models( $controller );

		// redirect if a model was not specified
		$defaultModel = false;
		
		if( isset( $properties[ 'defaultModel' ] ) )
			$defaultModel = $properties[ 'defaultModel' ];
		
		if( count( $models ) > 0 )
			$defaultModel = reset( $models );
		
		if( $defaultModel )
			$res->redirect( '/admin/' . $properties[ 'name' ] . '/' . $defaultModel[ 'model' ] );
		else
			return SKIP_ROUTE;
	}

	function model( $req, $res )
	{
		// find the controller we need
		$controller = $this->getController( $req, $res );

		if( !is_object( $controller ) )
			return $controller;

		// fetch some basic parameters we want to pass to the view
		$params = $this->getViewParams( $req->params( 'module' ), $controller );

		// which model are we talking about?
		$model = $this->fetchModelInfo( $req->params( 'module' ), $req->params( 'model' ) );

		if( !$model )
			return $res->setCode( 404 );
		
		$modelClassName = $model[ 'class_name' ];
		$modelObj = new $modelClassName();

		$user = $this->app[ 'user' ];
		
		$modelInfo = array_replace( $model, [
			'permissions' => [
				'create' => $modelObj->can( 'create', $user ),
				'edit' => $modelObj->can( 'edit', $user ),
				'delete' => $modelObj->can( 'delete', $user ) ],
			'idProperty' => $modelClassName::idProperty(),
			'properties' => [],
			'visibleProperties' => []
		] );
		$params[ 'modelInfo' ] = $modelInfo;		
	
		$default = [
			'admin_type' => 'text',
			'admin_hidden_property' => false,
			'admin_truncate' => true,
			'admin_nowrap' => true,
			'mutable' => true
		];		
	
		foreach( $modelClassName::$properties as $name => $property )
		{
			// id properties are immutable by default
			if( !isset( $property[ 'mutable' ] ) && $modelClassName::isIdProperty( $name ) )
				$property[ 'mutable' ] = false;

			$modelInfo[ 'properties' ][] = array_merge(
				$default,
				[
					'name' => $name,
					'title' => Inflector::titleize( $name ) ],
				$property );

			if( !Util::array_value( $property, 'admin_hidden_property' ) )
				$modelInfo[ 'visibleProperties' ][] = array_merge(
					$default,
					[
						'name' => $name,
						'title' => Inflector::titleize( $name ) ],
					$property );
		}
		
		$params[ 'modelJSON' ] = json_encode( $modelInfo );
		$params[ 'ngApp' ] = 'models';
		
		$res->render( 'model', $params );
	}

	private function getController( $req, $res )
	{
		// instantiate the controller
		$controller = '\\app\\' . $req->params( 'module' ) . '\\Controller';
		$controllerObj = new $controller( $this->app );

		$properties = $controller::$properties;
				
		// check if automatic admin generation enabled
		if( !Util::array_value( $properties, 'scaffoldAdmin' ) )
			return SKIP_ROUTE;

		// html only
		if( !$req->isHtml() )
			return $res->setCode( 406 );

		// must have permission to view admin section
		if( !$this->app[ 'user' ]->isAdmin() )
			return $res->setCode( 401 );

		return $controllerObj;		
	}

	private function getViewParams( $module, $controller )
	{
		$properties = $controller::$properties;

		$models = $this->models( $controller );
		
		$params = [
			'moduleName' => $this->name( $controller ),
			'models' => $models,
			'modulesWithAdmin' => Admin::adminModules(),
			'selectedModule' => $module,
			'title' => Inflector::titleize( $module ),
		];

		return $params;		
	}

	/** 
	 * Computes the name for a given controller
	 *
	 * @param object $controller
	 *
	 * @return string
	 */
	private function name( $controller )
	{
		// compute module name
		$parts = explode( '\\', get_class( $controller ) );
		return $parts[ 1 ];
	}

	/** 
	 * Takes the pluralized model name from the route and gets info about the model
	 *
	 * @param string $modelRouteName the name that comes from the route (i.e. the route "/users" would supply "users")
	 *
	 * @return array|null model info
	 */
	private function fetchModelInfo( $module, $model = false )
	{
		// instantiate the controller
		$controller = '\\app\\' . $module . '\\Controller';
		$controllerObj = new $controller( $this->app );

		// get info about the controller
		$properties = $controller::$properties;

		// fetch all available models from the controller
		$availableModels = $this->models( $controllerObj );
		
		// look for a default model
		if( !$model )
		{
			// when there is only one choice, use it
			if( count( $availableModels ) == 1 )
				return reset( $availableModels );
			else
				$model = Util::array_value( $properties, 'defaultModel' );
		}
		
		// convert the route name to the pluralized name
		$modelName = Inflector::singularize( Inflector::camelize( $model ) );
		
		// attempt to fetch the model info
		return Util::array_value( $availableModels, $modelName );
	}

	/**
	 * Fetches the models for a given controller
	 *
	 * @param object $controller
	 *
	 * @return array
	 */
	private function models( $controller )
	{
		$properties = $controller::$properties;
		$module = $this->name( $controller );
		
		$models = [];
		
		foreach( (array)Util::array_value( $properties, 'models' ) as $model )
		{
			$modelClassName = '\\app\\' . $module . '\\models\\' . $model;
			
			$info = $modelClassName::metadata();
			
			$models[ $model ] = array_replace( $info, [
				'route_base' => '/' . $module . '/' . $info[ 'plural_key' ] ] );
		}

		return $models;
	}
}