/* global console,angular,require */
(function () {
    'use strict';
    angular.module(
        'wdt.controllers.space', [])
        .controller('Space', ['$scope', '$routeParams', function ($scope, $routeParams) {

            switch ($routeParams.spaceModule) {
                case "inertia":
                    $scope.exercises = [
                        { type: "Inertia" }
                    ];
                    break;
                case "cage":
                    $scope.exercises = [
                        { type: "Cage", left: 0.2, top: 0.2, right: 0.8, bottom: 1.1 },
                        { type: "Cage", left: 0.35, top: 0.15, right: 0.6, bottom: 1.1 }
                    ];
                    break;
                default:
                    $scope.exercises = [
                        { type: "StandAtAngle", angle: 45.0 },
                        { type: "StandAtAngle", angle: 0.0 },
                        { type: "StandAtAngle", angle: 180.0 },
                        { type: "StandAtAngle", angle: 316.0 },
                        { type: "MoveTo", x: 0.8, y: 0.7 },
                        { type: "StandAtAngle", angle: 95.0 },
                        { type: "MoveTo", x: 0.1, y: 0.75 },
                        { type: "StandAtAngle", angle: 212.0 },
                        { type: "StandAtAngle", angle: 114.0 },
                        { type: "MoveTo", x: 0.9, y: 0.23 }
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
                if ($scope.exerciseIndex < 0) {
                    $scope.exerciseIndex = $scope.exercises.length - 1;
                }
                $scope.exercise = $scope.exercises[$scope.exerciseIndex];
            };

            $scope.exerciseDone = function () {
                snd.play();
                $scope.nextExercise();
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

            function deg2rad(v) {
                return ((v / 180) * -Math.PI);
            }

            $scope.threshold = 100;

            var canvas = document.getElementById("canvas");
            var context = canvas.getContext("2d");

            var width = 320;
            var height = 240;

            $scope.inert = { x: width / 2, y: height / 2 };
            $scope.vel = { x: 0.0, y: 0.0 };

            var snd = new Audio("./snd/Robot_blip_2-Marianne_Gagnon-299056732.wav");

            var cv = require('wdt-native');

            var camDevice = 0;

            var cam = new cv.VideoCapture(camDevice);
            var extremes = new cv.wExtremes();
            var motion = new cv.cvMotion();
            var accumulate = new cv.wAccumulate();
            var multiplys = new cv.cvMultiplyS();
            var camshift = new cv.cvCamShift();
            //var displayFormat = new cv.cvDisplayFormat();

            cam.setWidth(width);
            cam.setHeight(height);

            /*
            var pipeline = new gstreamer.Pipeline(
                //"videotestsrc pattern=snow"
                    "v4l2src"
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
            */

            var videoContainer = document.getElementById("video-container");
            var canvasContainer = document.getElementById("canvas-container");
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

            document.onkeydown = function (e) {
                switch (e.keyCode) {
                    case 38: // up
                        $scope.threshold = Math.min(255, $scope.threshold + 3);
                        $scope.showOSD();
                        //threshold.set("threshold", $scope.threshold);
                        break;
                    case 40: // down
                        $scope.threshold = Math.max(0, $scope.threshold - 3);
                        $scope.showOSD();
                        //threshold.set("threshold", $scope.threshold);
                        break;
                    case 39: // right
                        $scope.nextExercise();
                        break;
                    case 37: // left;
                        $scope.previousExercise();
                        break;
                    case 32: // space:
                        motion.reset();
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
                        //pipeline.stop();
                        cam.close();
                        cam = undefined;
                        window.location = "index.html";
                        break;
                    default:
                        console.log("unhandled key code " + e.keyCode);
                }
                $scope.$apply();
            };

            var readFrame = function () {
                cam.read(function(err, mat){
                    mat.convertGrayscale();
                    motion.process(mat, 0.000001, 2.0, -10.0, 0);
                    mat = mat.flip(1);
                    mat.gaussianBlur();
                    mat = mat.threshold($scope.threshold, 255);
                    mat.cvtColor('CV_GRAY2BGR');
                    var extRes = extremes.process(mat);
                    var camshiftRes = camshift.process(mat);
                    accumulate.process(mat, 0.2, 0.8);
                    multiplys.process(mat, 0.6, 0);
                    //displayFormat.process(mat);


                    var image = context.createImageData(mat.width(), mat.height());
                    //image.data.set(mat.toBuffer());

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

                    var extr = $scope.extremes = {
                        left: extRes[0] * width,
                        top: extRes[2] * height,
                        right: extRes[1] * width,
                        bottom: extRes[3] * height
                    };

                    if (!camshiftRes) {
                        window.setTimeout(readFrame, 10);
                        return;
                    }

                    var c = $scope.centroid = {
                        x: Math.floor(camshiftRes[0] * width),
                        y: Math.floor(camshiftRes[1] * height),
                        width: Math.floor(camshiftRes[2] * width),
                        height: Math.floor(camshiftRes[3] * height),
                        angle: deg2rad(camshiftRes[4])
                    };

                    context.fillStyle = "#0f0";
                    context.save();
                    context.translate(c.x, c.y);
                    context.rotate(c.angle);
                    context.fillRect(-(c.width / 2), -5, c.width, 10);
                    context.fillRect(-5, -(c.height / 2), 10, c.height);
                    context.fillStyle = "#ff0";
                    context.fillRect(-5, c.height / 2 - 10, 10, 10);
                    context.restore();

                    context.strokeStyle = "#f00";
                    context.lineWidth = 2;
                    context.strokeRect(extr.left, extr.top, extr.right - extr.left, extr.bottom - extr.top);

                    // inert centroid
                    var acc = 0.05; // TODO: make configurable
                    var brake = 1.0 - acc;
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
                    context.fillStyle = "#fff";
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
                            if (delta < Math.abs(deg2rad(3))) {
                                $scope.exerciseDone();
                            }
                            break;

                        case "MoveTo":
                            var x = ex.x * width;
                            var y = ex.y * height;
                            context.fillRect(x - th, y - sz, th * 2, sz * 2);
                            context.fillRect(x - sz, y - th, sz * 2, th * 2);

                            var d = { x: x - c.x, y: y - c.y };
                            var delta = Math.sqrt((d.x * d.x) + (d.y * d.y));
                            $scope.delta = delta;
                            if (delta < 10) {
                                $scope.exerciseDone();
                            }
                            break;

                        case "Cage":
                            var cg = {
                                l: ex.left * width,
                                t: ex.top * height,
                                r: ex.right * width,
                                b: ex.bottom * height
                            };
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

                    window.setTimeout(readFrame, 10);
                });
            };

            $scope.$on('$routeChangeStart', function(next, current) {
                if (next !== current) {
                    cam.close();
                    cam = undefined;
                }
            });

            window.onresize();
            readFrame();

        }]);
})();
