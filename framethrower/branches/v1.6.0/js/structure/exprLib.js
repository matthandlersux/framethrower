/*
TODO:
gate/passthru
put Futures where they're supposed to be
make a Null type for Unit Null instead of Unit Bool?
make an Ord type for generic ordering
*/



var exprLib = {
	
	// ========================================================================
	// Basic utility
	// ========================================================================
	
	identity: {
		type: "a -> a",
		expr: "x -> x"
	},
	swap: {
		type: "(a -> b -> c) -> b -> a -> c",
		expr: "f -> x -> y -> f y x"
	},
	/*compose: {
		type: "(b -> c) -> (a -> b) -> (a -> c)",
		expr: "f -> g -> x -> f (g x)"
	},*/
	
	
	// ========================================================================
	// Monadic utility
	// ========================================================================
	
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
	flattenUnitSet: {
		type: "Unit (Set a) -> Set a",
		expr: "compose flattenSet returnUnitSet"
	},
	flattenSetUnit: {
		type: "Set (Unit a) -> Set a",
		expr: "compose flattenSet (mapSet returnUnitSet)"
	},
	
	
	// ========================================================================
	// Set utility
	// ========================================================================
	
	passthru: {
		type: "(a -> Unit Null) -> a -> Unit a",
		expr: "pred -> x -> gate (pred x) x"
	},
	
	filter: {
		type: "(a -> Unit Null) -> Set a -> Set a",
		expr: "pred -> bindSet (compose returnUnitSet (passthru pred))"
	},
	
	length: {
		type: "Set a -> Unit Number",
		expr: "fold (x -> sum -> add sum 1) (x -> sum -> subtract sum 1) 0"
	},
	
	
	// ========================================================================
	// Map utility
	// ========================================================================
	
	// I think we should consider making this one primitive, maybe as :: Set a -> Unit a
	takeLast: {
		type: "Map Number a -> Unit a",
		expr: "m -> bindUnit ((swap getKey) m) ((mapUnit ((swap subtract) 1)) (length (keys m)))"
	},
	
	unfoldMapInv: {
		type: "(a -> Set a) -> a -> Map Number (Set a)",
		expr: "f -> x -> invert (mapMapValue returnSet (unfoldMap f x))"
	},




	// ========================================================================
	// Object/Cons utility
	// ========================================================================
	
	filterByTruth: {
		type: "Set Cons -> Set Cons",
		expr: "infons -> filter (Cons:truth) infons"
	},
	

	// ========================================================================
	// Getting properties of objects
	// ========================================================================
	
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
	
	getRelationTemplate: {
		type: "Object -> Set XML",
		expr: "obj -> getXML (getOntProp shared.relationTemplate obj)",
		where: {
			getXML: {
				type: "Set Object -> Set XML",
				chain: ["X.xml:xml"]
			}
		}
	},
	
	getTypes: {
		type: "Object -> Set Object",
		expr: "unfoldSet (getOntProp shared.isA)"
	},


	// ========================================================================
	// Querying for infons
	// ========================================================================
	
	getAllInfonsAboveCons: {
		type: "Cons -> Set Cons",
		expr: "unfoldSet up",
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
	
	getConsUsingIn: {
		type: "Object -> Set Cons",
		expr: "x -> upRight (Cons::lookup shared.in x)",
		where: {
			upRight: {
				type: "Unit Cons -> Set Cons",
				chain: ["Object:upRight"]
			}
		}
	},


	getInfonsAbout: {
		type: "Object -> Set Cons",
		expr: "x -> filterByTruth ((bindSet getAllInfonsAboveCons) (setDifference (Object:upLeft x) (returnUnitSet (Cons::lookup shared.in x))))"
	},
	
	getInfonsIn: {
		type: "Object -> Set Cons",
		expr: "x -> filter (compose (compose reactiveNot isEmpty) downRight) (filterByTruth (getConsUsingIn x))",
		where: {
			downRight: {
				type: "Cons -> Set Cons",
				chain: ["Cons:right"]
			}
		}
	},

	getObjectsIn: {
		type: "Object -> Set Object",
		expr: "x -> filter notCons (downRight (filterByTruth (getConsUsingIn x)))",
		where: {
			downRight: {
				type: "Set Cons -> Set Object",
				chain: ["Cons:right"]
			},
			notCons: {
				type: "Object -> Unit Null",
				expr: "obj -> isEmpty (returnUnitSet (Object~Cons obj))"
			}
		}
	},	

	// ========================================================================
	// Getting infon arguments, relation
	// ========================================================================	
	
	getConsComponents: {
		type: "Cons -> Map Number (Set Cons)",
		expr: "cons -> unfoldMapInv downLeft cons",
		where: {
			downLeft: {
				type: "Cons -> Set Cons",
				chain: ["Cons:left"]
			}
		}
	},
	
	getInfonArguments: {
		type: "Cons -> Map Number (Unit Object)",
		expr: "infon -> mapMapValue (compose takeOne downRight) (getConsComponents infon)",
		where: {
			downRight: {
				type: "Set Cons -> Set Object",
				chain: ["Cons:right"]
			}
		}
	},

	getInfonRelations: {
		type: "Cons -> Set Object",
		expr: "infon -> finalLeft (flattenSet (returnUnitSet (takeLast (getConsComponents infon))))",
		where: {
			finalLeft: {
				type: "Set Cons -> Set Object",
				chain: ["Cons:left"]
			}
		}
	}









	
	
	// unfoldToEnd: {
	// 	type: "(a -> Unit a) -> a -> Unit a",
	// 	expr: "f -> x -> takeOne (flattenUnitSet (takeLast (unfoldMapInv (compose returnUnitSet f) x)))",
	// 	where: {
	// 		takeLast: {
	// 			type: "Map Number a -> Unit a",
	// 			expr: "m -> bindUnit ((swap getKey) m) (length (keys m))"
	// 		}
	// 	}
	// },
	
	

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