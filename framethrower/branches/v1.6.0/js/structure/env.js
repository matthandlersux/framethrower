/*
An environment (env) is a function from strings to values.
The function spawnEnv takes a parent environment and adds some records to it to make a new environment (but without any mutations)

*/

function spawnEnv(parentEnv, entries) {
	return function (s) {
		var entry = entries[s];
		if (entry !== undefined) {
			return entry;
		} else {
			return parentEnv(s);
		}
	};
}
function envAdd(parentEnv, name, value) {
	var o = {};
	o[name] = value;
	return spawnEnv(parentEnv, o);
}



/*var lookupTable = {};

function addFun(name, typeString, fun) {
	lookupTable[name] = {
		stringify: name,
		type: parseType(typeString),
		fun: fun
	};
}
function addExpr(name, exprString) {
	lookupTable[name] = parseExpr(exprString);
}





var baseEnv = function (s) {
	// literals
	if (/^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$/.test(s)) {
		// matches a number
		// using http://www.regular-expressions.info/floatingpoint.html
		// might want to find the regular expression that javascript uses...
		return +s;
	} else if (/^".*"$/.test(s)) {
		// matches a string
		return s.substring(1, s.length - 2); // this needs to strip backslashes..
	} else if (s === "true") {
		return true;
	} else if (s === "false") {
		return false;
	} else {
		// lookup
		var lookup = lookupTable[s];
		if (lookup) {
			return lookup;
		} else {
			throw "Not found in environment: "+s;
		}
	}
};

*/
