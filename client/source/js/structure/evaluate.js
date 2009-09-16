var evalCache = {};


function betaReduceExpr(expr) {
	var orig = expr;
	
	
	// for testing	
	// function simulate(expr) {
	// 	if (expr.kind === "exprApply") {
	// 		var left = simulate(expr.left);
	// 		if (left.kind === "exprLambda") {
	// 			return betaReplace(left, expr.right);
	// 		} else {
	// 			return makeApply(left, expr.right);
	// 		}
	// 	}
	// 	return expr;
	// }
	// var origBetaReplaced = simulate(orig);
	
	
	
	var params = [];
	while (expr.kind === "exprApply") {
		params.push(expr.right);
		expr = expr.left;
	}
	params.reverse();
	
	var lambdaCount = 0;
	var paramCount = params.length;
	while (expr.kind === "exprLambda" && lambdaCount < paramCount) {
		lambdaCount++;
		expr = expr.expr;
	}
	
	function shiftReplaceExpr(expr, extraLambdas, level) {
		// suitably increasing the free variables occurring in N each time, to match the number of λ-binders the corresponding variable occurs under when substituted.
		if (getOutsideScope(expr) <= level) {
			return expr;
		} else if (expr.kind === "exprVar") {
			if (expr.deBruijn > level) {
				return makeVar(expr.deBruijn + extraLambdas);
			} else {
				return expr;
			}
		} else if (expr.kind === "exprApply") {
			return makeApply(shiftReplaceExpr(expr.left, extraLambdas, level), shiftReplaceExpr(expr.right, extraLambdas, level));
		} else if (expr.kind === "exprLambda") {
			return makeLambda(expr.varName, shiftReplaceExpr(expr.expr, extraLambdas, level + 1));
		} else {
			return expr;
		}
	}
	
	function helper(expr, deBruijn) {
		if (getOutsideScope(expr) === 0) {
			return expr;
		} else if (expr.kind === "exprVar") {
			if (expr.deBruijn > deBruijn && expr.deBruijn <= deBruijn + lambdaCount) {
				
				var argNum = expr.deBruijn - deBruijn;
				return shiftReplaceExpr(params[lambdaCount - argNum], deBruijn - 1, 0);
				//var ret = shiftReplaceExpr(replaceExpr, deBruijn - 1, 0);
				//return ret;
			} else if (expr.deBruijn > deBruijn + lambdaCount) {
				// decrease the free variables of M to match the removal of the outer λ-binder(s)
				return makeVar(expr.deBruijn - lambdaCount);
			} else {
				return expr;
			}
		} else if (expr.kind === "exprLambda") {
			return makeLambda(expr.varName, helper(expr.expr, deBruijn + 1));
		} else if (expr.kind === "exprApply") {
			return makeApply(helper(expr.left, deBruijn), helper(expr.right, deBruijn));
		} else {
			return expr;
		}
	}
	
	if (lambdaCount > 0) {
		var ret = helper(expr, 0);
		var extraParam = lambdaCount;
		while (extraParam < paramCount) {
			ret = makeApply(ret, params[extraParam]);
			extraParam++;
		}
		
		return ret;
	} else {
		return orig;
	}
	
	
}


function runBetaReduceExprTests() {
	var f = parseExpr("a -> b -> c -> mapUnit4 a b c");
	var x = makeApply(f, 6);
	var y = makeApply(makeApply(f, 6), 7);
	var z = makeApply(makeApply(makeApply(f, 6), 7), 8);
	console.log(betaReduceExpr(x));
	console.log(betaReduceExpr(y));
	console.log(betaReduceExpr(z));
	
	var q = parseExpr("(x -> plus x 1) 6 7");
	console.log(betaReduceExpr(q));
	
	console.log("break");
	
	var q2 = parseExpr("(unfoldSet (((a-> (b-> (c-> (a (b c))))) ((d-> (bindSet (e-> (returnUnitSet (returnUnit (d e)))))) Pipe:type)) Situation:asInstance))");
	console.log(betaReduceExpr(q2));
}




function evaluate2(expr) {
	/*
	This function will evaluate an Expr
	Another way of looking at it is getting rid of all top-level apply's in an Expr by doing the applications
	Also, if the expr is a remote cell, this function will create/return the proper surrogate cell
	*/
	
	//console.log("evaluating expression", unparseExpr(expr));
	
	
	
	

	
	
	if (expr.kind === "exprApply") {
		
		expr = betaReduceExpr(expr);
		if (expr.kind !== "exprApply") {
			return expr;
		}
		
		//getApplyParamsAndFunction(expr);
		
		//getRemote(expr); // just to tag the expr's .remote

		// check if it's already memoized
		var resultExprStringified = stringify(expr);
		var cached = evalCache[resultExprStringified];
		if (cached) {
			return cached;
		}

		// if (getRemote(expr) === 1) {
		// 	//var ret = queryExpr(expr);
		// 	var ret = session.query(expr);
		// 	memoizeCell(resultExprStringified, ret);
		// 	return ret;
		// }
		
		
		var fun = evaluate2(expr.left);
		var input = evaluate2(expr.right);
		
		if (fun.kind === "exprLambda") {
			return evaluate2(makeApply(fun, input));
		} else {
			// fun wasn't a lambda, and evaluate can't return an apply, so fun must be a Fun, so we can run it
			
			var resultType = GLOBAL.typeCheck ? getType(expr) : undefined;
			
			var ret = fun.fun(input);

			if (typeof ret === "function") {
				// if ret is a function, return a Fun and annotate its type and expr
				return makeFun(resultType, ret, stringify(expr), expr.remote);
			} else if (ret.kind === "cell") {
				// if ret is a cell, memoize the result and annotate its type and expr
				
				// annotate
				ret.type = resultType;
				ret.name = stringify(expr);
				ret.remote = expr.remote;
				
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


var evaluate = evaluate2; // this total misdirection is because the new firebug doesn't like to run a function called "evaluate" in the console (!!!)


// function evaluate(expr) {
// 	var ret = evaluate2(expr);
// 	// if (ret.kind === "cell") {
// 	// 	console.warn("Uh oh evaluate called and resulted in a cell, potential memory leak", expr, ret);
// 	// }
// 	return ret;
// }








function memoizeCell(exprString, cell) {
	evalCache[exprString] = cell;
	// add remove-from-cache callback to the cell
	cell.addOnRemove(function () {
		delete evalCache[exprString];
	});
	// TODO: test this cacheing
}




function evaluateAndInject(expr, depender, func) {
	var e = evaluate2(expr);
	return e.inject(depender, func);
}

