# BADco. Whatever Dance Toolbox

[![Code Climate](https://codeclimate.com/github/dasantonym/wdt/badges/gpa.svg)](https://codeclimate.com/github/dasantonym/wdt)

## About

This is a re-rewrite of the Daniel Turing's [Whatever Dance Toolbox](https://github.com/dturing/wdt) using a modified fork of [node-opencv](https://github.com/dasantonym/node-opencv), [node-webkit](https://github.com/rogerwang/node-webkit) and [angular.js](http://angularjs.org/).

The previous node-webkit based version (1.9) was dependent on GStreamer and the functionality from [ppgst](https://github.com/dturing/ppgst) was moved and ported to node.

The original 1.0 version uses [haXe](http://haxe.org)/[xinf](http://xinf.org) and became unmaintainable. It is available as a Linux LiveCD that works on PC (and some Macs) only with firewire cameras - on <http://badco.hr/works/whatever-toolbox/>.

This version, very much a work in progress, leverages some new techologies with the aim to have an easily installable application for Linux, Mac OS and Windows.

## Building

You'll need OpenCV 2.3.1 or newer, node-pre-gyp, grunt and bower installed.

Run this from the repository root:

```
npm install
bower install
cd dist
npm install
```

To build the app for your local machine (substitute PLATFORM for either linux64, osx64 or win64) run:

```
cd dist/node_modules/opencv
node-pre-gyp rebuild --runtime=node-webkit --target=0.12.0 --arch=x64
cd ../../..
grunt nodewebkit:PLATFORM
```

To regenerate all HTML/JS/CSS files run ``grunt``.
