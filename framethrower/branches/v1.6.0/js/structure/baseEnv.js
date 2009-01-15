/*
Here we define our base environment (baseEnv), which is used by expressions.
baseEnv will convert literal strings (Number's, String's, Bool's) to their actual representation
here we also create bindings for our so-called "primitive functions", the server-client shared vocabulary
	these bindings are stored in lookupTable
so in general, baseEnv will take a word and convert it to an Expr
*/

var lookupTable = {};

function parseLiteral(s) {
	if (/^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$/.test(s)) {
		// matches a number
		// using http://www.regular-expressions.info/floatingpoint.html
		// might want to find the regular expression that javascript uses...
		return +s;
	} else if (/^".*"$/.test(s)) {
		// matches a string
		return s.substring(1, s.length - 2); // TODO: this needs to strip backslashes
	} else if (s === "true") {
		return true;
	} else if (s === "false") {
		return false;
	} else {
		return undefined;
	}
}

var baseEnv = function (s) {
	var lit = parseLiteral(s);
	if (lit !== undefined) {
		return lit;
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


// ============================================================================
// Here we define our primitive functions and bind them
// ============================================================================

/*function returnsStartCap(type) {
	// returns true if the type is a function (of n parameters) that returns a StartCap (constructed type)
	if (type.kind === "typeApply") {
		return true;
	} else if (type.kind === "typeLambda") {
		return returnsStartCap(type.right);
	} else {
		return false;
	}
}*/

function addFun(name, typeString, f, numArguments) {
	/*
	This creates a new Fun object and binds it (by putting it in lookupTable)
	*/
	
	var type = parseType(typeString);
	var fun;
	/*if (returnsStartCap(type)) {
		// save the last parameter as the type of the StartCap to return
		fun = curry(f, f.length - 1);
	} else {
		fun = curry(f);
	}*/
	fun = curry(f, numArguments);
	
	lookupTable[name] = {
		kind: "fun",
		name: name,
		type: type,
		fun: fun,
		remote: 0
	};
}


// ============================================================================
// These are like primitive functions in that they're shared between client and server,
// but they are defined using expressions, that is, combinations of primitive functions
// ============================================================================

function addExpr(name, exprString, optionalTypeString) {
	var expr = parseExpr(exprString);
	if (optionalTypeString) {
		var type = parseType(optionalTypeString);
		if (!compareTypes(getType(expr), type)) {
			debug.error("Expression `"+name+"` has type `"+unparseType(getType(expr))+"` but expected `"+optionalTypeString+"`");
		}
	}
	lookupTable[name] = expr;
}

addExpr("compose", "f -> g -> x -> f (g x)");
addExpr("const", "x -> y -> x");
addExpr("swap", "f -> x -> y -> f y x");
