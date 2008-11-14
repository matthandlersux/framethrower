/*
An Expr is any one of the following:
	* Number, String, Bool
	* Fun
	* StartCap
	* ScafOb
	* Var
	*	{
			kind: "cons",
			cons: "apply",
			left: Expr,
			right: Expr
		}
	*	{
			kind: "cons",
			cons: "lambda",
			left: Var,
			right: Expr
		}

A Var is:
	{
		kind: "var",
		value: String
	}
*/

var varNameGen = makeGenerator("x");

function makeLambda(left, right) {
	return {kind: "cons", cons: "lambda", left: left, right: right};
}
function makeApply(left, right) {
	return {kind: "cons", cons: "apply", left: left, right: right};
}

function parseExpr(s) {
	/*
	Takes in a string and returns an Expr.
	After parsing the string to an AST,
		for each word we look it up in baseEnv
		for each apply we make the appropriate apply Expr
		for each lambda we make the appropriate lambda Expr,
			in this case we also rename the variable using varNameGen,
			this way no Expr's ever use the same Var name twice (unless they correspond)
			INVARIANT: no two lambdas use the same Var name as their parameter
	*/
	
	function helper(ast, env) {
		if (typeOf(ast) === "string") {
			return env(ast);
		} else if (ast.cons === "lambda") {
			var name = ast.left;
			var v = {
				kind: "var",
				value: varNameGen()
			};
			return makeLambda(v, helper(ast.right, envAdd(env, name, v)));
		} else if (ast.cons === "apply") {
			return makeApply(helper(ast.left, env), helper(ast.right, env));
		}
	}
	return helper(parse(s), baseEnv);
}

























function freshenExpr(expr) {
	// makes a copy of expr, but with all var's renamed to fresh varName's
	// used by betaReduce
	
}


























/*

The result of an evaluate is always either:
	a fun
	a lambda expression
	a String, Number, or Bool
	a reactive start cap

*/
/*
function evaluate(expr) {
	if (expr && expr.cons === "apply") {
		var ret;
		var fun = evaluate(expr.left);
		if (fun.kind === "fun") {
			var input = evaluate(expr.right);
			ret = fun.fun(input);
		} else if (fun.kind === "cons" && fun.cons === "lambda") {
			ret = evaluate(betaReduce(fun.right, fun.left.value, expr.right));
		}
		
		return ret;
	} else {
		return expr;
	}
}

function normalizeVariables(expr, nameGen, env) {
	if (expr.kind === "cons") {
		if (expr.cons === "apply") {
			return makeApply(normalizeVariables(expr.left, nameGen, env), normalizeVariables(expr.right, nameGen, env));
		} else if (expr.cons === "lambda") {
			var newVar = makeVar(nameGen());
			var newEnv = envAdd(env, expr.left.value, newVar);
			return makeLambda(newVar, normalizeVariables(expr.right, nameGen, newEnv));
		}
	} else if (expr.kind === "var") {
		return env(expr.value);
	} else {
		return expr;
	}
}
function betaReduce(expr, env) {
	if (expr.kind === "cons") {
		if (expr.cons === "apply") {
			var fun = betaReduce(expr.left, env);
			var input = betaReduce(expr.right, env);
			if (fun.cons === "lambda") {
				var varName = fun.left.value;
				var newEnv = envAdd(env, varName, input);
				return betaReduce(fun.right, newEnv);
			} else {
				return makeApply(fun, input);
			}
		} else if (expr.cons === "lambda") {
			var newEnv = envAdd(env, expr.left.value, expr.left);
			return makeLambda(expr.left, betaReduce(expr.right, newEnv));
		}
	} else if (expr.kind === "var") {
		return env(expr.value);
	} else {
		return expr;
	}
}
function normalizeExpr(expr) {
	/ *
	Takes an expression and returns it back but with beta-reduction performed wherever possible,
		and lambda expressions using parameters x0, x1, ... in a normalized way
	* /
	
	expr = normalizeVariables(expr, makeGenerator("x"), emptyEnv); // uniqueify variable names (so betaReduce doesn't have to worry about variable capture issues)
	expr = betaReduce(expr, emptyEnv); // beta reduce
	expr = normalizeVariables(expr, makeGenerator("x"), emptyEnv); // normalize variable names
	
	return expr;
}
*/