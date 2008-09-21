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

// used for merging objects
function merge() {
	var ret = {};
	forEach(arguments, function (arg) {
		forEach(arg, function (v, k) {
			ret[k] = v;
		});
	});
	return ret;
}

// like merge but merges all into the first argument
function mergeInto() {
	var firstArg = arguments[0];
	forEach(arguments, function (arg, i) {
		if (i > 0) {
			forEach(arg, function (v, k) {
				firstArg[k] = v;
			});			
		}
	});
}


function pCompose() {
	var funs = arguments;
	return function () {
		var params = arguments;
		forEach(funs, function (fun) {
			fun.apply(null, params);
		});
	};
}

function memoize(f) {
	var oHash = makeOhash(function (o) {
		return JSON.stringify(o);
	});
	return function () {
		var args = arguments;
		return oHash.getOrMake(args, function () {
			return f.apply(null, args);
		});
	};
}

function setWith(o, newO) {
	forEach(newO, function (value, key) {
		o[key] = value;
	});
}

function getter(value) {
	return function () {
		return value;
	};
}



//recursive deep clone. don't use on self-referencing objects
function clone(myObj)
{
	if(!objectLike(myObj)) return myObj;
	if(myObj == null) return null;

	var myNewObj;
	if(arrayLike(myObj)){
		myNewObj = [];
		for(var i=0;i<myObj.length;i++){
			myNewObj[i] = clone(myObj[i]);
		}
	} else {
		myNewObj = {};
		for(var i in myObj)
			myNewObj[i] = clone(myObj[i]);
	}

	return myNewObj;
}


