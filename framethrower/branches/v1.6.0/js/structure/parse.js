function parse(s) {
	/*
	Takes in a string and returns an AST.
	An AST is either an object {cons: "apply" || "lambda", left: AST, right: AST} or a String
	Strings are parsed like Haskell, here are the rules:
		apply's associate to the left, so f x y = (f x) y
			that is, f applied to x gives a function that is then applied to y
		lambda's associate to the right, so x -> y -> expr = x -> (y -> expr)
			that is, we have a function that takes a parameter x and gives a function that takes parameter y and gives expr
		apply's bind stronger than lambdas, so x -> f x = x -> (f x)
	
	Try it out:
		parse( "predicate -> bindSet (compose returnUnitSet (passthru predicate))" )
	*/
	
	var tokens = s.split(/\s+|(\(|\)|->)/); // split on spaces and extracts tokens: "(", ")", "->", and words
	
	// turn nested parens into nested lists (of lists) of tokens: "->" and words
	var ret = [];
	var stack = [ret];
	forEach(tokens, function (token) {
		if (token === "") {
		} else if (token === "(") {
			var newCons = [];
			stack[0].push(newCons);
			stack.unshift(newCons);
		} else if (token === ")") {
			stack.shift();
			if (stack.length === 0) {
				throw "Parse Error: Unbalanced parens. Too many )";
			}
		} else {
			stack[0].push(token);
		}
	});
	if (stack.length > 1) {
		throw "Parse Error: Unbalanced parens. Too many (";
	}
	
	// find "->" tokens and replace with lambda AST's
	function parseLambdas(tokens) {
		if (typeOf(tokens) === "string") {
			return tokens;
		} else {
			var index = tokens.indexOf("->");
			if (index === -1) {
				return map(tokens, parseLambdas);
			} else {
				return {
					cons: "lambda",
					left: map(tokens.slice(0, index), parseLambdas),
					right: parseLambdas(tokens.slice(index+1))
				};
			}
		}
	}
	ret = parseLambdas(ret);
	
	// parse all lists of words as apply AST's
	function parseApplys(tokens) {
		if (typeOf(tokens) === "string") {
			return tokens;
		} else if (tokens.cons === "lambda") {
			return {
				cons: "lambda",
				left: parseApplys(tokens.left),
				right: parseApplys(tokens.right)
			};
		} else {
			if (tokens.length === 1) {
				return parseApplys(tokens[0]);
			} else {
				return {
					cons: "apply",
					left: parseApplys(tokens.slice(0, tokens.length - 1)),
					right: parseApplys(tokens[tokens.length - 1])
				};
			}
		}
	}
	ret = parseApplys(ret);
	
	return ret;
}















/*

function makeCons(cons, left, right) {
	return {
		kind: "cons",
		cons: cons,
		left: left,
		right: right
	};
}
function makeApply(left, right) {
	return makeCons("apply", left, right);
}
function makeLambda(left, right) {
	return makeCons("lambda", left, right);
}
function makePrim(value) {
	return {
		kind: "prim",
		value: value
	};
}
function isPrim(o) {
	return o.kind === "prim";
	//return typeof o === "string";
}





function makeVar(value) {
	return {kind: "var", value: value};
}

function parseExpr(s) {
	function helper(ast, env) {
		if (isPrim(ast)) {
			return env(ast.value);
		} else if (ast.cons === "lambda") {
			var name = ast.left.value;
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
		if (expr.kind === "var") {
			return makePrim(expr.value);
		} else if (expr.kind === "cons") {
			return makeCons(expr.cons, helper(expr.left), helper(expr.right));
		} else {
			if (expr.stringify) {
				return makePrim(expr.stringify);
			} else {
				return makePrim(expr.toString());
			}
		}
	}
	return unparse(helper(expr));
}


function unparse(ast, parens) {
	if (!parens) parens = 0;
	var ret;
	if (isPrim(ast)) {
		return ast.value;
	} else if (ast.cons === "apply") {
		ret = unparse(ast.left, 2) + " " + unparse(ast.right, 1);
	} else if (ast.cons === "lambda") {
		ret = unparse(ast.left, 2) + " -> " + unparse(ast.right);
	}
	if ((parens === 2 && ast.cons === "lambda") || parens === 1) {
		return "(" + ret + ")";
	} else {
		return ret;
	}
}

*/