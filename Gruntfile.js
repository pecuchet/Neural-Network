module.exports = function ( grunt ) {

	grunt.initConfig( {

		pkg: grunt.file.readJSON( 'package.json' ),

		concat: {
			build: {
				src: [
					'js/helpers.js',
					'js/neuron.js', 'js/signal.js', 'js/particlePool.js', 'js/particle.js', 'js/axon.js', 'js/neuralNet.js',
					'js/scene.js'
				],
				dest: 'js/build/app.js'
			},
			vendorAll: {
				src: [
					'js/vendor/dat.gui.min.js', 'js/vendor/stats.min.js',
					'js/vendor/three.js', 'js/vendor/OrbitControls.js', 'js/vendor/OBJLoader.js'
				],
				dest: 'js/vendor/vendor-all-merge.js'
			},
			vendorSlim: {
                src: [
                    'js/vendor/three.js', 'js/vendor/OBJLoader.js'
                ],
                dest: 'js/vendor/vendor-slim-merge.js'
			},
			moduleAll: {
				src: [
					'js/moduleIn.js',
					'js/vendor/vendor-all-merge.js',
					'js/build/app.js',
					'js/moduleOut.js'
				],
				dest: 'js/build/module-all.js'
			},
			moduleSlim: {
                src: [
                    'js/moduleIn.js',
                    'js/vendor/vendor-slim-merge.js',
                    'js/build/app.js',
                    'js/moduleOut.js'
                ],
                dest: 'js/build/module-slim.js'
			}
		},
		uglify: {
			options: {},
			build: {
				src: [ 'js/build/app.js' ],
				dest: 'js/build/app.min.js',
				sourceMap: true
			},
            vendorAll: {
				src: [ 'js/vendor/vendor-all-merge.js' ],
				dest: 'js/vendor/vendor-all-merge.min.js',
				sourceMap: false
			},
            vendorSlim: {
                src: [ 'js/vendor/vendor-slim-merge.js' ],
                dest: 'js/vendor/vendor-slim-merge.min.js',
                sourceMap: false
            },
            moduleAll: {
				src: [ 'js/build/module-all.js' ],
				dest: 'js/build/module-all.min.js',
				sourceMap: true
			},
            moduleSlim: {
                src: [ 'js/build/module-slim.js' ],
                dest: 'js/build/module-slim.min.js',
                sourceMap: true
            }
		},
		watch: {
			options: {
			},
			js: {
				files: 'js/*.js',
				tasks: [ 'module-all' ]
			}
		}
	} );

	// Load the plugin that provides the tasks.
	grunt.loadNpmTasks( 'grunt-contrib-concat' );
	grunt.loadNpmTasks( 'grunt-contrib-uglify' );
	grunt.loadNpmTasks( 'grunt-contrib-watch' );

	// tasks
	grunt.registerTask( 'vendor-all', [ 'concat:vendorAll', 'uglify:vendorAll' ] );
    grunt.registerTask( 'vendor-slim', [ 'concat:vendorSlim', 'uglify:vendorSlim' ] );
    grunt.registerTask( 'module-all', [ 'concat:build', 'uglify:build', 'concat:moduleAll', 'uglify:moduleAll' ] );
    grunt.registerTask( 'module-slim', [ 'concat:build', 'uglify:build', 'concat:moduleSlim', 'uglify:moduleSlim' ] );
};
