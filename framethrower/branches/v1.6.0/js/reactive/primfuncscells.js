
var primFuncs = function () {
	function applyFunc(func, input) {
		return evaluate(makeApply(func, input));		
	}

	function applyAndInject(func, input, injectFunc) {
		return evaluateAndInject(makeApply(func, input), injectFunc);
	}	
	
	var bindUnitOrSetHelper = function (f, cell) {
		var outputCell = makeCell();
		
		var removeFunc = cell.injectFunc(function (val) {
			return applyAndInject(f, val, function (innerVal) {
				return outputCell.addLine(innerVal);
			});
		});
		outputCell.addOnRemove(removeFunc);
		
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
		
		var removeFunc1 = startCell.injectFunc(function(val) {
			start = val;
			updateRange();
			return function () {
				start = undefined;
				updateRange();
			};
		});

		var removeFunc2 = endCell.injectFunc(function(val) {
			end = val;
			updateRange();
			return function () {
				end = undefined;
				updateRange();
			};
		});
		
		var removeFunc3 = cell.injectFunc(function (val) {
			return outputCell.addLine(val);
		});
		outputCell.addOnRemove(removeFunc1);
		outputCell.addOnRemove(removeFunc2);
		outputCell.addOnRemove(removeFunc3);
		
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
				var removeFunc = cell.injectFunc(function (val) {
					return outputCell.addLine(val);
				});
				outputCell.addOnRemove(removeFunc);
				return outputCell;
			}
		},
		returnUnitMap : {
			type : "a -> Unit b -> Map a b",
			func : function (key, cell) {
				var outputCell = makeCellMapInput();
				var removeFunc = cell.injectFunc(function (val) {
					return outputCell.addLine({key:key, val:val});
				});
				outputCell.addOnRemove(removeFunc);
				return outputCell;
			}
		},
		returnFutureUnit : {
			type : "Future a -> Unit a",
			func : function (cell) {
				var outputCell = makeCell();
				var removeFunc = cell.injectFunc(function(val) {
					outputCell.addLine(val);
				});
				outputCell.addOnRemove(removeFunc);
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

				var removeFunc = cell.injectFunc(function (keyVal) {
					return applyAndInject(applyFunc(f, keyVal.key), keyVal.val, function (innerKeyVal) {
						return outputCell.addLine(innerKeyVal);
					});
				});
				outputCell.addOnRemove(removeFunc);
				
				return outputCell;
			}
		},
		bindFuture : {
			type : "(a -> Future b) -> Future a -> Future b",
			func : function (f, cell) {
				var outputCell = makeCell();
				
				var removeFunc = cell.injectFunc(function (val) {
					return applyAndInject(f, val, function (innerVal) {
						outputCell.addLine(innerVal);
					});
				});
				outputCell.addOnRemove(removeFunc);
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

				var removeFunc1 = cell1.injectFunc(function (val) {
					return outputCell.addLine(val);
				});
				var removeFunc2 = cell2.injectFunc(function (val) {
					return outputCell.addLine(val);
				});	
				outputCell.addOnRemove(removeFunc1);
				outputCell.addOnRemove(removeFunc2);

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

				var removeFunc1 = cell1.injectFunc(function (value) {
					var count = getOrMake(value);
					add(count, value);
					return function () {
						sub(count);
					};
				});

				var removeFunc2 = cell2.injectFunc(function (value) {
					var count = getOrMake(value);
					sub(count);
					return function () {
						add(count, value);
					};
				});
				outputCell.addOnRemove(removeFunc1);
				outputCell.addOnRemove(removeFunc2);

				return outputCell;
			}
		},
		takeOne : {
			type : "Set a -> Unit a",
			func : function (cell) {
				var outputCell = makeCell();
				var cache;
				
				var removeFunc = cell.injectFunc(function (val) {
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
				outputCell.addOnRemove(removeFunc);
				
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
		oneToMap : {
			type : "Number -> Number -> Map Number Number",
			func : function (val1, val2) {
				var outputCell = makeCellMapInput();
				for(var i=1; i<= val1; i++) {
					outputCell.addLine({key:i, val:val2});
				}
				return outputCell;
			}
		},
		x2ToMap : {
			type : "Number -> Number -> Map Number Number",
			func : function (val1, val2) {
				var outputCell = makeCellMapInput();
				outputCell.addLine({key:val1*2, val:val2});
				return outputCell;
			}
		},
	 	reactiveApply : {
			type : "Unit (a -> b) -> a -> Unit b",
			func : function (cell, input) {
				var outputCell = makeCell();
				var removeFunc = cell.injectFunc(function (val) {
					return outputCell.addLine(applyFunc(val, input));
				});
				outputCell.addOnRemove(removeFunc);
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

				var removeFunc = cell.injectFunc(function (val) {
					return applyAndInject(f, val, function (innerVal) {
						if (innerVal) {
							if (count == 0) {
								outputCell.removeLine(false);
								outputCell.addLine(true);
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
				outputCell.addOnRemove(removeFunc);
				
				return outputCell;
			}
		},
		fold : {
			type : "(a -> b -> b) -> (b -> a -> a) -> b -> Set a -> Unit b",
			func : function (f, finv, init, cell) {
				var outputCell = makeCell();
				var cache = init;
				outputCell.addLine(cache);
				
				var removeFunc = cell.injectFunc(function (val) {
					outputCell.removeLine(cache);
					cache = applyFunc(applyFunc(f, val), cache);
					outputCell.addLine(cache);
					return function () {
						outputCell.removeLine(cache);
						cache = applyFunc(applyFunc(finv, cache), val);
						outputCell.addLine(cache);	
					};
				});
				outputCell.addOnRemove(removeFunc);

				return outputCell;
			}
		},
		unfoldSet : {
			type : "(a -> Set a) -> a -> Set a",
			func : function (f, init) {
				var outputCell = makeCell();

				outputCell.addLine(init);		
				outputCell.injectFunc(function (val) {
					return applyAndInject(f, val, function (innerVal) {
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
				outputCell.injectFunc(function (keyVal) {
					return applyAndInject(f, keyVal.key, function (val) {
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
			
				var removeFunc = cell.injectFunc(function (val) {
					var result = applyFunc(f, val);
					return outputCell.addLine({key:val, val:result});
				});
				outputCell.addOnRemove(removeFunc);
			
				return outputCell;
			}
		},
		//REMOVE THIS LATER... JUST FOR TESTING
		flattenSet : {
			type : "Set (Set a) -> Set a",
			func : function (cell) {
				var outputCell = makeCell();

				var removeFunc = cell.injectFunc(function (innerCell) {
					return innerCell.injectFunc(function (val) {
						return outputCell.addLine(val);
					});
				});
				outputCell.addOnRemove(removeFunc);
				
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

				var removeFunc1 = bHashCell.injectFunc(function (bValue) {
					var newCell = makeCell();
					newCell.type = setType;
					bHash.set(bValue, newCell);
					var onRemove = outputCell.addLine({key:bValue, val:newCell});
					return function () {
						bHash.remove(bValue);
						onRemove();
					};
				});

				var removeFunc2 = cell.injectFunc(function (keyVal) {
					return keyVal.val.injectFunc(function (innerVal) {
						var onRemove1 = bHashCell.addLine(innerVal);
						var onRemove2 = bHash.get(innerVal).addLine(keyVal.key);
						return function () {
							onRemove2();
							onRemove1();
						};
					});
				});

				outputCell.addOnRemove(removeFunc1);
				outputCell.addOnRemove(removeFunc2);

				return outputCell;
			}
		},
		mapMapValue : {
			type : "(a -> b) -> Map c a -> Map c b",
			func : function (f, cell) {
				var outputCell = makeCellMapInput();

				var removeFunc = cell.injectFunc(function (keyVal) {
					var result = applyFunc(f, keyVal.val);
					return outputCell.addLine({key:keyVal.key, val:result});
				});
				outputCell.addOnRemove(removeFunc);
			
				return outputCell;
			}
		},
		getKey : {
			type : "a -> Map a b -> Unit b",
			func : function (key, cell) {
				var outputCell = makeCell();
			
				var removeFunc = cell.injectFunc(function (keyVal) {
					if (keyVal.key == key) {
						return outputCell.addLine(keyVal.val);
					}
				});
				outputCell.addOnRemove(removeFunc);
			
				return outputCell;
			}
		},
		keys : {
			type : "Map a b -> Set a",
			func : function (cell) {
				var outputCell = makeCell();
			
				var removeFunc = cell.injectFunc(function (keyVal) {
					return outputCell.addLine(keyVal.key);
				});
				outputCell.addOnRemove(removeFunc);

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
		sortedFold : {
			type : "Bool -> (a -> b -> b) -> b -> Set a -> Unit b",
			func : function (ascending, f, init, cell) {
				var outputCell = makeCell();
				var cache = [];
				cell.makeSorted();
				var lastRemoveFunc = outputCell.addLine(init);

				var removeFunc = cell.injectFunc(function (val) {					
					var index = cell.getIndex(val);
					if (index < cache.length) {
						cache[index].removeFunc();
					} else {
						lastRemoveFunc();
					}
					var newCell = makeCell();
					var cellRemoveFunc;
					
					if (index > 0) {
						cellRemoveFunc = cache[index-1].cell.injectFunc(function (innerVal) {
							return newCell.addLine(applyFunc(applyFunc(f, val), innerVal));
						});
					} else {
						cellRemoveFunc = newCell.addLine(applyFunc(applyFunc(f, val), init));
					}
					cache.splice(index, 0, {cell:newCell, val:val, removeFunc:cellRemoveFunc});
					if (index < cache.length - 1) {
						cache[index+1].removeFunc = cache[index].cell.injectFunc(function (innerVal) {
							return cache[index+1].cell.addLine(applyFunc(applyFunc(f, cache[index+1].val), innerVal));
						});
					} else {
						lastRemoveFunc = cache[index].cell.injectFunc(function (innerVal) {
							return outputCell.addLine(innerVal);
						});
					}

					return function () {
						var remIndex = cell.getIndex(val);
						cache[remIndex].removeFunc();
						if(remIndex < cache.length -1) {
							cache[remIndex+1].removeFunc();
						} else {
							lastRemoveFunc();
						}
						cache.splice(remIndex, 1);
						if (remIndex > 0) {
							if (remIndex < cache.length) {
								cache[remIndex].removeFunc = cache[remIndex-1].cell.injectFunc(function (innerVal) {
									return cache[remIndex].cell.addLine(applyFunc(applyFunc(f, cache[remIndex].val), innerVal));
								});
							} else {
								lastRemoveFunc = cache[remIndex-1].cell.injectFunc(function (innerVal) {
									return outputCell.addLine(innerVal);
								});
							}
						} else {
							if (remIndex < cache.length) {
								cache[remIndex].removeFunc = cache[remIndex].cell.addLine(applyFunc(cache[remIndex].val, init));
							} else {
								lastRemoveFunc = outputCell.addLine(init);
							}
						}
					};
				});
				outputCell.addOnRemove(removeFunc);

				return outputCell;
			}
		}
	};
}();






forEach(primFuncs, function (primFunc, name) {
	addFun(name, primFunc.type, primFunc.func);
});
