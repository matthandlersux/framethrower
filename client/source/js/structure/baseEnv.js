/*
Here we define our base environment (base), which is used by expressions.
base.env will convert literal strings (Number's, String's, Bool's) to their actual representation
*/



var literalEnv = function (s) {
	var lit = parseLiteral(s);
	if (lit !== undefined) {
		return lit;
	} else {
		return emptyEnv(s);
	}
};

function makeApplies(f, args) {
	var expr = f;
	for(var i=0; i<args.length; i++)
		expr = makeApply(expr, args[i]);
	return expr;
}

var mapUnitCache = {}
var mapUnitEnv = function (s) {
	// if string isn't of the form 'mapUnitN' then just use literalEnv:
	var mapUnitMatch = /^mapUnit(\d+)$/.exec(s);
	if(!mapUnitMatch)
		return literalEnv(s);

	var v = mapUnitCache[s];
	if(v!==undefined)
		return v;
		
	var n = parseInt(mapUnitMatch[1]);
	var fType = "t0", mapType = "Unit t0";
	for(var i=1; i<=n; i++) {
		fType += " -> t"+i;
		mapType += " -> Unit t"+i;
	}
	var type = parseType( "("+fType+") -> "+mapType );
	var mapUnit = function() {
		var args = Array.prototype.slice.call(arguments);
		var func = args.shift(); // first argument is the function
		return mapUnitJS(function () { // javascript version of func
			return evaluate(makeApplies(func, arguments));
		}).apply(null, args); // remaining arguments are the cells
	}
	v = makeFun(type, curry(mapUnit, n+1));
	mapUnitCache[s] = v;
	return v;
}

var base = makeDynamicEnv(mapUnitEnv);
