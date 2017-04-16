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