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


function getExpr(o) {
	/*
	this function takes an object, and returns the expression (Expr) that was used to make this object
	in particular, this returned expression will only make reference to the primitive functions, literals, and scafOb's
	notice that Fun's and StartCap's created using evaluate() have their .expr field tagged already with such an expression
	*/
	var t = typeOf(o);
	if (basicTypes[t]) { // literals: Number, String, or Bool
		return o;
	} else { //object
		if (!o.expr) {
			if (o.kind === "cons") {
				o.expr = makeCons(o.cons, getExpr(o.left), getExpr(o.right));
			} else if (o.kind === "var") {
				o.expr = o;
			} else {
				// this should only be the case for primitive functions and ScafOb's
				return o;
			}
			o.expr = getTypeOfExpr(o);
		}
		return o.expr;
	}
}

