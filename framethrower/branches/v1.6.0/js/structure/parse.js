/*

parse(string) returns an AST
	an AST is either a string or an object with properties cons, left, right
		cons is a string, either "apply" or "lambda"
		left and right are AST's

	try:
		parse( "predicate -> bindSet (compose returnUnitSet (passthru predicate))" )
*/

function makeApply(leftAST, rightAST) {
	return {
		cons: "apply",
		left: leftAST,
		right: rightAST
	};
}
function makeLambda(leftAST, rightAST) {
	return {
		cons: "lambda",
		left: leftAST,
		right: rightAST
	};
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
			return parsed;
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



function unparse(ast, parens) {
	if (!parens) parens = 0;
	var ret;
	if (!ast.cons) {
		return ast;
	} else if (ast.cons === "apply") {
		ret = unparse(ast.left) + " " + unparse(ast.right, 1);
	} else if (ast.cons === "lambda") {
		ret = unparse(ast.left, 2) + " -> " + unparse(ast.right);
	}
	if ((parens === 2 && ast.cons === "lambda") || parens === 1) {
		return "(" + ret + ")";
	} else {
		return ret;
	}
}

