/*

parse(string) returns an AST
	an AST is either
		an object {kind: "prim", value: String}
		or an object {kind: "cons"} with properties cons, left, right
			cons is a string, either "apply" or "lambda"
			left and right are AST's

	try:
		parse( "predicate -> bindSet (compose returnUnitSet (passthru predicate))" )
*/

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


function parse(s) {
	var tokens = s.split(/\s+|(\(|\)|->)/); // split on spaces and extract tokens "(", ")", "->"
	
	// turn nested parens into nested lists of tokens
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
	
	function parseArrow(tokens) {
		if (arrayLike(tokens)) {
			var index = tokens.indexOf("->");
			if (index === -1) {
				return map(tokens, parseArrow);
			} else {
				return {
					input: map(tokens.slice(0, index), parseArrow),
					output: parseArrow(tokens.slice(index+1))
				};
			}
		} else {
			return tokens;
		}
	}
	
	ret = parseArrow(ret);
	
	function makeAST(parsed) {
		if (typeOf(parsed) === "string") {
			return makePrim(parsed);
		} else if (parsed.input) {
			return makeLambda(
				makeAST(parsed.input),
				makeAST(parsed.output)
			);
		} else {
			if (parsed.length === 1) {
				return makeAST(parsed[0]);
			} else {
				return makeApply(
					makeAST(parsed.slice(0, parsed.length - 1)),
					makeAST(parsed[parsed.length - 1])
				);
			}
		}
	}
	
	return makeAST(ret);
}


function parseType(s) {
	return uniqueifyType(parse(s));
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

