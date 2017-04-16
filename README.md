# Neural Network

Same as [nxxcxx/Neural-Network](https://github.com/nxxcxx/Neural-Network) except code has been grouped into a module,
exposing public settings and methods to interact with and animate the neural network.

([original demo](http://nxxcxx.github.io/Neural-Network/))  

## Main settings and methods

#### neuralNet(settings)

Instantiate the neural network load the assets, and returns the instance to interact with it

#### neuralNet.camera

Three.js PerspectiveCamera instance

#### neuralNet.checkSupport()

Test browser support for Three.js

#### neuralNet.on(type, callback)

Shortcut to Three.js' ``addEventlistener`, currently implemented event:
- ``loaded``, fire when assets are loaded
- ``loading``, on progress load handler
- ``travelStart``, when starting camera movement
- ``travelUpdate``, when Tween.js updates camera position
- ``travelEnd``, when Tween.jhs completes

#### neuralNet.rendered

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
        range: {
            x: [0, 69],
            y: [0, 69],
            z: [0, 69]
        }
```

#### neuralNet.scene

Three.js Scene instance

#### neuralNet.start()

Start the rendering (if not already started with ``runOnLoad`` above)

#### neuralNet.travel(to, duration)

Dispatches the travel* event listed above.

#### neuralNet.travelRandom(duration)

Dispatches the travel* event listed above.
  
  
![](https://raw.githubusercontent.com/nxxcxx/Neural-Network/gh-pages/screenshot.jpg)
