# BADco. Whatever Dance Toolbox

[![Build Status](https://travis-ci.org/dasantonym/wdt.svg)](https://travis-ci.org/dasantonym/wdt) [![Code Climate](https://codeclimate.com/github/dasantonym/wdt/badges/gpa.svg)](https://codeclimate.com/github/dasantonym/wdt) [![Dependency Status](https://gemnasium.com/dasantonym/wdt.svg)](https://gemnasium.com/dasantonym/wdt)

## About

This is a re-rewrite of the Daniel Turing's [Whatever Dance Toolbox](https://github.com/dturing/wdt) using [node-opencv](https://github.com/dasantonym/node-opencv), [node-webkit](https://github.com/rogerwang/node-webkit) and [angular.js](http://angularjs.org/).

The previous node-webkit based version (1.9) was dependent on GStreamer and the functionality from [ppgst](https://github.com/dturing/ppgst) was moved and ported to node in form of the [wdt-native](https://github.com/dasantonym/node-wdt-native) module.

The original 1.0 version uses [haXe](http://haxe.org)/[xinf](http://xinf.org) and became unmaintainable. It is available as a Linux LiveCD that works on PC (and some Macs) only with firewire cameras - on <http://badco.hr/works/whatever-toolbox/>.

This version, very much a work in progress, leverages some new techologies with the aim to have an easily installable application for Linux, Mac OS and Windows.

## Building

You'll need OpenCV 2.3.1 or newer, cmake, gulp and bower installed.

Run this from the repository root:

```
npm install
bower install
gulp
cd dist
npm install
```

The last step will fetch the native module and compile it for your local architecture.

To build the app for your machine set either linux64, osx64 or win64 as the environment variable `WDT_TARGET_ARCH` and run:

```
WDT_TARGET_ARCH=osx64 gulp build-webkit-app
```

To regenerate all HTML/JS/CSS files run ``gulp``.
