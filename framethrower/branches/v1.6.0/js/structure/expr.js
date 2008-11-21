/*
An Expr is any one of the following:
	* Number, String, Bool
	* Fun
	* StartCap - TODO
	* ScafOb - TODO
	* Var
	*	{
			kind: "cons",
			cons: "apply",
			left: Expr,
			right: Expr
		}
	*	{
			kind: "cons",
			cons: "lambda",
			left: Var,
			right: Expr
		}

A Var is:
	{
		kind: "var",
		value: String
	}
*/






function makeVar(name) {
	return {kind: "var", value: name};
}
function makeCons(cons, left, right) {
	return {kind: "cons", cons: cons, left: left, right: right};
}
function makeApply(left, right) {
	// We can put a typechecker here...
	return makeCons("apply", left, right);
}
function makeLambda(left, right) {
	return makeCons("lambda", left, right);
}

function parseExpr(s) {
	/*
	Takes in a string and returns an Expr.
	After parsing the string to an AST,
		for each word we look it up in baseEnv
		for each apply we make the appropriate apply Expr
		for each lambda we make the appropriate lambda Expr
	*/
	
	function helper(ast, env) {
		if (typeOf(ast) === "string") {
			return env(ast);
		} else if (ast.cons === "lambda") {
			var name = ast.left;
			var v = makeVar(name);
			return makeLambda(v, helper(ast.right, envAdd(env, name, v)));
		} else if (ast.cons === "apply") {
			return makeApply(helper(ast.left, env), helper(ast.right, env));
		}
	}
	return helper(parse(s), baseEnv);
}

function unparseExpr(expr) {
	function helper(expr) {
		if (expr.kind === "cons") {
			return {
				cons: expr.cons,
				left: helper(expr.left),
				right: helper(expr.right)
			};
		} else if (expr.kind === "var") {
			return expr.value;
		} else if (expr.stringify) { // replace all this stuff with stringify()...
			return expr.stringify;
		} else {
			return expr.toString();
		}
	}
	return unparse(helper(expr));
}


function normalizeVariables(expr, prefix) {
	/*
	Takes in a closed Expr and returns it back but with every lambda's parameter renamed in a standard way
		Properties:
			Every lambda expression will have a unique parameter name
			normalizeVariables will return the same thing on any Expr's that are "alpha-equivalent" (equivalent up to variable names)
		Optional parameter prefix: will name variables starting with this prefix, default is "x"
	*/
	
	function helper(expr, nameGen, env) {
		if (expr.kind === "cons") {
			if (expr.cons === "apply") {
				return makeApply(helper(expr.left, nameGen, env), helper(expr.right, nameGen, env));
			} else if (expr.cons === "lambda") {
				var newVar = makeVar(nameGen());
				var newEnv = envAdd(env, expr.left.value, newVar);
				return makeLambda(newVar, helper(expr.right, nameGen, newEnv));
			}
		} else if (expr.kind === "var") {
			return env(expr.value);
		} else {
			return expr;
		}
	}
	
	if (!prefix) prefix = "x";
	return helper(expr, makeGenerator(prefix), emptyEnv);
}


function betaReplace(expr, name, replaceExpr) {
	// this should only be called if expr and replaceExpr share no variable names (to avoid collisions)
	if (expr.kind === "var" && expr.value === name) {
		return replaceExpr;
	} else if (expr.kind === "cons") {
		return makeCons(expr.cons, betaReplace(expr.left, name, replaceExpr), betaReplace(expr.right, name, replaceExpr));
	} else {
		return expr;
	}
}

function betaReduce(expr) {
	// this should only be called on Expr's with normalized variables (to avoid collisions)
	if (expr.kind === "cons") {
		if (expr.cons === "apply") {
			var fun = betaReduce(expr.left);
			var input = betaReduce(expr.right);
			if (fun.cons === "lambda") {
				// we can do a beta reduction here
				return betaReduce(betaReplace(fun.right, fun.left.value, input));
			} else {
				return makeApply(fun, input);
			}
		} else if (expr.cons === "lambda") {
			return makeLambda(expr.left, betaReduce(expr.right));
		}
	} else {
		return expr;
	}
}

function normalizeExpr(expr) {
	return normalizeVariables(betaReduce(normalizeVariables(expr)));
}





/*

function freeVariables(expr) {
	// returns a list (really a hash whose keys are a list) of free variable names in expr
	var ret = {};
	function helper(expr, env) {
		if (expr.kind === "var") {
			if (!env(expr.value)) {
				ret[expr.value] = true;
			}
		} else if (expr.kind === "cons") {
			if (expr.cons === "apply") {
				helper(expr.left, env);
				helper(expr.right, env);
			} else if (expr.cons === "lambda") {
				helper(expr.right, envAdd(env, expr.left.value, true));
			}
		}
	}
	helper(expr, falseEnv);
	return ret;
}

function allVariables(expr) {
	// returns a list (really a hash whose keys are a list) of all variable names in expr
	var ret = {};
	function helper(expr) {
		if (expr.kind === "var") {
			ret[expr.value] = true;
		} else if (expr.kind === "cons") {
			helper(expr.left);
			helper(expr.right);
		}
	}
	helper(expr);
	return ret;
}

function alphaConvert(expr, newVarName) {
	// takes a lambda expression and renames the parameter to newVarName
	// warning: bad things happen if newVarName is in allVariables(expr.right), so check that first!
	if (expr.kind === "var")
}



function substitute(expr, name, replaceExpr) {
	// returns back expr but with Var's named name replaced with replaceExpr
	
	var fv = freeVariables(replaceExpr);
	
	function helper(expr) {
		if (expr.kind === "var") {
			if (expr.value === name) {
				return replaceExpr;
			} else {
				return expr;
			}
		} else if (expr.kind === "cons") {
			if (expr.cons === "apply") {
				return makeApply(helper(expr.left), helper(expr.right));
			} else if (expr.cons === "lambda") {
				if (expr.left.value === name) {
					// name is now bound to something else, so just return the expr
					return expr;
				} else {
					if (fv[expr.left.value]) {
						// this lambda uses a variable that replaceExpr uses, so we'll need to alpha convert the lambda first
					} else {
						
					}
				}
			}
		} else {
			return expr;
		}
	}

}

*/












