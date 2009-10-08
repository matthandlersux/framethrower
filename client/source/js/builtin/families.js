// familyEnv is incorporated into the base environment in baseEnv.js
// it contains families of functions, such as mapUnitN, makeTupleN, et cetera.

var familyEnv = undefinedEnv;

var mapUnitEnv = function (s) {
	// if string isn't of the form 'mapUnitN' then give up:
	var mapUnitMatch = /^mapUnit(\d+)$/.exec(s);
	if(!mapUnitMatch)
		return undefined;
		
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
	return makeFun(type, curry(mapUnit, n+1));
};
familyEnv = extendEnv(familyEnv, mapUnitEnv);

var makeTupleEnv = function (s) {
	// if string isn't of the form 'makeTupleN' then give up:
	var makeTupleMatch = /^makeTuple(\d+)$/.exec(s);
	if(!makeTupleMatch)
		return undefined;

	var n = parseInt(makeTupleMatch[1], 10);
	var paramsType = "t1", tupleType = "Tuple"+n+" t1";
	for(var i=2; i<=n; i++) {
		paramsType += " -> t"+i;
		tupleType += " t"+i;
	}
	var type = parseType( paramsType+" -> "+tupleType );

	return makeFun(type, curry(makeTuple, n));
};
familyEnv = extendEnv(familyEnv, makeTupleEnv);

var tupleGetEnv = function (s) {
	// if string isn't of the form 'tupleNgetI' then give up:
	var tupleGetMatch = /^tuple(\d+)get(\d+)$/.exec(s);
	if(!tupleGetMatch)
		return undefined;

	var n = parseInt(tupleGetMatch[1], 10),
		i = parseInt(tupleGetMatch[2], 10);
	var tupleType = "Tuple"+n;
	for(var j=1; j<=n; j++)
		tupleType += " t"+j;
	var type = parseType( tupleType+" -> t"+i );

	return makeFun(type, function(tuple) { return tuple.asArray[i-1]; });
};
familyEnv = extendEnv(familyEnv, tupleGetEnv);

familyEnv = makeCachedEnv(familyEnv);
