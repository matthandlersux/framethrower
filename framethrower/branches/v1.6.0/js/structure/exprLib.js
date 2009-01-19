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

	
	getOntProp: {
		type: "Object -> Object -> Set Object",
		expr: "rel -> obj -> infonsToObjects (getInfons rel obj)", // TODO: filter here for truth in the ont layer
		where: {
			getInfons: {
				type: "Object -> Object -> Set Cons",
				expr: "rel -> obj -> helper (Cons::lookup rel obj)",
				where: {
					helper: {
						type: "Unit Cons -> Set Cons",
						chain: ["Object:upRight"]
					}
				}
			},
			infonsToObjects: {
				type: "Set Cons -> Set Object",
				chain: ["Cons:right"]
			}
		}
	},
	
	getName: {
		type: "Object -> Set String",
		expr: "obj -> getStrings (getOntProp shared.name obj)",
		where: {
			getStrings: {
				type: "Set Object -> Set String",
				chain: ["X.text:string"]
			}
		}
	},
	
	getTypes: {
		type: "Object -> Set Object",
		expr: "unfoldSet (getOntProp shared.isA)"
	},
	
	getInfonsAbout: {
		type: "Object -> Set Cons",
		expr: "x -> bindSet (unfoldSet up) (Object:upLeft x)",
		where: {
			up: {
				type: "Cons -> Set Cons",
				expr: "x -> union (upLeft x) (upRight x)",
				where: {
					upLeft: {
						type: "Cons -> Set Cons",
						chain: ["Object:upLeft"]
					},
					upRight: {
						type: "Cons -> Set Cons",
						chain: ["Object:upRight"]
					}
				}
			}
		}
	},
	
	unfoldMapInv: {
		type: "(a -> Set a) -> a -> Map Number (Set a)",
		expr: "f -> x -> invert (mapMapValue returnSet (unfoldMap f x))"
	},
	
	getInfonArguments: {
		type: "Cons -> Map Number (Unit Object)",
		expr: "infon -> mapMapValue (compose takeOne downRight) (unfoldMapInv downLeft infon)",
		where: {
			downLeft: {
				type: "Cons -> Set Cons",
				chain: ["Cons:left"]
			},
			downRight: {
				type: "Set Cons -> Set Object",
				chain: ["Cons:right"]
			}
		}
	},
	
	length: {
		type: "Set a -> Unit Number",
		expr: "fold (x -> sum -> add sum 1) (x -> sum -> subtract sum 1) 0"
	}
	
	/*,
	
	
	
	unfoldToEnd: {
		type: "(a -> Unit a) -> a -> Unit a",
		expr: "f -> x -> takeLast (unfoldMapInv (compose returnUnitSet f) x)",
		where: {
			takeLast: {
				type: "Map Number a -> Unit a",
				expr: 
			}
		}
	}*/
	

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
				var type = parseType(o.type);
				startType = type.left;
				endType = type.right;
			}
			var expr = exprChainer.chain(startType, chain, endType);
		}
		
		// for debug:
		getType(expr); // to make sure it's even well typed at all
		if (o.type && !compareTypes(parseType(o.type), getType(expr))) {
			debug.error("Expression `"+name+"` has type `"+unparseType(getType(expr))+"` but is annotated as `"+o.type+"`");
		}
		
		
		dynamicEnv.add(name, normalizeExpr(expr));
	});
}

processExprs(exprLib, base);