/*
var varNameGen = makeGenerator("x");

function makeLambda(left, right) {
	return {kind: "cons", cons: "lambda", left: left, right: right};
}
function makeApply(left, right) {
	return {kind: "cons", cons: "apply", left: left, right: right};
}

function parseExpr(s) {
	/ *
	Takes in a string and returns an Expr in normal form.
	Note parseExpr will throw an error if it is passed a non-"closed" expression.
		That is, there shouldn't be any free variables in s, every word should either be in baseEnv or bound by a lambda abstraction.
	
	Algorithm:
		After parsing the string to an AST,
			for each word we look it up in baseEnv
			for each apply we make the appropriate apply Expr
			for each lambda we make the appropriate lambda Expr,
				in this case we also rename the variable using varNameGen,
				this way no Expr's ever use the same Var name twice (unless they correspond)
				INVARIANT: no two lambdas (in the entire system) use the same Var name as their parameter
		Next we normalize, that is apply beta reduction wherever possible
	* /
	
	function helper(ast, env) {
		if (typeOf(ast) === "string") {
			return env(ast);
		} else if (ast.cons === "lambda") {
			var name = ast.left;
			var v = {
				kind: "var",
				value: varNameGen()
			};
			return makeLambda(v, helper(ast.right, envAdd(env, name, v)));
		} else if (ast.cons === "apply") {
			return makeApply(helper(ast.left, env), helper(ast.right, env));
		}
	}
	return helper(parse(s), baseEnv);
}

function betaReduce(expr, env) {
	if (expr.kind === "cons") {
		if (expr.cons === "apply") {
			var fun = betaReduce(expr.left, env);
			var input = betaReduce(expr.right, env);
			if (fun.cons === "lambda") {
				var varName = fun.left.value;
				var newEnv = envAdd(env, varName, input);
				return betaReduce(fun.right, newEnv);
			} else {
				return makeApply(fun, input);
			}
		} else if (expr.cons === "lambda") {
			var newEnv = envAdd(env, expr.left.value, expr.left);
			return makeLambda(expr.left, betaReduce(expr.right, newEnv));
		}
	} else if (expr.kind === "var") {
		return env(expr.value);
	} else {
		return expr;
	}
}






function freshenExpr(expr) {
	// returns back an expr but with all Var's renamed to fresh var names
	// used by betaReplace, to ensure that no two lambdas use the same Var name
	
}


*/






































/*

The result of an evaluate is always either:
	a fun
	a lambda expression
	a String, Number, or Bool
	a reactive start cap

*/
/*
function evaluate(expr) {
	if (expr && expr.cons === "apply") {
		var ret;
		var fun = evaluate(expr.left);
		if (fun.kind === "fun") {
			var input = evaluate(expr.right);
			ret = fun.fun(input);
		} else if (fun.kind === "cons" && fun.cons === "lambda") {
			ret = evaluate(betaReduce(fun.right, fun.left.value, expr.right));
		}
		
		return ret;
	} else {
		return expr;
	}
}

function normalizeVariables(expr, nameGen, env) {
	if (expr.kind === "cons") {
		if (expr.cons === "apply") {
			return makeApply(normalizeVariables(expr.left, nameGen, env), normalizeVariables(expr.right, nameGen, env));
		} else if (expr.cons === "lambda") {
			var newVar = makeVar(nameGen());
			var newEnv = envAdd(env, expr.left.value, newVar);
			return makeLambda(newVar, normalizeVariables(expr.right, nameGen, newEnv));
		}
	} else if (expr.kind === "var") {
		return env(expr.value);
	} else {
		return expr;
	}
}
function betaReduce(expr, env) {
	if (expr.kind === "cons") {
		if (expr.cons === "apply") {
			var fun = betaReduce(expr.left, env);
			var input = betaReduce(expr.right, env);
			if (fun.cons === "lambda") {
				var varName = fun.left.value;
				var newEnv = envAdd(env, varName, input);
				return betaReduce(fun.right, newEnv);
			} else {
				return makeApply(fun, input);
			}
		} else if (expr.cons === "lambda") {
			var newEnv = envAdd(env, expr.left.value, expr.left);
			return makeLambda(expr.left, betaReduce(expr.right, newEnv));
		}
	} else if (expr.kind === "var") {
		return env(expr.value);
	} else {
		return expr;
	}
}
function normalizeExpr(expr) {
	/ *
	Takes an expression and returns it back but with beta-reduction performed wherever possible,
		and lambda expressions using parameters x0, x1, ... in a normalized way
	* /
	
	expr = normalizeVariables(expr, makeGenerator("x"), emptyEnv); // uniqueify variable names (so betaReduce doesn't have to worry about variable capture issues)
	expr = betaReduce(expr, emptyEnv); // beta reduce
	expr = normalizeVariables(expr, makeGenerator("x"), emptyEnv); // normalize variable names
	
	return expr;
}
*/