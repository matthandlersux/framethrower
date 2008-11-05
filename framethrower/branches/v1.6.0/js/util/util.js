// http://javascript.crockford.com/remedial.html
function typeOf(value){
    var s = typeof value;
    if (s === 'object') {
        if (value) {
            if (value instanceof Array) {
                s = 'array';
            }
        }
        else {
            s = 'null';
        }
    }
    return s;
}

// Arrays/Objects

function arrayLike(o) {
	if (typeOf(o.length) === "number") {
		return true;
	} else {
		return false;
	}
}
function objectLike(o) {
	if (typeOf(o) === "object") {
		return true;
	} else {
		return false;
	}
}

function forEach(o, f) {
	if (arrayLike(o)) {
		for (var i = 0, len = o.length; i < len; i++) {
			f(o[i], i);
		}
	} else if (objectLike(o)) {
		for (var i in o) if (o.hasOwnProperty(i)) {
			f(o[i], i);
		}
	}
}

function forEachRecursive(o, f) {
	forEach(o, function (value, key) {
		f(value, key);
		forEachRecursive(value, f);
	});
}

function map(list, f) {
	var ret = [];
	forEach(list, function (val, key) {
		ret[key] = f(val);
	});
	return ret;
}
function filter(list, pred) {
	var ret = [];
	forEach(list, function (val, key) {
		if (pred(val, key)) {
			ret.push(val);
		}
	});
	return ret;
}

function any(o, f) {
	if (arrayLike(o)) {
		for (var i = 0, len = o.length; i < len; i++) {
			if (f(o[i], i)) {
				return true;
			}
		}
	} else if (typeOf(o) === "object") {
		for (var i in o) if (o.hasOwnProperty(i)) {
			if (f(o[i], i)) {
				return true;
			}
		}
	}
	return false;
}
function all(o, f) {
	return !any(o, function (v, k) {
		return !f(v, k);
	});
}
function isEmpty(o) {
	return !any(o, function () {
		return true;
	});
}

function values(o) {
	var ret = [];
	forEach(o, function (v, k) {
		ret.push(v);
	});
	return ret;
}
function keys(o) {
	var ret = [];
	forEach(o, function (v, k) {
		ret.push(k);
	});
	return ret;
}


function getProp(name) {
	return function (o) {
		return o[name];
	};
}