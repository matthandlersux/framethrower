function evaluate(expr) {
	/*
	This function will evaluate an Expr
	Another way of looking at it is getting rid of all top-level apply's in an Expr by doing the applications
	
	*/
	
	//console.log("evaluating expression", unparseExpr(expr));
	
	if (expr.kind === "cons" && expr.cons === "apply") {
		var fun = evaluate(expr.left);
		var input = evaluate(expr.right);
		
		if (fun.kind === "cons" && fun.cons === "lambda") {
			// we can do a beta reduction
			fun = normalizeVariables(fun, "x");
			input = normalizeVariables(input, "y");
			return evaluate(betaReplace(fun.right, fun.left.value, input));
		} else {
			// evaluate can't return an apply, so fun must be a Fun, so we can run it
			
			// but first, let's get the type
			var resultType = getType(makeApply(fun, input));
			
			var resultExpr;
			if (resultType.kind === "typeApply" || resultType.kind === "typeLambda") {
				// we're returning a Fun or a StartCap (constructed type), so we'll need to tag its .expr
				resultExpr = makeApply(getExpr(fun), getExpr(input));
			}
			
			// okay, now run fun
			var ret = fun.fun(input);

			if (typeof ret === "function") {
				// if ret is a function, return a Fun and annotate its type and expr
				return {
					kind: "fun",
					type: resultType,
					expr: resultExpr,
					fun: ret
				};
			} else if (ret.kind === "startCap") {
				// if ret is a startCap, memoize the result and annotate its type and expr
				// TODO
				return ret;
			} else {
				return ret;
			}
		}
	} else {
		return expr;
	}
}




