
var primFuncs = function () {
	function applyFunc(func, input) {
		return evaluate(makeApply(func, input));		
	}

	function applyAndInject(func, input, depender, injectFunc) {
		return evaluateAndInject(makeApply(func, input), depender, injectFunc);
	}	
	
	var bindUnitOrSetHelper = function (f, cell) {
		var outputCell = makeCell();
		
		cell.injectFunc(outputCell, function (val) {
			return applyAndInject(f, val, outputCell, function (innerVal) {
				return outputCell.addLine(innerVal);
			});
		});
		
		return outputCell;
	};
	
	var rangeHelper = function (outputCell, setRangeFunc, startCell, endCell, cell) {
		outputCell.makeSorted();
		var start;
		var end;
		
		var updateRange = function () {
			if (start != undefined && end != undefined) {
				setRangeFunc(start, end);
			} else if (start == undefined && end == undefined) {
				outputCell.clearRange();
			}
		};
		
		injectFuncs(outputCell, [
			{
				cell: startCell,
				f: function(val) {
					start = val;
					updateRange();
					return function () {
						start = undefined;
						updateRange();
					};
				}
			},
			{
				cell: endCell,
				f: function(val) {
					end = val;
					updateRange();
					return function () {
						end = undefined;
						updateRange();
					};
				}
			},
			{
				cell: cell,
				f: function (val) {
					return outputCell.addLine(val);
				}
			}
		]);
		
		return outputCell;
	};
	
	return {
		// ============================================================================
		// Monadic Operators
		// ============================================================================
	 	returnUnit : {
			type : "a -> Unit a",
			func : function (val) {
				var outputCell = makeCell();
				outputCell.addLine(val);
				outputCell.setDone();
				return outputCell;
			}
		},
		returnFuture : { // TODO: test this, merge code with returnUnit
			type : "a -> Future a",
			func : function (val) {
				var outputCell = makeCell();
				outputCell.addLine(val);
				outputCell.setDone();
				return outputCell;
			}
		},
	 	returnUnitSet : {
			type : "Unit a -> Set a",
			func : function (cell) {
				var outputCell = makeCell();
				cell.injectFunc(outputCell, function (val) {
					return outputCell.addLine(val);
				});
				return outputCell;
			}
		},
		returnUnitMap : {
			type : "a -> Unit b -> Map a b",
			func : function (key, cell) {
				var outputCell = makeCellMapInput();
				cell.injectFunc(outputCell, function (val) {
					return outputCell.addLine({key:key, val:val});
				});
				return outputCell;
			}
		},
		returnFutureUnit : {
			type : "Future a -> Unit a",
			func : function (cell) {
				var outputCell = makeCell();
				cell.injectFunc(outputCell, function(val) {
					outputCell.addLine(val);
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
	 	bindMap : {
			type : "(a -> b -> Map a c) -> Map a b -> Map a c",
			func : function (f, cell) {
				var outputCell = makeCellMapInput();

				cell.injectFunc(outputCell, function (keyVal) {
					return applyAndInject(applyFunc(f, keyVal.key), keyVal.val, outputCell, function (innerKeyVal) {
						return outputCell.addLine(innerKeyVal);
					});
				});
				
				return outputCell;
			}
		},
		bindFuture : {
			type : "(a -> Future b) -> Future a -> Future b",
			func : function (f, cell) {
				var outputCell = makeCell();
				
				cell.injectFunc(outputCell, function (val) {
					return applyAndInject(f, val, outputCell, function (innerVal) {
						outputCell.addLine(innerVal);
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
				
				injectFuncs(outputCell, [
					{
						cell: cell1,
						f: function (val) {
							return outputCell.addLine(val);
						}
					},
					{
						cell: cell2,
						f: function (val) {
							return outputCell.addLine(val);
						}
					}
				]);

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

				injectFuncs(outputCell, [
					{
						cell: cell1,
						f: function (value) {
							var count = getOrMake(value);
							add(count, value);
							return function () {
								sub(count);
							};
						}
					},
					{
						cell: cell2,
						f: function (value) {
							var count = getOrMake(value);
							sub(count);
							return function () {
								add(count, value);
							};
						}
					}
				]);

				return outputCell;
			}
		},
		takeOne : {
			type : "Set a -> Unit a",
			func : function (cell) {
				var outputCell = makeCell();
				var cache;
				
				cell.injectFunc(outputCell, function (val) {
					if (cache === undefined) {
						outputCell.addLine(val);
						cache = val;
					}
					return function () {
						if (cache === val) {
							outputCell.removeLine(val);
							cache = cell.getState()[0];
							if (cache !== undefined) {
								outputCell.addLine(cache);
							}
						}
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
				outputCell.setDone();
				return outputCell;
			}
		},
		oneToMap : {
			type : "Number -> Number -> Map Number Number",
			func : function (val1, val2) {
				var outputCell = makeCellMapInput();
				for(var i=1; i<= val1; i++) {
					outputCell.addLine({key:i, val:val2});
				}
				outputCell.setDone();
				return outputCell;
			}
		},
	 	reactiveApply : {
			type : "Unit (a -> b) -> a -> Unit b",
			func : function (cell, input) {
				var outputCell = makeCell();
				cell.injectFunc(outputCell, function (val) {
					return outputCell.addLine(applyFunc(val, input));
				});
				return outputCell;
			}
		},
		// ============================================================================
		// Null Type Functions
		// ============================================================================
		reactiveNot: {
			type: "Unit Null -> Unit Null",
			func: function (cell) {
				var outputCell = makeCell();
				outputCell.addLine(nullObject);
				cell.injectFunc(outputCell, function (val) {
					outputCell.removeLine(nullObject);
					return function() {
						outputCell.addLine(nullObject);
					};
				});
				return outputCell;
			}
		},
		reactiveAnd: {
			type: "Unit Null -> Unit Null -> Unit Null",
			func: function (cell1, cell2) {
				var bool1 = false;
				var bool2 = false;
				var isSet = false;
				var outputCell = makeCell();
				
				function updateOutputCell() {
					if (bool1 && bool2 && !isSet) {
						outputCell.addLine(nullObject);
						isSet = true;
					} else if (isSet) {
						outputCell.removeLine(nullObject);
						isSet = false;
					}
				}
				
				injectFuncs(outputCell, [
					{
						cell: cell1,
						f: function (val) {
							bool1 = true;
							updateOutputCell();
							return function () {
								bool1 = false;
								updateOutputCell();
							};
						}
					},
					{
						cell: cell2,
						f: function (val) {
							bool2 = true;
							updateOutputCell();
							return function () {
								bool2 = false;
								updateOutputCell();
							};
						}
					}
				]);				
				
				return outputCell;
			}
		},
		reactiveOr: {
			type: "Unit Null -> Unit Null -> Unit Null",
			func: function (cell1, cell2) {
				var bool1 = false;
				var bool2 = false;
				var isSet = false;
				var outputCell = makeCell();

				function updateOutputCell() {
					if ((bool1 || bool2) && !isSet) {
						outputCell.addLine(nullObject);
						isSet = true;
					} else if (!bool1 && !bool2 && isSet) {
						outputCell.removeLine(nullObject);
						isSet = false;
					}
				}

				injectFuncs(outputCell, [
					{
						cell: cell1,
						f: function (val) {
							bool1 = true;
							updateOutputCell();
							return function () {
								bool1 = false;
								updateOutputCell();
							};
						}
					},
					{
						cell: cell2,
						f: function (val) {
							bool2 = true;
							updateOutputCell();
							return function () {
								bool2 = false;
								updateOutputCell();
							};
						}
					}
				]);

				return outputCell;				
			}
		},
		isEmpty: {
			type: "Set a -> Unit Null",
			func: function (cell) {
				var outputCell = makeCell();
				var count = 0;
				outputCell.addLine(nullObject);
				
				cell.injectFunc(outputCell, function (val) {
					if (count === 0) outputCell.removeLine(nullObject);
					count++;
					return function() {
						count--;
						if (count === 0) outputCell.addLine(nullObject);
					};
				});
				return outputCell;				
			}
		},
		gate: {
			type: "Unit Null -> a -> Unit a",
			func: function (gatekeeper, passer) {
				// if gatekeeper is set, send passer through
				// if gatekeeper is empty, output is empty
				var bool1 = false;
				var isSet = false;
				var outputCell = makeCell();
				
				function updateOutputCell() {
					if (bool1 && !isSet) {
						outputCell.addLine(passer);
						isSet = true;
					} else if (!bool1 && isSet) {
						outputCell.removeLine(passer);
						isSet = false;
					}
				}
				
				gatekeeper.injectFunc(outputCell, function (val) {
					bool1 = true;
					updateOutputCell();
					return function () {
						bool1 = false;
						updateOutputCell();
					};
				});
				
				return outputCell;
			}
		},
				
		// 	 	any : {
		// 	type : "(a -> Unit Bool) -> Set a -> Unit Bool",
		// 	func : function (f, cell) {
		// 		var outputCell = makeCell();
		// 		var count = 0;
		// 		outputCell.addLine(false);
		// 
		// 		cell.injectFunc(outputCell, function (val) {
		// 			return applyAndInject(f, val, outputCell, function (innerVal) {
		// 				if (innerVal) {
		// 					if (count == 0) {
		// 						outputCell.removeLine(false);
		// 						outputCell.addLine(true);
		// 					}
		// 					count++;
		// 					return function () {
		// 						count--;
		// 						if (count == 0) {
		// 							outputCell.removeLine(true);
		// 							outputCell.addLine(false);
		// 						}
		// 					};
		// 				}
		// 			});
		// 		});
		// 		
		// 		return outputCell;
		// 	}
		// },
		fold : {
			//type : "(a -> b -> b) -> (b -> a -> a) -> b -> Set a -> Unit b",
			type : "(a -> b -> b) -> (a -> b -> b) -> b -> Set a -> Unit b",
			func : function (f, finv, init, cell) {
				var outputCell = makeCell();
				var cache = init;
				outputCell.addLine(cache);
				
				cell.injectFunc(outputCell, function (val) {
					outputCell.removeLine(cache);
					cache = applyFunc(applyFunc(f, val), cache);
					outputCell.addLine(cache);
					return function () {
						outputCell.removeLine(cache);
						//cache = applyFunc(applyFunc(finv, cache), val);
						cache = applyFunc(applyFunc(finv, val), cache);
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
				//TODO: make this injectFunc more like the erlang version
				outputCell.injectFunc(function(){}, function (val) {
					return applyAndInject(f, val, outputCell, function (innerVal) {
						return outputCell.addLine(innerVal);
					});
				});
				
				return outputCell;
			}
		},
		unfoldMap : {
			type : "(a -> Set a) -> a -> Map a Number",
			func : function (f, init) {
				var outputCell = makeCellMapInput();
				
				outputCell.addLine({key:init, val:0});
				//TODO: make this injectFunc more like the erlang version
				outputCell.injectFunc(function(){}, function (keyVal) {
					return applyAndInject(f, keyVal.key, outputCell, function (val) {
						return outputCell.addLine({key:val, val:keyVal.val+1});
					});
				});
				
				return outputCell;
			}
		},
		// ============================================================================
		// Map functions
		// ============================================================================
		buildMap : {
			type : "(a -> b) -> Set a -> Map a b",
			func : function (f, cell) {
				var outputCell = makeCellMapInput();
			
				cell.injectFunc(outputCell, function (val) {
					var result = applyFunc(f, val);
					return outputCell.addLine({key:val, val:result});
				});
			
				return outputCell;
			}
		},
		invert : {
			type : "Map a (Set b) -> Map b (Set a)",
			func : function (cell) {
				var setType = buildType(getType(cell), "Map a (Set b)", "Set a");
				
				var outputCell = makeCellMapInput();
				var bHash = makeObjectHash();
				
				var bHashCell = makeCell();
				
				//this is to make outputCell depend on BHashCell for being 'done' 
				bHashCell.injectFunc(outputCell, function (bValue) {});
				
				bHashCell.injectFunc(
					function() {
						bHash.forEach(function(bCell) {
							bCell.setDone();
						});
					},
					function (bValue) {
						var newCell = makeCell();
						newCell.type = setType;
						bHash.set(bValue, newCell);
						var onRemove = outputCell.addLine({key:bValue, val:newCell});
						return function () {
							bHash.remove(bValue);
							onRemove();
						};
					}
				);

				cell.injectFunc(outputCell, function (keyVal) {
					return keyVal.val.injectFunc(bHashCell, function (innerVal) {
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
		mapMapValue : {
			type : "(a -> b) -> Map c a -> Map c b",
			func : function (f, cell) {
				var outputCell = makeCellMapInput();

				cell.injectFunc(outputCell, function (keyVal) {
					var result = applyFunc(f, keyVal.val);
					return outputCell.addLine({key:keyVal.key, val:result});
				});
			
				return outputCell;
			}
		},
		getKey : {
			type : "a -> Map a b -> Unit b",
			func : function (key, cell) {
				var outputCell = makeCell();
			
				cell.injectFunc(outputCell, function (keyVal) {
					if (keyVal.key == key) {
						return outputCell.addLine(keyVal.val);
					}
				});
			
				return outputCell;
			}
		},
		keys : {
			type : "Map a b -> Set a",
			func : function (cell) {
				var outputCell = makeCell();
			
				cell.injectFunc(outputCell, function (keyVal) {
					return outputCell.addLine(keyVal.key);
				});

				return outputCell;
			}
		},
		// ============================================================================
		// Range/Sorted functions
		// ============================================================================
		rangeByKey : {
			type : "Unit a -> Unit a -> Set a -> Set a",
			func : function (startCell, endCell, cell) {
				var outputCell = makeCell();
				return rangeHelper(outputCell, outputCell.setKeyRange, startCell, endCell, cell);
			}
		},
		rangeByPos : {
			type : "Unit Number -> Unit Number -> Set a -> Set a",
			func : function (startCell, endCell, cell) {
				var outputCell = makeCell();
				return rangeHelper(outputCell, outputCell.setPosRange, startCell, endCell, cell);
			}
		},
		rangeMapByKey : {
			type : "Unit Number -> Unit Number -> Map a b -> Map a b",
			func : function (startCell, endCell, cell) {
				var outputCell = makeCellAssocInput();
				return rangeHelper(outputCell, outputCell.setKeyRange, startCell, endCell, cell);
			}
		},
		rangeMapByPos : {
			type : "Unit Number -> Unit Number -> Map a b -> Map a b",
			func : function (startCell, endCell, cell) {
				var outputCell = makeCellAssocInput();
				return rangeHelper(outputCell, outputCell.setPosRange, startCell, endCell, cell);
			}
		},
		takeLast : {
			type : "Set a -> Unit a",
			func : function (cell) {
				cell.makeSorted();
				var outputCell = makeCell();
				var cache;
				function update() {
					var state = cell.getState();
					var last = state[state.length-1];
					if(cache !== last) {
						if (cache !== undefined) outputCell.removeLine(cache);
						cache = last;
						outputCell.addLine(cache);
					}					
				}
				update();
				
				cell.injectFunc(outputCell, function (val) {
					update();
					return update;
				});
				return outputCell;
			}
		}
	};
}();






forEach(primFuncs, function (primFunc, name) {
	addFun(name, primFunc.type, primFunc.func);
});
