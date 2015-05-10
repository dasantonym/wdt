/**
 * wdt - Whatever Dance Toolbox
 * @version v2.0.0
 * @link https://github.com/dasantonym/wdt
 * @license GPL
 */
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
                        $scope.OSDOpacity *= .9;
                        if ($scope.OSDOpacity < .01) {
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
                record: { x: .025, y: .525, w: .1, h: .1 },
                replay: { x: .3, y: .525, w: .1, h: .1 },
                reverse: { x: .45, y: .525, w: .1, h: .1 },
                slowmotion: { x: .6, y: .525, w: .1, h: .1 }
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
                triggers[name].trigger = new cv.wTriggers();//pipeline.findChild(name);
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
                        break;
                    case "countdown":
                        context.putImageData(image, 0, 0);
                        break;
                    case "record":
                        context.putImageData(image, 0, 0);
                        frames.push(image);
                        if (frames.length >= maxFrames) mode = "menu";
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
                row.push($scope.tools[i]);
                if (row.length == 3) {
                    $scope.toolRows.push(row);
                    row = [];
                }
            }
            $scope.toolRows.push(row);

            $scope.externalClick = function (url) {
                var gui = require('nw.gui');
                gui.Shell.openExternal(url);
            }

            document.onkeydown = function (e) {
                var nr = e.keyCode - 49;
                if (nr >= 0 && nr < $scope.tools.length) {
                    window.location = $scope.tools[nr].href;
                    return;
                }

                switch (e.keyCode) {
                    case 81: // Q
                        //global.window.nwDispatcher.requireNwGui().App.quit();
                    default:
                        console.log("unhandled key code " + e.keyCode);
                }
            };

        }]);
})();

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
                if (d < 1) d = 1;
                if (d > 10) d = 10;
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
            }
            $scope.switchMode = function () {
                if ($scope.mode == "Delay") {
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
            }

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
            }

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
                while (playPosition < 0) playPosition = maxFrames - 1;

                $scope.frames = frames.length;
                $scope.playPosition = playPosition;
                $scope.recordPosition = recordPosition;

                if (frames.length > playPosition)
                    context.putImageData(frames[playPosition], 0, 0);
                else
                    context.clearRect(0, 0, width, height);

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
                snd.play();
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

            var width = 320;
            var height = 240;

            $scope.inert = { x: width / 2, y: height / 2 };
            $scope.vel = { x: 0., y: 0. };

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
                    context.restore();

                    context.strokeStyle = "#f00";
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
                            if (delta < Math.abs(deg2rad(3))) $scope.exerciseDone();
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
