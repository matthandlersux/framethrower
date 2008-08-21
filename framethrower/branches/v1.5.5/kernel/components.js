
// ============================================================================
// Component Definition
// ============================================================================

function makeComponent(inputInterfaces, outputInterfaces, apply, name) {
	var component = makeIded();
	
	var applications = makeOhash(stringifyInputs);
	
	component.makeApply = function (inputs) {
		if (DEBUG) {
			forEach(inputs, function (input, inputName) {
				// check that the input is indeed an outputPin
				if (!input.getOutputInterface) {
					console.error("Not an output pin on: " + inputName, input);
					console.trace();
				}
				if (input.getOutputInterface() !== inputInterfaces[inputName]) {
					console.error("Wrong interface on: " + inputName + ". Got: " + input.getOutputInterface().name + ", expected: " + inputInterfaces[inputName].name);
					console.trace();
				}
			});
		}
		return applications.getOrMake(inputs, function () {
			return apply(inputs);
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

function makeGenericComponent(inputInterfaces, outputInterfaces, instantiateProcessor, name) {
	return makeComponent(inputInterfaces, outputInterfaces, function (inputs) {
		var box = makeBox(outputInterfaces, instantiateProcessor, inputs);
		return box.outputPins;
	}, name);
}
function makeSimpleComponent(inputInterface, outputInterface, instantiateProcessor, name) {
	return makeGenericComponent({input: inputInterface}, {output: outputInterface}, function (myOut, ambient) {
		return {
			input: instantiateProcessor(myOut.output, ambient)
		};
	}, name);
}

// inputs :: {role: Object}
function stringifyInputs(inputs) {
	var strings = [];
	forEach(inputs, function (input, name) {
		strings.push("((" + name + ")(" + stringifyObject(input) + "))");
	});
	strings.sort();
	return strings.join("");
}


// ============================================================================
// Simplified component applying/composing
// ============================================================================

function simpleApply(component, input) {
	var outputs = component.makeApply({input: input});
	return outputs.output;
}

function simpleCompose() {
	var args = arguments;
	
	return makeComponent(args[0].getInputInterfaces(), args[args.length - 1].getOutputInterfaces(), function (inputs) {
		var pin = inputs.input;
		forEach(args, function (arg) {
			pin = simpleApply(arg, pin);
		});
		return {output: pin};
	}, "composed component");
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
// Start Caps
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

startCaps.unit = memoize(function (o) {
	var controller = {};
	var sc = makeSimpleStartCap(interfaces.unit, controller);
	controller.set(o);
	return sc;
});


// ============================================================================
// End Caps
// ============================================================================

var endCaps = {};

endCaps.log = {};

endCaps.log.set = function (name) {
	return {
		add: function (o) {
			console.log(name, "=added=", o);
		},
		remove: function (o) {
			console.log(name, "=removed=", o);
		}
	};
};

endCaps.log.unit = function (name) {
	return {
		set: function (o) {
			console.log(name, "=set to=", o);
		}
	};
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
			if (qInner !== undefined) {
				qInner.deactivate();
				inputs.remove(input);
				cr.removeInput(input, myOut.remove);				
			}
		}
	};
});

// (Ord a, Ord b) => f :: a -> OutputPin(Set(b))
components.set.bind = function (f) {
	return simpleCompose(components.set.map(f), components.set.union);
};

// f :: a -> OutputPin(Unit(Boolean))
/*components.set.filter = function (f) {
	
};*/

/*components.set.isEmpty = makeSimpleComponent(interfaces.set, interfaces.unit, function (myOut, ambient) {
	var cache = makeObjectHash();
	return {
		add: function (input) {
			cache.set(input, input);
			check();
		},
		remove: function (input) {
			cache.remove(input);
			check();
		}
	}
});*/

// ============================================================================
// Unit Components
// ============================================================================

components.unit = {};

/*components.unit.mapTo = function (outputInterface, f) {
	return makeSimpleComponent(interfaces.unit, outputInterface, function (myOut, ambient) {
		return {
			set: function (input) {
				
			}
		}
	});
}*/

components.unit.map = function (f) {
	return makeSimpleComponent(interfaces.unit, interfaces.unit, function (myOut, ambient) {
		return {
			set: function (input) {
				myOut.set(f(input));
			}
		};
	});
};

components.unit.not = components.unit.map(function (x) {
	return !x;
});

/*components.unit.tensor = makeSimpleComponent(interfaces.unit, interfaces.unit, function (myOut, ambient) {
	var inputs = {};
	return {
		set: function (o) {
			forEach(o, function (outputPin, name) {
				
			});
		}
	};
});*/

components.unit.tensor = function () { // arguments
	var inputInterfaces = {};
	forEach(arguments, function (name) {
		inputInterfaces[name] = interfaces.unit;
	});
	return makeGenericComponent(inputInterfaces, {output: interfaces.unit}, function (myOut, ambient) {
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
// Collapse Components
// ============================================================================

components.collapse = {};

components.collapse.setSet = components.set.union;

components.collapse.unitUnit = makeSimpleComponent(interfaces.unit, interfaces.unit, function (myOut, ambient) {
	var ec;
	return {
		set: function (embeddedUnit) {
			if (ec) {
				myOut.set(undefined);
				ec.deactivate();
			}
			ec = makeSimpleEndCap(ambient, {
				set: function (o) {
					myOut.set(o);
				}
			}, embeddedUnit);
			ec.activate();
		}
	};
});

components.collapse.unitSet = makeSimpleComponent(interfaces.unit, interfaces.set, function (myOut, ambient) {
	var ec;
	var setCache = makeObjectHash();
	return {
		set: function (embeddedSet) {
			if (ec) {
				setCache.forEach(function (o) {
					myOut.remove(o);
				});
				setCache = makeObjectHash();
				ec.deactivate();
			}
			ec = makeSimpleEndCap(ambient, {
				add: function (o) {
					setCache.set(o, o);
					myOut.add(o);
				},
				remove: function (o) {
					setCache.remove(o);
					myOut.remove(o);
				}
			}, embeddedSet);
			ec.activate();
		}
	};
});

components.collapse.setUnit = makeSimpleComponent(interfaces.set, interfaces.set, function (myOut, ambient) {
	var cr = makeCrossReference();
	var inputs = makeObjectHash();
	return {
		add: function (input) {
			inputs.getOrMake(input, function () {
				var aggregator = makeSimpleEndCap(ambient, {
					set: function (innerInput) {
						cr.removeInput(input, myOut.remove);
						if (innerInput !== undefined) {
							cr.addLink(input, innerInput, myOut.add);
						}
					}
				}, input);
				aggregator.activate();
				return aggregator;
			});
		},
		remove: function (input) {
			var qInner = inputs.get(input);
			if (qInner !== undefined) {
				qInner.deactivate();
				inputs.remove(input);
				cr.removeInput(input, myOut.remove);				
			}
		}
	};
});


// ============================================================================
// Convert Components
// ============================================================================

components.convert = {};

components.convert.setToUnit = makeSimpleComponent(interfaces.set, interfaces.unit, function (myOut, ambient) {
	var cache = makeObjectHash();
	function update() {
		var sorted = cache.toArray().sort(function (a, b) {
			if (stringifyObject(a) > stringifyObject(b)) {
				return 1;
			} else {
				return -1;
			}
		});
		console.log(map(sorted, stringifyObject));
		myOut.set(sorted);
	}
	update();
	return {
		add: function (o) {
			cache.set(o, o);
			update();
		},
		remove: function (o) {
			cache.remove(o);
			update();
		}
	};
});

