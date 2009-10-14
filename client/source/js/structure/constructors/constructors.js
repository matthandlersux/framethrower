/*

All expressions are created by the functions here.

*/

var localIds = makeGenerator("local.");





// =====================================================================
// Primitives used by the kernel
// fun, object, cell
// =====================================================================

function makeFun(type, fun, argsLength, name, remote) {
	if (name === undefined) name = localIds();
	if (remote === undefined) remote = 2;
	return {
		kind: "fun",
		type: type,
		fun: fun,
		argsLength: argsLength,
		name: name,
		remote: remote,
		outsideScope: 0
	};
}

function makeObject(type) {
	return {
		kind: "object",
		type: type,
		name: localIds(),
		prop: {},
		remote: 2,
		outsideScope: 0
	};
}

// TODO: rename this to makeCell and rename the other function of that name
function makeStartCap() {
	return {
		kind: "cell",
		remote: 2,
		name: localIds()
	};
}



// =====================================================================
// Additional data types
// null, ord
// =====================================================================

function makeNullObject() {
	return {
		kind: "null",
		type: parseType("Null"),
		name: "null",
		remote: 2,
		outsideScope: 0
	};
}

function makeOrd(value) {
	function stringifyOrdValue(value) {
		return map(value, function (x) {
			return x ? "b" : "a";
		}).join("");
	}
	if (value === undefined) value = [true];
	return {
		kind: "ord",
		type: parseType("Ord"),
		name: stringifyOrdValue(value),
		value: value,
		remote: 2,
		outsideScope: 0
	};
}




// =====================================================================
// Additional data structures
// list, tuple
// =====================================================================

function makeList(asArray) {
	return {
		kind: "list",
		remote: 2,
		outsideScope: 0,
		asArray: asArray
	};
}

function makeTuple() {
	//var n = arguments.length;
    return {
        //kind: "tuple"+n,
        kind: "tuple",
		remote: 2,
        asArray: Array.prototype.slice.call(arguments)
    };
}

// =====================================================================
// Things created/returned by template system (client only)
// xmlp, instruction
// =====================================================================

function makeXMLP(xml, env) {
	if (env === undefined) env = emptyEnv;
	return {
		kind: "xmlp", 
		name: localIds(),
		remote: 2,
		xml: xml,
		env: env
	};
}

function makeInstruction(lineAction, env) {
	return {
		kind: "instruction",
		instructions: lineAction.actions,
		env: env,
		remote: 2
	};
}

// =====================================================================
// Lambda calculus constructs
// exprVar, exprApply, exprLambda
// =====================================================================

function makeVar(deBruijn) {
	return {
		kind: "exprVar",
		deBruijn: deBruijn,
		name: "/" + deBruijn,
		outsideScope: deBruijn
	};
}
function makeApply(left, right) {
	return {
		kind: "exprApply",
		left: left,
		right: right,
		outsideScope: Math.max(getOutsideScope(left), getOutsideScope(right))
	};
}
function makeLambda(varName, expr) {
	return {
		kind: "exprLambda",
		varName: varName,
		expr: expr,
		outsideScope: Math.max(0, getOutsideScope(expr) - 1)
	};
}













// =====================================================================
// These are functions that can be called on all expr's.
// They tag expr's with memoized results
// 
// tags: name, stringifyForServer, outsideScope
// =====================================================================


/*
takes a key and a function f.
f should be a function on one parameter (an expr, as the case may be).

returns a function of one parameter (x)
if x is an object that has the key (ie: the result is already memoized), then returns the value associated with the key
otherwise performs f on x to get result. sets x[key] to the result. returns the result.
*/
function memoizeF(key, f) {
	return function (x) {
		if (typeof x === "object") {
			if (x[key] === undefined) {
				x[key] = f(x);
			}
			return x[key];			
		} else {
			return f(x);
		}
	};
}


// TODO: stringify should stringify lists properly
var stringify = memoizeF("name", function (expr) {
	if (expr.kind === "exprApply") {
		return "(" + stringify(expr.left) + " " + stringify(expr.right) + ")";
	} else if (expr.kind === "exprLambda") {
		return "(\\ " + stringify(expr.expr) + ")";
	// } else if (expr.kind === "exprVar") {
	// 	return "/" + expr.deBruijn;
	} else {
		var lit = unparseLiteral(expr);
		if (lit !== undefined) {
			return lit;
		} else {
			// TODO: this shouldn't be called, I think, check
			return localIds();
		}
	}
});

var stringifyForServer = memoizeF("stringifyForServer", function (expr) {
	if (expr.kind === "exprApply") {
		return "(" + stringifyForServer(expr.left) + " " + stringifyForServer(expr.right) + ")";
	} else if (expr.kind === "exprLambda") {
		return "(\\ " + stringifyForServer(expr.expr) + ")";
	} else {
		return stringify(expr);
	}
});

function getOutsideScope(expr) {
	if (expr.outsideScope !== undefined) return expr.outsideScope;
	else return 0;
}


