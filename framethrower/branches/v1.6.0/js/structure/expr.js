/*

The result of an evaluate is always either:
	a fun
	a lambda expression
	a String, Number, or Bool
	a reactive start cap

*/

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
	/*
	Takes an expression and returns it back but with beta-reduction performed wherever possible,
		and lambda expressions using parameters x0, x1, ... in a normalized way
	*/
	
	expr = normalizeVariables(expr, makeGenerator("x"), emptyEnv); // uniqueify variable names (so betaReduce doesn't have to worry about variable capture issues)
	expr = betaReduce(expr, emptyEnv); // beta reduce
	expr = normalizeVariables(expr, makeGenerator("x"), emptyEnv); // normalize variable names
	
	return expr;
}
