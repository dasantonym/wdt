(function () {
    'use strict';
    angular.module(
        'wdt.controllers.skel', [])
        .controller('Skel', ['$scope', function ($scope) {

            var canvas = document.getElementById("canvas");
            var context = canvas.getContext("2d");

            var gstreamer = require("gstreamer-superficial");

            var width = 320;
            var height = 240;

            var pipeline = new gstreamer.Pipeline("v4l2src ! videoconvert ! video/x-raw, format=RGBA, width=320, height=240 ! appsink name=sink");

            var appsink = pipeline.findChild("sink");

            var videoContainer = document.getElementById("video-container");
            var canvasContainer = document.getElementById("canvas-container");
            var OSD = document.getElementById("OSD");
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
            }
            window.onresize();

            document.onkeydown = function (e) {
                switch (e.keyCode) {
                    case 81: // Q
                        pipeline.stop();
                        window.location = "index.html";
                        break;
                    default:
                        console.log("unhandled key code " + e.keyCode);
                }
                $scope.$apply();
            }

            appsink.pull(function (frame) {
                var image = context.createImageData(width, height);
                image.data.set(frame);

                context.putImageData(image, 0, 0);


                $scope.$apply();

            }, function (caps) {
//				console.log("CAPS",caps);
            });

            $scope.$on('$routeChangeStart', function(next, current) {
                if (next !== current) {
                    pipeline.stop();
                }
            });

            pipeline.play();

        }]);
})();
