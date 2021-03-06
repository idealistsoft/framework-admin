<?php

/**
 * @author Jared King <j@jaredtking.com>
 *
 * @link http://jaredtking.com
 *
 * @version 1.0.0
 *
 * @copyright 2014 Jared King
 * @license MIT
 */
namespace app\admin;

use ICanBoogie\Inflector;
use Infuse\Utility as U;
use Infuse\View;

class Controller
{
    use \InjectApp;

    private $adminViewsDir;

    public function __construct()
    {
        $this->adminViewsDir = __DIR__.'/views/';
    }

    public function middleware($req, $res)
    {
        // add routes
        // NOTE we cannot use :module because it is a reserved param
        // and would mistakenly cause routes to be loaded for the module we are scaffolding,
        // so we use :mod instead
        $this->app->get('/admin', ['admin\\Controller', 'index'])
                  ->get('/admin/:mod', ['admin\\Controller', 'moduleIndex'])
                  ->get('/admin/:mod/:model', ['admin\\Controller', 'model'])
                  ->get('/admin/:mod/:model/:id', ['admin\\Controller', 'model']);

        if ($req->paths(0) == 'admin') {
            // inject variables useful for admin views
            $module = $req->paths(1);
            $adminViewParams = [
                'modulesWithAdmin' => $this->adminModules(),
                'selectedModule' => $module,
                'title' => Inflector::get()->titleize($module),
                'adminViewsDir' => $this->adminViewsDir, ];

            $this->app[ 'view_engine' ]->setGlobalParameters($adminViewParams);

            // set module param if module is not using scaffolding
            $controller = '\\app\\'.$module.'\\Controller';
            if (class_exists($controller) && property_exists($controller, 'hasAdminView')) {
                $req->setParams(['module' => $module]);
            }
        }
    }

    public function index($req, $res)
    {
        $res->redirect('/admin/'.$this->app[ 'config' ]->get('admin.index'));
    }

    public function moduleIndex($req, $res)
    {
        $controller = $this->getController($req, $res);

        if (!is_object($controller)) {
            return $controller;
        }

        $properties = $controller::$properties;
        $properties[ 'name' ] = $this->name($controller);

        $models = $this->models($controller);

        // redirect if a model was not specified
        $defaultModel = false;

        if (isset($properties[ 'defaultModel' ])) {
            $defaultModel = $properties[ 'defaultModel' ];
        }

        if (count($models) > 0) {
            $defaultModel = reset($models);
        }

        if ($defaultModel) {
            $res->redirect('/admin/'.$properties[ 'name' ].'/'.$defaultModel[ 'model' ]);
        } else {
            return SKIP_ROUTE;
        }
    }

    public function model($req, $res)
    {
        // find the controller we need
        $controller = $this->getController($req, $res);

        if (!is_object($controller)) {
            return $controller;
        }

        // fetch some basic parameters we want to pass to the view
        $params = [
            'moduleName' => $this->name($controller),
            'models' => $this->models($controller),
        ];

        // which model are we talking about?
        $model = $this->fetchModelInfo($req->params('mod'), $req->params('model'));

        if (!$model) {
            return $res->setCode(404);
        }

        $modelClassName = $model[ 'class_name' ];
        $modelObj = new $modelClassName();

        $user = $this->app[ 'user' ];

        $modelInfo = array_replace($model, [
            'permissions' => [
                'create' => $modelObj->can('create', $user),
                'edit' => $modelObj->can('edit', $user),
                'delete' => $modelObj->can('delete', $user), ],
            'idProperty' => $modelClassName::idProperty(),
            'properties' => [],
            'visibleProperties' => [],
        ]);
        $params[ 'modelInfo' ] = $modelInfo;

        $default = [
            'admin_type' => 'text',
            'admin_hidden_property' => false,
            'admin_truncate' => true,
            'admin_nowrap' => true,
            'mutable' => true,
        ];

        $inflector = Inflector::get();
        foreach ($modelClassName::properties() as $name => $property) {
            $modelInfo[ 'properties' ][] = array_merge(
                $default,
                [
                    'name' => $name,
                    'title' => $inflector->titleize($name), ],
                $property);

            if (!U::array_value($property, 'admin_hidden_property')) {
                $modelInfo[ 'visibleProperties' ][] = array_merge(
                    $default,
                    [
                        'name' => $name,
                        'title' => $inflector->titleize($name), ],
                    $property);
            }
        }

        $params[ 'modelJSON' ] = json_encode($modelInfo);
        $params[ 'ngApp' ] = 'models';

        return new View($this->adminViewsDir.'model', $params);
    }

