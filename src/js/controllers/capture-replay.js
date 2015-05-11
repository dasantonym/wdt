/* global console,angular,require,appsink,pipeline */
(function () {
    'use strict';
    angular.module(
        'wdt.controllers.capture-replay', [])
        .controller('CaptureReplay', ['$scope', function ($scope) {

            var canvas = document.getElementById("canvas");
            var context = canvas.getContext("2d");

            //var gstreamer = require("gstreamer-superficial");

            var mode = "menu";
            var frames = [];
            var fps = 25;
            var maxFrames = fps * 4;

            var playPosition = 0;
            var playSpeed = 0;

            function triggerRecording() {
                mode = "countdown";
                var toGo = 4;
                var countDown;
                countDown = function () {
                    toGo--;
                    if (toGo <= 0) {
                        mode = "record";
                        frames = [];
                    } else {
                        $scope.toGo = toGo;
                        setTimeout(countDown, 1000);
                    }
                };
                countDown();
            }

            function triggerReplay() {
                mode = "replay";
                playPosition = 0;
                playSpeed = 1;
            }

            function triggerReverse() {
                mode = "reverse";
                playPosition = maxFrames - 1;
                playSpeed = -1;
            }

            function triggerSlowMotion() {
                mode = "slowmotion";
                playPosition = 0;
                playSpeed = 0.33;
            }

            var width = 320;
            var height = 240;

            var triggers = {
                record: { x: 0.025, y: 0.525, w: 0.1, h: 0.1 },
                replay: { x: 0.3, y: 0.525, w: 0.1, h: 0.1 },
                reverse: { x: 0.45, y: 0.525, w: 0.1, h: 0.1 },
                slowmotion: { x: 0.6, y: 0.525, w: 0.1, h: 0.1 }
            };

            var cv = require('wdt-native');

            var camDevice = 0;

            var cam = new cv.VideoCapture(camDevice);
            var motion = new cv.cvMotion();

            cam.setWidth(width);
            cam.setHeight(height);

            /*
            var def = "v4l2src ! tee name=t0 "
                + " t0. ! queue max-size-buffers=1 ! videoconvert ! motion weight=0.3";

            for (var name in triggers) {
                var t = triggers[name];
                def += " ! triggers"
                    + " x=" + t.x
                    + " y=" + t.y
                    + " w=" + t.w
                    + " h=" + t.h
                    + " name=" + name;
            }

            def += " ! fakesink "
                + " t0. ! queue max-size-buffers=1 ! videoconvert ! video/x-raw, format=RGBA, width=320, height=240 ! appsink name=sink";

            var pipeline = new gstreamer.Pipeline(def);
            var appsink = pipeline.findChild("sink");
            */

            for (var name in triggers) {
                if (typeof triggers[name] === 'object') {
                    triggers[name].trigger = new cv.wTriggers();//pipeline.findChild(name);
                }
            }

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
            };
            window.onresize();

            document.onkeydown = function (e) {
                switch (e.keyCode) {
                    case 82: // R
                        triggerRecording();
                        break;
                    case 65: // A
                        triggerReplay();
                        break;
                    case 83: // S
                        triggerReverse();
                        break;
                    case 68: // D
                        triggerSlowMotion();
                        break;
                    case 81: // Q
                        //pipeline.stop();
                        window.location = "index.html";
                        break;
                    default:
                        console.log("unhandled key code " + e.keyCode);
                }
                $scope.$apply();
            };

            appsink.pull(function (frame) {
                var image = context.createImageData(width, height);
                image.data.set(frame);

                switch (mode) {
                    case "menu":
                        context.putImageData(image, 0, 0);

                        for (name in triggers) {
                            if (typeof triggers[name] === 'object') {
                                var t = triggers[name];

                                context.fillStyle = "rgba(255,0,0," + (t.trigger.get("value")) + ")";
                                context.fillRect(t.x * width, t.y * height, t.w * width, t.h * height);

                                context.strokeStyle = "#f00";
                                context.lineWidth = 1;
                                context.strokeRect(t.x * width, t.y * height, t.w * width, t.h * height);

                                if (t.trigger.get("ping")) {
                                    console.log("PING " + name);
                                }
                            }
                        }
                        break;
                    case "countdown":
                        context.putImageData(image, 0, 0);
                        break;
                    case "record":
                        context.putImageData(image, 0, 0);
                        frames.push(image);
                        if (frames.length >= maxFrames) {
                            mode = "menu";
                        }
                        $scope.toGo = (maxFrames - frames.length) / fps;
                        break;
                    case "replay":
                    case "reverse":
                    case "slowmotion":
                        playPosition += playSpeed;
                        var pos = Math.round(playPosition);
                        if (pos < 0 || pos >= frames.length) {
                            mode = "menu";
                        } else {
                            context.putImageData(frames[pos], 0, 0);
                        }
                        $scope.debug = { pos: pos, speed: playSpeed };
                        break;
                    default:
                        context.clearRect(0, 0, width, height);
                }
                $scope.mode = mode;

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
