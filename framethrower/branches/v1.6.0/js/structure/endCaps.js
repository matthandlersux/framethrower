function evaluate(expr) {
	expr = normalizeExpr(expr);
	
	//console.log("evaluating expression", unparseExpr(expr));
	
	if (expr.cons === "apply") {
		// because expr is normalized, expr.left must evaluate to a Fun
		var fun = evaluate(expr.left);
		var input = evaluate(expr.right);
		
		//console.log("applying Fun", fun, fun.fun, input);
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
			// if ret is a startCap, memoize the result, annotate its type and expr
			return ret;
		} else {
			return ret;
		}
	} else {
		return expr;
	}
}