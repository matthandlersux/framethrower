var evalCache = {};

function evaluate(expr) {
	/*
	This function will evaluate an Expr
	Another way of looking at it is getting rid of all top-level apply's in an Expr by doing the applications
	Also, if the expr is a remote cell, this function will create/return the proper surrogate cell
	*/
	
	//console.log("evaluating expression", unparseExpr(expr));
	
	
	
	var resultType = getType(expr);
	var resultExpr = getExpr(expr);
	
	// check if we're returning a StartCap and see if it's already memoized
	var resultExprStringified;
	if (isReactive(resultType)) {
		resultExprStringified = uniqueExpr(resultExpr);
		var cached = evalCache[resultExprStringified];
		if (cached) {
			return cached;
		}
		
		if (getRemote(expr) === 1) {
			var ret = queryExpr(expr);
			memoizeCell(resultExprStringified, ret);
		}
	}
	
	
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
				
				memoizeCell(resultExprStringified, ret);
				
				return ret;
			} else {
				return ret;
			}
			
		}
	} else {
		return expr;
	}
}

function memoizeCell(exprString, cell) {
	evalCache[exprString] = cell;
	// add remove-from-cache callback to the cell
	cell.addOnRemove(function () {
		delete evalCache[exprString];
	});
	// TODO: test this cacheing
}




function evaluateAndInject(expr, func) {
	var e = evaluate(expr);
	return e.injectFunc(func);
}

