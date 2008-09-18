//global array for debugging
var globalQArray = [];


function makeInputPin(sendFun) {
	var inputPin = makeIded("inputPin");
	inputPin.send = sendFun;
	
	// ==================== For Debug
	globalQArray.push(inputPin);

	return inputPin;
}

function makeOutputPin(outputInterface, controller, activator) {
	var outputPin = makeIded(outputInterface);
	
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
		outputInterfaceInstance = null;
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
	outputPin.isActive = function () {
		return active;
	};
	
	// this is now redundant since getType is the outputInterface
	outputPin.getOutputInterface = function () {
		return outputInterface;
	};
	
	globalQArray.push(outputPin);
	
	return outputPin;
}


function makeAmbient() {
	var ambient = {};
	
	var endCaps = [];
	
	ambient.makeEndCap = function (instantiateProcessor, inputs) {
		if (DEBUG) {
			// check that the inputs are indeed outputPins
			// (not as good as checking that they're the correct outputInterface, like components..)
			forEach(inputs, function (input, inputName) {
				if (!input.getOutputInterface) {
					console.error("Not an outputPin on: " + inputName, input);
					console.trace();
				}
			});
		}
		
		
		var endCap = makeGenericBox({}, instantiateProcessor, inputs);
		delete endCap.outputPins;
		
		endCaps.push(endCap);
		
		// NEW: automatically activate endcaps on creation
		endCap.activate();
		
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
	var startCap = makeIded("startCap");
	
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
	
	var box = makeIded("box");
	
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
	
	return box;
}


// ============================================================================
// Simple (one input named "input" or one output named "output") start caps and end caps
// ============================================================================

function makeSimpleStartCap(outputInterface, controller) {
	var controller2 = {};
	var sc = makeStartCap({output: outputInterface}, controller2);
	
	forEach(controller2.output, function (action, name) {
		controller[name] = action;
	});
	
	return sc.outputPins.output;
}

function makeSimpleEndCap(ambient, processor, input) {
	return ambient.makeEndCap(function () {
		return {
			input: processor
		};
	}, {input: input});
}