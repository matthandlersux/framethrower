
var primFuncs = function () {
	var bindUnitOrSetHelper = function (f, cell) {
		var outputCell = makeCell();
		
		cell.injectFunc(function (val) {
			var resultCell = applyFunc(f, val);
			return resultCell.injectFunc(function (innerVal) {
				return outputCell.addLine(innerVal);
			});
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
				cell.injectFunc(function (val) {
					return outputCell.addLine(val);
				});
				return outputCell;
			}
		},
		returnUnitAssoc : {
			type : "a -> Unit b -> Assoc a b",
			func : function (key, cell) {
				var outputCell = makeCellAssocInput();
				cell.injectFunc(function (val) {
					return outputCell.addLine({key:key, val:val});
				});
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

				cell.injectFunc(function (keyVal) {
					var resultCell = applyFunc(applyFunc(f, keyVal.key), keyVal.val);
					return resultCell.injectFunc(function (innerKeyVal) {
						return outputCell.addLine(innerKeyVal);
					});
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

				cell1.injectFunc(function (val) {
					return outputCell.addLine(val);
				});
				cell2.injectFunc(function (val) {
					return outputCell.addLine(val);
				});	

				return outputCell;
			}
		},
		setDifference : {
			type : "Set a -> Set a -> Set a",
			func : function (cell1, cell2) {
				var outputCell = makeCell();
				var countHash = makeObjectHash();

				var add = function (count, value) {
					count.num++;
					if (count.num == 1) count.onRemove = outputCell.addLine(value);					
				};
				
				var sub = function (count) {
					count.num--;
					if(count.num == 0) count.onRemove();
				};

				var getOrMake = function (value) {
					return countHash.getOrMake(value, function () {
						return {num:0};
					});
				};

				cell1.injectFunc(function (value) {
					var count = getOrMake(value);
					add(count, value);
					return function () {
						sub(count);
					};
				});

				cell2.injectFunc(function (value) {
					var count = getOrMake(value);
					sub(count);
					return function () {
						add(count, value);
					};
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
		// Just for Testing!!
		x2 : {
			type : "Number -> Set Number",
			func : function (val1) {
				var outputCell = makeCell();
				outputCell.addLine(val1 * 2);
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
				cell.injectFunc(function (val) {
					return outputCell.addLine(applyFunc(val, input));
				});
				return outputCell;
			}
		},
	 	passThru : {
			type : "(a -> Bool) -> a -> Unit a",
			func : function (f, input) {
				var outputCell = makeCell();
				if(applyFunc(f, input)) {
					outputCell.addLine(input);
				}
				return outputCell;
			}
		},
	 	any : {
			type : "(a -> Unit Bool) -> Set a -> Unit Bool",
			func : function (f, cell) {
				var outputCell = makeCell();
				var count = 0;
				outputCell.addLine(false);

				cell.injectFunc(function (val) {
					var resultCell = applyFunc(f, val);
					return resultCell.injectFunc(function (innerVal) {
						if (innerVal) {
							if (count == 0) {
								outputCell.removeLine(false);
								var onRemove = outputCell.addLine(true);
							}
							count++;
							return function () {
								count--;
								if (count == 0) {
									outputCell.removeLine(true);
									outputCell.addLine(false);
								}
							};
						}
					});
				});				
				
				return outputCell;
			}
		},
		fold : {
			type : "(a -> b -> b) -> (b -> a -> a) -> b -> Set a -> Unit b",
			func : function (f, finv, init, cell) {
				var outputCell = makeCell();
				var cache = init;
				outputCell.addLine(cache);
				
				cell.injectFunc(function (val) {
					outputCell.removeLine(cache);
					cache = applyFunc(applyFunc(f, val), cache);
					outputCell.addLine(cache);
					return function () {
						outputCell.removeLine(cache);
						cache = applyFunc(applyFunc(finv, cache), val);
						outputCell.addLine(cache);	
					};
				});

				return outputCell;
			}
		},
		unfoldSet : {
			type : "(a -> Set a) -> a -> Set a",
			func : function (f, init) {
				var outputCell = makeCell();

				outputCell.addLine(init);		
				outputCell.injectFunc(function (val) {
					var resultCell = applyFunc(f, val);
					resultCell.injectFunc(function (val) {
						return outputCell.addLine(val);
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
				outputCell.injectFunc(function (keyVal) {
					var resultCell = applyFunc(f, keyVal.key);
					resultCell.injectFunc(function (val) {
						return outputCell.addLine({key:val, val:keyVal.val+1});
					});
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
			
				cell.injectFunc(function (val) {
					var result = applyFunc(f, val);
					return outputCell.addLine({key:val, val:result});
				});
			
				return outputCell;
			}
		},
		//REMOVE THIS LATER... JUST FOR TESTING
		flattenSet : {
			type : "Set (Set a) -> Set a",
			func : function (cell) {
				var outputCell = makeCell();

				cell.injectFunc(function (innerCell) {
					return innerCell.injectFunc(function (val) {
						return outputCell.addLine(val);
					});
				});
				return outputCell;
			}
		},
		invert : {
			type : "Assoc a (Set b) -> Assoc b (Set a)",
			func : function (cell) {
				var outputCell = makeCellAssocInput();
				var bHash = makeObjectHash();
				
				var bHashCell = makeCell();

				bHashCell.injectFunc(function (bValue) {
					var newCell = makeCell();
					bHash.set(bValue, newCell);
					var onRemove = outputCell.addLine({key:bValue, val:newCell});
					return function () {
						bHash.remove(bValue);
						onRemove();
					};
				});

				cell.injectFunc(function (keyVal) {
					return keyVal.val.injectFunc(function (innerVal) {
						var onRemove1 = bHashCell.addLine(innerVal);
						var onRemove2 = bHash.get(innerVal).addLine(keyVal.key);
						return function () {
							onRemove2();
							onRemove1();
						};
					});
				});

				return outputCell;
			}
		},
		mapAssocValue : {
			type : "(a -> b) -> Assoc c a -> Assoc c b",
			func : function (f, cell) {
				var outputCell = makeCellAssocInput();

				cell.injectFunc(function (keyVal) {
					var result = applyFunc(f, keyVal.val);
					return outputCell.addLine({key:keyVal.key, val:result});
				});
			
				return outputCell;
			}
		},
		getKey : {
			type : "a -> Assoc a b -> Unit b",
			func : function (key, cell) {
				var outputCell = makeCell();
			
				cell.injectFunc(function (keyVal) {
					if (keyVal.key == key) {
						return outputCell.addLine(keyVal.val);
					}
				});
			
				return outputCell;
			}
		},
		keys : {
			type : "Assoc a b -> Set a",
			func : function (cell) {
				var outputCell = makeCell();
			
				cell.injectFunc(function (keyVal) {
					return outputCell.addLine(keyVal.key);
				});

				return outputCell;
			}
		},
		// ============================================================================
		// Range functions
		// ============================================================================
		rangeByKey : {
			type : "Unit a -> Unit a -> Set a -> Set a",
			func : function (startCell, endCell, cell) {
				var outputCell = makeCell();
				var start;
				var end;
				
				var updateRange = function () {
					if (start != undefined && end != undefined) {
						cell.setKeyRange(start, end);
					} else if (start == undefined && end == undefined) {
						cell.clearRange();
					}
				};
				
				startCell.injectFunc(function(val) {
					start = val;
					updateRange();
					return function () {
						start = undefined;
						updateRange();
					};
				});
				
				endCell.injectFunc(function(val) {
					end = val;
					updateRange();
					return function () {
						end = undefined;
						updateRange();
					};
				});
				
				cell.injectFunc(function (val) {
					return outputCell.addLine(val);
				});
				return outputCell;
			}
		},
		rangeByPos : {
			type : "Unit Number -> Unit Number -> Set a -> Set a",
			func : function (startCell, endCell, cell) {
				var outputCell = makeCell();
				var start;
				var end;
				
				var updateRange = function () {
					if (start != undefined && end != undefined) {
						cell.setPosRange(start, end);
					} else if (start == undefined && end == undefined) {
						cell.clearRange();
					}
				};
				
				startCell.injectFunc(function(val) {
					start = val;
					updateRange();
					return function () {
						start = undefined;
						updateRange();
					};
				});
				
				endCell.injectFunc(function(val) {
					end = val;
					updateRange();
					return function () {
						end = undefined;
						updateRange();
					};
				});
				
				cell.injectFunc(function (val) {
					return outputCell.addLine(val);
				});
				return outputCell;
			}
		}
	};
}();






forEach(primFuncs, function (primFunc, name) {
	addFun(name, primFunc.type, primFunc.func);
});