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
	
	var tokens = s.split(/(\s+|\(|\)|->|"|\[|\]|\,)/); // extracts tokens: whitespace, "(", ")", "->", quotes ("), "[", "]", ",", and words (anything in between those symbols)
	
	function pullQuotedStrings(tokens) {
		var ret = [];
		var quoting = false;
		var qs = [];
		var prevBS = false;
		forEach(tokens, function (token) {
			if (!quoting) {
				if (token === '"') {
					quoting = true;
					qs = ['"'];
				} else {
					ret.push(token);
				}
			} else {
				if (token === '"' && !prevBS) {
					qs.push(token);
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

	// get rid of whitespace:
	tokens = filter(tokens, function(s) {return !(/^\s*$/.test(s));});
	
	var ast = parseOne(tokens);
	
	if(tokens.length > 0) throw "Parse error: trailing tokens: "+tokens;
	
	return ast;
}

/* parses one expression from tokens, a list of non-whitespace tokens.
 * the parsed AST is returned, and the used tokens are removed.
 */
function parseOne(tokens, applies) {
	if(!applies)
		applies = [];
		
	var ast = undefined;
	
	if(tokens.length===0) throw "Parse error: empty expression";

	// no valid expression begins with these tokens:
	if(tokens[0] === "->" || tokens[0] === ',' || tokens[0] === ']' || tokens[0] === ')')
		throw "Parse error: expression beginning with "+tokens[0];

	if(tokens[0] === "(") {
		tokens.shift();

		var tuple = [parseOne(tokens)];
		while(tokens[0] === ',') { // accumulate tuple elements
			tokens.shift();
			tuple.push( parseOne(tokens) );
		}

		if(tokens[0] !== ")") throw "Parse error: missing )";
		tokens.shift();
		
		ast = makeTupleAST(tuple);
	}
	
	else if(tokens[0] === "[") {
		tokens.shift();

		var list = [parseOne(tokens)];
		while(tokens[0] === ',') { // accumulate list elements
			tokens.shift();
			list.push( parseOne(tokens) );
		}

		if(tokens[0] !== "]") throw "Parse error: missing ]";
		tokens.shift();

		ast = makeListAST(list);
	}
	
	else // not a special token, just a literal, i.e. an ast leaf
		ast = tokens.shift();

	applies.push(ast);

	// end of expression?
	if(tokens.length === 0 || tokens[0] === ',' || tokens[0] === ']' || tokens[0] === ')')
		return makeAppliesAST(applies.shift(), applies);
		
	if(tokens[0] === "->") { // recurse on lambdas
		tokens.shift();
		return {cons: 'lambda', left: makeAppliesAST(applies.shift(), applies), right: parseOne(tokens)};
	}

	// iterate on applies:
	return parseOne(tokens, applies);
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
