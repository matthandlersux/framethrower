/*

a type is an AST formed from a type signature (written Haskell style)
	so a prim with capitalized value is a primitive type
	a prim with lowercase value is a polymorphic type
	an apply is a constructed type with the constructor on the left
	a lambda is the type of a function with input type on the left, output type on the right

an expression (abbreviated: expr) is also an AST, formed from an expression (written Haskell style, but leave off the "\" lambdas)
	a string is a value/startCap from the environment,
		including a free variable from a lambda expression
	an apply is an apply
	a lambda is a lambda

*/



function isCapitalized(s) {
	var fc = s.charAt(0);
	return fc === fc.toUpperCase();
}

function isFV(type) {
	return isPrim(type) && !isCapitalized(type.value);
}
function freeVariables(type) {
	// returns a list of free variable names in type
	var fv = {};
	function helper(type) {
		if (isPrim(type)) {
			if (!isCapitalized(type.value)) {
				fv[type.value] = true;
			}
		} else {
			helper(type.left);
			helper(type.right);
		}
	}
	helper(type);
	return keys(fv);
}

function impose(type, substitutions) {
	/*
	takes in a type, and substitutions
		substitutions is a map of variable names to types
	returns type back, but with polymorphic variables substituted where noted in substitutions
	*/
	if (isPrim(type)) {
		return substitutions[type.value] || type;
	} else {
		return makeCons(type.cons, impose(type.left, substitutions), impose(type.right, substitutions));
	}
}
function imposeList(type, list) {
	// for imposing a list of substitutions in order
	forEach(list, function (sub) {
		type = impose(type, sub);
	});
	return type;
}




var typeNameGen = makeGenerator("t");

function uniqueifyType(type) {
	var fv = freeVariables(type);
	var sub = {};
	forEach(fv, function (name) {
		sub[name] = makePrim(typeNameGen());
	});
	//console.log("uniqueifying with", sub);
	return impose(type, sub);
}





function genConstraints(expr, env, constraints) {
	/*
	this function returns the type of expr, but also adds to constraints (which must be unified and imposed)
	
	env is a map (initially empty) of variable names to types
	constraints is a list (initially empty) of contraints, where each constraint is a pair (length-2 list) of types
	expr is an expression (AST)
	
	Algorithm: if expr is
		a literal
			return the literal's type
		a variable
			return the env's recorded type for the variable
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
	} else if (!expr.cons) {
		return getType(expr);
	} else if (expr.cons === "apply") {
		var funType = genConstraints(expr.left, env, constraints);
		var inputType = genConstraints(expr.right, env, constraints);
		var freshType = makePrim(typeNameGen());
		constraints.push([funType, makeLambda(inputType, freshType)]);
		return freshType;
	} else if (expr.cons === "lambda") {
		var freshType = makePrim(typeNameGen());
		var newEnv = envAdd(env, expr.left.value, {type: freshType});
		return makeLambda(freshType, genConstraints(expr.right, newEnv, constraints));
	}
}

function substConstraints(constraints, substitutions) {
	return map(constraints, function (constraint) {
		return [
			impose(constraint[0], substitutions),
			impose(constraint[1], substitutions)
		];
	});
}
function unify(constraints) {
	//console.log("constraints", constraints);
	// given constraints, returns substitutions that satisfy, or throws an error "Type mismatch."
	if (constraints.length === 0) {
		return {};
	} else {
		var constraint = constraints[0];
		var rest = constraints.slice(1);
		
		var left = constraint[0];
		var right = constraint[1];
		
		if (isPrim(left) && isPrim(right) && left.value === right.value) {
			return unify(rest);
		} else if (isFV(left) && !contains(freeVariables(right), left.value)) {
			var sub = {};
			sub[left.value] = right;
			return [sub].concat(unify(substConstraints(rest, sub)));
		} else if (isFV(right) && !contains(freeVariables(left), right.value)) {
			var sub = {};
			sub[right.value] = left;
			return [sub].concat(unify(substConstraints(rest, sub)));
		} else if (!isPrim(left) && !isPrim(right) && left.cons === right.cons) {
			var copy = rest.slice(0);
			copy.push([left.left, right.left]);
			copy.push([left.right, right.right]);
			return unify(copy);
		} else {
			console.error("Type mismatch, unresolveable constraint", unparse(left), unparse(right));
			//throw "Type mismatch.";
		}
	}
}

function getTypeOfExpr(expr) {
	var constraints = [];
	var t = genConstraints(expr, emptyEnv, constraints);
	var substitutions = unify(constraints);
	return imposeList(t, substitutions);
}




function getType(o) {
	var t = typeOf(o);
	if (t === "string") {
		return makePrim("String");
	} else if (t === "number") {
		return makePrim("Number");
	} else if (t === "boolean") {
		return makePrim("Bool");
	} else { //object
		if (!o.type) {
			o.type = getTypeOfExpr(o);
		}
		return o.type;
	}
}



function showType(type) {
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
}