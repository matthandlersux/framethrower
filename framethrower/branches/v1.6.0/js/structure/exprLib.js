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
	
	
	upRight: {
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
	
	
	
	

	
	nameInfonsToStrings: {
		type: "Set Object -> Set String",
		chain: ["Cons:right", "X.text:string"]
	},
	
	test1: {
		type: "Set Object -> Set Object",
		chain: ["Cons:right"]
	},
	
	test2: {
		type: "Set Object -> Set Cons",
		expr: "bindSet (compose returnUnitSet Object~Cons)"
	},
	
	potentialNameInfonsHelper: {
		type: "Unit Cons -> Set Object",
		chain: ["upRight"]
	},
	
	potentialNameInfons: {
		type: "Object -> Set Object",
		expr: "obj -> potentialNameInfonsHelper (Cons::lookup shared.name obj)"
	},
	
	getName: {
		type: "Object -> Set String",
		expr: "obj -> nameInfonsToStrings (potentialNameInfons obj)"
	}
	
};


forEach(exprLib, function(o, name) {
	if (o.expr) {
		addExpr(name, o.expr, o.type, base);		
	} else if (o.chain) {
		var chain = map(o.chain, function (exprString) {
			return parseExpr(exprString);
		});
		var startType = o.startType;
		if (o.type) {
			startType = parseType(o.type).left;
		}
		var expr = exprChainer.chain(startType, chain);
		if (o.type && !compareTypes(parseType(o.type), getType(expr))) {
			debug.error("Expression `"+name+"` has type `"+unparseType(getType(expr))+"` but expected `"+o.type+"`");
		}
		base.add(name, expr);
	}
});
