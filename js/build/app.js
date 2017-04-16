function random(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function extend(a, b) {

    if (!a || !b) return a;

    for (var key in b) {
        if (!b.hasOwnProperty(key)) continue;

        if (Object.prototype.toString.call(b[key]) === '[object Object]') {
            if (Object.prototype.toString.call(a[key]) !== '[object Object]') {
                a[key] = b[key];
            } else {
                a[key] = extend(a[key], b[key]);
            }
        } else {
            a[key] = b[key];
        }
    }
    return a;
}
// Neuron ----------------------------------------------------------------

function Neuron( x, y, z ) {

	this.connection = [];
	this.receivedSignal = false;
	this.lastSignalRelease = 0;
	this.releaseDelay = 0;
	this.fired = false;
	this.firedCount = 0;
	this.prevReleaseAxon = null;
	THREE.Vector3.call( this, x, y, z );

}

Neuron.prototype = Object.create( THREE.Vector3.prototype );

Neuron.prototype.connectNeuronTo = function ( neuronB ) {

	var neuronA = this;
	// create axon and establish connection
	var axon = new Axon( neuronA, neuronB );
	neuronA.connection.push( new Connection( axon, 'A' ) );
	neuronB.connection.push( new Connection( axon, 'B' ) );
	return axon;

};

Neuron.prototype.createSignal = function ( particlePool, minSpeed, maxSpeed ) {

	this.firedCount += 1;
	this.receivedSignal = false;

	var signals = [];
	// create signal to all connected axons
	for ( var i = 0; i < this.connection.length; i++ ) {
		if ( this.connection[ i ].axon !== this.prevReleaseAxon ) {
			var c = new Signal( particlePool, minSpeed, maxSpeed );
			c.setConnection( this.connection[ i ] );
			signals.push( c );
		}
	}
	return signals;

};

Neuron.prototype.reset = function () {

	this.receivedSignal = false;
	this.lastSignalRelease = 0;
	this.releaseDelay = 0;
	this.fired = false;
	this.firedCount = 0;

};

// Signal extends THREE.Vector3 ----------------------------------------------------------------

function Signal( particlePool, minSpeed, maxSpeed ) {

	this.minSpeed = minSpeed;
	this.maxSpeed = maxSpeed;
	this.speed = THREE.Math.randFloat( this.minSpeed, this.maxSpeed );
	this.alive = true;
	this.t = null;
	this.startingPoint = null;
	this.axon = null;
	this.particle = particlePool.getParticle();
	THREE.Vector3.call( this );

}

Signal.prototype = Object.create( THREE.Vector3.prototype );

Signal.prototype.setConnection = function ( Connection ) {

	this.startingPoint = Connection.startingPoint;
	this.axon = Connection.axon;
	if ( this.startingPoint === 'A' ) this.t = 0;
	else if ( this.startingPoint === 'B' ) this.t = 1;

};

Signal.prototype.travel = function ( deltaTime ) {

	var pos;
	if ( this.startingPoint === 'A' ) {
		this.t += this.speed * deltaTime;
		if ( this.t >= 1 ) {
			this.t = 1;
			this.alive = false;
			this.axon.neuronB.receivedSignal = true;
			this.axon.neuronB.prevReleaseAxon = this.axon;
		}

	} else if ( this.startingPoint === 'B' ) {
		this.t -= this.speed * deltaTime;
		if ( this.t <= 0 ) {
			this.t = 0;
			this.alive = false;
			this.axon.neuronA.receivedSignal = true;
			this.axon.neuronA.prevReleaseAxon = this.axon;
		}
	}

	pos = this.axon.getPoint( this.t );
	// pos = this.axon.getPointAt(this.t);	// uniform point distribution but slower calculation

	this.particle.set( pos.x, pos.y, pos.z );

};

// Particle Pool ---------------------------------------------------------

function ParticlePool( settings ) {

	this.spriteTextureSignal = TEXTURES.electric;

	this.poolSize = settings.limitSignals;
	this.pGeom = new THREE.Geometry();
	this.particles = this.pGeom.vertices;

	this.offScreenPos = new THREE.Vector3( 9999, 9999, 9999 );

	this.pColor = settings.signalColor;
	this.pSize = settings.signalSize;

	for ( var ii = 0; ii < this.poolSize; ii++ ) {
		this.particles[ ii ] = new Particle( this );
	}

	this.meshComponents = new THREE.Object3D();

	// inner particle
	this.pMat = new THREE.PointCloudMaterial( {
		map: this.spriteTextureSignal,
		size: this.pSize,
		color: this.pColor,
		blending: THREE.AdditiveBlending,
		depthTest: false,
		transparent: true
	} );

	this.pMesh = new THREE.PointCloud( this.pGeom, this.pMat );
	this.pMesh.frustumCulled = false;

	this.meshComponents.add( this.pMesh );


	// outer particle glow
	this.pMat_outer = this.pMat.clone();
	this.pMat_outer.size = this.pSize * 10;
	this.pMat_outer.opacity = 0.04;

	this.pMesh_outer = new THREE.PointCloud( this.pGeom, this.pMat_outer );
	this.pMesh_outer.frustumCulled = false;

	this.meshComponents.add( this.pMesh_outer );

}

ParticlePool.prototype.getAvgExecutionTime = function () {
	return this.profTime / this.itt;
};

ParticlePool.prototype.getParticle = function () {

	for ( var ii = 0; ii < this.poolSize; ii++ ) {
		var p = this.particles[ ii ];
		if ( p.available ) {
			this.lastAvailableIdx = ii;
			p.available = false;
			return p;
		}
	}

	console.error( "ParticlePool.prototype.getParticle return null" );
	return null;

};

ParticlePool.prototype.update = function () {

	this.pGeom.verticesNeedUpdate = true;

};

ParticlePool.prototype.updateSettings = function () {

	// inner particle
	this.pMat.color.setStyle( this.pColor );
	this.pMat.size = this.pSize;
	// outer particle
	this.pMat_outer.color.setStyle( this.pColor );
	this.pMat_outer.size = this.pSize * 10;

};

// Particle --------------------------------------------------------------
// Private class for particle pool

function Particle( particlePool ) {

	this.particlePool = particlePool;
	this.available = true;
	THREE.Vector3.call( this, this.particlePool.offScreenPos.x, this.particlePool.offScreenPos.y, this.particlePool.offScreenPos.z );

}

Particle.prototype = Object.create( THREE.Vector3.prototype );

Particle.prototype.free = function () {

	this.available = true;
	this.set( this.particlePool.offScreenPos.x, this.particlePool.offScreenPos.y, this.particlePool.offScreenPos.z );

};

// Axon extends THREE.CubicBezierCurve3 ------------------------------------------------------------------
/* exported Axon, Connection */

function Axon( neuronA, neuronB ) {

	this.bezierSubdivision = 8;
	this.neuronA = neuronA;
	this.neuronB = neuronB;
	this.cpLength = neuronA.distanceTo( neuronB ) / THREE.Math.randFloat( 1.5, 4.0 );
	this.controlPointA = this.getControlPoint( neuronA, neuronB );
	this.controlPointB = this.getControlPoint( neuronB, neuronA );
	THREE.CubicBezierCurve3.call( this, this.neuronA, this.controlPointA, this.controlPointB, this.neuronB );

	this.vertices = this.getSubdividedVertices();

}

Axon.prototype = Object.create( THREE.CubicBezierCurve3.prototype );

Axon.prototype.getSubdividedVertices = function () {
	return this.getSpacedPoints( this.bezierSubdivision );
};

// generate uniformly distribute vector within x-theta cone from arbitrary vector v1, v2
Axon.prototype.getControlPoint = function ( v1, v2 ) {

	var dirVec = new THREE.Vector3().copy( v2 ).sub( v1 ).normalize();
	var northPole = new THREE.Vector3( 0, 0, 1 ); // this is original axis where point get sampled
	var axis = new THREE.Vector3().crossVectors( northPole, dirVec ).normalize(); // get axis of rotation from original axis to dirVec
	var axisTheta = dirVec.angleTo( northPole ); // get angle
	var rotMat = new THREE.Matrix4().makeRotationAxis( axis, axisTheta ); // build rotation matrix

	var minz = Math.cos( THREE.Math.degToRad( 45 ) ); // cone spread in degrees
	var z = THREE.Math.randFloat( minz, 1 );
	var theta = THREE.Math.randFloat( 0, Math.PI * 2 );
	var r = Math.sqrt( 1 - z * z );
	var cpPos = new THREE.Vector3( r * Math.cos( theta ), r * Math.sin( theta ), z );
	cpPos.multiplyScalar( this.cpLength ); // length of cpPoint
	cpPos.applyMatrix4( rotMat ); // rotate to dirVec
	cpPos.add( v1 ); // translate to v1
	return cpPos;

};

// Connection ------------------------------------------------------------
function Connection( axon, startingPoint ) {
	this.axon = axon;
	this.startingPoint = startingPoint;
}

// Neural Network --------------------------------------------------------

var defaults = {
		verticesSkipStep: 3,
		maxAxonDist: 10,
		maxConnectionsPerNeuron: 6,
		signalSize: .6,
	    signalColor: '#FF4400',
		signalMinSpeed: 1.75,
		signalMaxSpeed: 3.25,
		currentMaxSignals: 3000,
		limitSignals: 10000,
    	axonColor: '#0099FF',
    	axonOpacityMultiplier: .5,
    	neuronSizeMultiplier: 1.0,
		neuronColor: '#00FFFF',
		neuronOpacity: .75
	};

function NeuralNetwork(settings) {

	this.initialized = false;

    this.settings = extend( defaults, settings || {} );

	this.meshComponents = new THREE.Object3D();
	this.particlePool = new ParticlePool( this.settings );
	this.meshComponents.add( this.particlePool.meshComponents );

	// NN component containers
	this.components = {
		neurons: [],
		allSignals: [],
		allAxons: []
	};

	// axon
	this.axonGeom = new THREE.BufferGeometry();
	this.axonPositions = [];
	this.axonIndices = [];
	this.axonNextPositionsIndex = 0;

	this.axonUniforms = {
		color: {
			type: 'c',
			value: new THREE.Color( this.settings.axonColor )
		},
		opacityMultiplier: {
			type: 'f',
			value: this.settings.axonOpacityMultiplier
		}
	};

	this.axonAttributes = {
		opacity: {
			type: 'f',
			value: []
		}
	};

	// neuron
	this.spriteTextureNeuron = TEXTURES.electric;
	this.neuronsGeom = new THREE.Geometry();

	this.neuronUniforms = {
		sizeMultiplier: {
			type: 'f',
			value: this.settings.neuronSizeMultiplier
		},
		opacity: {
			type: 'f',
			value: this.settings.neuronOpacity
		},
		texture: {
			type: 't',
			value: this.spriteTextureNeuron
		}
	};

	this.neuronAttributes = {
		color: {
			type: 'c',
			value: []
		},
		size: {
			type: 'f',
			value: []
		}
	};

	this.neuronShaderMaterial = new THREE.ShaderMaterial( {

		uniforms: this.neuronUniforms,
		attributes: this.neuronAttributes,
		vertexShader: null,
		fragmentShader: null,
		blending: THREE.AdditiveBlending,
		transparent: true,
		depthTest: false

	} );

	// info api
	this.numNeurons = 0;
	this.numAxons = 0;
	this.numSignals = 0;

	this.numPassive = 0;

	// initialize NN
	this.initNeuralNetwork();

}

NeuralNetwork.prototype.initNeuralNetwork = function () {

	this.initNeurons( OBJ_MODELS.brain.geometry.vertices );
	this.initAxons();

	this.neuronShaderMaterial.vertexShader = SHADER_CONTAINER.neuronVert;
	this.neuronShaderMaterial.fragmentShader = SHADER_CONTAINER.neuronFrag;

	this.axonShaderMaterial.vertexShader = SHADER_CONTAINER.axonVert;
	this.axonShaderMaterial.fragmentShader = SHADER_CONTAINER.axonFrag;

	this.initialized = true;

};

NeuralNetwork.prototype.initNeurons = function ( inputVertices ) {

	var i;
	for ( i = 0; i < inputVertices.length; i += this.settings.verticesSkipStep ) {
		var pos = inputVertices[ i ];
		var n = new Neuron( pos.x, pos.y, pos.z );
		this.components.neurons.push( n );
		this.neuronsGeom.vertices.push( n );
		// dont set neuron's property here because its skip vertices
	}

	// set neuron attributes value
	for ( i = 0; i < this.components.neurons.length; i++ ) {
		this.neuronAttributes.color.value[ i ] = new THREE.Color( this.settings.neuronColor ); // initial neuron color
		this.neuronAttributes.size.value[ i ] = THREE.Math.randFloat( 0.75, 3.0 ); // initial neuron size
	}


	// neuron mesh
	this.neuronParticles = new THREE.PointCloud( this.neuronsGeom, this.neuronShaderMaterial );
	this.meshComponents.add( this.neuronParticles );

	this.neuronShaderMaterial.needsUpdate = true;

};

NeuralNetwork.prototype.initAxons = function () {

	var allNeuronsLength = this.components.neurons.length;
	for ( var j = 0; j < allNeuronsLength; j++ ) {
		var n1 = this.components.neurons[ j ];
		for ( var k = j + 1; k < allNeuronsLength; k++ ) {
			var n2 = this.components.neurons[ k ];
			// connect neuron if distance is within threshold and limit maximum connection per neuron
			if ( n1 !== n2 && n1.distanceTo( n2 ) < this.settings.maxAxonDist &&
				n1.connection.length < this.settings.maxConnectionsPerNeuron &&
				n2.connection.length < this.settings.maxConnectionsPerNeuron ) {
				var connectedAxon = n1.connectNeuronTo( n2 );
				this.constructAxonArrayBuffer( connectedAxon );
			}
		}
	}

	// enable WebGL 32 bit index buffer or get an error
	if ( !getAppInstance().renderer.getContext().getExtension( "OES_element_index_uint" ) ) {
		console.error( "32bit index buffer not supported!" );
	}

	var axonIndices = new Uint32Array( this.axonIndices );
	var axonPositions = new Float32Array( this.axonPositions );
	var axonOpacities = new Float32Array( this.axonAttributes.opacity.value );

	this.axonGeom.addAttribute( 'index', new THREE.BufferAttribute( axonIndices, 1 ) );
	this.axonGeom.addAttribute( 'position', new THREE.BufferAttribute( axonPositions, 3 ) );
	this.axonGeom.addAttribute( 'opacity', new THREE.BufferAttribute( axonOpacities, 1 ) );
	this.axonGeom.computeBoundingSphere();

	this.axonShaderMaterial = new THREE.ShaderMaterial( {
		uniforms: this.axonUniforms,
		attributes: this.axonAttributes,
		vertexShader: null,
		fragmentShader: null,
		blending: THREE.AdditiveBlending,
		depthTest: false,
		transparent: true
	} );

	this.axonMesh = new THREE.Line( this.axonGeom, this.axonShaderMaterial, THREE.LinePieces );
	this.meshComponents.add( this.axonMesh );


	var numNotConnected = 0;
	for ( var i = 0; i < allNeuronsLength; i++ ) {
		if ( !this.components.neurons[ i ].connection[ 0 ] ) {
			numNotConnected += 1;
		}
	}

	if (this.settings.debug) {
        console.log( 'Number not connected neurons', numNotConnected );
	}
};

NeuralNetwork.prototype.update = function ( deltaTime ) {

	if ( !this.initialized ) return;

	var n, ii;
	var currentTime = Date.now();

	// update neurons state and release signal
	for ( ii = 0; ii < this.components.neurons.length; ii++ ) {

		n = this.components.neurons[ ii ];

		if ( this.components.allSignals.length < this.settings.currentMaxSignals - this.settings.maxConnectionsPerNeuron ) { // limit total signals currentMaxSignals - maxConnectionsPerNeuron because allSignals can not bigger than particlePool size

			if ( n.receivedSignal && n.firedCount < 8 ) { // Traversal mode
				// if (n.receivedSignal && (currentTime - n.lastSignalRelease > n.releaseDelay) && n.firedCount < 8)  {	// Random mode
				// if (n.receivedSignal && !n.fired )  {	// Single propagation mode
				n.fired = true;
				n.lastSignalRelease = currentTime;
				n.releaseDelay = THREE.Math.randInt( 100, 1000 );
				this.releaseSignalAt( n );
			}

		}

		n.receivedSignal = false; // if neuron recieved signal but still in delay reset it
	}

	// reset all neurons and when there is no signal and trigger release signal at random neuron
	if ( this.components.allSignals.length === 0 ) {

		this.resetAllNeurons();
		this.releaseSignalAt( this.components.neurons[ THREE.Math.randInt( 0, this.components.neurons.length ) ] );

	}

	// update and remove dead signals
	for ( var j = this.components.allSignals.length - 1; j >= 0; j-- ) {
		var s = this.components.allSignals[ j ];
		s.travel( deltaTime );

		if ( !s.alive ) {
			s.particle.free();
			for ( var k = this.components.allSignals.length - 1; k >= 0; k-- ) {
				if ( s === this.components.allSignals[ k ] ) {
					this.components.allSignals.splice( k, 1 );
					break;
				}
			}
		}

	}

	// update particle pool vertices
	this.particlePool.update();

	// update info for GUI
	this.updateInfo();

};

NeuralNetwork.prototype.constructAxonArrayBuffer = function ( axon ) {
	this.components.allAxons.push( axon );
	var vertices = axon.vertices;

	for ( var i = 0; i < vertices.length; i++ ) {

		this.axonPositions.push( vertices[ i ].x, vertices[ i ].y, vertices[ i ].z );

		if ( i < vertices.length - 1 ) {
			var idx = this.axonNextPositionsIndex;
			this.axonIndices.push( idx, idx + 1 );

			var opacity = THREE.Math.randFloat( 0.005, 0.2 );
			this.axonAttributes.opacity.value.push( opacity, opacity );

		}

		this.axonNextPositionsIndex += 1;
	}
};

NeuralNetwork.prototype.releaseSignalAt = function ( neuron ) {
	var signals = neuron.createSignal( this.particlePool, this.settings.signalMinSpeed, this.settings.signalMaxSpeed );
	for ( var ii = 0; ii < signals.length; ii++ ) {
		var s = signals[ ii ];
		this.components.allSignals.push( s );
	}
};

NeuralNetwork.prototype.resetAllNeurons = function () {

	this.numPassive = 0;
	for ( var ii = 0, n; ii < this.components.neurons.length; ii++ ) { // reset all neuron state
		n = this.components.neurons[ ii ];

		if ( !n.fired ) {
			this.numPassive += 1;
		}

		n.reset();

	}
	// console.log( 'numPassive =', this.numPassive );

};

NeuralNetwork.prototype.updateInfo = function () {
	this.numNeurons = this.components.neurons.length;
	this.numAxons = this.components.allAxons.length;
	this.numSignals = this.components.allSignals.length;
};

NeuralNetwork.prototype.updateSettings = function () {

	this.neuronUniforms.opacity.value = this.settings.neuronOpacity;

	for ( var i = 0; i < this.components.neurons.length; i++ ) {
		this.neuronAttributes.color.value[ i ].setStyle( this.settings.neuronColor ); // initial neuron color
	}
	this.neuronAttributes.color.needsUpdate = true;

	this.neuronUniforms.sizeMultiplier.value = this.settings.neuronSizeMultiplier;

	this.axonUniforms.color.value.set( this.settings.axonColor );
	this.axonUniforms.opacityMultiplier.value = this.settings.axonOpacityMultiplier;

	this.particlePool.updateSettings();


};

NeuralNetwork.prototype.testChangOpcAttr = function () {

	var opcArr = this.axonGeom.attributes.opacity.array;
	for ( var i = 0; i < opcArr.length; i++ ) {
		opcArr[ i ] = THREE.Math.randFloat( 0, 0.5 );
	}
	this.axonGeom.attributes.opacity.needsUpdate = true;
};

// Scene --------------------------------------------------------

var SHADER_CONTAINER = {},
    OBJ_MODELS = {},
    TEXTURES = {},
    app,
    appDefaults = {
        debug: 1,
        baseURL: '',
        testSupport: 0,
        pause: 0,
        runOnLoad: 1,
        spinner: document.getElementById( 'loading' ),
        bgColor: 0x0d0d0f,
        gui: 1,
        stats: 1,
        enableHelpers: 1,
        mouseInterface: 1,
        initialPosition: {
            x: 61,
            y: 51,
            z: 44
        },
        neuralNet: {
            /* see  neuralnet.js */
            },
        travel: {
            easing: TWEEN.Easing.Quadratic.Out,
            duration: 600,
            range: {
                x: [0, 69],
                y: [0, 69],
                z: [0, 69]
            }
        }
    },
    App = function(settings ) {
        var self = this;

        self.settings = extend( appDefaults, settings || {} );
        self.settings.neuralNet.debug = self.settings.debug;

        if (!settings.container) {
            throw Error('No container element provided.');
        }

        if (!self.checkSupport()) {
            throw Error('WebGL is not supported by your browser.');
        }

        self.load();
        bindDOMEvents.call(self);

        self.WIDTH = window.innerWidth;
        self.HEIGHT = window.innerHeight;
        self.pixelRatio = window.devicePixelRatio || 1;
        self.screenRatio = self.WIDTH / self.HEIGHT;
        self.clock = new THREE.Clock();

        // ---- Scene
        self.container = settings.container;
        self.scene = new THREE.Scene();

        // ---- Camera
        self.camera = new THREE.PerspectiveCamera( 75, self.screenRatio, 10, 5000 );
        self.camera.position.set(
            self.settings.initialPosition.x,
            self.settings.initialPosition.y,
            self.settings.initialPosition.z
        );
        self.camera.lookAt(new THREE.Vector3(0, 0, 0));

        // ---- Camera orbit control
        if (self.settings.mouseInterface) {
            self.cameraCtrl = new THREE.OrbitControls( self.camera, self.container );
            self.cameraCtrl.update();
        }

        // ---- Camera travelling settings
        self.canTravel = 1;

        // ---- Renderer
        self.renderer = new THREE.WebGLRenderer( {
            antialias: true,
            alpha: true
        } );
        self.renderer.setSize( self.WIDTH, self.HEIGHT );
        self.renderer.setPixelRatio( self.pixelRatio );
        self.renderer.setClearColor( self.settings.bgColor, 1 );
        self.renderer.autoClear = false;
        self.container.appendChild( self.renderer.domElement );

        // ---- Stats
        if (self.settings.stats) {
            self.stats = new Stats();
            self.container.appendChild( self.stats.domElement );
        }

        // ---- grid & axis helper
        if (self.settings.enableHelpers) {
            self.gridHelper = new THREE.GridHelper( 600, 50 );
            self.gridHelper.setColors( 0x00bbff, 0xffffff );
            self.gridHelper.material.opacity = 0.1;
            self.gridHelper.material.transparent = true;
            self.gridHelper.position.y = -300;
            self.scene.add( self.gridHelper );

            self.axisHelper = new THREE.AxisHelper( 50 );
            self.scene.add( self.axisHelper );

            this.settings.enableAxisHelper = this.settings.enableGridHelper = 1;
        }
    };

// Kinda singleton -----------------------------------------------------------------------------------------------------

function getAppInstance(settings) {
    return app || (app = new App(settings));
}

// Start, run & draw loop ----------------------------------------------------------------------------------------------

function update () {
    if (this.settings.enableHelpers) {
        updateHelpers.call(this);
    }
    if ( !this.settings.pause ) {
        this.neuralNet.update( this.clock.getDelta() );
        if (this.settings.gui) {
            updateGuiInfo.call(this);
        }
    }
}

function updateHelpers () {
    this.axisHelper.visible = this.settings.enableAxisHelper;
    this.gridHelper.visible = this.settings.enableGridHelper;
}

function run () {
    var self = this;
    TWEEN.update();
    requestAnimationFrame( function(){ run.call(self) } );
    this.renderer.setClearColor( this.settings.bgColor, 1 );
    this.renderer.clear();
    update.call(this);
    this.renderer.render( this.scene, this.camera );
    if (this.settings.stats) {
        this.stats.update();
    }
}

App.prototype.start = function () {
    if (this.isRunning) { return this; }
    this.neuralNet = new NeuralNetwork(this.settings.neuralNet);
    this.scene.add( this.neuralNet.meshComponents );
    if (this.settings.gui) {
        this.initGui();
    }
    run.call(this);
    this.isRunning = 1;
    return this;
};

// Event shortcut ------------------------------------------------------------------------------------------------------

App.prototype.on = function (name, callback) {
    this.scene.addEventListener(name, callback);
    return this;
};

// Camera Travelling ---------------------------------------------------------------------------------------------------

App.prototype.travelRandom = function(duration) {
    var travelRange = this.settings.travel.range;
    return this.travel({
        x: random(travelRange.x[0], travelRange.x[1]),
        y: random(travelRange.y[0], travelRange.y[1]),
        z: random(travelRange.z[0], travelRange.z[1])
    }, duration);
};

App.prototype.travel = function(to, duration) {
    var self = this,
        settings = self.settings.travel,
        from = {
            x: self.camera.position.x,
            y: self.camera.position.y,
            z: self.camera.position.z
        },
        toVector = new THREE.Vector3(to.x, to.y, to.y);

    if (!self.canTravel) return;

    new TWEEN.Tween(from)
        .to(to, duration || settings.duration)
        .easing(settings.easing)
        .onStart(function(){
            self.canTravel = 0;
            self.scene.dispatchEvent({
                type: 'travelStart',
                position: self.camera.position,
                distance: self.camera.position.distanceTo(toVector)
            });
        })
        .onUpdate(function () {
            self.camera.position.set(this.x, this.y, this.z);
            self.camera.lookAt(new THREE.Vector3(0, 0, 0));
            self.scene.dispatchEvent({
                type: 'travelUpdate',
                position: self.camera.position,
                distance: self.camera.position.distanceTo(toVector)
            });
        })
        .onComplete(function () {
            self.camera.lookAt(new THREE.Vector3(0, 0, 0));
            self.canTravel = 1;
            self.scene.dispatchEvent({
                type: 'travelEnd',
                position: self.camera.position,
                distance: 0
            });
        })
        .start();

    return this;
};

// Helpers -------------------------------------------------------------------------------------------------------------

App.prototype.checkSupport = function () {
    return ( function () { try { var canvas = document.createElement( 'canvas' ); return !! ( window.WebGLRenderingContext && ( canvas.getContext( 'webgl' ) || canvas.getContext( 'experimental-webgl' ) ) ); } catch( e ) { return false; } } )();
};

App.prototype.onWindowResize = function () {
    this.WIDTH = window.innerWidth;
    this.HEIGHT = window.innerHeight;
    this.screenRatio = this.WIDTH / this.HEIGHT;
    this.camera.aspect = this.screenRatio;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize( this.WIDTH, this.HEIGHT );
    this.renderer.setPixelRatio( this.pixelRatio );
};

// Events --------------------------------------------------------------------------------------------------------------

function bindDOMEvents () {
    var self = this,
        settings = self.settings,
        win = window;

    // delay resize handler
    win.addEventListener('load', function(){
        var timerID;
        win.addEventListener('resize', function () {
            clearTimeout( timerID );
            timerID = setTimeout( function () {
                self.onWindowResize();
            }, 250 );
        } );
    } );

    if (settings.enableHelpers) {
        win.addEventListener( 'keypress', function ( event ) {
            switch ( event.keyCode ) {
                case 32:/*space bar*/
                    settings.pause = !settings.pause;
                    break;
                case 65:/*A*/
                case 97:/*a*/
                    settings.enableGridHelper = !settings.enableGridHelper;
                    break;
                case 83 :/*S*/
                case 115:/*s*/
                    settings.enableAxisHelper = !settings.enableAxisHelper;
                    break;
            }
        } );
    }
}

// Assets & Loaders ----------------------------------------------------------------------------------------------------

App.prototype.load = function () {
    var self = this,
        settings = self.settings,
        baseURL = settings.baseURL,
        loadingManager = new THREE.LoadingManager(),
        shaderLoader = new THREE.XHRLoader( loadingManager ),
        OBJloader = new THREE.OBJLoader( loadingManager ),
        textureLoader = new THREE.TextureLoader( loadingManager );

    loadingManager.onLoad = function () {
        if (settings.spinner) {
            settings.spinner.style.display = 'none';
        }
        if (settings.debug) {
            console.log( 'Done loading.' );
        }
        self.scene.dispatchEvent({
            type: 'loaded'
        });
        if (settings.runOnLoad) {
            self.start();
        }
    };

    loadingManager.onProgress = function ( item, loaded, total ) {
        self.scene.dispatchEvent({
            type: 'loading',
            item: item,
            index: loaded,
            total: total
        });
        if (settings.debug) {
            console.log( loaded + '/' + total, item );
        }
    };

    shaderLoader.setResponseType( 'text' );
    shaderLoader.loadMultiple = function ( SHADER_CONTAINER, urlObj ) {
        var keys = Object.keys(urlObj);
        keys.forEach( function ( key ) {
            shaderLoader.load( urlObj[key], function ( shader ) {
                SHADER_CONTAINER[ key ] = shader;
            });
        });
    };

    shaderLoader.loadMultiple( SHADER_CONTAINER, {
        neuronVert: baseURL + 'shaders/neuron.vert',
        neuronFrag: baseURL + 'shaders/neuron.frag',
        axonVert: baseURL + 'shaders/axon.vert',
        axonFrag: baseURL + 'shaders/axon.frag'
    });

    function getRandom(arr, n) {
        var result = new Array(n),
            len = arr.length,
            taken = new Array(len);
        if (n > len)
            throw new RangeError("getRandom: more elements taken than available");
        while (n--) {
            var x = Math.floor(Math.random() * len);
            result[n] = arr[x in taken ? taken[x] : x];
            taken[x] = --len;
        }
        return result;
    }

    OBJloader.load( baseURL + 'models/brain_vertex_low.obj', function ( model ) {

        if (settings.debug) {
            console.log('Original vertices count', model.children[0].geometry.vertices.length );
        }

        OBJ_MODELS.brain = model.children[ 0 ];
    });

    textureLoader.load( baseURL + 'sprites/electric.png', function ( tex ) {
        TEXTURES.electric = tex;
    });
};

// GUI -----------------------------------------------------------------------------------------------------------------

App.prototype.initGui = function () {
    this.gui = new dat.GUI();
    this.gui.width = 270;

    this.gui_info = this.gui.addFolder( 'Info' );
    this.gui_info.add( this.neuralNet, 'numNeurons' ).name( 'Neurons' );
    this.gui_info.add( this.neuralNet, 'numAxons' ).name( 'Axons' );
    this.gui_info.add( this.neuralNet, 'numSignals', 0, this.neuralNet.settings.limitSignals ).name( 'Signals' );
    this.gui_info.autoListen = false;

    this.gui_settings = this.gui.addFolder( 'Settings' );
    this.gui_settings.add( this.neuralNet.settings, 'currentMaxSignals', 0, this.neuralNet.settings.limitSignals ).name( 'Max Signals' );
    this.gui_settings.add( this.neuralNet.particlePool, 'pSize', 0.2, 2 ).name( 'Signal Size' );
    this.gui_settings.add( this.neuralNet.settings, 'signalMinSpeed', 0.0, 8.0, 0.01 ).name( 'Signal Min Speed' );
    this.gui_settings.add( this.neuralNet.settings, 'signalMaxSpeed', 0.0, 8.0, 0.01 ).name( 'Signal Max Speed' );
    this.gui_settings.add( this.neuralNet.settings, 'neuronSizeMultiplier', 0, 2 ).name( 'Neuron Size Mult' );
    this.gui_settings.add( this.neuralNet.settings, 'neuronOpacity', 0, 1.0 ).name( 'Neuron Opacity' );
    this.gui_settings.add( this.neuralNet.settings, 'axonOpacityMultiplier', 0.0, 5.0 ).name( 'Axon Opacity Mult' );
    this.gui_settings.addColor( this.neuralNet.particlePool, 'pColor' ).name( 'Signal Color' );
    this.gui_settings.addColor( this.neuralNet.settings, 'neuronColor' ).name( 'Neuron Color' );
    this.gui_settings.addColor( this.neuralNet.settings, 'axonColor' ).name( 'Axon Color' );
    this.gui_settings.addColor( this.settings, 'bgColor' ).name( 'Background' );

    this.gui_info.open();
    this.gui_settings.open();

    for ( var i = 0; i < this.gui_settings.__controllers.length; i++ ) {
        this.gui_settings.__controllers[ i ].onChange( updateNeuralNetworkSettings.bind(this) );
    }
};

function updateNeuralNetworkSettings() {
    this.neuralNet.updateSettings();
    if ( this.neuralNet.settings.signalMinSpeed > this.neuralNet.settings.signalMaxSpeed ) {
        this.neuralNet.settings.signalMaxSpeed = this.neuralNet.settings.signalMinSpeed;
        this.gui_settings.__controllers[ 3 ].updateDisplay();
    }
}

function updateGuiInfo() {
    for ( var i = 0; i < this.gui_info.__controllers.length; i++ ) {
        this.gui_info.__controllers[ i ].updateDisplay();
    }
}