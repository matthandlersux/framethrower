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
	returnFutureSet: {
		type: "Future a -> Set a",
		expr: "x -> returnUnitSet (returnFutureUnit x)"
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
	bindUnitSet: {
		type: "(a -> Unit b) -> Set a -> Set b",
		expr: "f -> bindSet (compose returnUnitSet f)"
	},
	bindFutureSet: {
		type: "(a -> Future b) -> Set a -> Set b",
		expr: "f -> bindSet (compose returnFutureSet f)"
	},
	bindSetUnit: {
		type: "(a -> Set b) -> Unit a -> Set b",
		expr: "f -> compose (bindSet f) returnUnitSet"
	},
	bindFutureUnit: {
		type: "(a -> Future b) -> Unit a -> Unit b",
		expr: "f -> bindUnit (compose returnFutureUnit f)"
	},
	
	// mapBinaryUnit: {
	// 	type: "(a -> b -> c) -> Unit a -> Unit b -> Unit c",
	// 	expr: "f -> compose (compose bindUnit reactiveApply) (mapUnit f)"
	// },
	
	
	// ========================================================================
	// Bool/Reactive Bool (Unit a) utility
	// ========================================================================
	
	reactiveEqual: {
		type: "a -> a -> Unit Null",
		expr: "x -> y -> boolToUnit (equal x y)"
	},
	
	
	// ========================================================================
	// Set utility
	// ========================================================================
	
	isNotEmpty: {
		type: "Set a -> Unit Null",
		expr: "compose reactiveNot isEmpty"
	},
	
	passthru: {
		type: "(a -> Unit b) -> a -> Unit a",
		expr: "pred -> x -> gate (pred x) x"
	},
	
	filter: {
		type: "(a -> Unit b) -> Set a -> Set a",
		expr: "pred -> bindSet (compose returnUnitSet (passthru pred))"
	},
	
	length: {
		type: "Set a -> Unit Number",
		expr: "fold (x -> sum -> add sum 1) (x -> sum -> subtract sum 1) 0"
	},
	
	
	// ========================================================================
	// Map utility
	// ========================================================================
	
	takeLastVal: {
	 	type: "Map a b -> Unit b",
	 	expr: "m -> bindUnit ((swap getKey) m) (takeLast (keys m))"
	},
	
	takeLastKey: {
		type: "Map a b -> Unit a",
		expr: "m -> takeLast (keys m)"
	},
	
	unfoldMapInv: {
		type: "(a -> Set a) -> a -> Map Number (Set a)",
		expr: "f -> x -> invert (mapMapValue returnSet (unfoldMap f x))"
	},




	// ========================================================================
	// Object/Cons utility
	// ========================================================================
	
	getInfon2: {
		type: "Object -> Object -> Object -> Unit Cons",
		expr: "rel -> arg1 -> arg2 -> bindUnit ((swap Cons::lookup) arg2) (mapUnit Cons~Object (Cons::lookup rel arg1))"
	},
	
	getObjectInSit: {
		type: "Object -> Object -> Unit Cons",
		expr: "obj -> sit -> getInfon2 shared.in sit obj"
	},
	
	getObjectInOnt: {
		type: "Object -> Unit Cons",
		expr: "obj -> getObjectInSit obj shared.ont"
	},
	
	
	// ========================================================================
	// Filtering by Truth
	// ========================================================================
	
	filterByTruth: {
		type: "Set Cons -> Set Cons",
		expr: "filter Cons:truth"
	},
	
	filterByTruthInOnt: {
		type: "Set Cons -> Set Cons",
		expr: "infons -> filter (infon -> reactiveNot (isEmpty (filterByTruth (returnUnitSet (ontInfon infon))))) infons",
		where: {
			ontInfon: {
				type: "Cons -> Unit Cons",
				expr: "infon -> getObjectInOnt (Cons~Object infon)"
			}
		}
	},
	
	
	// ========================================================================
	// Getting properties of objects
	// ========================================================================
	
	getOntInfons: {
		type: "Object -> Object -> Set Cons",
		expr: "rel -> obj -> helper (Cons::lookup rel obj)",
		where: {
			helper: {
				type: "Unit Cons -> Set Cons",
				chain: ["Object:upRight"]
			}
		}
	},
	
	getOntInfonsInverse: {
		type: "Object -> Object -> Set Cons",
		expr: "rel -> obj -> filter (infon -> bindUnit (reactiveEqual rel) (downDownLeft infon)) (Object:upLeft obj)",
		where: {
			downDownLeft: {
				type: "Cons -> Unit Object",
				chain: ["Cons:left", "Cons:left"]
			}
		}
	},
	
	getOntProp: {
		type: "Object -> Object -> Set Object",
		expr: "rel -> obj -> infonsToObjects (filterByTruthInOnt (getOntInfons rel obj))",
		where: {
			infonsToObjects: {
				type: "Set Cons -> Set Object",
				chain: ["Cons:right"]
			}
		}
	},
	
	getOntPropInverse: {
		type: "Object -> Object -> Set Object",
		expr: "rel -> obj -> infonsToObjects (filterByTruthInOnt (getOntInfonsInverse rel obj))",
		where: {
			infonsToObjects: {
				type: "Set Cons -> Set Object",
				chain: ["Cons:left", "Cons:right"]
			}
		}
	},

	// ========================================================================
	// Getting some specific properties
	// ========================================================================	
	
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
	
	
	// ========================================================================
	// Getting Type (following isA recursively, infering type for Cons's)
	// ========================================================================
	
	getTypesOLD: {
		type: "Object -> Set Object",
		expr: "unfoldSet (getOntProp shared.isA)"
	},
	
	getTypesOneStep: {
		type: "Object -> Set Object",
		expr: "x -> union (getOntProp shared.isA x) (constructedType x)",
		where: {
			constructedType: {
				type: "Object -> Set Object",
				expr: "x -> finalRight (filter leftLeft (bindSetUnit (getOntProp shared.isA) (left x)))",
				// TODO: instead of (getOntProp shared.isA) this should recursively call getTypes.
				// Right now we can only get type for one-deep Cons's.
				// (Need to build in recursion first).
				where: {
					left: {
						type: "Object -> Unit Object",
						chain: ["Cons:left"]		
					},
					leftLeft: {
						type: "Object -> Unit Object",
						chain: ["Cons:left", "Cons:left"] // TODO: need to check if it equals shared.relationType
					},
					finalRight: {
						type: "Set Object -> Set Object",
						chain: ["Cons:right"]
					}
				}
			}
		}
	},
	
	getTypes: {
		type: "Object -> Set Object",
		expr: "unfoldSet getTypesOneStep"
	},
	
	getTypesMap: {
		type: "Object -> Map Number (Set Object)",
		expr: "unfoldMapInv getTypesOneStep"
	},

	// ========================================================================
	// Type Explorer
	// ========================================================================	
	
	isType: {
		type: "Object -> Unit Null",
		expr: "x -> bindUnit Cons:truth (bindUnit getObjectInOnt (mapUnit Cons~Object (Cons::lookup shared.isType x)))"
	},
	getTypeChildren: {
		type: "Object -> Set Object",
		expr: "compose (filter isType) (getOntPropInverse shared.isA)"
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
		// TODO: probably more efficient to do this by filtering out infons whose left is shared.in, rather than doing a setDifference
	},
	
	isInfon: {
		type: "Object -> Unit Null",
		expr: "obj -> isEmpty (bindUnitSet (reactiveEqual shared.type) (getTypes obj))" // TODO: this is wrong.. just happens to work
	},
	
	// getInfonsIn: {
	// 	type: "Object -> Set Cons",
	// 	expr: "x -> filter (compose (compose reactiveNot isEmpty) downRight) (filterByTruth (getConsUsingIn x))",
	// 	where: {
	// 		downRight: {
	// 			type: "Cons -> Set Cons",
	// 			chain: ["Cons:right"]
	// 		}
	// 	}
	// },
	getInfonsIn: {
		type: "Object -> Set Object",
		expr: "x -> filter isInfon (downRight (filterByTruth (getConsUsingIn x)))",
		where: {
			downRight: {
				type: "Set Cons -> Set Object",
				chain: ["Cons:right"]
			}
		}
	},

	getObjectsIn: {
		type: "Object -> Set Object",
		expr: "x -> filter (compose reactiveNot isInfon) (downRight (filterByTruth (getConsUsingIn x)))",
		where: {
			downRight: {
				type: "Set Cons -> Set Object",
				chain: ["Cons:right"]
			}
		}
	},
	
	// TODO: this is just needed for getting all relations in infonIP.xml relation popup. Factor it out.
	getAllIn: {
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
	
	// this is a temporary one probably... (should filter for truth if we leave it in)
	getAllNamedObjects: {
		type: "Set Object",
		expr: "upRightLeft shared.name",
		where: {
			upRightLeft: {
				type: "Object -> Set Object",
				chain: ["Object:upRight", "Cons:right"]
			}
		}
	},
	// getObjectsOfType: {
	// 	type: "Object -> Set Object",
	// 	expr: "type -> move type",
	// 	where: {
	// 		move: {
	// 			type: "Object -> Set Object",
	// 			chain: ["Object:upLeft", "Cons:left", "Cons:right"]
	// 		}
	// 	}
	// },
	getObjectsOfType: {
		type: "Object -> Set Object",
		expr: "getOntPropInverse shared.isA"
	},
	getObjectsOfTypeRecursive: {
		type: "Object -> Set Object",
		expr: "type -> filter (compose reactiveNot isType) (unfoldSet getObjectsOfType type)"
	},
	
	
	// TODO: this doesn't seem to work, the union is supposed to grab nullary relations but doesn't seem to...
	filterRelations: {
		type: "Set Object -> Set Object",
		//expr: "union (filter (x -> isNotEmpty (bindUnitSet Object~Cons (getTypes x)))) (filter (x -> isNotEmpty (bindUnitSet (reactiveEqual shared.type.infon) (getTypes x))))"
		//expr: "(filter (x -> isNotEmpty (bindUnitSet Object~Cons (getTypes x))))"
		expr: "filter (x -> (compose reactiveNot isEmpty) (bindUnitSet Object~Cons (getTypes x)))"
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
	getConsIPComponents: {
		type: "UI.consIP -> Map Number (Set UI.consIP)",
		expr: "consIP -> unfoldMapInv downLeft consIP",
		where: {
			downLeft: {
				type: "UI.consIP -> Set UI.consIP",
				chain: ["UI.consIP:left"]
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
	getInfonIPArguments: {
		type: "UI.consIP -> Map Number (Unit UI.consIP)",
		expr: "infon -> mapMapValue (compose takeOne downRight) (getConsIPComponents infon)",
		where: {
			downRight: {
				type: "Set UI.consIP -> Set UI.consIP",
				chain: ["UI.consIP:right"]
			}
		}
	},

	getInfonRelations: {
		type: "Cons -> Set Object",
		expr: "infon -> finalLeft (flattenSet (returnUnitSet (takeLastVal (getConsComponents infon))))",
		where: {
			finalLeft: {
				type: "Set Cons -> Set Object",
				chain: ["Cons:left"]
			}
		}
	},
	getInfonIPRelations: {
		type: "UI.consIP -> Set UI.consIP",
		expr: "infon -> (flattenSet (returnUnitSet (takeLastVal (getConsIPComponents infon))))",
		where: {
			finalLeft: {
				type: "Set UI.consIP -> Set UI.consIP",
				chain: ["UI.consIP:left"]
			}
		}
	},
	
	// ========================================================================
	// Relation Types
	// ========================================================================
	
	getRelationTypeComponents: {
		type: "Cons -> Map Number (Set Cons)",
		expr: "cons -> unfoldMapInv downRight cons",
		where: {
			downRight: {
				type: "Cons -> Set Cons",
				chain: ["Cons:right"]
			}
		}
	},
	getRelationTypeInputs: {
		type: "Cons -> Map Number (Unit Object)",
		expr: "rt -> mapMapValue (compose takeOne down) (getRelationTypeComponents rt)",
		where: {
			down: {
				type: "Set Cons -> Set Object",
				chain: ["Cons:left", "Cons:right"]				
			}
		}
	},
	getRelationTypeOutputs: {
		type: "Cons -> Set Object",
		expr: "rt -> finalRight (flattenSet (returnUnitSet (takeLastVal (getConsComponents rt))))",
		where: {
			finalRight: {
				type: "Set Cons -> Set Object",
				chain: ["Cons:right"]
			}
		}
	},

	getPropMap: {
		type: "Map a b -> (b -> Unit c) -> Map a c",
		expr: "panes -> getter -> bindMap (key -> val -> returnUnitMap key (getter val)) panes"
	},

	getMainPaneSet: {
		type: "UI.main -> Unit UI.pane.set",
		expr: "main -> paneSet main",
		where: {
			paneSet: {
				type: "UI.main -> Unit UI.pane.set",
				chain: ["UI.main:pane"]
			}
		}
	},
	
	
	// unfoldToEnd: {
	// 	type: "(a -> Unit a) -> a -> Unit a",
	// 	expr: "f -> x -> takeOne (flattenUnitSet (takeLastVal (unfoldMapInv (compose returnUnitSet f) x)))",
	// 	where: {
	// 		takeLastVal: {
	// 			type: "Map Number a -> Unit a",
	// 			expr: "m -> bindUnit ((swap getKey) m) (length (keys m))"
	// 		}
	// 	}
	// },
	
	
	
	// ========================================================================
	// Video Timeline stuff
	// ========================================================================
	
	getMovieTimeRanges: {
		type: "Object -> Set Object",
		expr: "movie -> upRight (Cons::lookup shared.movie.timeRange movie)",
		where: {
			upRight: {
				type: "Unit Cons -> Set Object",
				chain: ["Object:upRight"]
			}
		}
	},
	
	getSituationsInLayer: {
		type: "Object -> Object -> Set Object",
		expr: "movie -> layer -> mapSet Cons~Object (bindUnitSet (Cons::lookup layer) (getMovieTimeRanges movie))"
	},
	
	getTimeRangeFromSit: {
		type: "Object -> Unit X.time.range",
		chain: ["Cons:right", "Cons:right"]
	},
	
	getSalientDates: {
		type: "a -> Set Number",
		expr: "obj -> convert (Object:upRight shared.atTime)",
		where: {
			convert: {
				type: "Set Cons -> Set Number",
				chain: ["Cons:right", "X.date:day"]
			}
			// hasIn: {
			// 	type: "Cons -> Unit Null",
			// 	expr: "x -> (upLeft x)",
			// 	where: {
			// 		upLeft: {
			// 			type: "Cons -> Set Cons",
			// 			chain: ["Object:upLeft"]
			// 		}
			// 	}
			// }
		}
	},
	
	getSalientDates2: {
		type: "a -> Map Object (Set Number)",
		expr: "obj -> buildMap convert (upRight shared.atTime)",
		where: {
			upRight: {
				type: "Object -> Set Object",
				chain: ["Object:upRight"]
			},
			convert: {
				type: "Object -> Set Number",
				chain: ["Cons:right", "X.date:day"]
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