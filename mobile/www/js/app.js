(function () {
    'use strict';

    angular.module('starter', [
        'ionic', 'bin.controllers', 'ngMessages', 'bin.services', 'angular-cache'
    ])
        .constant('appConfig', {apiUrl: ''})
        .run(function ($ionicPlatform) {
            $ionicPlatform.ready(function () {
                // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
                // for form inputs)
                if (window.cordova && window.cordova.plugins.Keyboard) {
                    cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
                }
                if (window.StatusBar) {
                    StatusBar.styleDefault();
                }
            });
        })
        .run(['$templateCache', '$http', function ($templateCache, $http) {
            $http.get('templates/form_errors.html')
                .then(function (response) {
                    $templateCache.put('errors_template', response.data);
                })
        }])
        .config(function (CacheFactoryProvider) {
            /* Items expire after 1 month */
            angular.extend(CacheFactoryProvider.defaults, {
                maxAge: 30 * 24 * 3600 * 1000,
                storageMode: 'localStorage'
            });
        })
        /* Register application routes */
        .config(['$stateProvider', '$urlRouterProvider',
            function ($stateProvider, $urlRouterProvider) {
            defineRoutes($stateProvider, $urlRouterProvider);
        }]);

    function defineRoutes($stateProvider, $urlRouterProvider) {
        $stateProvider
            .state('login', {
                url: '/login',
                templateUrl: 'templates/login.html',
                controller: 'LoginCtrl as loginCtrl'
            })
            .state('menu', {
                url: '/app',
                abstract: true,
                templateUrl: 'templates/menu.html'
            })
            .state('menu.report', {
                url: '^/report',
                parent: 'menu',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/make_report.html',
                        controller: 'MakeReportCtrl as reportCtrl'
                    }
                }
            })
            .state('menu.status', {
                url: '^/status',
                parent: 'menu',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/report_status.html',
                        controller: 'ReportStatusCtrl as statusCtrl'
                    }
                }
            });

        $urlRouterProvider.otherwise('/report');
    }

})();