/*
An Expr is any one of the following:
	* Number, String, Bool
	* Fun
	* Cell - see reactive/cells.js
	* Object - see objects/objects.js
	* Var
	*	{
			kind: "exprApply",
			left: Expr,
			right: Expr
		}
	*	{
			kind: "exprLambda",
			varName: String, (NOTE: optional. varName is only a human convenience, the system never needs to know this)
			expr: Expr
		}

A Var is:
	{
		kind: "exprVar",
		deBruijn: Number
	}

NOTE: our expr data structure now uses deBruijn indexes:
http://en.wikipedia.org/wiki/De_Bruijn_index

*/



function parseExpression(ast, env, deBruijnHash) {
	if (!deBruijnHash) deBruijnHash = {};
	function incrementHash() {
		var newDeBruijnHash = {};
		forEach(deBruijnHash, function (index, varName) {
			newDeBruijnHash[varName] = index + 1;
		});
		return newDeBruijnHash;
	}

	if (typeOf(ast) === "string") {
		if (deBruijnHash[ast]) {
			return makeVar(deBruijnHash[ast]);
		} else {
			return env(ast);			
		}
	} else if (ast.cons === "lambda") {
		var newDeBruijnHash = incrementHash();
		var varName = ast.left;
		newDeBruijnHash[varName] = 1;
		return makeLambda(varName, parseExpression(ast.right, env, newDeBruijnHash));
	} else if (ast.cons === "apply") {
		return makeApply(parseExpression(ast.left, env, deBruijnHash), parseExpression(ast.right, env, deBruijnHash));
	}
}

function parseExpr(s, env) {
	/*
	Takes in a string and returns an Expr.
	After parsing the string to an AST,
		for each word we look it up in env
		for each apply we make the appropriate apply Expr
		for each lambda we make the appropriate lambda Expr
	*/
	if (!env) env = base.env;
	return parseExpression(parse(s), env);
}


// function unparseExpr(expr) {
// 	function helper(expr, deBruijnCount) {
// 		
// 	}
// }







function betaReplace(expr, replaceExpr) {
	/*
	Takes an expr (which should be a lambda expression) and "applies" it to replaceExpr,
	replacing all occurances of the variable bound by the lambda expression with the replacement expression.
	
	Specifically, via http://en.wikipedia.org/wiki/De_Bruijn_index
	find the variables n1, n2, …, nk in M that are bound by the λ in λ M,
	decrease the free variables of M to match the removal of the outer λ-binder, and
	replace n1, n2, …, nk with N, suitably increasing the free variables occurring in N each time, to match the number of λ-binders the corresponding variable occurs under when substituted.
	
	*/
	
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
	
	// var optimizeType = false;
	// if (getOutsideScope(expr) === 0 && getOutsideScope(replaceExpr) === 0) {
	// 	optimizeType = true;
	// 	var typeVarToReplace = getType(expr).left.value;
	// 	var typeToReplaceWith = getType(replaceExpr);		
	// }
	
	function helper(expr, deBruijn) {
		if (getOutsideScope(expr) === 0) {
			return expr;
		} else if (expr.kind === "exprVar") {
			if (expr.deBruijn === deBruijn) {
				var ret = shiftReplaceExpr(replaceExpr, deBruijn - 1, 0);
				return ret;
				//return replaceExpr;
			} else if (expr.deBruijn > deBruijn) {
				// decrease the free variables of M to match the removal of the outer λ-binder
				return makeVar(expr.deBruijn - 1);
			} else {
				return expr;
			}
		} else if (expr.kind === "exprLambda") {
			//return makeLambda(expr.varName, helper(expr.expr, deBruijn + 1), optimizeType && expr.type && imposeSub(expr.type, typeVarToReplace, typeToReplaceWith));
			return makeLambda(expr.varName, helper(expr.expr, deBruijn + 1));
		} else if (expr.kind === "exprApply") {
			//return makeApply(helper(expr.left, deBruijn), helper(expr.right, deBruijn), optimizeType && expr.type && imposeSub(expr.type, typeVarToReplace, typeToReplaceWith));
			return makeApply(helper(expr.left, deBruijn), helper(expr.right, deBruijn));
		} else {
			return expr;
		}
	}
	var ret = helper(expr.expr, 1);
	
	return ret;
}



function fullBetaReduce(expr) {
	if (expr.kind === "exprLambda") {
		return makeLambda(expr.varName, fullBetaReduce(expr.expr), expr.type);
	} else if (expr.kind === "exprApply") {
		var fun = fullBetaReduce(expr.left);
		var input = fullBetaReduce(expr.right);
		if (fun.kind === "exprLambda") {
			return fullBetaReduce(betaReplace(fun, input)); // do I need this extra fullBetaReduce around the betaReplace?
		} else {
			return makeApply(fun, input, expr.type);			
		}
	} else {
		return expr;
	}
}
