(function () {
	
	
	var primFuncs = function () {
		function applyFunc(func, input) {
			return evaluate(makeApply(func, input));		
		}

		function applyAndInject(func, input, depender, inject) {
			return evaluateAndInject(makeApply(func, input), depender, inject);
		}	

		function rangeHelper (outputCell, setRangeFunc, startCell, endCell, cell) {
			cell.makeSorted();
			var start;
			var end;
			outputCell.leash();

			var rView;

			var initializeRange = function (rView) {
				rView.clearRange();
			};

			var injectedFunc = cell.inject(outputCell, function (val) {
				outputCell.addLine(val);
				return function () {outputCell.removeLine(val);};
			}, initializeRange);
			rView = injectedFunc.rView;

			var updateRange = function (rView) {
				if (start !== undefined && end !== undefined) {
					rView[setRangeFunc](start, end);
				} else if (start === undefined && end === undefined) {
					// TODO: figure out another way to do this
					// outputCell.clearRange();
				}
			};
			
			startCell.inject(outputCell, function(val) {
				start = val;
				updateRange(rView);
				return function () {
					start = undefined;
					updateRange(rView);
				};
			}, undefined, true);
			endCell.inject(outputCell, function(val) {
				end = val;
				updateRange(rView);
				return function () {
					end = undefined;
					updateRange(rView);
				};
			}, undefined, true);
			
			outputCell.unleash();
			return outputCell;
		}

		return {
			// ============================================================================
			// Monadic Operators
			// ============================================================================
		 	returnUnit : {
				type : "a -> Unit a",
				func : function (val) {
					var outputCell = makeCellUnit();
					outputCell.addLine(val);
					outputCell.setDone();
					return outputCell;
				}
			},
		 	returnUnitSet : {
				type : "Unit a -> Set a",
				func : function (cell) {
					var outputCell = makeCellSet();
					cell.inject(outputCell, function (val) {
						outputCell.addLine(val);
						return function () {outputCell.removeLine(val);};
					});
					return outputCell;
				}
			},
			returnUnitMap : {
				type : "a -> Unit b -> Map a b",
				func : function (key, cell) {
					var outputCell = makeCellMap();
					cell.inject(outputCell, function (val) {
						outputCell.addLine({key:key, val:val});
						return function () {outputCell.removeLine({key:key, val:val});};
					});
					return outputCell;
				}
			},
		 	bindUnit : {
			// this is hacked for the output to not flicker as long as there are no asynchronous calls
				type : "(a -> Unit b) -> Unit a -> Unit b",
				func : function (f, cell) {
					var outputCell = makeCellUnit();
					var uninjectDone = true;
					var injectedFunc;
					var clearOutput;
					cell.inject(outputCell, function (val) {
						if (!uninjectDone) {
							injectedFunc.unInject;
						}
						var needToClear = true;
						injectedFunc = applyAndInject(f, val, outputCell, function (innerVal) {
							needToClear = false;
							outputCell.addLine(innerVal);
							clearOutput = function () {outputCell.removeLine();};
						});
						if (needToClear && clearOutput) {
							clearOutput();
						}
						uninjectDone = false;
						return function () {
							injectedFunc.unInject;
							if (clearOutput) clearOutput();
							uninjectDone = true;
						};
					}, undefined, true);
					return outputCell;
				}
			},
		 	bindSet : {
				type : "(a -> Set b) -> Set a -> Set b",
				func : function (f, cell) {
					var outputCell = makeCellSet();
					cell.inject(outputCell, function (val) {
						var injectedFunc = applyAndInject(f, val, outputCell, function (innerVal) {
							outputCell.addLine(innerVal);
							return function () {outputCell.removeLine(innerVal);};
						});
						return injectedFunc.unInject;
					});
					return outputCell;
				}
			},
		 	bindMap : {
				type : "(a -> b -> Map a c) -> Map a b -> Map a c",
				func : function (f, cell) {
					var outputCell = makeCellMap();

					cell.inject(outputCell, function (keyVal) {
						var injectedFunc = applyAndInject(applyFunc(f, keyVal.key), keyVal.val, outputCell, function (innerKeyVal) {
							outputCell.addLine(innerKeyVal);
							return function () {outputCell.removeLine(innerKeyVal);};
						});
						return injectedFunc.unInject;
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
					var outputCell = makeCellSet();
					outputCell.leash();
					cell1.inject(outputCell, function (val) {
						outputCell.addLine(val);
						return function () {outputCell.removeLine(val);};
					});
					cell2.inject(outputCell, function (val) {
						outputCell.addLine(val);
						return function () {outputCell.removeLine(val);};
					});
					outputCell.unleash();
					return outputCell;
				}
			},
			setDifference : {
				type : "Set a -> Set a -> Set a",
				func : function (cell1, cell2) {
					var outputCell = makeCellSet();
					var countHash = {};

					var add = function (count, value) {
						count.num++;
						if (count.num == 1) {
							outputCell.addLine(value);
							count.onRemove = function () {outputCell.removeLine(value);};
						}
					};

					var sub = function (count) {
						count.num--;
						if(count.num == 0) count.onRemove();
					};

					var getOrMake = function (value) {
						if (countHash[value] === undefined) {
							countHash[value] = {num:0};
						}
						return countHash[value];
					};
					outputCell.leash();
					cell1.inject(outputCell, function (value) {
						var count = getOrMake(value);
						add(count, value);
						return function () {
							sub(count);
						};
					});
					cell2.inject(outputCell, function (value) {
						var count = getOrMake(value);
						sub(count);
						return function () {
							add(count, value);
						};
					});
					outputCell.unleash();
					return outputCell;
				}
			},
			takeOne : {
				type : "Set a -> Unit a",
				func : function (cell) {
					var outputCell = makeCellUnit();
					var cache;

					cell.inject(outputCell, function (val) {
						if (cache === undefined) {
							outputCell.addLine(val);
							cache = val;
						}
						return function () {
							if (cache === val) {
								cache = cell.getState()[0];
								if (cache !== undefined) {
									outputCell.addLine(cache);
								} else {
									outputCell.removeLine();
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

			boolToUnit : {
				type : "Bool -> Unit Null",
				func : function (val) {
					var outputCell = makeCellUnit();
					if (val) {
						outputCell.addLine(nullObject);
						outputCell.setDone();
					}
					return outputCell;
				}
			},
			unitDone: {
				type: "Unit Null -> Unit Null",
				func: function (cell) {
					var currentValue = false;
					var outputValue = false;
					var outputCell = makeCellUnit();
					cell.inject(outputCell, function (val) {
						currentValue = true;
						return function () {
							currentValue = false;
						};
					});
					cell.injectDependency(function () {
						if (outputValue !== currentValue) {
							outputValue = currentValue;
							if (outputValue) {
								outputCell.addLine(nullObject);
							} else {
								outputCell.removeLine();
							}
						}
					});
					return outputCell;
				}
			},
			lowPassFilter: {
				type: "Unit a -> Unit a",
				func: function (cell) {
					var inputCellValue;
					var outputCellValue;
					
					var outputCell = makeCellUnit();
					
					function update() {
						if (outputCellValue !== inputCellValue) {
							outputCellValue = inputCellValue;
							outputCell.addLine(outputCellValue);
						}
					}
					
					cell.inject(outputCell, function (val) {
						inputCellValue = val;
						setTimeout(update, 0);
						return function () {
							
						};
					});
					return outputCell;
				}
			},
			countChanges: { // for debugging
				type: "Unit a -> Unit Number",
				func: function (cell) {
					var currentValue = 0;
					var outputCell = makeCellUnit();
					outputCell.addLine(currentValue);
					cell.inject(outputCell, function (val) {
						currentValue += 1;
						outputCell.addLine(currentValue);
						return function () {
							
						};
					});
					return outputCell;
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
					var outputCell = makeCellSet();
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
					var outputCell = makeCellMap();
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
					var outputCell = makeCellUnit();
					cell.inject(outputCell, function (val) {
						var resultVal = applyFunc(val, input);
						outputCell.addLine(resultVal);
						return function () {outputCell.removeLine(resultVal);};
					});
					return outputCell;
				}
			},

			// ============================================================================
			// Null Type Functions
			// ============================================================================
			reactiveNot: {
				type: "Unit a -> Unit Null", // TODO: change this type (from Unit Null -> Unit Null) server-side...
				func: function (cell) {
					var outputCell = makeCellUnit();
					outputCell.addLine(nullObject);
					cell.inject(outputCell, function (val) {
						outputCell.removeLine();
						return function() {
							outputCell.addLine(nullObject);
						};
					}, undefined, true);
					return outputCell;
				}
			},
			reactiveAnd: {
				type: "Unit Null -> Unit Null -> Unit Null",
				func: function (cell1, cell2) {
					var bool1 = false;
					var bool2 = false;
					var isSet = false;
					var outputCell = makeCellUnit();

					function updateOutputCell() {
						if (bool1 && bool2 && !isSet) {
							outputCell.addLine(nullObject);
							isSet = true;
						} else if (isSet) {
							outputCell.removeLine();
							isSet = false;
						}
					}
					outputCell.leash();
					cell1.inject(outputCell, function (val) {
						bool1 = true;
						updateOutputCell();
						return function () {
							bool1 = false;
							updateOutputCell();
						};
					}, undefined, true);
					cell2.inject(outputCell, function (val) {
						bool2 = true;
						updateOutputCell();
						return function () {
							bool2 = false;
							updateOutputCell();
						};
					}, undefined, true);
					outputCell.unleash();
					return outputCell;
				}
			},
			reactiveOr: {
				type: "Unit Null -> Unit Null -> Unit Null",
				func: function (cell1, cell2) {
					var bool1 = false;
					var bool2 = false;
					var isSet = false;
					var outputCell = makeCellUnit();

					function updateOutputCell() {
						if ((bool1 || bool2) && !isSet) {
							outputCell.addLine(nullObject);
							isSet = true;
						} else if (!bool1 && !bool2 && isSet) {
							outputCell.removeLine();
							isSet = false;
						}
					}
					outputCell.leash();
					cell1.inject(outputCell, function (val) {
						bool1 = true;
						updateOutputCell();
						return function () {
							bool1 = false;
							updateOutputCell();
						};
					}, undefined, true);
					cell2.inject(outputCell, function (val) {
						bool2 = true;
						updateOutputCell();
						return function () {
							bool2 = false;
							updateOutputCell();
						};
					}, undefined, true);
					outputCell.unleash();
					return outputCell;				
				}
			},
			defaultValue: {
				type: "a -> Unit a -> Unit a",
				func: function (defaultValue, cell) {
					var outputCell = makeCellUnit();
					outputCell.addLine(defaultValue);
					cell.inject(outputCell, function (val) {
						outputCell.addLine(val);
						return function () {
							outputCell.addLine(defaultValue);
						};
					}, undefined, true);
					return outputCell;
				}
			},
			reactiveIfThen: {
				type: "Unit a -> b -> b -> Unit b",
				func: function (predicate, consequent, alternative) {
					var outputCell = makeCellUnit();
					outputCell.addLine(alternative);
					predicate.inject(outputCell, function (val) {
						outputCell.addLine(consequent);
						return function () {
							outputCell.addLine(alternative);
						};
					}, undefined, true);
					return outputCell;
				}
			},
			isEmpty: {
				type: "Set a -> Unit Null",
				func: function (cell) {
					var outputCell = makeCellUnit();
					var count = 0;
					outputCell.addLine(nullObject);

					cell.inject(outputCell, function (val) {
						if (count === 0) outputCell.removeLine();
						count++;
						return function() {
							count--;
							if (count === 0) outputCell.addLine(nullObject);
						};
					});
					return outputCell;				
				}
			},
			getByPosition: {
				type: "Number -> Set a -> Unit a",
				func: function (index, cell) {
					var outputCell = makeCellUnit();
					cell.makeSorted();
					var current;
					var active = false;
					function update() {
						if (active) {
							var a = cell.getKeyByIndex(index);
							if (current !== a) {
								if (a !== undefined) {
									outputCell.addLine(a);
								} else {
									outputCell.removeLine();
								}
								current = a;
							}
						}
					}
					cell.inject(outputCell, function (val) {
						update(); 
						return update;
					});
					cell.injectDependency(function () {
						active = true;
						update();
					});
					return outputCell;
				}
			},
			getPosition: {
				type: "a -> Set a -> Unit Number", // TODO: add to server
				func: function (element, cell) {
					var outputCell = makeCellUnit();
					cell.makeSorted();
					var current;
					var active = false;
					
					function update() {
						if(active) {
							var a = cell.getIndex(element);
							if (current !== a) {
								if (a !== undefined) {
									outputCell.addLine(a);
								} else {
									outputCell.removeLine();
								}
								current = a;
							}
						}
					}
					cell.inject(outputCell, function (val) {
						update(); 
						return update;
					});
					cell.injectDependency(function () {
						active = true;
						update();
					});
					return outputCell;
				}
			},
			gate: {
				type: "Unit b -> a -> Unit a",
				func: function (gatekeeper, passer) {
					// if gatekeeper is set, send passer through
					// if gatekeeper is empty, output is empty
					var bool1 = false;
					var isSet = false;
					var outputCell = makeCellUnit();

					function updateOutputCell() {
						if (bool1 && !isSet) {
							outputCell.addLine(passer);
							isSet = true;
						} else if (!bool1 && isSet) {
							outputCell.removeLine();
							isSet = false;
						}
					}

					gatekeeper.inject(outputCell, function (val) {
						bool1 = true;
						updateOutputCell();
						return function () {
							bool1 = false;
							updateOutputCell();
						};
					}, undefined, true);

					return outputCell;
				}
			},

			fold : {
				//type : "(a -> b -> b) -> (b -> a -> a) -> b -> Set a -> Unit b",
				type : "(a -> b -> b) -> (a -> b -> b) -> b -> Set a -> Unit b",
				func : function (f, finv, init, cell) {
					var outputCell = makeCellUnit();
					var cache = init;
					outputCell.addLine(cache);

					cell.inject(outputCell, function (val) {
						cache = applyFunc(applyFunc(f, val), cache);
						outputCell.addLine(cache);
						return function () {
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
					var outputCell = makeCellSet();

					outputCell.addLine(init);
					//TODO: make this inject more like the erlang version
					outputCell.inject(function(){}, function (val) {
						var injectedFunc = applyAndInject(f, val, outputCell, function (innerVal) {
							outputCell.addLine(innerVal);
							return function () {outputCell.removeLine(innerVal);};
						});
						return injectedFunc.unInject;
					});

					return outputCell;
				}
			},
			unfoldMap : {
				type : "(a -> Set a) -> a -> Map a Number",
				func : function (f, init) {
					var outputCell = makeCellMap();

					outputCell.addLine({key:init, val:0});
					//TODO: make this inject more like the erlang version
					outputCell.inject(function(){}, function (keyVal) {
						var injectedFunc = applyAndInject(f, keyVal.key, outputCell, function (val) {
							var keyValToAdd = {key:val, val:keyVal.val+1};
							outputCell.addLine(keyValToAdd);
							return function () {outputCell.removeLine(keyValToAdd);};
						});
						return injectedFunc.unInject;
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
					var outputCell = makeCellMap();

					cell.inject(outputCell, function (val) {
						var result = applyFunc(f, val);
						outputCell.addLine({key:val, val:result});
						return function () {outputCell.removeLine({key:val, val:result});};
					});

					return outputCell;
				}
			},
			invert : {
				type : "Map a (Set b) -> Map b (Set a)",
				func : function (cell) {
					var setType = GLOBAL.typeCheck ? buildType(getType(cell), "Map a (Set b)", "Set a") : undefined;

					var outputCell = makeCellMap();
					var bHash = {};

					var bHashCell = makeCellSet();

					//this is to make outputCell depend on BHashCell for being 'done' 
					bHashCell.inject(outputCell, function (bValue) {});
					
					bHashCell.inject(
						function() {
							forEach(bHash, function(bCell) {
								bCell.setDone();
							});
						},
						function (bValue) {
							var newCell = makeCellSet();
							newCell.type = setType;
							bHash[bValue] = newCell;
							outputCell.addLine({key:bValue, val:newCell});
							return function () {
								delete bHash[bValue];
								return function () {outputCell.removeLine({key:bValue, val:newCell});};
							};
						}
					);

					cell.inject(outputCell, function (keyVal) {
						var injectedFunc = keyVal.val.inject(bHashCell, function (innerVal) {
							bHashCell.addLine(innerVal);
							bHash[innerVal].addLine(keyVal.key);
							return function () {
								bHash[innerVal].removeLine(keyVal.key);
								bHashCell.removeLine(innerVal);
							};
						});
						return injectedFunc.unInject;
					});

					return outputCell;
				}
			},
			mapMapValue : {
				type : "(a -> b) -> Map c a -> Map c b",
				func : function (f, cell) {
					var outputCell = makeCellMap();

					cell.inject(outputCell, function (keyVal) {
						var result = applyFunc(f, keyVal.val);
						outputCell.addLine({key:keyVal.key, val:result});
						return function () {outputCell.removeLine({key:keyVal.key, val:result});};
					});

					return outputCell;
				}
			},
			getKey : {
				type : "a -> Map a b -> Unit b",
				func : function (key, cell) {
					var outputCell = makeCellUnit();

					cell.inject(outputCell, function (keyVal) {
						//if (keyVal.key === key) {
						if (stringify(keyVal.key) === stringify(key)) {
							outputCell.addLine(keyVal.val);
							return function () {outputCell.removeLine(keyVal.val);};
						}
					});

					return outputCell;
				}
			},
			keys : {
				type : "Map a b -> Set a",
				func : function (cell) {
					var outputCell = makeCellSet();

					cell.inject(outputCell, function (keyVal) {
						outputCell.addLine(keyVal.key);
						return function () {outputCell.removeLine(keyVal.key);};
					});

					return outputCell;
				}
			},
			values : { // TODO: add this to server
				type : "Map a b -> Set b",
				func : function (cell) {
					var outputCell = makeCellSet();

					cell.inject(outputCell, function (keyVal) {
						outputCell.addLine(keyVal.val);
						return function () {outputCell.removeLine(keyVal.val);};
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
					var outputCell = makeCellSet();
					return rangeHelper(outputCell, 'setKeyRange', startCell, endCell, cell);
				}
			},
			rangeByPos : {
				type : "Unit Number -> Unit Number -> Set a -> Set a",
				func : function (startCell, endCell, cell) {
					var outputCell = makeCellSet();
					return rangeHelper(outputCell, 'setPosRange', startCell, endCell, cell);
				}
			},
			rangeMapByKey : {
				type : "Unit Number -> Unit Number -> Map a b -> Map a b",
				func : function (startCell, endCell, cell) {
					var outputCell = makeCellMap();
					return rangeHelper(outputCell, 'setKeyRange', startCell, endCell, cell);
				}
			},
			rangeMapByPos : {
				type : "Unit Number -> Unit Number -> Map a b -> Map a b",
				func : function (startCell, endCell, cell) {
					var outputCell = makeCellMap();
					return rangeHelper(outputCell, 'setPosRange', startCell, endCell, cell);
				}
			},
			takeLast : {
				type : "Set a -> Unit a",
				func : function (cell) {
					cell.makeSorted();
					var outputCell = makeCellUnit();
					var cache;
					function update() {
						var state = cell.getState();
						var last = state[state.length-1];
						if(cache !== last) {
							cache = last;
							outputCell.addLine(cache);
						}					
					}
					update();

					cell.inject(outputCell, function (val) {
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

	
	
})();