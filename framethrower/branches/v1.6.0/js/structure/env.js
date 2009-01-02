/*
An environment (env) is a function from strings to values. It is intended to store the bindings of variables in an environment.
*/

// here are two useful environments:
var emptyEnv = function (s) {
	console.error("Not found in environment: "+s);
};

var falseEnv = function (s) {
	return false;
};

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
	return function (s) {
		var lookup = hash[s];
		if (lookup === undefined) {
			return parentEnv(s);
		} else {
			return lookup;
		}
	};
}