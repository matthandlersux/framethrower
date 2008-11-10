/*

a type is an AST formed from a type signature (written Haskell style)
	so a capitalized string is a primitive type
	a lowercase string is a polymorphic type
	an apply is a constructed type with the constructor on the left
	a lambda is the type of a function with input on the left, output on the right

an expression (abbreviated: expr) is also an AST, formed from an expression (written Haskell style, but leave off the "\" lambdas)
	a string is a value/startCap from the environment,
		including a free variable from a lambda expression
	an apply is an apply
	a lambda is a lambda

*/

function isPrim(o) {
	return typeof o === "string";
}

function isCapitalized(s) {
	var fc = s.charAt(0);
	return fc === fc.toUpperCase();
}

function freeVariables(type) {
	// returns a list of free variable names in type
	var fv = {};
	function helper(type) {
		if (isPrim(type)) {
			if (!isCapitalized(type)) {
				fv[type] = true;
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
		return substitutions[type] || type;
	} else {
		return {
			cons: type.cons,
			left: impose(type.left, substitutions),
			right: impose(type.right, substitutions)
		};
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
		sub[name] = typeNameGen();
	});
	//console.log("uniqueifying with", sub);
	return impose(type, sub);
}


var typeEnv = {};
typeEnv["bindSet"] = parse("(a -> Set b) -> Set a -> Set b");
typeEnv["compose"] = parse("(b -> c) -> (a -> b) -> (a -> c)");
typeEnv["returnUnitSet"] = parse("Unit a -> Set a");
typeEnv["passthru"] = parse("(a -> Bool) -> a -> Unit a");




typeEnv = map(typeEnv, uniqueifyType);


function genConstraints(expr, env, constraints) {
	/*
	this function returns the type of expr, but also adds to constraints (which must be unified, normalized, and imposed)
	
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
	
	if (isPrim(expr)) {
		return env[expr];
	} else if (expr.cons === "apply") {
		var funType = genConstraints(expr.left, env, constraints);
		var inputType = genConstraints(expr.right, env, constraints);
		var freshType = typeNameGen();
		constraints.push([funType, {
			cons: "lambda",
			left: inputType,
			right: freshType
		}]);
		return freshType;
	} else if (expr.cons === "lambda") {
		var freshType = typeNameGen();
		var newEnv = merge(env);
		newEnv[expr.left] = freshType;
		return {
			cons: "lambda",
			left: freshType,
			right: genConstraints(expr.right, newEnv, constraints)
		};
	}
	
}


function isFV(type) {
	return isPrim(type) && !isCapitalized(type);
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
	//console.log(constraints, constraints.length);
	// given constraints, returns substitutions that satisfy, or throws an error "Type mismatch."
	if (constraints.length === 0) {
		return {};
	} else {
		var constraint = constraints[0];
		var rest = constraints.slice(1);
		
		var left = constraint[0];
		var right = constraint[1];
		
		if (isPrim(left) && isPrim(right) && left === right) {
			return unify(rest);
		} else if (isFV(left) && !contains(freeVariables(right), left)) {
			var sub = {};
			sub[left] = right;
			return [sub].concat(unify(substConstraints(rest, sub)));
		} else if (isFV(right) && !contains(freeVariables(left), right)) {
			var sub = {};
			sub[right] = left;
			return [sub].concat(unify(substConstraints(rest, sub)));
		} else if (!isPrim(left) && !isPrim(right) && left.cons === right.cons) {
			var copy = rest.slice(0);
			copy.push([left.left, right.left]);
			copy.push([left.right, right.right]);
			return unify(copy);
		} else {
			throw "Type mismatch.";
		}
	}
}



function getType(expr) {
	var constraints = [];
	var t = genConstraints(expr, typeEnv, constraints);
	var substitutions = unify(constraints);
	return imposeList(t, substitutions);
}

