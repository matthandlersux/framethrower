

var typeZero = memoize(function (type) {
	return makeSimpleStartCap(type, {});
});


var applyGet = memoize(function (input, what) {
	var t = input.getType();
	
	var intf = t.getConstructor();
	var intfargs = t.getArguments();
	
	
	var inType = intfargs[0];
	if (!inType.getProp) {
		console.warn("inType doesn't have a prop", inType.getName(), input.getId(), input.getState(), what);
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

		var ret = startCaps.unit(convertFromXML(getTrimmedFirstChild(xml), {}, {}));
		return ret;
		
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
			var newcontext = merge(context);
			var ascontext = xml.getAttributeNS("", "ascontext");
			var com = components.filterC(focus.getType().getConstructor(), focus.getType().getArguments()[0], function (o) {
				var start = startCaps.unit(o);
				if (ascontext) {
					newcontext[ascontext] = start;
				}
				//console.log("deriving predicate", o.getId());
				var res = derive(xml.firstChild, newcontext, start);
				//console.log("done deriving pred", o.getId());
				if (res.getType().getConstructor() === interfaces.set) {
					//console.log("filtering from a set, derive non empty");
					res = deriveNonEmpty(res);
					//console.log(res.getType().getName());
				}
				return res;
			});
			focus = simpleApply(com, focus);
		} else if (name === "groupby") {
			var newcontext = merge(context);
			var ascontext = xml.getAttributeNS("", "ascontext");
			focus = deriveGroupBy(focus, function (o) {
				var start = startCaps.unit(o);
				if (ascontext) {
					newcontext[ascontext] = start;
				}
				var res = derive(xml.firstChild, newcontext, start);
				return res;
			}, typeNames[xml.getAttributeNS("", "type")]);
		} else if (name === "buildassoc") {
			var t = focus.getType();
			var what = xml.getAttributeNS("", "what");
			var outType = t.getArguments()[0].getProp(what);
			focus = deriveBuildAssoc(focus, function (o) {
				return o.get[what]();
			}, outType);
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
		} else if (name === "sort") {
			focus = deriveSort(focus);
		} else if (name === "takeone") {
			focus = deriveTakeOne(focus);
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

// takes in a set {set(a)} and returns one element of the set {unit(a)}
function deriveTakeOne(focus) {
	var type = focus.getType().getArguments()[0];
	return makeSimpleBox(interfaces.unit(type), function (myOut, ambient) {
		var cache = makeObjectHash();
		function update() {
			function sortfunc(a, b) {
				return (stringifyObject(a) > stringifyObject(b)) ? 1 : -1;
			}
			
			var sorted = cache.toArray().sort(sortfunc);
			if (sorted.length > 0) {
				myOut.set(sorted[0]);
			} else {
				myOut.set(undefined);
			}
		}
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
	}, focus);
}

// takes in a set(a), a function a->unit(outType), and returns an assoc(outType, set(a))
function deriveGroupBy(focus, f, outType) {
	var setType = focus.getType();
	return makeSimpleBox(interfaces.assoc(outType, setType), function (myOut, ambient) {
		var inputs = makeObjectHash();
		var assoc = makeObjectHash();
		function addToAssoc(key, value) {
			var set = assoc.getOrMake(key, function () {
				var controller = {};
				var pin = makeSimpleStartCap(setType, controller);
				myOut.set(key, pin);
				return {control: controller, get: pin};
			});
			set.control.add(value);
		}
		function removeFromAssoc(key, value) {
			var set = assoc.get(key);
			if (set) {
				set.control.remove(value);
				if (set.get.getState().length === 0) {
					assoc.remove(key);
					myOut.remove(key);
				}
			}
		}
		return {
			add: function (o) {
				inputs.getOrMake(o, function () {
					var ret = {ec: undefined, fed: undefined};
					ret.ec = makeSimpleEndCap(ambient, {
						set: function (fed) {
							if (ret.fed) {
								removeFromAssoc(ret.fed, o);
							}
							ret.fed = fed;
							if (ret.fed !== undefined) {
								addToAssoc(ret.fed, o);								
							}
						}
					}, f(o));
					return ret;
				});
			},
			remove: function (o) {
				var input = inputs.get(o);
				if (input) {
					removeFromAssoc(input.fed, o);
					input.ec.deactivate();
					inputs.remove(o);
				}
			}
		};
	}, focus);
}

function deriveNonEmpty(focus) {
	return makeSimpleBox(interfaces.unit(basic.js), function (myOut, ambient) {
		var cache = makeObjectHash();
		var res = false;
		function update() {
			var newres = !cache.isEmpty();
			if (res !== newres) {
				res = newres;
				myOut.set(res);
			}
		}
		myOut.set(res);
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
	}, focus);
}

// set(a), (a->b) -> assoc(a, b)
// list(a), (a->b) -> assoc(a, b)
function deriveBuildAssoc(focus, f, outType) {
	var type = focus.getType().getConstructor();
	if (type === interfaces.set) {
		return makeSimpleBox(interfaces.assoc(focus.getType().getArguments()[0], outType), function (myOut, ambient) {
			return {
				add: function (o) {
					myOut.set(o, f(o));
				},
				remove: function (o) {
					myOut.remove(o);
				}
			};
		}, focus);
	} else if (type === interfaces.list) {
		return makeSimpleBox(interfaces.assoc(focus.getType().getArguments()[0], outType), function (myOut, ambient) {
			var cache = [];
			return {
				insert: function (o, index) {
					cache.splice(index, 0, o);
					myOut.set(o, f(o));
				},
				update: function (o, index) {
					if(cache[index]){
						myOut.remove(cache[index]);
					}
					cache[index] = o;
					myOut.set(o, f(o));
				},
				append: function (o) {
					cache.push(o);
					myOut.set(o, f(o));
				},
				remove: function (index) {
					if(cache[index]){
						myOut.remove(cache[index]);
					}
					cache.splice(index, 1);
				}
			};
		}, focus);
	}
}

// sorts a set to a list
function deriveSort(focus) {
	return makeSimpleBox(interfaces.list(focus.getType().getArguments()[0]), function (myOut, ambient) {
		var cache = [];
		return {
			add: function (o) {
				var stringified = stringifyObject(o);
				for (var i = 0; i < cache.length; i++) {
					if (stringified === cache[i]) {
						return;
					} else if (stringified < cache[i]) {
						cache.splice(i, 0, stringified);
						myOut.insert(o, i);
						return;
					}
				}
				cache[i] = stringified;
				myOut.update(o, i);
			},
			remove: function (o) {
				var stringified = stringifyObject(o);
				for (var i = 0; i< cache.length; i++) {
					if (stringified === cache[i]) {
						cache.splice(i, 1);
						myOut.remove(i);
						return;
					}
				}
			}
		};
	}, focus);
}

function deriveLimit(focus) {
	return makeSimpleBox(focus.getType(), function (myOut, ambient) {
		var cache = [];
		var start = 0;
		var limit = 4;
		return {
			insert: function (o, index) {
				cache.splice(index, 0, o);
				if (index >= start && index < start + limit) {
					myOut.insert(o, index - start);
				}
			},
			append: function (o) {
				cache.push(o);
				var index = cache.length;
				if (index >= start && index < start + limit) {
					myOut.append(o);
				}
			},
			update: function (o, index) {
				cache[index] = o;
				if (index >= start && index < start + limit) {
					myOut.update(o, index - start);
				}
			},
			remove: function (index) {
				cache.splice(index, 1);
				if (index >= start && index < start + limit) {
					myOut.remove(index);
					var last = start + limit - 1;
					if (cache[last]) {
						myOut.update(cache[last], last);
					}
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
		//console.warn("inType doesn't have a prop", inType.getName(), input);
		inType = basic.bool;
	}
	
	var treecom = components.treeify(basic.fun(interfaces.set(inType), interfaces.tree(inType)), goUpProperty);
	return simpleApply(treecom, input);
});
