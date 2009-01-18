/*
TODO:
gate/passthru
put Futures where they're supposed to be
make a Null type for Unit Null instead of Unit Bool?
make an Ord type for generic ordering
*/



var exprLib = {
	identity: {
		type: "a -> a",
		expr: "x -> x"
	},
	/*compose: {
		type: "(b -> c) -> (a -> b) -> (a -> c)",
		expr: "f -> g -> x -> f (g x)"
	},*/
	
	
	returnSet: {
		type: "a -> Set a",
		expr: "x -> returnUnitSet (returnUnit x)"
	},
	mapUnit: {
		type: "(a -> b) -> Unit a -> Unit b",
		expr: "f -> bindUnit (compose returnUnit f)"
	},
	mapSet: {
		type: "(a -> b) -> Set a -> Set b",
		expr: "f -> bindSet (compose returnSet f)"
	},
	flattenUnit: {
		type: "Unit (Unit a) -> Unit a",
		expr: "bindUnit identity"
	},
	flattenSet: {
		type: "Set (Set a) -> Set a",
		expr: "bindSet identity"
	},
	
	
/*	upRight: {
		type: "Object -> Set Object",
		expr: "compose (mapSet Cons~Object) Object:upRight"
	},
	upLeft: {
		type: "Object -> Set Object",
		expr: "compose (mapSet Cons~Object) Object:upLeft"
	},
	
	consWithRelation: {
		type: "Set Object -> Set Object",
		expr: "bindSet upRight"
	},
	consWithArgument: {
		type: "Set Object -> Set Object",
		expr: "bindSet upLeft"
	},
*/	
	
	
	

	

	
/*	test1: {
		type: "Set Object -> Set Object",
		chain: ["Cons:right"]
	},
	
	test2: {
		type: "Set Object -> Set Cons",
		expr: "bindSet (compose returnUnitSet Object~Cons)"
	},
*/	

	

	
	getName: {
		type: "Object -> Set String",
		expr: "obj -> nameInfonsToStrings (getNameInfons obj)",
		where: {
			getNameInfons: {
				type: "Object -> Set Cons",
				expr: "obj -> helper (Cons::lookup shared.name obj)",
				where: {
					helper: {
						type: "Unit Cons -> Set Cons",
						chain: ["Object:upRight"]
					}
				}
			},
			nameInfonsToStrings: {
				type: "Set Cons -> Set String",
				chain: ["Cons:right", "X.text:string"]
			}
		}
	}
	
};

function processExprs(exprs, dynamicEnv) {
	forEach(exprs, function (o, name) {
		var scope = makeDynamicEnv(dynamicEnv.env);
		
		if (o.where) {
			processExprs(o.where, scope);
		}
		
		var expr;
		if (o.expr) {
			var expr = parseExpr(o.expr, scope.env);
		} else if (o.chain) {
			var chain = map(o.chain, function (exprString) {
				return parseExpr(exprString, scope.env);
			});
			var startType = o.startType;
			if (o.type) {
				startType = parseType(o.type).left;
			}
			var expr = exprChainer.chain(startType, chain);
		}
		if (o.type && !compareTypes(parseType(o.type), getType(expr))) {
			debug.error("Expression `"+name+"` has type `"+unparseType(getType(expr))+"` but expected `"+o.type+"`");
		}
		dynamicEnv.add(name, expr);
	});
}

processExprs(exprLib, base);