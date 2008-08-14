/*

Query
	content : Object -> Unit XML
	involves: Object -> Set Object
	childObjects: Situation -> Set Object
	arc(role): Infon -> Unit Object
	
	<f:param name="focus" />
	<f:derived name="focusContent">
		<select what="content" from="focus" />
	</f:derived>


filter(component :: Unit a -> Unit Boolean)

equals(Unit)

*/


// Object -> Unit Object
function start(from) {
	return startCaps.unit(from);
}

// (Unit a => Unit Boolean) -> (Set a => Set a)
/*function filter(c) {
	return components.set.bind(function (o) {
		return simpleCompose(start(o), c);
	});
}*/

var passthru = memoize(function (o) {
	return makeSimpleComponent(interfaces.unit, interfaces.set, function (myOut) {
		return {
			set: function (b) {
				if (b) {
					myOut.add(o);
				} else {
					myOut.remove(o);
				}
			}
		};
	});
});


var equal = makeGenericComponent({in1: interfaces.unit, in2: interfaces.unit}, {output: interfaces.unit}, function (myOut, ambient) {
	var in1, in2;
	function check() {
		if (in1 !== undefined && in2 !== undefined && in1 === in2) {
			myOut.output.set(true);
		} else {
			myOut.output.set(false);
		}
	}
	return {
		in1: {
			set: function (o) {
				in1 = o;
				check();
			}
		},
		in2: {
			set: function (o) {
				in2 = o;
				check();
			}
		}
	};
});


// context is an object whose keys are param names and values are output pins
// focus is an optional variable
// derive puts together a chain of components and returns an output pin for the derived variable
function derive(xml, context, focus) {
	var next;
	var name = xml.localName;
	
	//console.log("hooking up", name);
	
	if (name === "derived") {
		focus = context[xml.getAttributeNS("", "from")];
		next = xml.firstChild;
	} else if (name === "start") {
		focus = context[xml.getAttributeNS("", "from")];
	} else if (name === "js") {
		focus = jsvalue(xml.getAttributeNS("", "value"));
	} else if (name === "get") {
		var com = queryComponent(xml.getAttributeNS("", "what"), xml.getAttributeNS("", "role"));
		focus = simpleApply(com, focus);
	} else if (name === "filter") {
		var com = components.set.bind(function (o) {
			var out = derive(xml.firstChild, context, startCaps.unit(o));
			return simpleApply(passthru(o), out);
		});
		focus = simpleApply(com, focus);
	} else if (name === "equal") {
		focus = equal.makeApply({in1: focus, in2: derive(xml.firstChild, context)}).output;
	} else if (name === "not") {
		focus = simpleApply(components.unit.not, focus);
	}
	
	if (!next) next = xml.nextSibling;
	
	if (next) {
		return derive(next, context, focus);
	} else {
		return focus;
	}
}

var jsvalue = memoize(function (val) {
	return startCaps.unit(eval(val));
});



function appendCopy(parent, child) {
	var c = child.cloneNode(true);
	parent.ownerDocument.adoptNode(c);
	parent.appendChild(c);
	return c;
}


var blankXML = createDocument();
blankXML.appendChild(blankXML.createElementNS("", "nothing"));
blankXML = blankXML.firstChild;



function extractXSLFromCustomXML(xml) {
	var xslDoc = createDocument();
	var ss = xslDoc.createElementNS(xmlns["xsl"], "stylesheet");
	ss.setAttributeNS("", "version", "1.0");

	var paramNodes = xpath("f:param | f:derived", xml);
	forEach(paramNodes, function (n) {
		var p = xslDoc.createElementNS(xmlns["xsl"], "param");
		p.setAttributeNS("", "name", n.getAttributeNS("", "name"));
		ss.appendChild(p);
	});

	var xslNodes = xpath("xsl:*", xml);
	forEach(xslNodes, function (n) {
		var c = appendCopy(ss, n);

		if (!n.hasAttribute("name") && !n.hasAttribute("match")) {
			c.setAttributeNS("", "match", "*");
		}
	});

	return ss;
}


function applyCustom(xml, context) {
	var derivedNodes = xpath("f:derived", xml);
	
	forEach(derivedNodes, function (n) {
		var name = n.getAttributeNS("", "name");
		context[name] = derive(n, context);
	});
	
	var compiled = compileXSL(extractXSLFromCustomXML(xml));
	
	var combinedContext = combineContext(context);

	var com = components.unit.map(function (params) {
		var res = compiled(blankXML, params);
		return res;
	});
	
	var transformed = simpleApply(com, combinedContext.output);
	
	var tensoredCom = components.unit.tensor("xml", "ids");
	var tensored = tensoredCom.makeApply({xml: transformed, ids: combinedContext.ids});
	
	return tensored.output;
}

