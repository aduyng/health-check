var path = require('path'),
  _ = require('underscore');

module.exports = function(grunt) {
  'use strict';
  // load all grunt tasks
  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);
  var pkg = grunt.file.readJSON('package.json'),
    target = grunt.option('target') || 'development',
    isDevelopmentMode = target === 'development';
  if (isDevelopmentMode) {
    console.log('In Development Mode');
  }

  var opts = {
    pkg: pkg,
    concurrent: {
      frontend: {
        tasks: ['http-server:frontend', 'watch:frontend', 'watch:less'],
        options: {
          limit: 2,
          logConcurrentOutput: true
        }
      },
      backend: {
        tasks: ['forever:web:start', 'forever:worker:start', 'watch:backend'],
        options: {
          logConcurrentOutput: true
        }
      }
    },
    'http-server': {
      frontend: {
        root: './app',
        port: grunt.option('http-port') || 5000,
        host: '0.0.0.0',
        cache: -1,
        showDir: true,
        autoIndex: false,
        runInBackground: false,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept'
        }
      }
    }
    ,
    watch: {
      less: {
        files: [
          './app/**/*.less'
        ],
        tasks: [
          'less'
        ]
      }
      ,
      frontend: {
        files: [
          //frontend
          './app/*.js',
          './app/collections/*.js',
          './app/models/*.js',
          './app/pages/**/*.js',
          './app/views/**/*.js',
          './app/pages/**/*.hbs',
          './app/views/**/*.hbs',
          './app/pages/**/*.json',
          './app/templates/*/*.js',
          './app/templates/*/*.json',
          './app/views/*.js',
          './app/views/*.hbs',
          './app/app.js',
          './app/config.js',
          './app/router.js',
          './app/pages/*/*.less',
          './app/style.less',
          './app/pages/*/*.less'
        ],
        tasks: [
          'requirejs',
          'less'
        ]
      },
      backend: {
        files: [
          //backend,
          './resources/*.js',
          './odm/**/*.js',
          './routes/*.js',
          './config.js',
          './package.json',
          './server.js',
          './connection.js',
          './error.js',
          './utils.js'
        ],
        tasks: [
          'forever:web:restart',
          'forever:worker:restart'
        ]
      }
      ,
      build: {
        files: [
          //build stuff,
          'Gruntfile.js',
          'package.json'
        ],
        tasks: [
          'clean:frontend',
          'requirejs',
          'less',
          'copy:frontend'
        ]
      }
    },


    requirejs: {
      compile: {
        options: {
          baseUrl: "./app",
          mainConfigFile: 'app/init.js',
          paths: {
            backbone: 'empty:',
            bootstrap: 'empty:',
            text: 'vendors/requirejs-plugins/lib/text',
            goog: 'vendors/requirejs-plugins/src/goog',
            async: 'vendors/requirejs-plugins/src/async',
            propertyParser: 'vendors/requirejs-plugins/src/propertyParser',
            image: 'vendors/requirejs-plugins/src/image',
            json: 'vendors/requirejs-plugins/src/json',
            hbs: 'vendors/require-handlebars-plugin/hbs',
            i18nprecompile: 'vendors/require-handlebars-plugin/hbs/i18nprecompile',
            json2: 'vendors/require-handlebars-plugin/hbs/json2',
            jquery: 'empty:',
            bootstrapValidator: 'empty:',
            toastr: 'empty:',
            ladda: 'empty:',
            spin: 'empty:',
            moment: "empty:",
            nprogress: "empty:",
            'underscore.string': 'empty:',
            bluebird: 'empty:',
            underscore: 'empty:',
            select2: 'empty:',
            ace: 'empty:',
            'socket.io': 'empty:',
            'data.io': 'vendors/data.io/data.io',
            'ansi': 'vendors/ansi_up/ansi_up'
          },
          packages: [],
          keepBuildDir: true,
          locale: "en-us",
          optimize: isDevelopmentMode ? 'none' : 'uglify2',
          skipDirOptimize: true,
          generateSourceMaps: isDevelopmentMode,
          normalizeDirDefines: "skip",
          uglify2: {
            output: {}
            ,
            compress: {
              sequences: true,  // join consecutive statemets with the “comma operator”
              properties: true,  // optimize property access: a['foo'] → a.foo
              dead_code: true,  // discard unreachable code
              drop_debugger: true,  // discard “debugger” statements
              drop_console: true,
              unsafe: false, // some unsafe optimizations (see below)
              conditionals: true,  // optimize if-s and conditional expressions
              comparisons: true,  // optimize comparisons
              evaluate: true,  // evaluate constant expressions
              booleans: true,  // optimize boolean expressions
              loops: true,  // optimize loops
              unused: true,  // drop unused variables/functions
              hoist_funs: true,  // hoist function declarations
              hoist_vars: false, // hoist variable declarations
              if_return: true,  // optimize if-s followed by return/continue
              join_vars: true,  // join var declarations
              cascade: true,  // try to cascade `right` into `left` in sequences
              side_effects: true,  // drop side-effect-free statements
              warnings: true,  // warn about potentially dangerous optimizations/code
              global_defs: {}     // global definitions
            }
            ,
            warnings: true,
            mangle: false
          }
          ,
          inlineText: true,
          useStrict: true,
          //Skip processing for pragmas.
          skipPragmas: false,
          skipModuleInsertion: false,
          stubModules: ['text', 'hbs'],
          optimizeAllPluginResources: false,
          findNestedDependencies: false,
          removeCombined: false,
          name: "init",
          include: [
            'app',
            "pages/index/index",
            "pages/index/login"
          ],
          excludeShallow: [
            'dist'
          ],
          out: "./dist/frontend/init.js",
          wrap: true,
          fileExclusionRegExp: /^\./,
          preserveLicenseComments: false,
          logLevel: 0,
          cjsTranslate: true,
          useSourceUrl: isDevelopmentMode,
          waitSeconds: 30,
          skipSemiColonInsertion: false
        }
      }
    }
    ,
    clean: {
      options: {
        force: true
      }
      ,
      frontend: {
        src: [
          './dist/frontend'
        ]
      }
      ,
      backend: {
        src: [
          './dist/backend'
        ]
      }
    }
    ,
    copy: {
      frontend: {
        files: [
          {
            expand: true,
            cwd: './app',
            dest: './dist/frontend',
            src: [
              'style.css',
              'images/icon/*',
              'images/*'
            ]
          }, {

            dest: './dist/frontend/vendors/developer.sabre.com/04b3c812-2234-45b5-af16-18a0f70cf1df.eot',
            src: './app/vendors/developer.sabre.com/04b3c812-2234-45b5-af16-18a0f70cf1df.eot'
          }, {

            dest: './dist/frontend/vendors/developer.sabre.com/131afccb-6196-44dd-9bad-6d2827250d32.woff',
            src: './app/vendors/developer.sabre.com/131afccb-6196-44dd-9bad-6d2827250d32.woff'
          }, {

            dest: './dist/frontend/vendors/developer.sabre.com/bc35730a-e839-4dc2-b89f-92575ffec5c1.woff',
            src: './app/vendors/developer.sabre.com/bc35730a-e839-4dc2-b89f-92575ffec5c1.woff '
          }, {

            dest: './dist/frontend/vendors/developer.sabre.com/20588565-aa56-46ce-8d7c-6b5f77df85f9.ttf',
            src: '../app/vendors/developer.sabre.com/20588565-aa56-46ce-8d7c-6b5f77df85f9.ttf'
          }, {

            dest: './dist/frontend/vendors/developer.sabre.com/d7cf6a30-fb6a-4725-9c93-2372d9f4bb8d.woff',
            src: './app/vendors/developer.sabre.com/d7cf6a30-fb6a-4725-9c93-2372d9f4bb8d.woff '
          }, {
            dest: './dist/frontend/vendors/developer.sabre.com/fb6dd99b-78b9-4459-b787-00d3f0fc0c9f.ttf',
            src: './app/vendors/developer.sabre.com/fb6dd99b-78b9-4459-b787-00d3f0fc0c9f.ttf'
          }
        ]
      }
      ,
      backend: {
        files: [
          {
            expand: true,
            cwd: './',
            dest: './dist/backend',
            src: [
              './jobs/*.js',
              './odm/**/*.js',
              './resources/**/*.js',
              './views/**/*.hbs',
              './agenda.js',
              './connection.js',
              './config.js',
              './server.js',
              './error.js',
              './logger.js',
              './mailer.js',
              './odm.js',
              './package.json',
              './utils.js',
              './worker.js'
            ]
          }

        ]
      }
    },
    less: {
      dev: {
        options: {
          paths: ["./app"],
          compress: true,
          cleancss: true
        }
        ,
        files: {
          'app/style.css': 'app/style.less'
        }
      }
    },
    forever: {
      web: {
        options: {
          index: 'server.js',
          logDir: 'logs',
          outFile: 'web.log',
          errFile: 'web.log',
          logFile: 'web.log'
        }
      },
      worker: {
        options: {
          index: 'worker.js',
          logDir: 'logs',
          outFile: 'web.log',
          errFile: 'web.log',
          logFile: 'web.log'
        }
      }
    }
  };


  grunt.initConfig(opts);

  grunt.registerTask('build', function(target) {
    grunt.task.run([
      'clean',
      'requirejs',
      'less',
      'copy'
    ]);
  });

  grunt.registerTask('default', function(target) {
    grunt.task.run([
      'less',
      'watch'
    ]);
  });

  grunt.registerTask('frontend', function(target) {
    grunt.task.run([
      //'clean:frontend',
      'less',
      //'requirejs',
      //'copy:frontend',
      'concurrent:frontend'
    ]);
  });

  grunt.registerTask('backend', function(target) {
    grunt.task.run([
      'concurrent:backend'
    ]);
  });
};
