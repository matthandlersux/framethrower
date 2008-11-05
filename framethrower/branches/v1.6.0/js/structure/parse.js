
function parse(s) {
	var tokens = s.split(/\s+|(\(|\)|->)/); // split on spaces and extract tokens "(", ")", "->"
	
	tokens = filter(tokens, function (token) {
		return token !== "";
	});
	
	tokens = parseContainment("parens", "(", ")", tokens);
	tokens = parseInfixRight("->", "->", tokens);
	
	return tokens;
}


function parseContainment(construct, left, right, tokens) {
	var ret = [];
	var stack = [ret];
	forEach(tokens, function (token) {
		if (token === left) {
			var newCons = {
				construct: construct,
				list: []
			};
			stack[0].push(newCons);
			stack.unshift(newCons.list);
		} else if (token === right) {
			stack.shift();
			if (stack.length === 0) {
				throw "Parse Error: Unbalanced "+construct+". Too many "+right;
			}
		} else {
			stack[0].push(token);
		}
	});
	
	if (stack.length > 1) {
		throw "Parse Error: Unbalanced "+construct+". Too many "+left;
	}
	
	return ret;
}

function parseInfixRight(construct, sep, tokens) {
	function recurse(tokens) {
		return map(tokens, function (token) {
			if (token.list) {
				return {
					construct: token.construct,
					list: parseInfixRight(construct, sep, token.list)
				};
			} else {
				return token;
			}
		});
	}
	
	var index = tokens.indexOf(sep);
	if (index === -1) {
		return recurse(tokens);
	} else {
		return {
			construct: construct,
			list: [
				recurse(tokens.slice(0, index)),
				parseInfixRight(construct, sep, tokens.slice(index+1))
			]
		};
	}
}



// try:
// parse( "predicate -> bindSet (compose returnUnitSet (passthru predicate))" )

