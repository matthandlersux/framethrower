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


var emptyEnv = function (s) {
	throw "Not found in environment: "+s;
};


var lookupTable = {};

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
			return emptyEnv(s);
		}
	}
};

function addFun(name, typeString, f) {
	lookupTable[name] = {
		kind: "fun",
		stringify: name,
		type: parseType(typeString),
		fun: curry(f)
	};
}
function addExpr(name, exprString) {
	lookupTable[name] = parseExpr(exprString);
}



addFun("bindSet", "(a -> Set b) -> Set a -> Set b", function () {
	
});
addFun("returnUnitSet", "Unit a -> Set a", function () {
	
});
addFun("passthru", "(a -> Bool) -> a -> Unit a", function () {
	
});


addFun("and", "Bool -> Bool -> Bool", function (x, y) {
	return x && y;
});
addFun("or", "Bool -> Bool -> Bool", function (x, y) {
	return x || y;
});
addFun("not", "Bool -> Bool -> Bool", function (x) {
	return !x;
});



addExpr("compose", "f -> g -> x -> f (g x)");
addExpr("const", "x -> y -> x");
addExpr("swap", "f -> x -> y -> f y x");


