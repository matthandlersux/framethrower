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
				},
				getState: function () {
					return cache;
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
				},
				getState: function () {
					return cache.toArray();
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
					cache.forEach(function (o, index) {
						pin.insert(o, index);
					});					
				},
				getState: function () {
					return cache;
				}
			};
		}
	},
	xml: {
		
	}
};




function makeInputPin(sendFun) {
	var inputPin = makeIded();
	inputPin.send = sendFun;
	return inputPin;
}


function makeOutputPin(outputInterface, controller, activator) {
	var outputPin = makeIded();
	
	var active = false;
	var outputInterfaceInstance;
	
	var informs = makeObjectHash();
	
	outputPin.addInform = function (inputPin) {
		informs.set(inputPin, inputPin);
		if (active) {
			outputInterfaceInstance.addInform(inputPin.send);
		} else {
			activator.activate();
		}
	};
	outputPin.removeInform = function (inputPin) {
		informs.remove(inputPin);
		activator.checkDeactivate();
	};
	outputPin.hasNoInforms = function () {
		return informs.isEmpty();
	};
	
	controller.activate = function () {
		outputInterfaceInstance = outputInterface.instantiate();
		
		controller.send = {};
		forEach(outputInterfaceInstance.actions, function (action, actionName) {
			controller.send[actionName] = function () {
				var args = arguments;
				action.apply(null, args);
				informs.forEach(function (inform) {
					inform.send[actionName].apply(null, args);
				});
			};
		});
		
		active = true;
	};
	controller.deactivate = function () {
		// garbage collect
		outputInterfaceInstance = {};
		controller.send = {};

		active = false;
	};
	
	
	outputPin.getState = function () {
		return outputInterfaceInstance.getState();
	};
	
	
	return outputPin;
}



function makeStartCap(outputInterfaces, controller) {
	var startCap = makeIded();
	
	var outputInterfaceInstances = {};
	
	var activator = {
		activate: function () {},
		checkDeactivate: function () {}
	};
	
	startCap.outputPins = {};
	forEach(outputInterfaces, function (outputInterface, pinName) {
		var c = {};
		startCap.outputPins[pinName] = makeOutputPin(outputInterface, c, activator);
		c.activate();
		controller[pinName] = c.send;
	});
	
	return startCap;
}

function makeEndCap(instantiateProcessor, inputs) {
	var endCap = makeGenericBox({}, instantiateProcessor, inputs);
	delete endCap.outputPins;
	return endCap;
}

function makeBox(outputInterfaces, instantiateProcessor, inputs) {
	var box = makeGenericBox(outputInterfaces, instantiateProcessor, inputs);
	delete box.activate;
	delete box.deactivate;
	return box;
}

// used to make boxes and endcaps
function makeGenericBox(outputInterfaces, instantiateProcessor, inputs) {
	var box = makeIded();
	
	var active = false;
	
	var controllers = {};
	var output = {};
	var inputPins = {};
	
	function activate() {
		// activate output pins
		forEach(controllers, function (controller, pinName) {
			controller.activate();
			output[pinName] = controllers[pinName].send;
		});
		
		// instantiate processor
		var processor = instantiateProcessor(output);

		// make input pins
		forEach(inputs, function (parentPin, inputName) {
			var pin = makeInputPin(processor[inputName]);
			parentPin.addInform(pin);
			inputPins[inputName] = pin;
		});
		
		active = true;
	}
	
	function deactivate() {
		// deactivate output pins
		forEach(controllers, function (controller) {
			controller.deactivate();
		});
		
		// deactivate processor
		
		// remove input pins inform
		forEach(inputs, function (parentPin, inputName) {
			parentPin.removeInform(inputPins[inputName]);
		});
		
		active = false;
	}
	
	box.activate = activate;
	box.deactivate = deactivate;
	
	var activator = {
		activate: activate,
		checkDeactivate: function () {
			if (all(box.outputPins, function (outputPin) {
				return outputPin.hasNoInforms();
			})) {
				deactivate();
			}
		}
	};
	
	box.outputPins = {};
	
	forEach(outputInterfaces, function (outputInterface, pinName) {
		controllers[pinName] = {};
		box.outputPins[pinName] = makeOutputPin(outputInterface, controllers[pinName], activator);
	});
	
	return box;
}



function makeComponent(inputInterfaces, outputInterfaces, instantiateProcessor) {
	var component = makeIded();
	
	var applications = makeOhash(stringifyInputs);
	
	component.makeApply = function (inputs) {
		return applications.getOrMake(inputs, function () {
			return makeBox(outputInterfaces, instantiateProcessor, inputs);
		});
	};
	
	return component;
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








// Component Makers

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
function liftSet(f) {
	return makeComponent({input: interfaces.set}, {output: interfaces.set}, function (myOut) {
		myOut = myOut.output;
		var cr = makeCrossReference();
		return {
			input: {
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
			}
		};
	});
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