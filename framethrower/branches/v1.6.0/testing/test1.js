var expr = parse("predicate -> bindSet (compose returnUnitSet (passthru predicate))");

var c = [];

var t = genConstraints(expr, typeEnv, c);