
    var publicInterface = function(settings) {
        return getAppInstance(settings);
    };

    // UMD
    if (typeof define === 'function' && define.amd) {
        define([], function(){ return publicInterface; });
    } else if (typeof module === 'object' && module.exports) {
        module.exports = publicInterface;
    } else {
        window.neuralNet = publicInterface;
    }
} ( window, document ) );