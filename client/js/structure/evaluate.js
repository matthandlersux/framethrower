var evalCache = {};

function evaluate2(expr) {
	/*
	This function will evaluate an Expr
	Another way of looking at it is getting rid of all top-level apply's in an Expr by doing the applications
	Also, if the expr is a remote cell, this function will create/return the proper surrogate cell
	*/
	
	//console.log("evaluating expression", unparseExpr(expr));
	
	
	
	var resultType = getType(expr);
	getRemote(expr); // just to tag the expr's .remote
	
	// check if we're returning a StartCap and see if it's already memoized
	var resultExprStringified;
	if (isReactive(resultType)) {
		resultExprStringified = stringify(expr);
		var cached = evalCache[resultExprStringified];
		if (cached) {
			return cached;
		}
		
		if (getRemote(expr) === 1) {
			//var ret = queryExpr(expr);
			var ret = session.query(expr);
			memoizeCell(resultExprStringified, ret);
			return ret;
		}
	}
	
	
	if (expr.kind === "exprApply") {
		var fun = evaluate(expr.left);
		var input = evaluate(expr.right);
		
		if (fun.kind === "exprLambda") {
			// we can do a beta reduction
			var ret = betaReplace(fun, input);
			ret.type = resultType; // optimization
			return evaluate(ret);
		} else {
			// fun wasn't a lambda, and evaluate can't return an apply, so fun must be a Fun, so we can run it
			
			// check if input is an actionRef and fun is an object converter or property accessor
			if (input.kind === "actionRef" && isObjectFun(fun)) {
				return {
					kind: "actionRef",
					type: resultType,
					name: stringify(expr),
					left: fun,
					right: input
				};
			}
			
			var ret = fun.fun(input);

			if (typeof ret === "function") {
				// if ret is a function, return a Fun and annotate its type and expr
				return makeFun(resultType, ret, stringify(expr), expr.remote);
			} else if (ret.kind === "startCap") {
				// if ret is a startCap, memoize the result and annotate its type and expr
				
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









function memoizeCell(exprString, cell) {
	evalCache[exprString] = cell;
	// add remove-from-cache callback to the cell
	cell.addOnRemove(function () {
		delete evalCache[exprString];
	});
	// TODO: test this cacheing
}




function evaluateAndInject(expr, depender, func) {
	var e = evaluate(expr);
	return e.inject(depender, func);
}






function isObjectFun(fun) {
	// TODO: would be nicer if this didn't check based on the name
	var name = stringify(fun);
	return name.indexOf(" ") === -1 && (name.indexOf(":") !== -1 || name.indexOf("~") !== -1);
}
