function evaluate(expr) {
	/*
	This function will essentially get rid of all apply's in an Expr
	
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
			var ret = fun.fun(input);

			if (typeof ret === "function") {
				// if ret is a function, return a Fun and annotate its type and expr
				return {
					kind: "fun",
					type: getType(expr),
					expr: expr,
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

