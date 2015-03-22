(function () {
    'use strict';
    angular.module(
        'wdt.controllers.appear-disappear', [])
        .controller('AppearDisappear', ['$scope', function ($scope) {

            var cv = require('opencv');

            var canvas = document.getElementById("canvas");
            var context = canvas.getContext("2d");
            var videoContainer = document.getElementById("video-container");
            var canvasContainer = document.getElementById("canvas-container");
            var OSD = document.getElementById("OSD");

            var width = 320;
            var height = 240;

            var cam = new cv.VideoCapture(0);
            var average = new cv.Average();

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

                OSD.style.left = "" + ((ww - (width * scale)) / 2) + "px";
                OSD.style.top = "" + ((wh - (height * scale)) / 2) + "px";
            };

            document.onkeydown = function (e) {
                switch (e.keyCode) {
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
                    average.process(mat, 0.01);
                    //var res = wdt2.process(mat, 8, 8, 0.1, 0.0001);
                    //console.log(res);
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
                    if (count < 100) window.setTimeout(readFrame, 10);
                });
            };

            window.onresize();
            readFrame();

        }]);
})();
