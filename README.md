# Neural Network

Same as [nxxcxx/Neural-Network](https://github.com/nxxcxx/Neural-Network), except code has been grouped into a module,
exposing public settings and methods to interact with the neural network. Basic methods have also been added 
to animate the camera (randomly or to a specific 3D point). The camera movements are done through Tween.js, which
is setup to fire events during animation.

([original demo](http://nxxcxx.github.io/Neural-Network/))  

## Main settings and methods

#### neuralNet(settings)

Instantiates the neural network, loads the assets, and returns the instance to interact with it

#### neuralNet.camera

Three.js PerspectiveCamera instance

#### neuralNet.checkSupport()

Test browser support for Three.js

#### neuralNet.on(type, callback)

Shortcut to Three.js' ``addEventlistener``, currently implemented events:
- ``loaded``, fire when assets are loaded
- ``loading``, on progress load handler
- ``travelStart``, when starting camera movement
- ``travelUpdate``, when Tween.js updates camera position
- ``travelEnd``, when Tween.js completes

#### neuralNet.renderer

Three.js WebGLRenderer instance

#### neuralNet.settings

```
    debug: 1,
    baseURL: '',       // for assets
    testSupport: 0,    // on instantiation
    pause: 0,          // pause signal animation
    runOnLoad: 1,
    spinner: document.getElementById( 'loading' ),
    bgColor: 0x0d0d0f,
    gui: 1,             // use graphical interface
    stats: 1,           // show fps stats
    enableHelpers: 1,   // perspective helpers
    mouseInterface: 1,  // enable OrbitControls
    initialPosition: {
        x: 61,
        y: 51,
        z: 44
    },
    neuralNet: {
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
    },
    travel: {             // camera movements
        easing: TWEEN.Easing.Quadratic.Out,
        duration: 600,
        range: {         // for travelRandom, min-max values for the camera position
            x: [0, 69],
            y: [0, 69],
            z: [0, 69]
        }
```

#### neuralNet.scene

Three.js Scene instance

#### neuralNet.start()

Start the rendering (if not already started). Can be started automatically with ``runOnLoad`` in the ``settings`` object.  

#### neuralNet.travel(to, duration)

Takes an object with ``x``, ``y`` and ``z`` as properties, a float as ``duration`` or defaults to ``settings.travel.duration``.  
Dispatches the ``travel*`` events listed above.

#### neuralNet.travelAlong(axis, distance, duration)

Takes a string with 'x' 'y' or 'z' as value for ``axis`` and a float for distance and duration.  
Dispatches the ``travel*`` events listed above.

#### neuralNet.travelRandom(duration)

Randomly animate the camera position. The random position is constrained by ``settings.travel.range`` ``x``, ``y`` and ``z``.  
Dispatches the ``travel*`` events listed above.
  
  
![](https://raw.githubusercontent.com/nxxcxx/Neural-Network/gh-pages/screenshot.jpg)
