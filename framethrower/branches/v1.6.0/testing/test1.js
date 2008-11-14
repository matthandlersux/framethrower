var expr = parseExpr("predicate -> bindSet (compose returnUnitSet (passthru predicate))");

var c = [];

var t = genConstraints(expr, emptyEnv, c);

var subs = unify(c);

var type = imposeSubs(t, subs);

console.log(type);