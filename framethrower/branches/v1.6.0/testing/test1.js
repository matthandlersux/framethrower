var expr = parseExpr("predicate -> bindSet (compose returnUnitSet (passthru predicate))");

var c = [];

var t = genConstraints(expr, emptyEnv, c);

var subs = unify(c);

var type = imposeSubs(t, subs);

console.log(type);



function speedTest() {
	var t = (new Date()).getTime();
	for (var i = 0; i < 10000; i++) {
		parse("predicate -> bindSet (compose returnUnitSet (passthru predicate))");
	}
	var td = (new Date()).getTime();
	return td - t;
}