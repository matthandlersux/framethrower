
// ============================================================================
// Component Definition
// ============================================================================

function makeComponent(inputInterfaces, outputInterfaces, instantiateProcessor) {
	var component = makeIded();
	
	var applications = makeOhash(stringifyInputs);
	
	component.makeApply = function (inputs) {
		return applications.getOrMake(inputs, function () {
			var box = makeBox(outputInterfaces, instantiateProcessor, inputs);
			return box.outputPins;
		});
	};
	
	// ==================== For Debug
	component.getApplications = function () {
		return applications.toArray();
	};
	component.getInputInterfaces = function () {
		return inputInterfaces;
	};
	component.getOutputInterfaces = function () {
		return outputInterfaces;
	};
	
	globalQArray.push(component);
	component.getType = function(){
		return "component";
	};
	return component;
}

// inputs :: {role: Object}
function stringifyInputs(inputs) {
	var strings = [];
	forEach(inputs, function (name, input) {
		strings.push("((" + name + ")(" + stringifyObject(input) + "))");
	});
	strings.sort();
	return strings.join("");
}


// ============================================================================
// Simplified component making/composing
// ============================================================================

function makeSimpleComponent(inputInterface, outputInterface, instantiateProcessor) {
	return makeComponent({input: inputInterface}, {output: outputInterface}, function (myOut, ambient) {
		return {
			input: instantiateProcessor(myOut.output, ambient)
		};
	});
}

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

function simpleApply(component, input) {
	var outputs = component.makeApply({input: input});
	return outputs.output;
}

function simpleCompose() {
	var args = arguments;
	var component = {};
	
	component.makeApply = function (inputs) {
		var pin = inputs.input;
		forEach(args, function (arg) {
			pin = simpleApply(arg, pin);
		});
		return {output: pin};
	};
	component.getInputInterfaces = function () {
		return args[0].getInputInterfaces();
	};
	component.getOutputInterfaces = function () {
		return args[args.length - 1].getOutputInterfaces();
	};
	
	return component;
}


// ============================================================================
// Utility
// ============================================================================

// for keeping track of set correspondences
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


// ============================================================================
// StartCaps
// ============================================================================

var startCaps = {};

startCaps.set = memoize(function () {
	var controller = {};
	var sc = makeSimpleStartCap(interfaces.set, controller);
	forEach(arguments, function (arg) {
		controller.add(arg);
	});
	return sc;
});

var endCaps = {};

endCaps.log = {};

endCaps.log.set = {
	add: function (o) {
		console.log("adding", o);
	},
	remove: function (o) {
		console.log("removing", o);
	}
};


// ============================================================================
// Set Components
// ============================================================================

var components = {};

components.set = {};

// (Ord a, Ord b) => f :: a -> b
components.set.map = function (f) {
	return components.set.liftG(function (x) {
		return [f(x)];
	});
};

// (Ord a, Ord b) => f :: a -> [b]
components.set.liftG = function (f) {
	return makeSimpleComponent(interfaces.set, interfaces.set, function (myOut) {
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
};

components.set.union = makeSimpleComponent(interfaces.set, interfaces.set, function (myOut, ambient) {
	var cr = makeCrossReference();
	var inputs = makeObjectHash();
	return {
		add: function (input) {
			inputs.getOrMake(input, function () {
				var aggregator = makeSimpleEndCap(ambient, {
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
		}
	};
});

// (Ord a, Ord b) => f :: a -> OutputPin(Set(b))
components.set.bind = function (f) {
	return simpleCompose(components.set.map(f), components.set.union);
};

// ============================================================================
// Unit Components
// ============================================================================

components.unit = {};

components.unit.tensor = function () { // arguments
	var inputInterfaces = {};
	forEach(arguments, function (name) {
		inputInterfaces[name] = interfaces.unit;
	});
	console.log(inputInterfaces);
	return makeComponent(inputInterfaces, {output: interfaces.unit}, function (myOut, ambient) {
		var inputs = {};
		var done = {};
		var processor = {};
		forEach(inputInterfaces, function (intf, name) {
			processor[name] = {
				set: function (value) {
					inputs[name] = value;
					done[name] = true;
					checkDone();
				}
			};
		});
		function checkDone() {
			if (all(inputInterfaces, function (intf, name) {
				return done[name];
			})) {
				myOut.output.set(inputs);
			}
		}
		return processor;
	});
};


// ============================================================================
// Convert Components
// ============================================================================

components.convert = {};

components.convert.setToUnit = makeSimpleComponent(interfaces.set, interfaces.unit, function (myOut, ambient) {
	var cache = makeObjectHash();
	return {
		add: function (o) {
			cache.set(o, o);
			myOut.set(cache.toArray());
		},
		remove: function (o) {
			cache.remove(o);
			myOut.set(cache.toArray());
		}
	};
});


/*




xml thunk guys
	query
		takes an xml representation of a query and returns a component that performs it

*/




