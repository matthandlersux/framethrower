/*
An environment (env) is a function from strings to values. It is intended to store bindings of variables in an environment.
The function envAdd takes an environment and adds a new binding (of name to value) to it.

*/

var emptyEnv = function (s) {
	throw "Not found in environment: "+s;
};

function envAdd(parentEnv, name, value) {
	return function (s) {
		if (s === name) {
			return value;
		} else {
			return parentEnv(s);
		}
	};
}