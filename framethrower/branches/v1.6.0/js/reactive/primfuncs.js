
var primFuncs = function () {
	var bindUnitOrSetHelper = function (f, cell) {
		var outputCell = makeCell();
		
		cell.injectContFunc('bindUnit' + stringify(outputCell), function (val, innerId) {
			var resultCell = applyFunc(f, val);
			resultCell.injectFunc(innerId, outputCell, function (innerVal) {
				return innerVal;
			});
			return resultCell;
		});
		return outputCell;
	};
	
	return {
		// ============================================================================
		// Monadic Operators
		// ============================================================================
	 	returnUnit : {
			type : "a -> Unit a",
			func : function (val) {
				var cell = makeCell();
				cell.addLine(val);
				return cell;
			}
		},
	 	returnUnitSet : {
			type : "Unit a -> Set a",
			func : function (cell) {
				var outputCell = makeCell();
				cell.injectFunc('returnUnitSet', outputCell, function (val) {
					return val;
				});
				return outputCell;
			}
		},
		returnUnitAssoc : {
			type : "a -> Unit b -> Assoc a b",
			func : function (key, cell) {
				var outputCell = makeCellAssocInput();
				cell.injectFunc('returnUnitAssoc', outputCell, function (val) {
					return {key:key, val:val};
				}, true);
				return outputCell;
			}
		},
	 	bindUnit : {
			type : "(a -> Unit b) -> Unit a -> Unit b",
			func : bindUnitOrSetHelper
		},
	 	bindSet : {
			type : "(a -> Set b) -> Set a -> Set b",
			func : bindUnitOrSetHelper
		},
	 	bindAssoc : {
			type : "(a -> b -> Assoc a c) -> Assoc a b -> Assoc a c",
			func : function (f, cell) {
				var outputCell = makeCellAssocInput();

				cell.injectContFunc('bindAssoc' + stringify(outputCell), function (keyVal, innerId) {
					var resultCell = applyFunc(applyFunc(f, keyVal.key), keyVal.val);
					resultCell.injectFunc(innerId, outputCell, function (innerKeyVal) {
						return innerKeyVal;
					}, true);
					return resultCell;
				});
				return outputCell;
			}
		},
		// ============================================================================
		// Set utility functions
		// ============================================================================		
		union : {
			type : "Set a -> Set a -> Set a",
			func : function (cell1, cell2) {
				var outputCell = makeCell();

				cell1.injectFunc('union1', outputCell, function (val) {
					return val;
				});
				cell2.injectFunc('union2', outputCell, function (val) {
					return val;
				});	

				return outputCell;
			}
		},
		setDifference : {
			type : "Set a -> Set a -> Set a",
			func : function (cell1, cell2) {
				var outputCell = makeCellCountNegatives();

				cell1.injectFunc('setDifference1', outputCell, function (val) {
					return val;
				});
				cell2.injectCustomRemoveLineResponse('setDifference2', function (key, func, id) {
					outputCell.addLine(key);
				});
				cell2.injectFunc('setDifference2', null, function (val) {
					outputCell.removeLine(val);
				});	

				return outputCell;
			}
		},
		// ============================================================================
		// Bool utility functions
		// ============================================================================
	 	equal : {
			type : "a -> a -> Bool",
			func : function (val1, val2) {
				return (val1 == val2);
			}
		},
	 	not : {
			type : "Bool -> Bool",
			func : function (val1) {
				return (!val1);
			}
		},
	 	and : {
			type : "Bool -> Bool -> Bool",
			func : function (val1, val2) {
				return (val1 && val2);
			}
		},
	 	or : {
			type : "Bool -> Bool -> Bool",
			func : function (val1, val2) {
				return (val1 || val2);
			}
		},
		// ============================================================================
		// Number utility functions
		// ============================================================================
		add : {
			type : "Number -> Number -> Number",
			func : function (val1, val2) {
				return val1 + val2;
			}
		},
		subtract : {
			type : "Number -> Number -> Number",
			func : function (val1, val2) {
				return val1 - val2;
			}
		},
		// ============================================================================
		// Other functions?
		// ============================================================================
		// Just for Testing!!
		// takes a number x, and returns a set with 1,2..x
		oneTo : {
			type : "Number -> Set Number",
			func : function (val1) {
				var outputCell = makeCell();
				for(var i=1; i<= val1; i++) {
					outputCell.addLine(i);
				}
				return outputCell;
			}
		},
		oneToAssoc : {
			type : "Number -> Number -> Assoc Number Number",
			func : function (val1, val2) {
				var outputCell = makeCellAssocInput();
				for(var i=1; i<= val1; i++) {
					outputCell.addLine({key:i, val:val2});
				}
				return outputCell;
			}
		},
		x2ToAssoc : {
			type : "Number -> Number -> Assoc Number Number",
			func : function (val1, val2) {
				var outputCell = makeCellAssocInput();
				outputCell.addLine({key:val1*2, val:val2});
				return outputCell;
			}
		},
	 	reactiveApply : {
			type : "Unit (a -> b) -> a -> Unit b",
			func : function (cell, input) {
				var outputCell = makeCell();
				cell.injectFunc('reactiveApply', outputCell, function (val) {
					return applyFunc(val, input);
				});
				return outputCell;
			}
		},
	 	passThru : {
			type : "(a -> Bool) -> a -> Unit a",
			func : function (f, input) {
				if(applyFunc(f, input)) {
					return applyFunc(primFuncs.returnUnit, input);
				} else {
					return applyFunc(primFuncs.returnUnit, null);
				}
			}
		},
	 	any : {
			type : "(a -> Unit Bool) -> Set a -> Unit Bool",
			func : function (f, cell) {
				var outputCell = makeCellWithDefault();
				outputCell.setDefault(false);
				cell.injectContFunc('any' + stringify(outputCell), function (val, innerId) {
					var resultCell = applyFunc(f, val);
					resultCell.injectFunc(innerId, outputCell, function (innerVal) {
						if (innerVal) {
							return innerVal;
						}
					});
					return resultCell;
				});
				return outputCell;
			}
		},
		fold : {
			//gotta change this type signature! The second input function is the "inverse" of the first function
			//to this: (a->b->b) -> (b->a->a) -> b -> Set a -> Unit b
			type : "(a -> b -> b) -> (b -> a -> a) -> b -> Set a -> Unit b",
			func : function (f, finv, init, cell) {
				var outputCell = makeCell();
				var cache = init;
				outputCell.addLine(cache);
				
				cell.injectFunc('fold', outputCell, function (val) {
					outputCell.removeLine(cache);
					cache = applyFunc(applyFunc(f, val), cache);
					return cache;
				});
			
				cell.injectCustomRemoveLineResponse('fold', function(key, func, id) {
					outputCell.removeLine(cache);
					cache = applyFunc(applyFunc(finv, cache), key);
					outputCell.addLine(cache);
				});

				return outputCell;
			}
		},
		unfoldSet : {
			type : "(a -> Set a) -> a -> Set a",
			func : function (f, init) {
				var outputCell = makeCell();

				outputCell.addLine(init);		
				outputCell.injectFunc('unfoldSet', outputCell, function (val) {
					var resultCell = applyFunc(f, val);
					resultCell.injectFunc('innerUnfoldSet', outputCell, function (val) {
						return val;
					});
				});
				
				return outputCell;
			}
		},
		unfoldAssoc : {
			type : "(a -> Set a) -> a -> Assoc a Number",
			func : function (f, init) {
				var outputCell = makeCellAssocInput();
				
				outputCell.addLine({key:init, val:0});
				outputCell.injectFunc('unfoldAssoc', outputCell, function (keyVal) {
					var resultCell = applyFunc(f, keyVal.key);
					resultCell.injectFunc('innerUnfoldAssoc', outputCell, function (val) {
						return {key:val, val:keyVal.val+1};
					}, true);
				});
				
				return outputCell;
			}
		},
		// ============================================================================
		// Assoc functions
		// ============================================================================
		buildAssoc : {
			type : "(a -> b) -> Set a -> Assoc a b",
			func : function (f, cell) {
				var outputCell = makeCellAssocInput();
			
				cell.injectFunc('buildAssoc', outputCell, function (val) {
					var result = applyFunc(f, val);
					return {key:val, val:result};
				}, true);
			
				return outputCell;
			}
		},
		//REMOVE THIS LATER... JUST FOR TESTING
		flattenSet : {
			type : "Set (Set a) -> Set a",
			func : function (cell) {
				var outputCell = makeCell();
			
				cell.injectContFunc('flattenSet' + stringify(outputCell), function (innerCell, innerId) {
					innerCell.injectFunc(innerId, outputCell, function (val) {
						return val;
					});
					return innerCell;
				});
				return outputCell;
			}
		},
		invert : {
			type : "Assoc a (Set b) -> Assoc b (Set a)",
			func : function (cell) {
				var outputCell = makeCellAssocInput();

				var middleCell = makeCellWithDuplicateKeys();

				cell.injectContFunc('invert' + stringify(middleCell), function (keyVal, innerId) {
					keyVal.val.injectFunc(innerId, middleCell, function (innerVal) {
						return {key: innerVal, val: keyVal.key};
					}, true);
					return keyVal.val;
				});
				
				var middleId = 'middleInvert' + stringify(outputCell);
				
				middleCell.injectFunc(middleId, outputCell, function (innerKeyVal) {
					return {key:innerKeyVal.key, val:makeCell()};
				}, true);
				middleCell.injectSecFunc(middleId, 'secInvert', function (innerKeyVal) {
					return innerKeyVal.val;
				});
				
				return outputCell;
			}
		},
		mapAssocValue : {
			type : "(a -> b) -> Assoc c a -> Assoc c b",
			func : function (f, cell) {
				var outputCell = makeCellAssocInput();
			
				cell.injectFunc('mapAssocValue', outputCell, function (keyVal) {
					var result = applyFunc(f, keyVal.val);
					return {key:keyVal.key, val:result};
				}, true);
			
				return outputCell;
			}
		},
		getKey : {
			type : "a -> Assoc a b -> Unit b",
			func : function (key, cell) {
				var outputCell = makeCell();
			
				cell.injectFunc('getKey', outputCell, function (keyVal) {
					if(keyVal.key == key) return keyVal.val;
				});
			
				return outputCell;
			}
		},
		keys : {
			type : "Assoc a b -> Set a",
			func : function (cell) {
				var outputCell = makeCell();
			
				cell.injectFunc('keys', outputCell, function (keyVal) {
					return keyVal.key;
				});

				return outputCell;
			}
		}
	};
}();






forEach(primFuncs, function (primFunc, name) {
	addFun(name, primFunc.type, primFunc.func);
});