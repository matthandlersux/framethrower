// ============================================================================
// Utility
// ============================================================================

// for keeping track of set correspondences
function makeCrossReference() {
	var cr = {};
	
	var inputs = makeObjectHash();
	var outputs = makeObjectHash();
	
	cr.getStateMessages = function () {
		var stateArray = outputs.getState();
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

//This is almost the same as the Set Cross Reference, but keeps track of the values that go with each output key for getStateMessages
function makeAssocCrossReference() {
	var cr = {};
	
	var inputs = makeObjectHash();
	var outputs = makeObjectHash();
	
	cr.getStateMessages = function () {
		var stateArray = outputs.getState();
		var returnArray = [];
		stateArray.forEach(function (value, key) {
			returnArray.push(makeMessage.setAssoc(key, value));
		});
		return returnArray;
	};
	
	cr.hasInput = function (input) {
		return inputs.get(input);
	};
	
	cr.addLink = function (input, output, callback, assocVal) {
		if (!outputs.get(output)) {
			callback(output);
		}
		inputs.getOrMake(input, makeObjectHash).set(output, assocVal);
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



//helper functions
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

function assocProcessor (funcs) {
	return function (messages) {
		forEach(messages, function (message) {
			if (message.action == messageEnum.setAssoc) {
				funcs.setAssoc(message.key, message.value);
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
		var sc = makeStartCap("Unit");
		sc.send([makeMessage.set(val)]);
		return sc;
	},
// type: Unit a -> Set a 
 	returnUnitSet : function (sc) {
		var cache;

		var getState = function () {
			return [makeMessage.set(cache)];
		};

		var outputCap = makeStartCap(("Set"), getState);

		makeEndCap(sc, function (messages) {
			var message = messages[messages.length-1];
			if(cache) {
				outputCap.send([makeMessage.remove(cache)]);
			}
			cache = message.value;
			if(message.value) {
				//outputCap.send(getState());
				outputCap.send([message]);
			}
		});
		
		return outputCap;
	},
// type : a -> Unit b -> Assoc a b
	returnUnitAssoc : function (key) {
		return function (sc) {
			var cache;
			
			var getState = function () {
				if (cache) {
					return [makeMessage.setAssoc(key, cache)];
				} else {
					return [];
				}
			};
			
			var outputCap = makeStartCap(("Assoc"), getState);
			
			makeEndCap(sc, function (messages) {
				var message = messages[messages.length-1];
				cache = message.value;
				if(cache) {
					outputCap.send(getState());
				} else {
					outputCap.send([makeMessage.remove(key)]);
				}
			});
			return outputCap;
		};
	},
// type: (a -> Unit b) -> Unit a -> Unit b 
 	bindUnit : function (f) {
		// type: Unit a -> Unit b 
 		return function (sc) {
			var outputCap = makeStartCap("Unit");
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
			var outputCap = makeStartCap("Set");
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
							crossRef.removeLink(inputValue, removeValue, function (value) {
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
	// type: (a -> b -> Assoc a c) -> Assoc a b -> Assoc a c 
	 	bindAssoc : function (f) {
			// type: Assoc a b -> Assoc a c 
	 		return function (sc) {
				var outputCap = makeStartCap("Assoc");
				var crossRef = makeAssocCrossReference();
				var ECs = makeOhash();

				makeEndCap(sc, assocProcessor({
					setAssoc : function (inputKey, inputValue) {
						var resultCap = applyFunc(f, inputKey, inputValue);

						var innerEc = makeEndCap(resultCap, assocProcessor({
							setAssoc : function (setKey, setValue) {
								crossRef.addLink(inputKey, setKey, function (key) {
									outputCap.send([makeMessage.setAssoc(key, setValue)]);
								}, setValue);
							},
							remove : function (removeValue) {
								crossRef.removeLink(inputKey, removeValue, function (value) {
									outputCap.send([makeMessage.remove(value)]);
								});
							}
						}));

						ECs.set(inputKey, innerEc);
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
	// Number utility functions
	// ============================================================================
// type: Number -> Number -> Number
	add : function (val1) {
		// type: Number -> Number
		return function (val2) {
			return val1 + val2;
		};
	},
	// Just for Testing!!
	// takes a number x, and returns a set with 1,2..x
	// type: Number -> Set Number
	oneTo : function (val1) {
		var outputCap = makeStartCap("Set");
		var outMessages = [];
		for(var i=1; i<= val1; i++) {
			outMessages.push(makeMessage.set(i));
		}
		outputCap.send(outMessages);
		return outputCap;
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

			var outputCap = makeStartCap("Unit", getState);

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
			var outputCap = makeStartCap("Unit");
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
				var outputCap = makeStartCap("Unit");
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
				}), function () {
					if(resultList.length > 0) {
						return [makeMessage.set(resultList[resultList.length-1])];
					} else {
						return [];
					}
				});

				return outputCap;
			};
		};
	},
	// ============================================================================
	// Assoc functions
	// ============================================================================
// type: (a -> b) -> Set a -> Assoc a b
	buildAssoc : function (f) {
		return function (sc) {
			var outputCap = makeStartCap("Assoc");
			var cache = makeOhash();
			
			var getState = function () {
				return cache.toArray();
			};
			
			makeEndCap(sc, setProcessor({
				set : function (inputValue) {
					if(!cache.get(inputValue));
					var result = applyFunc(f, inputValue);
					var message = makeMessage.setAssoc(inputValue, result);
					cache.set(inputValue, message);
					outputCap.send([message]);
				},
				remove : function (removeValue) {
					if(cache.get(inputValue)) {
						cache.remove(inputValue);
						outputCap.send(makeMessages.remove(inputValue));
					}
				}
			}), getState);

			return outputCap;
		};
	},
// type: Assoc a (Set b) -> Assoc b (Set a)
	invert : function (sc) {
		var outputCap = makeStartCap("Assoc");
		var ECs = makeOhash();
		var OCs = makeOhash();
		var cache = makeOhash();
		var outputBag = makeOhash();

		makeEndCap(sc, assocProcessor({
			setAssoc : function (inputKey, inputValueSC) {
				var innerCache = makeOhash();
				cache.set(inputKey, innerCache);
				var prevEC = ECs.get(inputKey);
				if (prevEC) prevEC.deactivate();
				
				ECs.set(inputKey, makeEndCap(inputValueSC, setProcessor({
					set : function (setValue) {
						if(!innerCache.get(setValue)) {
							innerCache.set(setValue, setValue);
							//send (setValue, inputKey) to the output carefully
							var innerOutcap = OCs.get(setValue);
							if(!innerOutcap) {
								innerOutcap = makeStartCap("Set");
								OCs.set(setValue, innerOutcap);
								outputCap.send([makeMessage.setAssoc(setValue, innerOutcap)]);
							}
							innerOutcap.send([makeMessage.set(inputKey)]);
							var bagCount = outputBag.get(setValue);
							if (!bagCount) {
								bagCount = 0;
							}
							outputBag.set(setValue, bagCount+1);
						}
					},
					remove : function (removeValue) {
						var innerOutcap = OCs.get(removeValue);
						innerOutcap.send([makeMessage.remove(inputKey)]);
						var bagCount = outputBag.get(removeValue);
						if (bagCount <= 1) {
							outputCap.send([makeMessage.remove(removeValue)]);
							OCs.remove(removeValue);
						}
						outputBag.set(removeValue, bagCount-1);
					}
				})));
			},
			remove : function (removeValue) {
				var innerCache = cache.get(removeValue);
				innerCache.forEach(function(setValue) {
					var innerOutcap = OCs.get(setValue);
					innerOutcap.send([makeMessage.remove(removeValue)]);
					var bagCount = outputBag.get(setValue);
					if (bagCount <= 1) {
						outputCap.send([makeMessage.remove(setValue)]);
						OCs.remove(setValue);
					}
					outputBag.set(setValue, bagCount-1);
				});
				cache.remove(removeValue);
				//need to clean up the innerEc associated with this input
				ECs.get(removeValue).deactivate();
				ECs.remove(removeValue);
			}
		}));

		return outputCap;
	},
// type: (a -> b) -> Assoc c a -> Assoc c b
	mapAssocValue : function (f) {
		return function (sc) {
			var outputCap = makeStartCap("Assoc");
			makeEndCap(sc, assocProcessor({
				setAssoc : function (inputKey, inputValue) {
					var result = applyFunc(f, inputValue);
					outputCap.send([makeMessage.setAssoc(inputKey, result)]);
				},
				remove : function (removeKey) {
					outputCap.send([makeMessage.remove(removeKey)]);
				}
			}));
			return outputCap;
		};
	},
// type: a -> Assoc a b -> Unit b
	getKey : function (key) {
		return function (sc) {
			var outputCap = makeStartCap("Unit");
			makeEndCap(sc, assocProcessor({
				setAssoc : function (inputKey, inputValue) {
					if (inputKey == key) {
						outputCap.send([makeMessage.set(inputValue)]);
					}
				},
				remove : function (removeKey) {
					if (removeKey == key) {
						outputCap.send([makeMessage.set(undefined)]);
					}
				}
			}));
			return outputCap;
		};
	},
// type: Assoc a b -> Set a
	keys : function (sc) {
		var outputCap = makeStartCap("Set");
		makeEndCap(sc, assocProcessor({
			setAssoc : function (inputKey, inputValue) {
				outputCap.send([makeMessage.set(inputKey)]);
			},
			remove : function (removeKey) {
				outputCap.send([makeMessage.remove(removeKey)]);
			}
		}));
		return outputCap;
	}
};












forEach(primFuncs, function (func, name) {
	addFun(name, "a", func);
});