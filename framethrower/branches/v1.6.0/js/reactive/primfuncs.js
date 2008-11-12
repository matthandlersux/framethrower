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
	returnUnit : makeFun("a -> Unit a", function (val) {
		var sc = makeStartCap(parse("Unit a"));
		sc.send([makeMessage.set(val)]);
		return sc;
	}),
	returnUnitSet : makeFun("Unit a -> Set a", function (sc) {
		var cache;

		var getState = function () {
			return [makeMessage.set(cache)];
		};

		var outputCap = makeStartCap(parse("Set a"), null, getState);
		
		var processor = function (messages) {
			var message = messages[messages.length-1];
			if(message.action == messageEnum.set) {
				if(cache) {
					outputCap.send(makeMessage.remove(message.value));
				}
				cache = message.value;
				if(message.value) {
					outputCap.send([message]);
				}
			}
		};
		
		var ec = makeEndCap(sc, processor);
		
		return outputCap;
	}),
	bindUnit : makeFun("(a -> Unit b) -> Unit a -> Unit b", function (f) {
		return makeFun("Unit a -> Unit b", function (sc) {
			var outputCap = makeStartCap(parse("Unit b"));
			var innerEc;
			var processor = function (messages) {
				var message = messages[messages.length-1];
				// could typeCheck message here	
				if(message.value) {
					var resultCap = applyFunc(f, message.value);
					
					var innerProcessor = function (messages) {
						var message = messages[messages.length-1];
						outputCap.send([message]);
					};
					if (innerEc) {
						innerEc.deactivate();
					}
					innerEc = makeEndCap(resultCap, innerProcessor);				
				} else {
					if (innerEc) {
						innerEc.deactivate();
					}
					outputCap.send(message);
				}
			};

			var ec = makeEndCap(sc, processor);
			return outputCap;
		});
	}),
	bindSet : makeFun("(a -> Set b) -> Set a -> Set b", function (f) {
		return makeFun("Set a -> Set b", function (sc) {
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
			}), null, crossRef.getStateMessages);

			return outputCap;
		});
	})
};