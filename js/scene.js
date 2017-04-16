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