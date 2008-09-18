

var typeZero = memoize(function (type) {
	return makeSimpleStartCap(type, {});
});


var applyGet = memoize(function (input, what) {
	var t = input.getType();
	
	var intf = t.getConstructor();
	var intfargs = t.getArguments();
	
	
	var inType = intfargs[0];
	if (!inType.getProp) {
		console.warn("inType doesn't have a prop", inType.getName(), input);
	}
	var outType = inType.getProp(what);

	function getf(x) {
		if (x && x.get[what]) {
			return x.get[what].apply(null, []);
		} else {
			return typeZero(outType);
		}
	}
	
	var com = components.lift(intf, basic.fun(inType, outType), getf);
	var intermediate = simpleApply(com, input);
	
	if (outType.getConstructor) {
		var colcom = components.collapse(intf, outType.getConstructor(), outType.getArguments());
		return simpleApply(colcom, intermediate);
	} else {
		return intermediate;
	}
});


function getFromContext(context, s) {
	var firstLetter = s.charAt(0);
	if (firstLetter === '"' || firstLetter === "'") {
		return startCaps.unit(s.substring(1, s.length - 1));
	} else {
		return context[s];
	}
}

// context is an object whose keys are param names and values are output pins
// focus is an optional variable
// derive puts together a chain of components and returns an output pin for the derived variable
function derive(xml, context, focus) {
	var next;
	var name = xml.localName;
	
	//if (name) console.log("hooking up", name, xml, focus);
	
	function startFrom(xml) {
		var from = xml.getAttributeNS("", "from");
		if (from) {
			return context[from];
		}
		
		var predef = xml.getAttributeNS("", "predef");
		if (predef) {
			return startCaps.unit(PREDEF[predef]);
		}
	}
	
	if (!name) {
		
	} else if (name === "derived") {
		focus = startFrom(xml);
		next = xml.firstChild;
	} else if (name === "start") {
		focus = startFrom(xml);
	} else if (focus) {
		if (name === "get") {
			focus = applyGet(focus, xml.getAttributeNS("", "what"));
		} else if (name === "filter") {
			var com = components.filterC(focus.getType().getConstructor(), focus.getType().getArguments()[0], function (o) {
				//console.log("deriving predicate", o.getId());
				var res = derive(xml.firstChild, context, startCaps.unit(o));
				//console.log("done deriving pred", o.getId());
				return res;
			});
			focus = simpleApply(com, focus);
		} else if (name === "equals") {
			var input2 = derive(xml.firstChild, context);
			var type = getSuperTypeFromTypes(focus.getType().getArguments()[0], input2.getType().getArguments()[0]);
			var com = components.equals(type);
			//console.log("deciding equals", focus.getType().getName(), input2.getType().getName(), type.getName());
			var out = com.makeApply({input1: focus, input2: input2});
			focus = out.output;
		} else if (name === "filtertype") {
			var com = components.set.filterType(focus.getType().getArguments()[0], typeNames[xml.getAttributeNS("", "type")]);
			focus = simpleApply(com, focus);
		} else if (name === "gettype") {
			var com = components.lift(focus.getType().getConstructor(), basic.fun(focus.getType().getArguments()[0], basic.string), function (o) {
				return o.getType().getName();
			});
			focus = simpleApply(com, focus);
		} else if (name === "getkey") {
			var com = components.assoc.getKey(focus.getType().getArguments()[0], focus.getType().getArguments()[1]);
			var key = getFromContext(context, xml.getAttributeNS("", "key"));
			focus = com.makeApply({input: focus, key: key}).output;
		} else if (name === "trace") {
			var t = focus.getType();
			var what = xml.getAttributeNS("", "what");
			var outType = t.getArguments()[0].getProp(what).getArguments()[0];
			focus = deriveTrace(focus, function (o) {
				return o.get[what]();
			}, outType);
		} else if (name === "foreach") {
			var type = typeNames[xml.getAttributeNS("", "type")];
			focus = deriveForEach(focus, function (o) {
				return derive(xml.firstChild, context, startCaps.unit(o));
			}, type);
		} else if (name === "treeify") {
			var t = focus.getType();
			var property = xml.getAttributeNS("", "property");
			focus = deriveTreeify(focus, property);
		} else {
			console.error("Unknown xml element in derive: " + name);
		}
	}

	// missing: equals
	
	
	if (!next) next = xml.nextSibling;
	
	if (next) {
		return derive(next, context, focus);
	} else if (focus) {
		//console.log("derive done", focus.getOutputInterface().getName());
		return focus;
	} else {
		return typeZero(interfaces.unit(basic.js));
	}
}

// f: a -> unit(a)
// example: parentSituation
// TODO: make this use the trace component
function deriveTrace(focus, f, outType) {
	return box = makeSimpleBox(interfaces.list(outType), function (myOut, ambient) {
		var endCaps = [];
		function makeEndCaps(i, o) {
			if (endCaps[i]) {
				endCaps[i].deacivate();
			}
			endCaps[i] = makeSimpleEndCap(ambient, {
				set: function (o) {
					if (o === undefined) {
						removeEndCaps(i+1);
					} else {
						myOut.update(o, i);
						makeEndCaps(i+1, o);
					}
				}
			}, f(o));
		}
		function removeEndCaps(i) {
			if (endCaps[i]) {
				endCaps[i].deactivate();
				endCaps[i] = false;
				myOut.remove(i);
				removeEndCaps(i+1);
			}
		}
		return {
			set: function (o) {
				makeEndCaps(0, o);
			}
		};
	}, focus);
}

function deriveForEach(focus, f, outType) {
	return box = makeSimpleBox(interfaces.set(outType), function (myOut, ambient) {
		var cr = makeCrossReference();
		var inputs = makeObjectHash();
		return {
			add: function (input) {
				inputs.getOrMake(input, function () {
					var fOut = f(input);
					return makeSimpleEndCap(ambient, {
						set: function (o) {
							if (o) {
								cr.addLink(input, o, myOut.add);
							}
						}
					}, fOut);
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
	}, focus);
}




var deriveTreeify = memoize(function (input, goUpProperty) {
	// input must be interfaces.set()
	var t = input.getType();
	
	var intf = t.getConstructor();
	var intfargs = t.getArguments();
	
	
	var inType = intfargs[0];
	if (!inType.getProp) {
		console.warn("inType doesn't have a prop", inType.getName(), input);
	}
	var outType = inType.getProp(goUpProperty);
	
	var treecom = components.treeify(basic.fun(interfaces.set(inType), interfaces.tree(inType)), goUpProperty);
	return simpleApply(treecom, input);
});
