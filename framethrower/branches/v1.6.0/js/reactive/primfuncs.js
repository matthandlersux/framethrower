// ============================================================================
// Utility
// ============================================================================

// for keeping track of set correspondences
function makeCrossReference() {
	var cr = {};
	
	var inputs = makeObjectHash();
	var outputs = makeObjectHash();
	
	cr.getStateMessages = function () {
		var stateArray = crossRef.getState();
		var returnArray = [];
		stateArray.forEach(function (value) {
			returnArray.push(makeMessage.set(value));
		});
		return returnArray;
	};
	
	cr.hasInput = function (input) {
		return inputs.get(input);
	};
	
	cr.addLink = function (input, output, callback) {
		if (!outputs.get(output)) {
			callback(output);
		}
		inputs.getOrMake(input, makeObjectHash).set(output, output);
		outputs.getOrMake(output, makeObjectHash).set(input, input);
	};
	
	function checkDead(output, callback) {
		var ins = outputs.get(output);
		if (ins.isEmpty()) {
			outputs.remove(output);
			callback(output);
		}
	}
	
	cr.removeLink = function (input, output, callback) {
		var outs = inputs.get(input);
		if (outs) {
			outs.remove(output);
			var ins = outputs.get(output);
			ins.remove(input);
			checkDead(output, callback);
		}
	};
	
	cr.removeInput = function (input, callback) {
		var outs = inputs.get(input);
		if (outs) {
			outs.forEach(function (output) {
				var ins = outputs.get(output);
				ins.remove(input);
				checkDead(output, callback);
			});
		}
		inputs.remove(input);
	};
	
	return cr;
}


//helper function
function setProcessor (funcs) {
	return function (messages) {
		forEach(messages, function (message) {
			if (message.action == messageEnum.set) {
				funcs.set(message.value);
			} else if (message.action == messageEnum.remove) {
				funcs.remove(message.value);
			}
		});
	};
}



