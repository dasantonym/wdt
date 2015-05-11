/* global console,angular,require */
(function () {
    'use strict';
    angular.module(
        'wdt.controllers.appear-disappear', [])
        .controller('AppearDisappear', ['$scope', function ($scope) {

            $scope.weight = 0.01;

            var cv = require('wdt-native');

            var canvas = document.getElementById("canvas");
            var context = canvas.getContext("2d");
            var videoContainer = document.getElementById("video-container");
            var canvasContainer = document.getElementById("canvas-container");

            var width = 320;
            var height = 240;

            var camDevice = 0;
            var cam = new cv.VideoCapture(camDevice);
            var average = new cv.cvAverage();

            cam.setWidth(width);
            cam.setHeight(height);

            window.onresize = function (e) {
                var ww = window.innerWidth;
                var wh = window.innerHeight;

                var scale = Math.min(ww / width, wh / height);
                canvasContainer.style.webkitTransform = "scale(" + scale + "," + scale + ")";

                var ofsx = (ww - width) / 2;
                var ofsy = (wh - height) / 2;
                videoContainer.style.left = "" + (ofsx) + "px";
                videoContainer.style.top = "" + (ofsy) + "px";
            };

            $scope.OSDOpacity = 0;
            var fade;
            $scope.showOSD = function () {
                $scope.OSDOpacity = 1;
                if (!fade) {
                    fade = setInterval(function () {
                        $scope.OSDOpacity *= 0.9;
                        if ($scope.OSDOpacity < 0.01) {
                            $scope.OSDOpacity = 0;
                            clearInterval(fade);
                            fade = undefined;
                        }
                        $scope.$apply();
                    }, 66);
                }
            };

            document.onkeydown = function (e) {
                switch (e.keyCode) {
                    case 38: // up
                        $scope.weight = Math.min(1.0, $scope.weight + 0.005);
                        $scope.showOSD();
                        //threshold.set("threshold", $scope.threshold);
                        break;
                    case 40: // down
                        $scope.weight = Math.max(0.005, $scope.weight - 0.005);
                        $scope.showOSD();
                        //threshold.set("threshold", $scope.threshold);
                        break;
                    case 67: // c:
                        try {
                            camDevice += 1;
                            cam.close();
                            cam = new cv.VideoCapture(camDevice);
                        } catch (e) {
                            camDevice = 0;
                            cam = new cv.VideoCapture(camDevice);
                        }
                        cam.setWidth(width);
                        cam.setHeight(height);
                        break;
                    case 81: // Q
                        cam.close();
                        average = undefined;
                        cam = undefined;
                        window.location = "index.html";
                        break;
                    default:
                        console.log("unhandled key code " + e.keyCode);
                }
                $scope.$apply();
            };

            var count = 0;

            var readFrame = function () {
                cam.read(function(err, mat){
                    average.process(mat, $scope.weight);
                    var image = context.createImageData(mat.width(), mat.height());
                    var width = mat.width();
                    var height = mat.height();
                    for (var y = 0; y < height; y += 1) {
                        for (var x = 0; x < width; x += 1) {
                            var pixel = mat.pixel(y, x);
                            var pos = (width * y + x) * 4;
                            image.data[pos] = pixel[2];
                            image.data[pos + 1] = pixel[1];
                            image.data[pos + 2] = pixel[0];
                            image.data[pos + 3] = 255;
                        }
                    }
                    context.putImageData(image, 0, 0);
                    count+=1;
                    window.setTimeout(readFrame, 10);
                });
            };

            window.onresize();
            readFrame();

        }]);
})();
