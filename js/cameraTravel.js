// Camera Movements --------------------------------------------------------

var debug = 1,
    mayTravel = 1,
    duration = 600,
    xRange = [-69, 69],
    yRange = [-69, 69],
    zRange = [-69, 69];

function random(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

if (debug) {
    console.log(camera.position);
    container.addEventListener( 'mouseup', function(){
        console.log(camera.position);
    }, false );
}

function travel () {
    var from = {
            x: camera.position.x,
            y: camera.position.y,
            z: camera.position.z
        },
        to = {
            x: random(xRange[0], xRange[1]),
            y: random(yRange[0], yRange[1]),
            z: random(zRange[0], zRange[1])
        };

    mayTravel = 0;

    new TWEEN.Tween(from)
        .to(to, duration)
        .easing(TWEEN.Easing.Linear.None)
        .onUpdate(function () {
            camera.position.set(this.x, this.y, this.z);
            camera.lookAt(new THREE.Vector3(0, 0, 0));
        })
        .onComplete(function () {
            camera.lookAt(new THREE.Vector3(0, 0, 0));
            mayTravel = 1;
        })
        .start();
}