var primFuncs = {
	// ============================================================================
	// Monadic Operators
	// ============================================================================
// type: a -> Unit a 
 	returnUnit : function (val) {
		var sc = makeStartCap(parse("Unit a"));
		sc.send([makeMessage.set(val)]);
		return sc;
	},
// type: Unit a -> Set a 
 	returnUnitSet : function (sc) {
		var cache;

		var getState = function () {
			return [makeMessage.set(cache)];
		};

		var outputCap = makeStartCap(parse("Set a"), getState);

		makeEndCap(sc, function (messages) {
			var message = messages[messages.length-1];
			if(cache) {
				outputCap.send([makeMessage.remove(cache)]);
			}
			cache = message.value;
			if(message.value) {
				outputCap.send([message]);
			}
		});
		
		return outputCap;
	},
// type: (a -> Unit b) -> Unit a -> Unit b 
 	bindUnit : function (f) {
		// type: Unit a -> Unit b 
 		return function (sc) {
			var outputCap = makeStartCap(parse("Unit b"));
			var innerEc;
			makeEndCap(sc, function (messages) {
				var message = messages[messages.length-1];
				// could typeCheck message here	
				if(message.value) {
					if (innerEc) {
						innerEc.deactivate();
					}
					var resultCap = applyFunc(f, message.value);
					innerEc = makeEndCap(resultCap, function (messages) {
						var message = messages[messages.length-1];
						outputCap.send([message]);
					});
				} else {
					if (innerEc) {
						innerEc.deactivate();
					}
					outputCap.send(message);
				}
			});
			return outputCap;
		};
	},
// type: (a -> Set b) -> Set a -> Set b 
 	bindSet : function (f) {
		// type: Set a -> Set b 
 		return function (sc) {
			var outputCap = makeStartCap(parse("Set b"));
			var crossRef = makeCrossReference();
			var ECs = makeOhash();
			
			makeEndCap(sc, setProcessor({
				set : function (inputValue) {
					var resultCap = applyFunc(f, inputValue);

					var innerEc = makeEndCap(resultCap, setProcessor({
						set : function (setValue) {
							crossRef.addLink(inputValue, setValue, function (value) {
								outputCap.send([makeMessage.set(value)]);
							});								
						},
						remove : function (removeValue) {
							crossRef.removeLink(message.value, removeValue, function (value) {
								outputCap.send([makeMessage.remove(value)]);
							});								
						}
					}));
					
					ECs.set(inputValue, innerEc);
				},
				remove : function (removeValue) {
					crossRef.removeInput(removeValue, function (value) {
						outputCap.send([makeMessage.remove(value)]);
					});
					//need to clean up the innerEc associated with this input
					ECs.get(removeValue).deactivate();
					ECs.remove(removeValue);
				}
			}), crossRef.getStateMessages);

			return outputCap;
		};
	},
	// ============================================================================
	// Bool utility functions
	// ============================================================================
// type: a -> a -> Bool 
 	equal : function (val1) {
		// type: a -> Bool 
 		return function (val2) {
			return (val1 == val2);
		};
	},
// type: Bool -> Bool 
 	not : function (val1) {
		return (!val1);
	},
// type: Bool -> Bool -> Bool 
 	and : function (val1) {
		// type: Bool -> Bool 
 		return function (val2) {
			return (val1 && val2);
		};
	},
// type: Bool -> Bool -> Bool 
 	or : function (val1) {
		// type: Bool -> Bool 
 		return function (val2) {
			return (val1 || val2);
		};
	},
	// ============================================================================
	// Other functions?
	// ============================================================================
// type: Unit (a -> b) -> a -> Unit b 
 	reactiveApply : function (sc) {
		// type: a -> Unit b 
 		return function (input) {
			var cache;

			var getState = function () {
				return [makeMessage.set(cache)];
			};

			var outputCap = makeStartCap(parse("Unit b"), getState);

			makeEndCap(sc, function (messages) {
				var message = messages[messages.length-1];
				if(cache) {
					outputCap.send([makeMessage.remove(cache)]);
				}
				if(message.value) {
					var result = applyFunc(message.value, input);
					outputCap.send([makeMessage.set(result)]);
					cache = result;
				}
			});
			return outputCap;
		};
	},
// type: (a -> Bool) -> a -> Unit a 
 	passThru : function (f) {
		// type: a -> Unit a 
 		return function (input) {
			if(f(input)) {
				return applyFunc(primFuncs.returnUnit, input);
			} else {
				return applyFunc(primFuncs.returnUnit, null);
			}
		};
	},
// type: (a -> Unit Bool) -> Set a -> Unit Bool 
 	any : function (f) {
		// type: Set a -> Unit Bool 
 		return function (sc) {
			//working on this
			var outputCap = makeStartCap(parse("Unit Bool"));
			var simpleCrossRef = {};
			var trueCount = 0;
			var ECs = makeOhash();

			outputCap.send([makeMessage.set(false)]);
			makeEndCap(sc, setProcessor({
				set : function (inputValue) {
					var resultCap = applyFunc(f, inputValue);

					var innerEc = makeEndCap(resultCap, function (messages) {
						var setValue = messages[messages.length-1].value;
						if (setValue && !simpleCrossRef[inputValue]) {
							simpleCrossRef[inputValue] = true;
							trueCount++;
							if(trueCount == 1) {
								outputCap.send([makeMessage.set(true)]);
							}
						} else if (!setValue && simpleCrossRef[inputValue]) {
							simpleCrossRef[inputValue] = false;
							trueCount--;
							if(trueCount == 0) {
								outputCap.send([makeMessage.set(false)]);
							}
						}
					});
					
					ECs.set(inputValue, innerEc);
				},
				remove : function (removeValue) {
					if(simpleCrossRef[removeValue]) {
						delete simpleCrossRef[removeValue];
						trueCount--;
						if(trueCount == 0) {
							outputCap.send([makeMessage.set(false)]);
						}
					}
					//need to clean up the innerEc associated with this input
					ECs.get(removeValue).deactivate();
					ECs.remove(removeValue);
				}
			}));

			return outputCap;
		};
	},
// type: (a -> b -> b) -> b -> Set a -> Unit b
	fold : function (f) {
		return function (init) {
	 		return function (sc) {
				var outputCap = makeStartCap(parse("Unit b"));
				var list = [init];
				var resultList = [init];
				var cache = makeOhash();
				cache.set(init, 0);

				makeEndCap(sc, setProcessor({
					set : function (inputValue) {
						//ignore values we already have
						if(!cache.get(inputValue)) {
							var result = applyFunc(applyFunc(f, resultList[resultList.length-1]), inputValue);
							list.push(inputValue);
							resultList.push(result);
							cache.set(inputValue, list.length-1);
							outputCap.send([makeMessage.set(result)]);
						}
					},
					remove : function (removeValue) {
						var index = cache.get(removeValue);
						if(!index) return;
						if(index !== list.length-1) {
							// insert last element in list where removeValue was
							var lastElement = list.pop();
							list.splice(index, 1, lastElement);
							// remove the results that depended on the removedElement
							resultList.splice(index);
							// recompute the missing part of the resultList
							// TODO: make this more functional
							for (var i = index; i < list.length; i++){
								resultList.push(applyFunc(applyFunc(f, list[i]), resultList[i-1]));
							}
							cache.remove(removeValue);
							cache.set(lastElement, index);
						} else {
							// just remove the last element and last result
							list.pop();
							resultList.pop();
							cache.remove(removeValue);
						}
						outputCap.send([makeMessage.set(resultList[resultList.length-1])]);
					}
				}), function () {return [makeMessage.set(resultList[resultList.length-1])];});

				return outputCap;
			};
		};
	}
};