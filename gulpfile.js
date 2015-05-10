var gulp = require('gulp'),
    header = require('gulp-header'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    jade = require('gulp-jade'),
    less = require('gulp-less'),
    minify = require('gulp-minify-css'),
    watch = require('gulp-watch'),
    pkg = require('./package.json');

var banner = ['/**',
    ' * <%= pkg.name %> - <%= pkg.description %>',
    ' * @version v<%= pkg.version %>',
    ' * @link <%= pkg.homepage %>',
    ' * @license <%= pkg.license %>',
    ' */',
    ''].join('\n');

//
//
// JS building

gulp.task('js-deps', function () {
    return gulp.src([
        'bower_components/angular/angular.min.js',
        'bower_components/angular-route/angular-route.min.js'
    ])
        .pipe(concat('wdt-deps.min.js'))
        .pipe(header(banner, {pkg: pkg}))
        .pipe(gulp.dest('./dist/approot/js/'));
});

function jsPipe(src, destPath) {
    return src.pipe(concat('wdt-app.js'))
        .pipe(header(banner, {pkg: pkg}))
        .pipe(gulp.dest(destPath))
        .pipe(rename({
            extname: ".min.js"
        }))
        .pipe(uglify())
        .pipe(header(banner, {pkg: pkg}))
        .pipe(gulp.dest(destPath));
}

gulp.task('js', function () {
    return jsPipe(gulp.src(['./src/js/**/*.js']), './dist/approot/js/');
});


//
//
// CSS building

function cssPipe(src, destPath) {
    return src.pipe(less())
        .pipe(minify())
        .pipe(header(banner, {pkg: pkg}))
        .pipe(rename({
            basename: 'wdt-app.min'
        }))
        .pipe(gulp.dest(destPath));
}

gulp.task('css', function () {
    return cssPipe(gulp.src('./src/less/app.less'), './dist/approot/css/');
});


//
//
// HTML building

function htmlPipe(src, destPath) {
    return src.pipe(jade())
        .pipe(gulp.dest(destPath));
}

gulp.task('html', function () {
    return htmlPipe(gulp.src(['./src/jade/**/*.jade']), './dist/approot/');

});


//
//
// NW app

gulp.task('build-webkit-app', function (cb) {
    var arch = 'osx64';
    if (process.env.WDT_TARGET_ARCH) {
        arch = process.env.WDT_TARGET_ARCH;
    } else {
        console.log('You did not specifiy a target architecture (e.g. win64, osx64 or linux64) through env var WDT_TARGET_ARCH.');
    }
    console.log('Building for target architecture: ' + arch);
    var NwBuilder = require('node-webkit-builder');
    var nw = new NwBuilder({
        files: './dist/**/**',
        platforms: [arch],
        buildDir: './release/',
        version: '0.12.1',
        appVersion: pkg.version,
        macPlist: {
            'NSHumanReadableCopyright': "2015 BADco. / Turing / Koch"
        }
    });
    nw.on('log', console.log);
    nw.build(function (err) {
        cb(err);
    });
});


//
//
// Watch tasks

gulp.task('watch', function () {
    watch(['src/js/**/*.js'], function () {
        gulp.start('js');
    });
    watch('src/less/**/*.less', function () {
        gulp.start('css');
    });
    watch(['src/jade/**/*.jade'], function () {
        gulp.start('html');
    });
});


//
//
// combined tasks

gulp.task('default', [
    'js-deps',
    'js',
    'css',
    'html'
]);

