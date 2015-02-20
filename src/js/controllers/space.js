(function () {
    'use strict';
    angular.module(
        'wdt.controllers.space', [])
        .controller('Space', ['$scope', function ($scope) {

            switch (window.location.hash) {
                case "#inertia":
                    $scope.exercises = [
                        { type: "Inertia" }
                    ];
                    break;
                case "#cage":
                    $scope.exercises = [
                        { type: "Cage", left: .2, top: .2, right: .8, bottom: 1.1 },
                        { type: "Cage", left: .35, top: .15, right: .6, bottom: 1.1 },
                    ];
                    break;
                default:
                    $scope.exercises = [
                        { type: "StandAtAngle", angle: 45. },
                        { type: "StandAtAngle", angle: 0. },
                        { type: "StandAtAngle", angle: 180. },
                        { type: "StandAtAngle", angle: 316. },
                        { type: "MoveTo", x: .8, y: .7 },
                        { type: "StandAtAngle", angle: 95. },
                        { type: "MoveTo", x: .1, y: .75 },
                        { type: "StandAtAngle", angle: 212. },
                        { type: "StandAtAngle", angle: 114. },
                        { type: "MoveTo", x: .9, y: .23 },
                    ];
                    break;
            }

            $scope.exerciseIndex = 0;
            $scope.exercise = $scope.exercises[$scope.exerciseIndex];

            $scope.nextExercise = function () {
                $scope.exerciseIndex = ($scope.exerciseIndex + 1) % $scope.exercises.length;
                $scope.exercise = $scope.exercises[$scope.exerciseIndex];
            };
            $scope.previousExercise = function () {
                $scope.exerciseIndex = ($scope.exerciseIndex - 1) % $scope.exercises.length;
                if ($scope.exerciseIndex < 0) $scope.exerciseIndex = $scope.exercises.length - 1;
                $scope.exercise = $scope.exercises[$scope.exerciseIndex];
            };

            $scope.exerciseDone = function () {
                // play sound
                $scope.nextExercise();
            }

            $scope.OSDOpacity = 0;
            var fade;
            $scope.showOSD = function () {
                $scope.OSDOpacity = 1;
                if (!fade) {
                    fade = setInterval(function () {
                        $scope.OSDOpacity *= .9;
                        if ($scope.OSDOpacity < .01) {
                            $scope.OSDOpacity = 0;
                            clearInterval(fade);
                            fade = undefined;
                        }
                        $scope.$apply();
                    }, 66);
                }
            }

            function deg2rad(v) {
                return ((v / 180) * -Math.PI);
            }

            $scope.threshold = 100;

            var canvas = document.getElementById("canvas");
            var context = canvas.getContext("2d");

            var gstreamer = require("node-gstreamer-superficial");

            var width = 320;
            var height = 240;

            $scope.inert = { x: width / 2, y: height / 2 };
            $scope.vel = { x: 0., y: 0. };

            var pipeline = new gstreamer.Pipeline(
                //"videotestsrc pattern=snow"
                    "filesrc location=/home/dan/archive/video/aida/dance.avi ! decodebin"
                    + " ! videoconvert ! video/x-raw, format=GRAY8, width=320, height=240"
                    + " ! motion name=motion weight=0.000001 scale=2 shift=-10 ! videoconvert "
                    + " ! flip h=true ! blur ! threshold name=threshold threshold=" + $scope.threshold
                    + " ! extremes name=extremes ! camshift name=camshift ! acc "
                    + " ! multiplys scale=.6 "
                    + " ! videoconvert ! video/x-raw, format=RGBA ! appsink name=sink");

            var appsink = pipeline.findChild("sink");
            var motion = pipeline.findChild("motion");
            var extremes = pipeline.findChild("extremes");
            var camshift = pipeline.findChild("camshift");
            var threshold = pipeline.findChild("threshold");

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
                    case 38: // up
                        $scope.threshold = Math.min(255, $scope.threshold + 3);
                        $scope.showOSD();
                        threshold.set("threshold", $scope.threshold);
                        break;
                    case 40: // down
                        $scope.threshold = Math.max(0, $scope.threshold - 3);
                        $scope.showOSD();
                        threshold.set("threshold", $scope.threshold);
                        break;
                    case 39: // right
                        $scope.nextExercise();
                        break;
                    case 37: // left;
                        $scope.previousExercise();
                        break;
                    case 32: // space:
                        motion.set("reset", true);
                        break;
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

                var extr = $scope.extremes = {
                    left: extremes.get("left") * width,
                    top: extremes.get("top") * height,
                    right: extremes.get("right") * width,
                    bottom: extremes.get("bottom") * height,
                };
                var c = $scope.centroid = {
                    x: camshift.get("x") * width,
                    y: camshift.get("y") * height,
                    width: camshift.get("width") * width,
                    height: camshift.get("height") * height,
                    angle: deg2rad(camshift.get("angle"))
                };

                context.fillStyle = "#fff";
                context.save();
                context.translate(c.x, c.y);
                context.rotate(c.angle);
                context.fillRect(-(c.width / 2), -5, c.width, 10);
                context.fillRect(-5, -(c.height / 2), 10, c.height);
                context.restore();

                context.fillStyle = "rgba(0,20,120,0.5)";
                context.fillRect(0, 0, width, height);

                context.strokeStyle = "#fff";
                context.lineWidth = 2;
                context.strokeRect(extr.left, extr.top, extr.right - extr.left, extr.bottom - extr.top);

                // inert centroid
                var acc = .05; // TODO: make configurable
                var brake = 1. - acc;
                var inert = $scope.inert;
                var vel = $scope.vel;
                var d = { x: c.x - inert.x, y: c.y - inert.y };
                d.x *= acc;
                d.y *= acc;
                vel.x *= brake;
                vel.y *= brake;
                vel.x += d.x;
                vel.y += d.y;
                inert.x += vel.x;
                inert.y += vel.y;

                $scope.inert = inert;
                $scope.vel = vel;


                var ex = $scope.exercise;
                context.fillStyle = "#f00";
                var th = 2;
                var sz = 30;
                context.save();
                switch (ex.type) {
                    case "StandAtAngle":
                        var angle = deg2rad(ex.angle);
                        context.translate(width / 2, height / 2);
                        context.rotate(angle);
                        context.fillRect(-width / 2, -2, width, 4);
                        var delta = Math.abs(angle - c.angle);
                        $scope.delta = delta;
                        if (delta < deg2rad(3)) $scope.exerciseDone();
                        break;

                    case "MoveTo":
                        var x = ex.x * width;
                        var y = ex.y * height;
                        context.fillRect(x - th, y - sz, th * 2, sz * 2);
                        context.fillRect(x - sz, y - th, sz * 2, th * 2);

                        var d = { x: x - c.x, y: y - c.y };
                        var delta = Math.sqrt((d.x * d.x) + (d.y * d.y));
                        $scope.delta = delta;
                        if (delta < 10) $scope.exerciseDone();
                        break;

                    case "Cage":
                        var cg = {
                            l: ex.left * width,
                            t: ex.top * height,
                            r: ex.right * width,
                            b: ex.bottom * height
                        }
                        var inside = cg.l < extr.left && cg.t < extr.top && cg.r > extr.right && cg.b >= extr.bottom;
                        $scope.insideCage = inside;
                        context.strokeStyle = inside ? "#0f0" : "#f00";
                        context.lineWidth = 2;
                        context.strokeRect(cg.l, cg.t, cg.r - cg.l, cg.b - cg.t);
                        break;

                    case "Inertia":
                        var x = $scope.inert.x;
                        var y = $scope.inert.y;
                        context.fillRect(x - th, y - sz, th * 2, sz * 2);
                        context.fillRect(x - sz, y - th, sz * 2, th * 2);
                        break;

                }
                context.restore();


                $scope.$apply();

            }, function (caps) {
//				console.log("CAPS",caps);
            });

            pipeline.play();

        }]);
})();
