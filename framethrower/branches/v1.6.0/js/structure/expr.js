/*
An Expr is any one of the following:
	* Number, String, Bool
	* Fun
	* StartCap - see reactive/cells.js
	* Object - see objects/objects.js
	* Var
	*	{
			kind: "exprApply",
			left: Expr,
			right: Expr
		}
	*	{
			kind: "exprLambda",
			left: Var,
			right: Expr
		}

A Var is:
	{
		kind: "var",
		value: String
	}
*/



function makeVar(name) {
	return {kind: "var", value: name};
}
function makeApply(left, right) {
	return {kind: "exprApply", left: left, right: right};
}
function makeLambda(left, right) {
	return {kind: "exprLambda", left: left, right: right};
}


function parseExpression(ast, env) {
	if (typeOf(ast) === "string") {
		return env(ast);
	} else if (ast.cons === "lambda") {
		var name = ast.left;
		var v = makeVar(name);
		return makeLambda(v, parseExpression(ast.right, envAdd(env, name, v)));
	} else if (ast.cons === "apply") {
		return makeApply(parseExpression(ast.left, env), parseExpression(ast.right, env));
	}
}

function parseExpr(s) {
	/*
	Takes in a string and returns an Expr.
	After parsing the string to an AST,
		for each word we look it up in env
		for each apply we make the appropriate apply Expr
		for each lambda we make the appropriate lambda Expr
	*/
	return parseExpression(parse(s), baseEnv);
}





function normalizeVariables(expr, prefix) {
	/*
	Takes in a closed Expr and returns it back but with every lambda's parameter renamed in a standard way
		Properties:
			Every lambda expression will have a unique parameter name
			normalizeVariables will return the same thing on any Expr's that are "alpha-equivalent" (equivalent up to variable names)
		Optional parameter prefix: will name variables starting with this prefix, default is "x"
	*/
	
	function helper(expr, nameGen, env) {
		if (expr.kind === "exprApply") {
			return makeApply(helper(expr.left, nameGen, env), helper(expr.right, nameGen, env));
		} else if (expr.kind === "exprLambda") {
			var newVar = makeVar(nameGen());
			var newEnv = envAdd(env, expr.left.value, newVar);
			return makeLambda(newVar, helper(expr.right, nameGen, newEnv));
		} else if (expr.kind === "var") {
			return env(expr.value);
		} else {
			return expr;
		}
	}
	
	if (!prefix) prefix = "x";
	return helper(expr, makeGenerator(prefix), emptyEnv);
}


function betaReplace(expr, name, replaceExpr) {
	// replaces all Var's with (.value == name) with replaceExpr in expr
	// this should only be called if expr and replaceExpr share no variable names (to avoid collisions)
	if (expr.kind === "var" && expr.value === name) {
		return replaceExpr;
	} else if (expr.kind === "exprApply" || expr.kind === "exprLambda") {
		return {
			kind: expr.kind,
			left: betaReplace(expr.left, name, replaceExpr),
			right: betaReplace(expr.right, name, replaceExpr)
		};
	} else {
		return expr;
	}
}



function betaReduce(expr) {
	// applies beta reduction wherever possible in an Expr
	// this should only be called on Expr's with normalized variables (to avoid collisions)
	if (expr.kind === "exprApply") {
		var fun = betaReduce(expr.left);
		var input = betaReduce(expr.right);
		if (fun.kind === "exprLambda") {
			// we can do a beta reduction here
			return betaReduce(betaReplace(fun.right, fun.left.value, input));
		} else {
			return makeApply(fun, input);
		}
	} else if (expr.kind === "exprLambda") {
		return makeLambda(expr.left, betaReduce(expr.right));
	} else {
		return expr;
	}
}

function normalizeExpr(expr) {
	return normalizeVariables(betaReduce(normalizeVariables(expr)));
}