    /////////////////////////
    // PRIVATE METHODS
    /////////////////////////

    /**
     * Returns a list of modules with admin sections.
     *
     * @param array $modules input modules
     *
     * @return array admin-enabled modules
     */
    private function adminModules()
    {
        $return = [];

        foreach ($this->app[ 'config' ]->get('modules.all') as $module) {
            $controller = '\\app\\'.$module.'\\Controller';

            if (!class_exists($controller)) {
                continue;
            }

            if (property_exists($controller, 'scaffoldAdmin') ||
                property_exists($controller, 'hasAdminView')) {
                $moduleInfo = [
                    'name' => $module,
                    'title' => Inflector::get()->titleize($module), ];

                if (property_exists($controller, 'properties')) {
                    $moduleInfo = array_replace($moduleInfo, $controller::$properties);
                }

                $return[] = $moduleInfo;
            }
        }

        return $return;
    }

    private function getController($req, $res)
    {
        $controller = '\\app\\'.$req->params('mod').'\\Controller';

        if (!class_exists($controller)) {
            return SKIP_ROUTE;
        }

        $controllerObj = new $controller();
        if (method_exists($controllerObj, 'injectApp')) {
            $controllerObj->injectApp($this->app);
        }

        $properties = $controller::$properties;

        // check if automatic admin generation enabled
        if (!property_exists($controller, 'scaffoldAdmin')) {
            return SKIP_ROUTE;
        }

        // must have permission to view admin section
        if (!$this->app[ 'user' ]->isAdmin()) {
            $res->redirect('/login?redir='.urlencode($req->basePath().$req->path()));

            return false;
        }

        return $controllerObj;
    }

    /**
     * Computes the name for a given controller.
     *
     * @param object $controller
     *
     * @return string
     */
    private function name($controller)
    {
        // compute module name
        $parts = explode('\\', get_class($controller));

        return $parts[ 1 ];
    }

    /**
     * Takes the pluralized model name from the route and gets info about the model.
     *
     * @param string $modelRouteName the name that comes from the route (i.e. the route "/users" would supply "users")
     *
     * @return array|null model info
     */
    private function fetchModelInfo($module, $model = false)
    {
        // instantiate the controller
        $controller = '\\app\\'.$module.'\\Controller';
        $controllerObj = new $controller($this->app);

        // get info about the controller
        $properties = $controller::$properties;

        // fetch all available models from the controller
        $availableModels = $this->models($controllerObj);

        // look for a default model
        if (!$model) {
            // when there is only one choice, use it
            if (count($availableModels) == 1) {
                return reset($availableModels);
            } else {
                $model = U::array_value($properties, 'defaultModel');
            }
        }

        // convert the route name to the pluralized name
        $inflector = Inflector::get();
        $modelName = $inflector->singularize($inflector->camelize($model));

        // attempt to fetch the model info
        return U::array_value($availableModels, $modelName);
    }

    /**
     * Fetches the models for a given controller.
     *
     * @param object $controller
     *
     * @return array
     */
    private function models($controller)
    {
        $properties = $controller::$properties;
        $module = $this->name($controller);

        $models = [];

        foreach ((array) U::array_value($properties, 'models') as $model) {
            $modelClassName = '\\app\\'.$module.'\\models\\'.$model;

            $info = $modelClassName::metadata();

            $models[ $model ] = array_replace($info, [
                'route_base' => '/'.$module.'/'.$info[ 'plural_key' ], ]);
        }

        return $models;
    }
}
