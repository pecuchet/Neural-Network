module.exports = function ( grunt ) {

	grunt.initConfig( {

		pkg: grunt.file.readJSON( 'package.json' ),

		browserify: {
			build: {
				files: {
					'js/build/deploy.js': [ 'js/build/app.js' ]
				}
			}
		},
		concat: {
			options: {
				// banner: '/* <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
				// footer: ''
			},
			build: {
				src: [ 'js/neuron.js', 'js/signal.js', 'js/particlePool.js', 'js/particle.js', 'js/axon.js', 'js/neuralNet.js',
						 'js/loaders.js', 'js/scene.js', 'js/main.js', 'js/gui.js', 'js/cameraTravel.js', 'js/run.js', 'js/events.js' ],

				dest: 'js/build/app.js'
			},
			vendor: {
				src: [ 'js/vendor/Detector.js', 'js/vendor/dat.gui.min.js', 'js/vendor/stats.min.js',
						  'js/vendor/three.js', 'js/vendor/OrbitControls.js', 'js/vendor/OBJLoader.js', 'js/vendor/Tween.js' ],

				dest: 'js/vendor/vendor-merge.js'
			},
			module: {
				src: [
					'js/moduleIn.js',
					'js/vendor/vendor-merge.js',
					'js/build/app.js',
					'js/moduleOut.js'
				],
				dest: 'js/build/module.js'
			}
		},
		uglify: {
			options: {},
			build: {
				src: [ 'js/build/app.js' ],
				dest: 'js/build/app.min.js',
				sourceMap: true
			},
			vendor: {
				src: [ 'js/vendor/vendor-merge.js' ],
				dest: 'js/vendor/vendor-merge.min.js',
				sourceMap: false
			},
			module: {
				src: [ 'js/build/module.js' ],
				dest: 'js/build/module.min.js',
				sourceMap: true
			}
		},
		watch: {
			options: {
			},
			js: {
				files: 'js/*.js',
				tasks: [ 'module' ]
			}
		}
	} );

	// Load the plugin that provides the tasks.
	grunt.loadNpmTasks( 'grunt-contrib-concat' );
	grunt.loadNpmTasks( 'grunt-contrib-uglify' );
	grunt.loadNpmTasks( 'grunt-contrib-watch' );

	// tasks
	grunt.registerTask( 'build', [ 'concat:build', 'uglify:build' ] );
	grunt.registerTask( 'vendor', [ 'concat:vendor', 'uglify:vendor' ] );
    grunt.registerTask( 'module', [ 'concat:build', 'uglify:build', 'concat:module', 'uglify:module' ] );
};
