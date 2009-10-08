/*
An environment (env) is a function from strings to values. It is intended to store the bindings of variables in an environment.
*/

// here are two useful environments:
var emptyEnv = function (s) {
	//debug.error("Not found in environment: `"+s+"`");
	throw "Not found in environment: `"+s+"`";
};

var falseEnv = function (s) {
	return false;
};

var undefinedEnv = function (s) {
	return undefined;
}

function envAdd(parentEnv, name, value) {
	/*
	Takes an environment and adds a new binding (of name to value) to it.
	*/
	return function (s) {
		if (s === name) {
			return value;
		} else {
			return parentEnv(s);
		}
	};
}

function extendEnv(parentEnv, hash) {
	if(typeof hash === "function") {
		return function(s) {
			var lookup = hash(s);
			if (lookup === undefined) {
				return parentEnv(s);
			} else {
				return lookup;
			}
		}
	}
	else
		return function (s) {
			var lookup = hash[s];
			if (lookup === undefined) {
				return parentEnv(s);
			} else {
				return lookup;
			}
		};
}


function isInEnv(env, key) {
	try {
		env(key);
		return true;
	} catch (e) {
		return false;
	}
}


function makeDynamicEnv(inherit) {
	if (!inherit) inherit = emptyEnv;
	var lookup = {};
	return {
		add: function (name, value) {
			lookup[name] = value;
		},
		env: function (s) {
			var value = lookup[s];
			if (value === undefined) {
				return inherit(s);
			} else {
				return value;
			}
		},
		debug: function () {
			return lookup;
		}
	};
}

function makeCachedEnv(env) {
	var cache = {};
	return function(s) {
		var v = cache[s];
		if(!def(v)) {
			v = env(s);
			cache[s] = v;
		}
		return v;
	};
}
