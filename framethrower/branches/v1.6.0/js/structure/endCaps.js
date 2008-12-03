var evalCache = {};

function evaluate(expr) {
	/*
	This function will evaluate an Expr
	Another way of looking at it is getting rid of all top-level apply's in an Expr by doing the applications
	*/
	
	//console.log("evaluating expression", unparseExpr(expr));
	
	if (expr.kind === "exprApply") {
		var fun = evaluate(expr.left);
		var input = evaluate(expr.right);
		
		if (fun.kind === "exprLambda") {
			// we can do a beta reduction
			fun = normalizeVariables(fun, "x");
			input = normalizeVariables(input, "y");
			return evaluate(betaReplace(fun.right, fun.left.value, input));
		} else {
			// fun wasn't a lambda, and evaluate can't return an apply, so fun must be a Fun, so we can run it
			
			// but first, let's get the type
			var resultType = getType(makeApply(fun, input));
			
			var resultExpr;
			if (resultType.kind === "typeLambda" || resultType.kind === "typeApply") {
				// we're returning a Fun or a StartCap (constructed type), so we'll need to tag its .expr
				resultExpr = makeApply(getExpr(fun), getExpr(input));
			}	
			
			// check if we're returning a StartCap and see if it's already memoized
			var resultExprStringified;
			if (resultType.kind === "typeApply") {
				resultExprStringified = stringify(resultExpr);
				var cached = evalCache[resultExprStringified];
				if (cached) {
					return cached;
				}
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
				
				// annotate
				ret.type = resultType;
				ret.expr = resultExpr;
				
				// memoize
				evalCache[resultExprStringified] = ret;
				
				// add remove-from-cache callback to the StartCap
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




