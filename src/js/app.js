/* global console,angular,require */
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
            $routeProvider.when('/capture-replay', {templateUrl: viewPath + 'capture-replay.html', controller: 'CaptureReplay'});
            $routeProvider.when('/reverse-delay', {templateUrl: viewPath + 'reverse-delay.html', controller: 'ReverseDelay'});
            $routeProvider.when('/space/:spaceModule', {templateUrl: viewPath + 'space.html', controller: 'Space'});

        }]).run(function () {
            var gui = require('nw.gui');
            var os = require('os');
            var win = gui.Window.get();
            var nativeMenuBar = new gui.Menu({type: 'menubar'});

            if (os.platform() === 'darwin') {
                nativeMenuBar.createMacBuiltin('WDT');
                win.menu = nativeMenuBar;
            }
        });
}());