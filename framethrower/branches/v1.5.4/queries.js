var interfaces = {
	unit: {
		actions: ["set"],
		instantiate: function () {
			var cache;
			return {
				actions: {
					set: function (o) {
						cache = o;
					}
				},
				addInform: function (pin) {
					pin.set(cache);
				}
			};
		}
	},
	set: {
		actions: ["add", "remove"],
		instantiate: function () {
			var cache = makeObjectHash();
			return {
				actions: {
					add: function (o) {
						cache.set(o, o);
					},
					remove: function (o) {
						cache.remove(o);
					}
				},
				addInform: function (pin) {
					cache.forEach(function (o) {
						pin.add(o);
					});
				}
			};
		}
	},
	list: {
		actions: ["insert", "update", "remove"],
		instantiate: function () {
			var cache = [];
			return {
				actions: {
					insert: function (o, index) {
						cache.splice(index, 0, o);
					},
					update: function (o, index) {
						cache[index] = o;
					},
					remove: function (index) {
						cache.splice(index, 1);
					}
				},
				addInform: function (pin) {
					cache.forEach(function (o) {
						pin.add(o);
					});					
				}
			};
		}
	},
	xml: {
		
	}
};


// being rewritten.....


function makeComponent(inputInterfaces, outputInterfaces, instantiateProcessor) {
	var component = makeIded();
	
	var applications = makeOhash(stringifyInputs);
	
	component.makeApply = function (inputs) {
		return applications.getOrMake(input, function () {
			var box = makeBox(inputInterfaces, outputInterfaces, instantiateProcessor, inputs);
			delete box.activate;
			delete box.deactivate;
			return box;
		});
	};
	
	return component;
}

function makeInputPin(sendFun) {
	var inputPin = makeIded();
	inputPin.send = sendFun;
	return inputPin;
}

function makeOutputPin(informs, pinName) {
	var outputPin = makeIded();
	outputPin.addInform = function (inputPin) {
		informs.add(pinName, inputPin);
	};
	outputPin.removeInform = function (inputPin) {
		informs.remove(pinName, inputPin);
	};
	return outputPin;
}

function makeBox(inputInterfaces, outputInterfaces, instantiateProcessor, inputs) {
	var box = makeIded();
	
	var active = false;
	
	var input, output, outputInterfaceInstances;
	
	box.outputPins = {};
	
	
	
	var informs = {};
	var informsCache = {};
	informs.add = function (outputPinName, childInputPin) {
		informsCache[outputPinName].add(childInputPin, childInputPin);
		// activate
		if (!active) {
			activate();
		} else {
			// catch the new child up
			outputInterfaceInstances[outputPinName].addInform(childInputPin.send);
		}
	};
	informs.remove = function (outputPinName, childInputPin) {
		informsCache[outputPinName].remove(childInputPin);
		// deactivate if nothing left
		
	};
	
	forEach(outputInterfaces, function (outputInterface, name) {
		informsCache[name] = makeObjectHash();
		box.outputPins[name] = makeOutputPin(informs);
	});
	
	
	function passToInforms(outputPinName, actionName) {
		return function () {
			var args = arguments;
			informsCache[outputPinName].forEach(function (childInputPin) {
				childInputPin.send.apply(null, args);
			});
		};
	}
	
	
	
	
	
	function activate() {
		output = {};
		forEach(outputInterfaces, function (outputInterface, outputName) {
			output[outputName] = {};
			var out = output[outputName];
			
			outputInterfaceInstances[outputName] = outputInterface.instantiate();
			var outputInterfaceInstance = outputInterfaceInstances[outputName];
			
			forEach(outputInterfaceInstance.actions, function (actionFunction, actionName) {
				out[actionName] = pCompose(actionFunction, passToInforms(outputName, actionName));
			});
		});
		
		var processor = instantiateProcessor(output);
		
		// make input pins
		forEach(inputs, function (parentPin, inputName) {
			var pin = makeInputPin(processor[inputName]);
			parentPin.addInform(pin);
		});
		
		active = true;
	}
	
	function deactivate() {
		
	}
	
	
	
	
	return box;
}

// inputs : {role: Object}
function stringifyInputs(inputs) {
	var strings = [];
	forEach(inputs, function (name, input) {
		strings.push("((" + name + ")(" + stringifyObject(input) + "))");
	});
	strings.sort();
	return strings.join("");
}










// OLD ========================

