/*
Here we define our base environment (base), which is used by expressions.
base.env will convert literal strings (Number's, String's, Bool's) to their actual representation
here we also create bindings for our so-called "primitive functions", the server-client shared vocabulary
*/

function parseLiteral(s) {
	if (/^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$/.test(s)) {
		// matches a number
		// using http://www.regular-expressions.info/floatingpoint.html
		// might want to find the regular expression that javascript uses...
		return +s;
	} else if (/^".*"$/.test(s)) {
		// matches a string
		var sub = s.substring(1, s.length - 2);
		return sub.replace(/\\(["\\])/g, "$1");
	} else if (s === "true") {
		return true;
	} else if (s === "false") {
		return false;
	} else {
		return undefined;
	}
}

var literalEnv = function (s) {
	var lit = parseLiteral(s);
	if (lit !== undefined) {
		return lit;
	} else {
		return emptyEnv(s);
	}
};

var base = makeDynamicEnv(literalEnv);

// ============================================================================
// Here we define our primitive functions and bind them
// ============================================================================


// TODO: factor this out, or at least make it not take real expr's and types, not strings
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
	
	base.add(name, {
		kind: "fun",
		name: name,
		type: type,
		fun: fun,
		remote: 0
	});
}


// ============================================================================
// These are like primitive functions in that they're shared between client and server,
// but they are defined using expressions, that is, combinations of primitive functions
// ============================================================================

function addExpr(name, exprString, optionalTypeString, dynamicEnv) {
	var expr = parseExpr(exprString);
	if (optionalTypeString) {
		var type = parseType(optionalTypeString);
		if (!compareTypes(getType(expr), type)) {
			debug.error("Expression `"+name+"` has type `"+unparseType(getType(expr))+"` but expected `"+optionalTypeString+"`");
		}
	}
	dynamicEnv.add(name, expr);
}

addExpr("compose", "f -> g -> x -> f (g x)", "(b -> c) -> (a -> b) -> a -> c", base);
