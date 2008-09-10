
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
				if (!inputInterfaces[inputName].match(input.getOutputInterface())) {
					console.error("Wrong interface on: " + inputName + ". Got: " + input.getOutputInterface().getName() + ", expected: " + inputInterfaces[inputName].getName());
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
// Start Caps
// ============================================================================

var startCaps = {};

// perhaps startCaps.set and startCaps.assoc should not be memoized, so that they can be garbage collected

startCaps.set = memoize(function (set) {
	var controller = {};
	var type = getSuperType(set);
	var sc = makeSimpleStartCap(interfaces.set(type), controller);
	forEach(set, function (arg) {
		controller.add(arg);
	});
	return sc;
});

startCaps.assoc = memoize(function (pairs) {
	var controller = {};
	var keyType = getSuperType(map(pairs, function (pair) {return pair.key;}));
	var valueType = getSuperType(map(pairs, function (pair) {return pair.value;}));
	var sc = makeSimpleStartCap(interfaces.assoc(keyType, valueType), controller);
	forEach(pairs, function (pair) {
		controller.set(pair.key, pair.value);
	});
	return sc;
});

startCaps.unit = memoize(function (o) {
	var controller = {};
	var sc;
	sc = makeSimpleStartCap(interfaces.unit(getType(o)), controller);
	
	controller.set(o);
	return sc;
});


// ============================================================================
// End Caps
// ============================================================================

var endCaps = {};

function maybeGetContent(o) {
	if (o && o.get && o.get.content) {
		return o.get.content().getState();
	} else {
		return false;
	}
}

endCaps.log = {};

endCaps.log.set = function (name) {
	return {
		add: function (o) {
			console.log(name, "=added=", o, maybeGetContent(o));
		},
		remove: function (o) {
			console.log(name, "=removed=", o, maybeGetContent(o));
		}
	};
};

endCaps.log.unit = function (name) {
	return {
		set: function (o) {
			console.log(name, "=set to=", o, maybeGetContent(o));
		}
	};
};

endCaps.log.list = function (name) {
	return {
		update: function (o, i) {
			console.log(name, "=updated=", o, i, maybeGetContent(o));
		},
		insert: function (o, i) {
			console.log(name, "=inserted=", o, i, maybeGetContent(o));
		},
		remove: function (i) {
			console.log(name, "=removed=", i);
		}
	};
};


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
// 
// ============================================================================

var components = {};

components.lift = function (liftInterface, fType, f) {
	var inputType = fType.getArguments()[0];
	var outputType = fType.getResult();
	
	var instProc;
	if (liftInterface === interfaces.unit) {
		instProc = function (myOut) {
			return {
				set: function (input) {
					myOut.set(f(input));
				}
			};
		};
	} else if (liftInterface === interfaces.set) {
		instProc = function (myOut) {
			var cr = makeCrossReference();
			return {
				add: function (input) {
					if (!cr.hasInput(input)) {
						var output = f(input);
						cr.addLink(input, output, myOut.add);
					}
				},
				remove: function (input) {
					cr.removeInput(input, myOut.remove);
				}
			};
		};
	}
	
	return makeSimpleComponent(liftInterface(inputType), liftInterface(outputType), instProc);
};

components.filter = function (liftInterface, inputType, pred, outputType) {
	if (outputType === undefined) {
		outputType = inputType;
	}
	
	var instProc;
	if (liftInterface === interfaces.set) {
		instProc = function (myOut) {
			var cr = makeCrossReference();
			return {
				add: function (input) {
					if (!cr.hasInput(input)) {
						if (pred(input)) {
							cr.addLink(input, input, myOut.add);
						}
					}
				},
				remove: function (input) {
					cr.removeInput(input, myOut.remove);
				}
			};
		};
	}
	
	return makeSimpleComponent(liftInterface(inputType), liftInterface(outputType), instProc);
};


components.filterC = function (liftInterface, inputType, predC, outputType) {
	if (outputType === undefined) {
		outputType = inputType;
	}
	
	var instProc;
	if (liftInterface === interfaces.set) {
		instProc = function (myOut, ambient) {
			var cr = makeCrossReference();
			var inputs = makeObjectHash();
			return {
				add: function (input) {
					inputs.getOrMake(input, function () {
						//var predOut = simpleApply(predC, startCaps.unit(input));
						var predOut = predC(input);
						var passthru = makeSimpleEndCap(ambient, {
							set: function (innerInput) {
								if (innerInput) {
									cr.addLink(input, input, myOut.add);
								} else {
									cr.removeLink(input, input, myOut.remove);
								}
							}
						}, predOut);
						passthru.activate();
						return passthru;
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
		};
	}
	
	return makeSimpleComponent(liftInterface(inputType), liftInterface(outputType), instProc);
};

components.equals = memoize(function (type) {
	return makeGenericComponent({input1: interfaces.unit(type), input2: interfaces.unit(type)}, {output: interfaces.unit(basic.bool)}, function (myOut, ambient) {
		var input1, input2;
		function update() {
			if (input1 !== undefined && input2 !== undefined) {
				myOut.output.set(input1 === input2);
			}
		}
		return {
			input1: {
				set: function (o) {
					input1 = o;
					update();
				}
			},
			input2: {
				set: function (o) {
					input2 = o;
					update();
				}
			}
		};
	});
});


components.collapse = memoize(function (intf1, intf2, typeArgs) {
	if (intf1 === interfaces.unit && intf2 === interfaces.unit) {
		return makeSimpleComponent(intf1(intf2.apply(null, typeArgs)), interfaces.unit.apply(null, typeArgs), function (myOut, ambient) {
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
	} else if (intf1 === interfaces.unit && intf2 === interfaces.set) {
		return makeSimpleComponent(intf1(intf2.apply(null, typeArgs)), interfaces.set.apply(null, typeArgs), function (myOut, ambient) {
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
	} else if (intf1 === interfaces.unit && intf2 === interfaces.assoc) {
		return makeSimpleComponent(intf1(intf2.apply(null, typeArgs)), interfaces.assoc.apply(null, typeArgs), function (myOut, ambient) {
			var ec;
			var assocCache = makeObjectHash();
			return {
				set: function (embeddedAssoc) {
					if (ec) {
						assocCache.forEach(function (v, k) {
							myOut.remove(k);
						});
						assocCache = makeObjectHash();
						ec.deactivate();
					}
					ec = makeSimpleEndCap(ambient, {
						set: function (k, v) {
							assocCache.set(k, v);
							myOut.set(k, v);
						},
						remove: function (k) {
							assocCache.remove(k);
							myOut.remove(k);
						}
					}, embeddedAssoc);
				}
			};
		});
	} else if (intf1 === interfaces.set && intf2 === interfaces.unit) {
		return makeSimpleComponent(intf1(intf2.apply(null, typeArgs)), interfaces.set.apply(null, typeArgs), function (myOut, ambient) {
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
	} else if (intf1 === interfaces.set && intf2 === interfaces.set) {
		return makeSimpleComponent(intf1(intf2.apply(null, typeArgs)), interfaces.set.apply(null, typeArgs), function (myOut, ambient) {
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
	}
});


components.set = {};

components.set.filterType = memoize(function (inputType, filterType) {
	return components.filter(interfaces.set, inputType, function (o) {
		return filterType.match(o.getType());
	}, filterType);
});


components.assoc = {};

components.assoc.getKey = memoize(function (keyType, valueType) {
	return makeGenericComponent({
			input: interfaces.assoc(keyType, valueType),
			key: interfaces.unit(keyType)
		}, {output: interfaces.unit(valueType)},
		function (myOut, ambient) {
			var key;
			var input = makeObjectHash();
			var cache;
			function update() {
				if (key) {
					var out = input.get(key);
					if (cache !== out) {
						cache = out;
						myOut.output.set(out);
					}
				}
			}
			myOut.output.set(undefined);
			return {
				input: {
					set: function (k, v) {
						input.set(k, v);
						update();
					},
					remove: function (k) {
						input.remove(k);
						update();
					}
				},
				key: {
					set: function (o) {
						key = o;
						update();
					}
				}
			};
		});
});