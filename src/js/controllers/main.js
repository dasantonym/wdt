/* global console,angular,require */
(function () {
    'use strict';
    angular.module(
        'wdt.controllers.main', [])
        .controller('Main', ['$scope', function ($scope) {

            $scope.tools = [
                { name: "Matching Positions", href: "#/space/positions", img: "img/matching-positions.png" },
                { name: "Inertia", href: "#/space/inertia", img: "img/inertia.png" },
                { name: "Cage", href: "#/space/cage", img: "img/cage.png" },

                //{ name: "Reverse and Delay", href: "#/reverse-delay", img: "img/reverse-and-delay.png" },
                //{ name: "Capture and Replay", href: "#/capture-replay", img: "img/capture-and-replay.png" },
                { name: "Appear - Disappear", href: "#/appear-disappear", img: "img/appear-disappear.png" },
            ];

            $scope.toolRows = [];
            var row = [];
            for (var i in $scope.tools) {
                if ($scope.tools[i]) {
                    row.push($scope.tools[i]);
                    if (row.length === 3) {
                        $scope.toolRows.push(row);
                        row = [];
                    }
                }
            }
            $scope.toolRows.push(row);

            $scope.externalClick = function (url) {
                var gui = require('nw.gui');
                gui.Shell.openExternal(url);
            };

            document.onkeydown = function (e) {
                var nr = e.keyCode - 49;
                if (nr >= 0 && nr < $scope.tools.length) {
                    window.location = $scope.tools[nr].href;
                    return;
                }

                switch (e.keyCode) {
                    case 81: // Q
                        //global.window.nwDispatcher.requireNwGui().App.quit();
                        break;
                    default:
                        console.log("unhandled key code " + e.keyCode);
                }
            };

        }]);
})();
