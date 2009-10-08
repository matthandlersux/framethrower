/*
Here we define our base environment (base), which is used by expressions.
base.env will convert literal strings (Number's, String's, Bool's) to their actual representation
*/



var base = function (s) {
	var lit = parseLiteral(s);
	if (lit !== undefined) {
		return lit;
	} else {
		return emptyEnv(s);
	}
};

// bring in families of assignments from families.js
base = extendEnv(base, familyEnv);

base = makeDynamicEnv(base);
