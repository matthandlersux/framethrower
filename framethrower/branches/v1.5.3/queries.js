


function makeQ(instantiate, parent) {
	var q = makeIded();
	
	var active = false;
	var outputCache;
	var processor;
	
	function activate() {
		// initialize
		outputCache = makeObjectHash();
		processor = instantiate();
		// add inform from parent
		if (parent) {
			parent.addInform(q);
		}
		active = true;
	}
	function deactivate() {
		parent.removeInform(q);
		active = false;
		if (processor.deactivate) {
			processor.deactivate();
		}
		// garbage collect
		outputCache = null;
		processor = null;
	};
	q.activate = activate;
	q.deactivate = deactivate;
	
	
	var informs = makeObjectHash();
	
	q.addInform = function (inform) {
		informs.set(inform, inform);
		if (!active) {
			activate();
		} else {
			// catch it up
			outputCache.forEach(function (o) {
				inform.input.add(o);
			});
		}
	};
	q.removeInform = function (inform) {
		informs.remove(inform);
		if (parent && informs.isEmpty()) {
			deactivate();
		}
	};
	
	q.input = {};
	q.input.add = function (o) {
		processor.add(o, output);
	};
	q.input.remove = function (o) {
		processor.remove(o, output);
	};
	
	var output = {};
	output.add = function (o) {
		informs.forEach(function (inform) {
			inform.input.add(o);
		});
		outputCache.set(o, o);
	};
	output.remove = function (o) {
		informs.forEach(function (inform) {
			inform.input.remove(o);
		});
		outputCache.remove(o);
	};
	
	return q;
}

function makeQStart() {
	var q = makeQ(function () {
		return {
			add: function (o, output) {
				output.add(o);
			},
			remove: function (o, output) {
				output.remove(o);
			}
		};
	});
	q.activate();
	delete q.activate;
	delete q.deactivate;
	return q;
}

function makeQEnd(processor, parent) {
	var q = makeQ(function () {
		return processor;
	}, parent);
	delete q.addInform;
	delete q.removeInform;
	return q;
}



function makeQComponent(instantiate) {
	var component = makeIded();
	
	var applications = makeObjectHash();
	
	component.makeApply = function (input) {
		return applications.getOrMake(input, function () {
			var q = makeQ(instantiate, input);
			delete q.activate;
			delete q.deactivate;
			return q;
		});
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



function qLift(f) {
	return makeQComponent(function () {
		var cr = makeCrossReference();
		return {
			add: function (input, myOut) {
				if (!cr.hasInput(input)) {
					var outputList = f(input);
					forEach(outputList, function (output) {
						cr.addLink(input, output, myOut.add);
					});
				}
			},
			remove: function (input, myOut) {
				cr.removeInput(input, myOut.remove);
			}
		};
	});
}


var qUnion = makeQComponent(function () {
	var cr = makeCrossReference();
	var inputs = makeObjectHash();
	return {
		add: function (input, myOut) {
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
		remove: function (input, myOut) {
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



/*

function makeQSoul(removeFromParent) {
	var soul = {};
	
	var bodies = makeObjectHash();
	
	soul.addBody = function (body) {
		bodies.set(body, body);
	};
	soul.removeBody = function (body) {
		bodies.remove(body);
		if (bodies.isEmpty() && removeFromParent) {
			removeFromParent();
		}
	};
	
	var components = makeObjectHash();
	
	var output = makeObjectHash();
	
	soul.qAdd = function (o) {
		output.set(o, o);
		components.forEach(function (c) {
			c.instance.qAdd(o, c.soul);
		});
	};
	
	soul.qRemove = function (o) {
		output.remove(o);
		components.forEach(function (c) {
			c.instance.qRemove(o, c.soul);
		});
	};
	
	soul.spawn = function (component) {
		components.getOrMake(component, function () {
			var instance = component.instantiate();
			var spawnedSoul = makeQSoul(function () {
				components.remove(component);
			});
			
			forEach(output, function (o) {
				instance.qAdd(o, spawnedSoul);
			});
			
			return {
				instance: instance,
				soul: spawnedSoul
			};
		});
	};
}


function makeQ(soul) {
	
}











function makeQ(qOut, removeParentConnection) {
	var q = makeIded();
	
	
	
	
	var children = makeObjectHash();
	var injectors = makeObjectHash();
	
	var output = makeObjectHash();
	
	
	qOut.qAdd = function (o) {
		output.set(o, o);
		injectors.forEach(function (injector) {
			injector.qAdd(o);
		});
	};
	qOut.qRemove = function (o) {
		output.remove(o);
		injectors.forEach(function (injector) {
			injector.qRemove(o);
		});
	};
	
	function removeChild(component) {
		children.remove(component);
		injectors.remove(component);
		if (children.isEmpty()) {
			q.remove();
		}
	}
	
	q.spawn = function (component) {
		return children.getOrMake(component, function () {
			var instance = component.instantiate();
			
			var spawnedOut = {};
			var spawned = makeQ(spawnedOut, function () {
				removeChild(component);
			});
			
			var qIn = {
				qAdd: function (o) {
					instance.qAdd(o, spawnedOut);
				},
				qRemove: function (o) {
					instance.qRemove(o, spawnedOut);
				}
			};
			
			injectors.set(component, qIn);
			
			// get it caught up
			output.forEach(function (o) {
				qIn.qAdd(o);
			});
			
			return spawned;
		});
	};
	
	
	q.remove = function () {
		// remove children
		//children.forEach(function (childIn, child) {
		//	child.remove();
		//});
		
		// remove parent connection
		if (removeParentConnection) {
			removeParentConnection();
		}
	};
	
	q.getOutput = function () {
		return output.toArray();
	};
	
	return q;
}




function makeComponent(instantiate) {
	var com = makeIded();
	com.instantiate = instantiate;
	return com;
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



function qLift(f) {
	return makeComponent(function () {
		var cr = makeCrossReference();
		return {
			qAdd: function (input, myOut) {
				if (!cr.hasInput(input)) {
					var outputList = f(input);
					forEach(outputList, function (output) {
						cr.addLink(input, output, myOut.qAdd);
					});
				}
			},
			qRemove: function (input, myOut) {
				cr.removeInput(input, myOut.qRemove);
			}
		};
	});
}


var qUnion = makeComponent(function () {
	var cr = makeCrossReference();
	var inputs = makeObjectHash();
	return {
		qAdd: function (input, myOut) {
			inputs.getOrMake(input, function () {
				var aggregator = makeComponent(function () {
					return {
						qAdd: function (innerInput) {
							cr.addLink(input, innerInput, myOut.qAdd);
						},
						qRemove: function (innerInput) {
							cr.removeLink(input, innerInput, myOut.qRemove);
						}
					};
				});
				return input.spawn(aggregator);
			});
		},
		qRemove: function (input, myOut) {
			var qInner = inputs.get(input);
			qInner.remove();
			inputs.remove(input);
			cr.removeInput(input, myOut.qRemove);
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