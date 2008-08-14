var interfaces = {
	unit: {
		name: "unit",
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
					if (cache !== undefined) {
						pin.set(cache);
					}
				},
				getState: function () {
					return cache;
				}
			};
		}
	},
	set: {
		name: "set",
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
		name: "list",
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

//global array for debugging
var globalQArray = [];


function makeInputPin(sendFun) {
	var inputPin = makeIded();
	inputPin.send = sendFun;

	globalQArray.push(inputPin);
	inputPin.getType = function(){
		return "inputPin";
	};

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
	
	// ==================== For Debug
	outputPin.getState = function () {
		if (!active) {
			return undefined;
		}
		return outputInterfaceInstance.getState();
	};
	outputPin.getInforms = function () {
		return informs.toArray();
	};
	outputPin.getOutputInterface = function () {
		return outputInterface;
	};
	
	globalQArray.push(outputPin);
	outputPin.getType = function(){
		return "outputPin";
	};
	return outputPin;
}


function makeAmbient() {
	var ambient = {};
	
	var endCaps = [];
	
	ambient.makeEndCap = function (instantiateProcessor, inputs) {
		var endCap = makeGenericBox({}, instantiateProcessor, inputs);
		delete endCap.outputPins;
		
		endCaps.push(endCap);
		
		// ==================== For Debug
		globalQArray.push(endCap);	
		endCap.getType = function () {
			return "endCap";
		};
		
		return endCap;
	};
	
	ambient.deactivate = function () {
		forEach(endCaps, function (endCap) {
			endCap.deactivate();
		});
	};
	
	ambient.getEndCaps = function () {
		return endCaps;
	};
	
	return ambient;
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
	
	globalQArray.push(startCap);	
	startCap.getType = function () {
		return "startCap";
	};
	return startCap;
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
	var ambient;
	
	function activate() {
		if (!active) {
			// activate output pins
			forEach(controllers, function (controller, pinName) {
				controller.activate();
				output[pinName] = controllers[pinName].send;
			});

			// instantiate processor
			ambient = makeAmbient();
			var processor = instantiateProcessor(output, ambient);

			// make input pins
			forEach(inputs, function (parentPin, inputName) {
				var pin = makeInputPin(processor[inputName]);
				parentPin.addInform(pin);
				inputPins[inputName] = pin;
			});

			active = true;
		}
	}
	
	function deactivate() {
		if (active) {
			// deactivate output pins
			forEach(controllers, function (controller) {
				controller.deactivate();
			});

			// deactivate ambient
			ambient.deactivate();

			// remove input pins inform
			forEach(inputs, function (parentPin, inputName) {
				parentPin.removeInform(inputPins[inputName]);
			});

			active = false;
		}
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
	
	// ==================== For Debug
	box.getInputPins = function () {
		return inputPins;
	};
	box.getInputs = function () {
		return inputs;
	};
	box.getActive = function () {
		return active;
	};
	
	globalQArray.push(box);	
	box.getType = function(){
		return "box";
	};
	return box;
}
