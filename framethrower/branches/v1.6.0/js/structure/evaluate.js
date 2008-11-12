/*

The result of an evaluate is always either:
	a fun
	a lambda expression
	a String, Number, or Bool
	a reactive start cap

*/

function evaluate(expr) {
	if (expr && expr.kind === "prim") {
		return evaluate(baseEnv(expr));
	} else if (expr && expr.kind === "cons" && expr.cons === "apply") {
		var ret;
		var fun = evaluate(expr.left);
		if (fun.kind === "fun") {
			var input = evaluate(expr.right);
			ret = fun.fun(input);
		} else if (fun.kind === "cons" && fun.cons === "lambda") {
			// a lambda expression
			ret = evaluate(betaReduce(fun.right, fun.left.value, expr.right));
		} else {
			// shouldn't get here...
			throw "runtime error";
		}
		
		return ret;
	} else {
		return expr;
	}
}

function betaReduce(expr, varName, replaceExpr) {
	/*
	takes in an expression and returns it back but with all instances of prim varName replaced with replaceExpr
	to be used when applying lambda expressions
	caveat: does not replace inner lambda expressions that use varName as a parameter,
		this is to properly deal with variable capture
		this is also the difference between betaReduce and impose
	*/
	if (isPrim(expr)) {
		if (expr.value === varName) {
			return replaceExpr;
		} else {
			return expr;
		}
	} else if (expr.cons === "lambda") {
		if (expr.left.value === varName) {
			return expr;
		} else {
			return makeLambda(expr.left, betaReduce(expr.right, varName, replaceExpr));
		}
	} else {
		return makeApply(betaReduce(expr.left, varName, replaceExpr), betaReduce(expr.right, varName, replaceExpr));
	}
}