function makeCustomCom(xml) {
	var paramNodes = xpath("f:param", xml);
	var inputInterfaces = {};
	forEach(paramNodes, function (n) {
		var name = n.getAttributeNS("", "name");
		inputInterfaces[name] = interfaces.unit;
	});
	
	var derivedNodes = xpath("f:derived", xml);
	
	var compiled = compileXSL(extractXSLFromCustomXML(xml));
	
	return makeComponent(inputInterfaces, {output: interfaces.unit},
		function (inputs) {
			var context = merge(inputs);
			
			forEach(derivedNodes, function (n) {
				var name = n.getAttributeNS("", "name");
				context[name] = derive(n, context);
			});

			var combinedContext = combineContext(context);

			var com = components.unit.map(function (params) {
				var res = compiled(blankXML, params);
				return res;
			});

			var transformed = simpleApply(com, combinedContext.output);

			var tensoredCom = components.unit.tensor("xml", "ids");
			var tensored = tensoredCom.makeApply({xml: transformed, ids: combinedContext.ids});

			return {output: tensored.output};
		},
		"custom component");
}





function combineContext(context) {
	var inputInterfaces = {};
	var pins = {};
	forEach(context, function (pin, name) {
		inputInterfaces[name] = interfaces.unit;
		var outInt = pin.getOutputInterface();
		if (outInt === interfaces.unit) {
			pins[name] = pin;
		} else if (outInt === interfaces.set) {
			pins[name] = simpleApply(components.convert.setToUnit, pin);
		}
	});
	
	var com = makeGenericComponent(inputInterfaces, {output: interfaces.unit, ids: interfaces.unit}, function (myOut, ambient) {
		var inputs = {};
		var done = {};
		var processor = {};
		var ids = {};
		
		forEach(inputInterfaces, function (intf, name) {
			var outInt = context[name].getOutputInterface();
			processor[name] = {
				set: function (value) {
					if (outInt === interfaces.unit) {
						if (value.getId) {
							var id = value.getId();
							inputs[name] = id;
							ids[id] = value;
						} else {
							inputs[name] = value;
						}
					} else if (outInt === interfaces.set) {
						inputs[name] = [];
						forEach(value, function (val, key) {
							if (val.getId) {
								var id = val.getId();
								inputs[name][key] = document.createTextNode(id);
								ids[id] = val;
							} else {
								inputs[name][key] = val;
							}
						});
						if (inputs[name].length === 0) {
							inputs[name] = emptyXPathResult;
						}
					}
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
				myOut.ids.set(ids);
			}
		}
		return processor;
	});
	
	return com.makeApply(pins);
}




function domEndCap(ambient, input, node) {
	var ec = ambient.makeEndCap(function (myOut, amb) {
		return {
			input: {
				set: function (o) {
					// This whole thing needs to be optimized, specifically it should use a more nuanced replace xml function so as not to reevaluate thunks
					
					var c = o.xml.cloneNode(true);
					node.ownerDocument.adoptNode(c);
					node.parentNode.replaceChild(c, node);
					node = c;
					
					// find thunks
					var thunks = xpath("//f:thunk", node);
					
					forEach(thunks, function (thunk) {
						processThunk(amb, thunk, o.ids);
					});
				}
			}
		};
	}, {input: input});
	ec.activate();
	return ec;
}


function processThunk(ambient, node, ids) {
	var functionURL = xpath("f:function", node)[0].getAttributeNS("", "url");
	
	var functionCom = documents.get(functionURL);
	
	var paramNodes = xpath("f:with-param", node);
	var params = {};
	forEach(paramNodes, function (paramNode) {
		params[paramNode.getAttributeNS("", "name")] = startCaps.unit(ids[paramNode.getAttributeNS("", "value")]);
	});
	
	var out = functionCom.makeApply(params);
	
	out = out.output;
	
	domEndCap(ambient, out, node);
}







var documents = (function () {
	var cache = {};
	
	return {
		get: function (url) {
			if (!cache[url]) {
				cache[url] = makeCustomCom(loadXMLNow(ROOTDIR + url));
			}
			return cache[url];
		}
	};
})();




/*
function select(what, role) {
	return function (o) {
		if (what === "content") {
			return o.queryContent;
		} else if (what === "involves") {
			return o.queryInvolves;
		} else if (what === "childObjects") {
			return o.queryChildObjects;
		} else if (what === "arc") {
			return startCaps.unit(o.getArc(role));
		}
	};
}
*/

var queryComponent = memoize(function (what, role) {
	if (what === "content") {
		return simpleCompose(
			components.unit.map(function (o) {
				return o.queryContent;
			}),
			components.collapse.unitUnit);
	} else if (what === "type") {
		return simpleCompose(
			components.unit.map(function (o) {
				return startCaps.unit(o.getType());
			}),
			components.collapse.unitUnit);
	} else if (what === "involves") {
		return simpleCompose(
			components.unit.map(function (o) {
				return o.queryInvolves;
			}),
			components.collapse.unitSet);
	} else if (what === "childObjects") {
		return simpleCompose(
			components.unit.map(function (o) {
				return o.queryChildObjects;
			}),
			components.collapse.unitSet);
	} else if (what === "arc") {
		return simpleCompose(
			components.unit.map(function (o) {
				return startCaps.unit(o.getArc(role));
			}),
			components.collapse.unitUnit);
	} else if (what === "relation") {
		return simpleCompose(
			components.unit.map(function (o) {
				return startCaps.unit(o.getRelation());
			}),
			components.collapse.unitUnit);
	}
});


var customCom = (function () {

	

	
	return {
		xsl: function (xsl) {
			var compiled = compileXSL(xsl);

			return components.unit.map(function (params) {
				console.log("xsl getting called with", params);
				return compiled(blankXML, params);
			});
		},
		compileCustom: function (xml) {
			
		}
	};
})();