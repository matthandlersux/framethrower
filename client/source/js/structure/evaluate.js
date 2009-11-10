var evalCache = {};



function getFuncAndParams(expr) {
	var params = [];
	while (expr.kind === "exprApply") {
		params.push(expr.right);
		expr = expr.left;
	}
	params.reverse();
	return {func: expr, params: params};
}

function fullBetaReduceExpr(expr) {
	var expr0;
	do {
		expr0 = expr;
		expr = betaReduceExpr(expr);
	} while(expr!==expr0);
	return expr;
}

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
	
	var fp = getFuncAndParams(expr);
	var params = fp.params;
	expr = fp.func;
	
	
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
	// console.log("evaluating expression", unparseExpr(expr));
	
	if (expr.kind === "exprApply") {
		expr = fullBetaReduceExpr(expr);
		
		if (expr.kind !== "exprApply") {
			return expr;
		}
		
		//getApplyParamsAndFunction(expr);
		
		// check if it's already memoized
		var resultExprStringified = stringify(expr);
		var cached = evalCache[resultExprStringified];
		if (cached) {
			return cached;
		}

		var fp = getFuncAndParams(expr);
		if (fp.func.kind === "fun") {
			var paramsLength = fp.params.length;
			var expectedLength = fp.func.argsLength;
			if (paramsLength < expectedLength) {
				// not ready to be fully evaluated
				return expr;
			} else {
				funArgs = fp.params.splice(0, expectedLength);

				var result;

				//check for server exprs
				if (isServerOnly(getRemoteLevel(expr)) && isReactive(getOutputType(fp.func.type))) {
					//var ret = queryExpr(expr);
					//TODO: check if expr returns a Cell before querying server
					result = session.query(expr);
				} else {
					// evaluate each input if the fun is strict
					if (!fp.func.lazy) {
						funArgs = map(funArgs, evaluate2);					
					}
					result = fp.func.fun.apply(null, funArgs);
				}
				
				if (result.kind === "cell") {
					// if result is a cell, memoize the result and annotate its type and expr
				
					// annotate
					if (GLOBAL.typeCheck) result.type = getType(expr);
					result.name = resultExprStringified;
					result.remote = expr.remote;
				
					memoizeCell(resultExprStringified, result);
				}
				// apply the result to any remaining args
				forEach(fp.params, function (remainingParam) {
					result = makeApply(result, remainingParam);
				});
				return evaluate(result);
			}
		} else {
			// this shouldn't happen
			console.error("trying to apply a non-Fun", expr);
		}
		
	} else if (expr.kind === "remoteCell") {
		// check if it's already memoized
		var resultExprStringified = stringify(expr);
		var cached = evalCache[resultExprStringified];
		if (cached) {
			return cached;
		}
		//query the server for the remote cell by name
		var result = session.query(expr);
		//memoize the result
		memoizeCell(resultExprStringified, result);
		return result;
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

