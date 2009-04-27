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
	if (typeOf(o.length) === "number" && typeof o !== "string") {
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

function forEachReverse(o, f) {
	if (arrayLike(o)) {
		for (var i = o.length - 1; i >= 0; i--) {
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
	var ret;
	if (arrayLike(list)) ret = [];
	else ret = {};
	
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

function forEachRegexp(s, regexp, f) {
	var result;
	while ((result = regexp.exec(s)) != null) {
		f(result[0]);
	}
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
function contains(o, e) {
	return any(o, function (x) {
		return e === x;
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

// used for merging objects/records
function merge() {
	var ret = {};
	forEach(arguments, function (arg) {
		forEach(arg, function (v, k) {
			ret[k] = v;
		});
	});
	return ret;
}
// optimized
function mergeInto(o, into) {
	forEach(o, function (v, k) {
		into[k] = v;
	});
}


function getProp(name) {
	return function (o) {
		return o[name];
	};
}


function curry(f, expects) {
	if (expects === undefined) expects = f.length;
	function accumulate(savedArgs) {
		if (savedArgs.length === expects) {
			return f.apply(null, savedArgs);
		} else {
			return function (arg) {
				var newSavedArgs = savedArgs.slice(0); // copy
				newSavedArgs.push(arg);
				return accumulate(newSavedArgs);
			};
		}
	}
	return accumulate([]);
}



function getter(value) {
	return function () {
		return value;
	};
}



function makeGenerator(prefix) {
	var count = 0;
	return function () {
		count += 1;
		return prefix + count;
	};
}

function capFirst(s) {
	return (s.substring(0,1)).toUpperCase() + s.substring(1);
}





function emptyFunction() {
	
}