/*


function setQInterface() {
	var outputCache = makeObjectHash();
	return {
		actions: {
			add: function (o) {
				outputCache.set(o, o);
			},
			remove: function (o) {
				outputCache.remove(o);
			}
		},
		addInform: function (inform) {
			outputCache.forEach(function (o) {
				inform.input.add(o);
			});
		}
	};
}


function makeQ(outInterface, instantiate, parent) {
	var q = makeIded();
	
	var active = false;
	
	q.input = null;
	var outInterfaceInstance, output;
	
	function activate() {
		// initialize
		output = {};
		if (outInterface) {
			outInterfaceInstance = outInterface();

			forEach(outInterfaceInstance.actions, function (fun, name) {
				output[name] = pCompose(fun, callOnInforms(name));
			});
		}
		
		if (instantiate) {
			q.input = instantiate(output);
		} else {
			q.input = output;
		}
		
		// add inform from parent
		if (parent) {
			parent.addInform(q);
		}
		
		active = true;
	}
	function deactivate() {
		parent.removeInform(q);
		active = false;
		if (q.input.deactivate) {
			q.input.deactivate();
		}
		// garbage collect
		q.input = null;
		outInterfaceInstance = null;
		output = null;
	};
	q.activate = activate;
	q.deactivate = deactivate;
	
	
	var informs = makeObjectHash();
	
	q.addInform = function (inform) {
		informs.set(inform, inform);
		if (!active) {
			activate();
		}
		outInterfaceInstance.addInform(inform);
	};
	q.removeInform = function (inform) {
		informs.remove(inform);
		if (parent && informs.isEmpty()) {
			deactivate();
		}
	};
	
	function callOnInforms(name) {
		return function () {
			var args = arguments;
			informs.forEach(function (inform) {
				inform.input[name].apply(null, args);
			});
		};
	}
	
	
	
	
	
	// For visual debugging purposes
	q.getType = function () {
		return "q";
	};
	q.getInforms = function () {
		return informs.toArray();
	};
	q.getOutput = function () {
		return outputCache.toArray();
	};
	q.getActive = function () {
		return active;
	};
	
	
	return q;
}

function makeQStart(qInterface) {
	var q = makeQ(qInterface);
	q.activate();
	delete q.activate;
	delete q.deactivate;
	return q;
}

function makeQEnd(processor, parent) {
	var q = makeQ(null, function (myOut) {
		return processor;
	}, parent);
	delete q.addInform;
	delete q.removeInform;
	return q;
}



function makeQComponent(qInterface, instantiate) {
	var component = makeIded();
	
	var applications = makeObjectHash();
	
	component.makeApply = function (input) {
		return applications.getOrMake(input, function () {
			var q = makeQ(qInterface, instantiate, input);
			delete q.activate;
			delete q.deactivate;
			return q;
		});
	};
	
	return component;
}


function qCompose() {
	var component = makeIded();
	
	var components = arguments;
	
	component.makeApply = function (input) {
		var q = input;
		forEach(components, function (component) {
			q = component.makeApply(q);
		});
		return q;
	};
	
	return component;
}





function makeCrossReference() {
	var cr = {};
	
	var inputs = makeObjectHash();
	var outputs = makeObjectHash();
	
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


// f : Object -> [Object]
function qLift(f) {
	return makeQComponent(setQInterface, function (myOut) {
		var cr = makeCrossReference();
		return {
			add: function (input) {
				if (!cr.hasInput(input)) {
					var outputList = f(input);
					forEach(outputList, function (output) {
						cr.addLink(input, output, myOut.add);
					});
				}
			},
			remove: function (input) {
				cr.removeInput(input, myOut.remove);
			}
		};
	});
}


// f : Object -> Q Object
function qSelect(f) {
	return qCompose(
		qLift(function (o) {
			return [f(o)];
		}),
		qUnion);
}



var qUnion = makeQComponent(setQInterface, function (myOut) {
	var cr = makeCrossReference();
	var inputs = makeObjectHash();
	return {
		add: function (input) {
			inputs.getOrMake(input, function () {
				var aggregator = makeQEnd({
					add: function (innerInput) {
						cr.addLink(input, innerInput, myOut.add);
					},
					remove: function (innerInput) {
						cr.removeLink(input, innerInput, myOut.remove);
					}
				}, input);
				aggregator.activate();
				return aggregator;
			});
		},
		remove: function (input) {
			var qInner = inputs.get(input);
			qInner.deactivate();
			inputs.remove(input);
			cr.removeInput(input, myOut.remove);
		},
		deactivate: function () {
			inputs.forEach(function (qInner) {
				qInner.deactivate();
			});
		}
	};
});




*/





/*function memoize(stringify, f) {
	var oHash = makeOhash(stringify);
	return function (i) {
		oHash.getOrMake(i, f);
	};
}*/