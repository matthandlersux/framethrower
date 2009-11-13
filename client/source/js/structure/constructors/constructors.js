/*

All expressions are created by the functions here.

*/

var localIds = makeGenerator("local.");





// =====================================================================
// Primitives used by the kernel
// fun, object, cell
// =====================================================================

function makeFun(type, fun, argsLength, name, remoteLevel, lazy) {
	if(argsLength === 0)
		return fun();
	if (name === undefined) name = localIds();
	if (remoteLevel === undefined) remoteLevel = remote.shared;
	return {
		kind: "fun",
		type: type,
		fun: fun,
		argsLength: argsLength,
		name: name,
		remote: remoteLevel,
		lazy: lazy,
		outsideScope: 0
	};
}

function makeObject(type, name, prop, remoteLevel) {
	if (name === undefined) name = localIds();
	if (remoteLevel === undefined) remoteLevel = remote.localOnly;
	if (prop === undefined) prop = {};
	return {
		kind: "object",
		type: type,
		name: name,
		prop: prop,
		remote: remoteLevel,
		outsideScope: 0
	};
}

// TODO: rename this to makeCell and rename the other function of that name
function makeStartCap() {
	return {
		kind: "cell",
		remote: remote.localOnly,
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
		remote: remote.localOnly,
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
		remote: remote.localOnly,
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
		type: parseType("[a]"),
		remote: remote.localOnly,
		outsideScope: 0,
		asArray: asArray
	};
}

function makeTuple() {
	//var n = arguments.length;
    return {
        //kind: "tuple"+n,
        kind: "tuple",
		//name: localIds(),
		remote: remote.localOnly,
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
		remote: remote.localOnly,
		xml: xml,
		env: env
	};
}

function makeInstruction(lineAction, env) {
	return {
		kind: "instruction",
		instructions: lineAction.actions,
		env: env,
		remote: remote.localOnly
	};
}

// used by builtin actions in functions/actions.js, and also by desugar of jsaction() syntax in semantics.js:
function makeActionMethod(f) {
	var action = {kind: "actionMethod", f: f}, // will be interpreted by executeAction()
		lineAction = {actions: [{action: action}]};
	
	return makeInstruction(lineAction, emptyEnv);
}


// =====================================================================
// AST constructors
// apply, lambda
// =====================================================================

function makeApplyAST(left, right) {
	return {
		cons: "apply",
		left: left,
		right: right
	};
}

function makeLambdaAST(left, right) {
	return {
		cons: "lambda",
		left: left,
		right: right
	};
}


// =====================================================================
// type constructors
// typeVar, typeName, typeAapply, typeLambda
// =====================================================================

function makeTypeVar(name) {
	return {kind: "typeVar", value: name};
}
function makeTypeName(name) {
	return {kind: "typeName", value: name};
}
function makeTypeLambda(left, right) {
	return {kind: "typeLambda", left: left, right: right};
}
function makeTypeApply(left, right) {
	return {kind: "typeApply", left: left, right: right};
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
		outsideScope: maximum(getOutsideScope(left), getOutsideScope(right))
	};
}
function makeLambda(varName, expr) {
	return {
		kind: "exprLambda",
		varName: varName,
		expr: expr,
		outsideScope: maximum(0, getOutsideScope(expr) - 1)
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


