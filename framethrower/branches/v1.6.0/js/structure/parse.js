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
	
	var tokens = s.split(/(\s+|\(|\)|->|")/); // extracts tokens: whitespace, "(", ")", "->", quotes ("), and words (anything in between those symbols)
	
	function pullQuotedStrings(tokens) {
		var ret = [];
		var quoting = false;
		var qs = [];
		var prevBS = false;
		forEach(tokens, function (token) {
			if (!quoting) {
				if (token === '"') {
					quoting = true;
					qs = [];
				} else {
					ret.push(token);
				}
			} else {
				if (token === '"' && !prevBS) {
					ret.push(qs.join(""));
					quoting = false;
				} else {
					qs.push(token);
				}
			}
			if (token.charAt(token.length - 1) === "\\") {
				prevBS = true;
			} else {
				prevBS = false;
			}
		});
		if (quoting) {
			throw "Parse Error: Unbalanced quotes";
		}
		return ret;
	}
	tokens = pullQuotedStrings(tokens);
	
	// turn nested parens into nested lists of tokens: "->" and words
	function nestParens(tokens) {
		var ret = [];
		var stack = [ret];
		forEach(tokens, function (token) {
			if (/^\s*$/.test(token)) {
				// ignore whitespace token
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
		return ret;
	}
	tokens = nestParens(tokens);
	
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
	tokens = parseLambdas(tokens);
	
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
	tokens = parseApplys(tokens);
	
	return tokens;
}


function unparse(ast, parens) {
	if (!parens) parens = 0;
	var ret;
	if (typeOf(ast) === "string") {
		return ast;
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

