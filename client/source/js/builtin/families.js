// familyEnv is incorporated into the base environment in baseEnv.js
// it contains families of functions, such as mapUnitN, makeTupleN, et cetera.

var familyEnv = undefinedEnv;

var mapUnitCache = {};
var mapUnitEnv = function (s) {
	// if string isn't of the form 'mapUnitN' then give up:
	var mapUnitMatch = /^mapUnit(\d+)$/.exec(s);
	if(!mapUnitMatch)
		return undefined;

	var v = mapUnitCache[s];
	if(v!==undefined)
		return v;
		
	var n = parseInt(mapUnitMatch[1], 10);
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
	};
	v = makeFun(type, curry(mapUnit, n+1));
	mapUnitCache[s] = v;
	
	return v;
};

familyEnv = extendEnv(familyEnv, mapUnitEnv);
