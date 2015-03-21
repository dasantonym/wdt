module.exports = function (grunt) {
    'use strict';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        less: {
            webkit: {
                files: {
                    'dist/approot/css/style.css': [
                        'src/less/style.less'
                    ]
                },
                options: {
                    compress: true,
                    sourceMap: false
                }
            }
        },
        jade: {
            webkit: {
                expand: true,
                cwd: 'src/jade/',
                src: ['**/*.jade'],
                dest: 'dist/approot/',
                ext: '.html'
            }
        },
        uglify: {
            webkit: {
                options: {
                    compress: {
                        drop_console: false
                    },
                    banner: '/*! <%= pkg.name %> webkit - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %> */\n\n'
                },
                files: {
                    'dist/approot/js/wdt-app.min.js': [
                        'src/js/**/*.js'
                    ]
                }
            }
        },
        concat: {
            options: {
                separator: '\n\n',
                stripBanners: { block: true },
                nonull: true,
                banner: '/*! <%= pkg.name %> dependencies - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %> */\n\n'
            },
            webkit: {
                src: [
                    'bower_components/angular/angular.min.js',
                    'bower_components/angular-route/angular-route.min.js'
                ],
                dest: 'dist/approot/js/wdt-deps.min.js'
            }
        },
        nodewebkit: {
            server: {
                options: {
                    platforms: ['osx64'],
                    buildDir: './release/',
                    version: '0.12.0',
                    macPlist: {
                        'NSHumanReadableCopyright': "2015 BADco. / Turing / Koch"
                    }
                },
                src: ['./dist/**/*']
            }
        },
        exec: {
            webkit: '/Applications/node-webkit.app/Contents/MacOS/node-webkit ./dist &'
        },
        watch: {
            all: {
                files: 'src/**/*',
                tasks: ['default']
            }
        }
    });
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-jade');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-exec');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-node-webkit-builder');

    grunt.registerTask('default', ['less', 'jade', 'uglify', 'concat']);
    grunt.registerTask('dev', ['exec:webkit', 'watch:all']);
};
