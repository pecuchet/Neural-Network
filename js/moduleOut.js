    function isValidRange (range) {
        if (!range || !(typeof range === 'object' && range.length) || range.length < 2 ) {
            console.error('Range should be an array with two integers');
            return false;
        }
        return true;
    }

    var publicInterface = {
            container : null,
            run: function() {
                main();
            },
            onLoad: null,
            scene : {
                setContainer : function(c) {
                    container = c;
                }
            },
            travel : {
                go: travel,
                setDuration : function (d) {
                    return duration = d;
                },
                setXRange : function (range) {
                    return isValidRange(range) ? xRange = range : xRange;
                },
                setYRange : function (range) {
                    return isValidRange(range) ? yRange = range : yRange;
                },
                setZRange : function (range) {
                    return isValidRange(range) ? zRange = range : zRange;
                }
            }
        };

    // UMD
    if (typeof define === 'function' && define.amd) {
        define([], function(){ return publicInterface; });
    } else if (typeof module === 'object' && module.exports) {
        module.exports = publicInterface;
    } else {
        window.nn = publicInterface;
    }
} ( window, document ) );