/* global console,angular,require */
(function () {
    'use strict';
    angular.module(
        'wdt.controllers.reverse-delay', [])
        .controller('ReverseDelay', ['$scope', function ($scope) {

            $scope.mode = "Delay";

            var frames = [];
            var fps = 25;
            var maxFrames = 100;
            var playPosition = 0;
            var recordPosition = 0;
            var playSpeed = 1;

            $scope.duration = maxFrames / fps;

            $scope.changeBuffer = function (by) {
                var d = maxFrames / fps;
                d += by;
                if (d < 1) {
                    d = 1;
                }
                if (d > 10) {
                    d = 10;
                }
                maxFrames = d * fps;
                frames = [];
                switch ($scope.mode) {
                    case "Delay":
                        playSpeed = 1;
                        recordPosition = 0;
                        playPosition = 1;
                        break;
                    case "Reverse":
                        playSpeed = -1;
                        recordPosition = 0;
                        playPosition = maxFrames - 1;
                        break;
                }
                $scope.duration = d;
            };
            $scope.switchMode = function () {
                if ($scope.mode === "Delay") {
                    $scope.mode = "Reverse";
                    playSpeed = -1;
                    recordPosition = 0;
                    playPosition = maxFrames - 1;
                } else {
                    $scope.mode = "Delay";
                    playSpeed = 1;
                    recordPosition = 0;
                    playPosition = 1;
                }
            };

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
            };
            window.onresize();

            document.onkeydown = function (e) {
                switch (e.keyCode) {
                    case 38: // up
                        $scope.changeBuffer(1);
                        break;
                    case 40: // down
                        $scope.changeBuffer(-1);
                        break;
                    case 39: // right
                        $scope.switchMode();
                        break;
                    case 37: // left;
                        $scope.switchMode();
                        break;
                    case 81: // Q
                        pipeline.stop();
                        window.location = "index.html";
                        break;
                    default:
                        console.log("unhandled key code " + e.keyCode);
                }
                $scope.$apply();
            };

            function triangle(context) {
                context.beginPath();
                context.moveTo(0, 0);
                context.lineTo(3, 7);
                context.lineTo(-3, 7);
                context.closePath();
                context.fill();
            }

            appsink.pull(function (frame) {
                var image = context.createImageData(width, height);
                image.data.set(frame);

                frames[ recordPosition ] = image;
                recordPosition = (recordPosition + 1) % maxFrames;

                playPosition = (playPosition + playSpeed) % maxFrames;
                while (playPosition < 0) {
                    playPosition = maxFrames - 1;
                }

                $scope.frames = frames.length;
                $scope.playPosition = playPosition;
                $scope.recordPosition = recordPosition;

                if (frames.length > playPosition) {
                    context.putImageData(frames[playPosition], 0, 0);
                } else {
                    context.clearRect(0, 0, width, height);
                }

                var x = 150;
                var y = 10;
                var l = 150;
                context.strokeStyle = "#fff";
                context.lineWidth = 1;
                context.beginPath();
                context.moveTo(x, y);
                context.lineTo(x + l, y);
                context.stroke();

                context.save();
                context.translate(x + (l * recordPosition / maxFrames), y);
                context.fillStyle = "#f00";
                triangle(context);
                context.restore();

                context.save();
                context.translate(x + (l * playPosition / maxFrames), y);
                context.fillStyle = "#0f0";
                triangle(context);
                context.restore();


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
