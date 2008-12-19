/*
A Type is any one of the following:
	*	{
			kind: "typeName",
			value: String
		}
	*	{
			kind: "typeVar",
			value: String
		}
	*	{
			kind: "typeApply",
			left: Type,
			right: Type
		}
	*	{
			kind: "typeLambda",
			left: Type,
			right: Type
		}
*/


var typeVarGen = makeGenerator("t");

// helper functions
function makeFreshTypeVar() {
	return {kind: "typeVar", value: typeVarGen()};
}
function makeTypeName(name) {
	return {kind: "typeName", value: name};
}
function makeTypeLambda(left, right) {
	return {kind: "typeLambda", left: left, right: right};
}


function parseType(s) {
	/*
	Takes in a string and returns a Type.
	After parsing to an AST,
		apply's get turned into typeApply's, lambda's get turned into typeLambda's
		capitalized strings get turned into typeName's
		lowercase strings get turned into typeVar's
			also, these get renamed using typeVarGen,
			this way no Type's ever use the same typeVar name twice (unless they correspond)
	*/
	
	function isCapitalized(s) {
		var fc = s.charAt(0);
		return fc === fc.toUpperCase();
	}
	
	var typeVars = {};
	
	function helper(ast) {
		if (typeOf(ast) === "string") {
			if (isCapitalized(ast)) {
				return {
					kind: "typeName",
					value: ast
				};
			} else {
				if (!typeVars[ast]) {
					typeVars[ast] = makeFreshTypeVar();
				}
				return typeVars[ast];
			}
		} else if (ast.cons === "apply") {
			return {
				kind: "typeApply",
				left: helper(ast.left),
				right: helper(ast.right)
			};
		} else if (ast.cons === "lambda") {
			return makeTypeLambda(helper(ast.left), helper(ast.right));
		}
	}
	return helper(parse(s));
}

function unparseType(type) {
	function helper(type) {
		if (type.kind === "typeName" || type.kind === "typeVar") {
			return type.value;
		} else if (type.kind === "typeApply") {
			return {cons: "apply", left: helper(type.left), right: helper(type.right)};
		} else if (type.kind === "typeLambda") {
			return {cons: "lambda", left: helper(type.left), right: helper(type.right)};
		}
	}
	return unparse(helper(type));
}





function genConstraints(expr, env, constraints) {
	/* MUTATES: constraints
	this function returns the type of expr, but also adds to constraints (which must be unified and imposed)
	
	env is a map of words to Expr's, initially baseEnv
	constraints is a list (initially empty) of contraints, where each constraint is a pair (length-2 list) of types which must be equal
	expr is an Expr
	
	Algorithm: if expr is
		a variable
			return getType(env(expr.value))
		a non-cons
			return getType(expr)
		an application (funExpr inputExpr)
			run genConstraints on funExpr -> funType
			run genConstraints on inputExpr -> inputType
			make a fresh variable -> vName
			add constraint funType = inputType -> vName
			return vName
		a lambda (\x -> expr2)
			make a fresh variable -> vName
			return vName -> (genConstraints on expr2 using env augmented with x::vName)
	*/
	
	if (expr.kind === "var") {
		return getType(env(expr.value));
	} else if (expr.kind === "exprApply") {
		var funType = genConstraints(expr.left, env, constraints);
		var inputType = genConstraints(expr.right, env, constraints);
		var freshType = makeFreshTypeVar();
		constraints.push([funType, makeTypeLambda(inputType, freshType)]);
		return freshType;
	} else if (expr.kind === "exprLambda") {
		var freshType = makeFreshTypeVar();
		var newEnv = envAdd(env, expr.left.value, {type: freshType});
		return makeTypeLambda(freshType, genConstraints(expr.right, newEnv, constraints));
	} else {
		return getType(expr);
	}
}

function containsVar(type, typeVar) {
	if (type.kind === "typeName") {
		return false;
	} else if (type.kind === "typeVar") {
		return type.value === typeVar.value;
	} else {
		return containsVar(type.left, typeVar) || containsVar(type.right, typeVar);
	}
}

function unify(constraints) {
	/* MUTATES: constraints
	given constraints, returns subs or throws an error
	*/
	
	function subOnConstraints(name, value) {
		forEach(constraints, function (constraint) {
			constraint[0] = imposeSub(constraint[0], name, value);
			constraint[1] = imposeSub(constraint[1], name, value);
		});
	}
	
	var subs = [];
	
	while (constraints.length !== 0) {
		var constraint = constraints.shift(); // take a constraint from the front of the list
		
		var left = constraint[0];
		var right = constraint[1];
		
		if (left.kind === "typeName" && right.kind === "typeName") {
			if (left.value !== right.value) {
				throw "Type mismatch between `"+left.value+"` and `"+right.value+"`.";
			}
			// otherwise ignore
		} else if (left.kind === "typeVar" && right.kind === "typeVar" && left.value === right.value) {
			// ignore
		} else if (left.kind === "typeVar" && !containsVar(right, left)) {
			// add substitution
			subs.push([left.value, right]);
			subOnConstraints(left.value, right);
		} else if (right.kind === "typeVar" && !containsVar(left, right)) {
			// add substitution
			subs.push([right.value, left]);
			subOnConstraints(right.value, left);
		} else if (left.kind === right.kind) {
			// add two new constraints to the end of the list
			constraints.push([left.left, right.left]);
			constraints.push([left.right, right.right]);
		} else {
			throw "Type mismatch, unresolveable: `"+unparseType(left)+"` and `"+unparseType(right)+"`";
		}
	}
	
	return subs;
}

function imposeSub(type, name, value) {
	if (type.kind === "typeName") {
		return type;
	} else if (type.kind === "typeVar") {
		if (type.value === name) {
			return value;
		} else {
			return type;
		}
	} else {
		return {
			kind: type.kind,
			left: imposeSub(type.left, name, value),
			right: imposeSub(type.right, name, value)
		};
	}
}

function imposeSubs(type, subs) {
	function helper(type, name, value) {

	}
	forEach(subs, function (sub) {
		type = imposeSub(type, sub[0], sub[1]);
	});
	return type;
}






function getTypeOfExpr(expr) {
	var constraints = [];
	var t = genConstraints(expr, emptyEnv, constraints);
	var subs = unify(constraints);
	return imposeSubs(t, subs);
}



var basicTypes = {
	string: makeTypeName("String"),
	number: makeTypeName("Number"),
	"boolean": makeTypeName("Bool")
};
var jsType = makeTypeName("JS"); // this is for all miscellaneous types

function getType(o) {
	var t = typeOf(o);
	if (basicTypes[t]) {
		return basicTypes[t];
	} else { //object
		if (!o.type) {
			o.type = getTypeOfExpr(o);
		}
		return o.type;
	}
}




function testConstraints(s) {
	var exp = parseExpr(s);
	var c = [];
	var t = genConstraints(exp, baseEnv, c);
	forEach(c, function (x) {
		console.log(unparseType(x[0]) + " = " + unparseType(x[1]));
	});
	console.log("type of the expression: " + unparseType(t));
}


/*function showType(type) {
	// like unparse, but renames t1, t2, ... to a, b, ...
	function getLetter(i) {
		return "abcdefghijklmnopqrstuvwxyz".charAt(i);
	}
	var fv = freeVariables(type);
	var sub = {};
	forEach(fv, function (name, i) {
		sub[name] = makePrim(getLetter(i));
	});
	return unparse(impose(type, sub));
}
function checkType(s) {
	return showType(getType(parseExpr(s)));
}*/