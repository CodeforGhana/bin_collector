/*global module, require */
module.exports = function( grunt ) {
    'use strict';

    // Livereload and connect variables
    var LIVERELOAD_PORT = 35729;
    var lrSnippet = require('connect-livereload')({
        port: LIVERELOAD_PORT
    });
    var mountFolder = function( connect, dir ) {
        return connect.static(require('path').resolve(dir));
    };
    var mixIn = require('mout/object/mixIn');
    var requireConfig = {
        baseUrl: 'app/',
        paths: {
            'jquery': '../lib/jquery/jquery-1.9.1',
            'knockout': '../lib/knockout/knockout-3.2.0',
            'text': '../lib/require/text',
            'durandal': '../lib/durandal/js',
            'plugins': '../lib/durandal/js/plugins',
            'transitions': '../lib/durandal/js/transitions',
            'viewmodel': '../lib/custom-libs/knockout.viewmodel',
            'bootstrap': '../lib/bootstrap/js/bootstrap'
        }
    };

    grunt.initConfig({
            pkg: grunt.file.readJSON('package.json'),
            clean: {
                build: ['build/*']
            },
            connect: {
                build: {
                    options: {
                        port: 9001,
                        hostname: 'localhost',
                        base: 'build'
                    }
                },
                dev: {
                    options: {
                        port: 8999,
                        hostname: 'localhost',
                        middleware: function( connect ) {
                            return [lrSnippet, mountFolder(connect, '.')];
                        }
                    }
                }
            },
            copy: {
                lib: {
                    src: 'lib/**/**',
                    dest: 'build/'
                },
                index: {
                    src: 'index.html',
                    dest: 'build/'
                },
                css: {
                    src: 'css/**',
                    dest: 'build/'
                },
                assets: {
                    src: 'assets/**',
                    dest: 'build/'
                }
            },
            open: {
                dev: {
                    path: 'http://localhost:<%= connect.dev.options.port %>/index.html'
                },
                build: {
                    path: 'http://localhost:<%= connect.build.options.port %>'
                }
            },
            durandal: {
                main: {
                    src: ['app/**/*.*', 'lib/durandal/**/*.js'],
                    options: {
                        name: '../lib/require/almond-custom',
                        baseUrl: requireConfig.baseUrl,
                        mainPath: 'app/main',
                        paths: mixIn({}, requireConfig.paths, { 'almond': '../lib/require/almond-custom.js' }),
                        exclude: [],
                        optimize: 'none',
                        out: 'build/app/main.js'
                    }
                }
            },

            jshint: {
                all: ['Gruntfile.js', 'app/**/*.js']
            },
            uglify: {
                options: {
                    banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> \n' +
                        '* Copyright (c) <%= grunt.template.today("yyyy") %> Coders4Africa Inc. \n' +
                        '*/\n'
                },
                build: {
                    src: 'build/app/main.js',
                    dest: 'build/app/main-built.js'
                }
            },

            watch: {
                build: {
                    files: ['build/**/*.js']
                },
                dev: {
                    files: ['app/**/*.js'],
                    options: {
                        livereload: true
                    }
                }
            }
        }
    );

// Loading plugin(s)
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-open');
    grunt.loadNpmTasks('grunt-durandal');

    grunt.registerTask('default', ['jshint','connect:dev', 'open:dev', 'watch:dev']);
    grunt.registerTask('build', ['jshint', 'clean', 'copy', 'durandal:main', 'uglify', 'connect:build', 'open:build', 'watch:build']);

};
