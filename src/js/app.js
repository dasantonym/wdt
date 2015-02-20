(function () {
    'use strict';
    angular.module('app', [
        'ngRoute',
        'wdt.controllers.appear-disappear',
        'wdt.controllers.capture-replay',
        'wdt.controllers.main',
        'wdt.controllers.reverse-delay',
        'wdt.controllers.skel',
        'wdt.controllers.space'
    ])
        .config(['$routeProvider', '$logProvider', function ($routeProvider, $logProvider) {

            $logProvider.debugEnabled(true);

            var viewPath = 'views/';

            $routeProvider.when('/', {templateUrl: viewPath + 'main.html', controller: 'Main'});
            $routeProvider.when('/appear-disappear', {templateUrl: viewPath + 'appear-disappear.html', controller: 'AppearDisappear'});

        }]);
}());