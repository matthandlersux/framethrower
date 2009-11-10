
function def(obj) {
	return obj !== undefined;
}

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

// foldAsynchronous(o, init, f)
// foldAsynchronous will perform a fold operation with f over the elements of o, using init as the starting value
// f is allowed to execute and return a value, or return an asynchronous function ('asyncFunction')
// when f returns 'asyncFunction', foldAsynchronous will return a function that will run asyncFunction and the continue the fold operation
//
// o can be list or object
//
// f must return either
//	 {async:true, asyncFunction: function(aSyncCallback)}  where aSyncCallback(accum) is called with the result of asyncFunction
// | {async:false, value: value}
//
// foldAsynchronous returns same thing as f:
//	 {async:true, asyncFunction: function(aSyncCallback)}  where aSyncCallback(accum) is called with the result of asyncFunction
// | {async:false, value: value}

function foldAsynchronous(o, init, f) {
	function helper (list, begin, length, accum) {
		var current;
		var result = {value:accum};
		for (var i = begin; i < length; i++) {
			current = list[i];
			result = f(current.value, current.index, result.value);
			if (result.async) {
				return {
					async: true,
					asyncFunction:function(callback) {
						result.asyncFunction(function (accum) {
							callback(helper(list, i+1, length, accum));
						});
					}
				};
			}
		}
		return {async:false, value:result.value};
	}
	var list = [];
	forEach(o, function(value, index) {
		list.push({index:index, value:value});
	});
	return helper(list, 0, list.length, init);
}



function map(list, f) {
	var ret;
	if (arrayLike(list)) ret = [];
	else ret = {};
	
	forEach(list, function (val, key) {
		ret[key] = f(val, key);
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

function shallowCopy(o) {
	var ret = {};
	forEach(o, function (value, key) {
		ret[key] = value;
	});
	return ret;
}

//JSON with formatting. see JSON.stringify for a more robust stringification of JSON
function JSONtoString(object) {

	function JSONtoString2(object, tabs) {
		if(object !== undefined) {
			if(arrayLike(object)) {
				var output = "[\n";
				var first = true;
				forEach(object, function (value) {
					if (!first) {
						output += ",\n";
					} else {
						first = false;
					}
					for (var i=0; i<=tabs; i++) {
						output += "\t";
					}
					output += JSONtoString2(value, tabs+1);
				});
				output += "\n";
				for (var i=0; i<=tabs-1; i++) {
					output += "\t";
				}			
				output += "]";
				return output;			
			} else if (objectLike(object)) {
				var output = "{\n";
				var first = true;
				forEach(object, function (value, name) {
					if (!first) {
						output += ",\n";
					} else {
						first = false;
					}
					for (var i=0; i<=tabs; i++) {
						output += "\t";
					}
					output += name + ": " + JSONtoString2(value, tabs+1);
				});
				output += "\n";
				for (var i=0; i<=tabs-1; i++) {
					output += "\t";
				}			
				output += "}";
				return output;
			} else if (typeOf(object) === "string"){
				return "\"" + object.replace(/\n/g, "\\n") + "\"";
			} else {
				return object;
			}
		}
	}
	
	return JSONtoString2(object, 0);
}