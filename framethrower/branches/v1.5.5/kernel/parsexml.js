


var applyGet = memoize(function (input, what) {
	var t = input.getType();
	
	var intf = t.getConstructor();
	var intfargs = t.getArguments();
	
	
	var inType = intfargs[0];
	var outType = inType.getProp(what);

	function getf(x) {
		if (x && x.get[what]) {
			return x.get[what].apply(null, []);
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
	
	//if (name) console.log("hooking up", name);
	
	if (!name) {
		
	} else if (name === "derived") {
		focus = context[xml.getAttributeNS("", "from")];
		next = xml.firstChild;
	} else if (name === "start") {
		focus = context[xml.getAttributeNS("", "from")];
	} else if (name === "get") {
		focus = applyGet(focus, xml.getAttributeNS("", "what"));
	} else if (name === "filter") {
		// need to test still..
		var com = components.filterC(focus.getType().getConstructor(), focus.getType().getArguments()[0], function (o) {
			return derive(xml.firstChild, context, startCaps.unit(o));
		});
		focus = simpleApply(com, focus);
	} else if (name === "filtertype") {
		var com = components.set.filterType(focus.getType().getArguments()[0], typeNames[xml.getAttributeNS("", "type")]);
		focus = simpleApply(com, focus);
	} else if (name === "getkey") {
		var com = components.assoc.getKey(focus.getType().getArguments()[0], focus.getType().getArguments()[1]);
		var key = getFromContext(context, xml.getAttributeNS("", "key"));
		focus = com.makeApply({input: focus, key: key}).output;
	} else {
		console.error("Unknown xml element in derive: " + name);
	}
	// missing: equals
	
	
	if (!next) next = xml.nextSibling;
	
	if (next) {
		return derive(next, context, focus);
	} else {
		return focus;
	}
}




var combiner = memoize(function (inputTypes) {
	return makeGenericComponent(inputTypes, {output: interfaces.unit(basic.js), ids: interfaces.unit(basic.js)}, function (myOut, ambient) {
		//var done = {}; // boolean for each input saying whether done or not
		var xmlrep = {}; // xml representation for each input
		var ids = {}; // (id => object) pairs
		
		function getxmlrep(o) {
			if (!o) {
				return emptyXPathResult;
			} else if (o.getId) {
				var id = o.getId();
				ids[id] = o;
				return document.createTextNode(id);
			} else {
				return o;
			}
		}
		
		var processor = {};
		
		forEach(inputTypes, function (t, name) {
			var intf = t.getConstructor();
			var intfargs = t.getArguments();
			
			var intype = intfargs[0];
			
			if (intf === interfaces.unit) {
				processor[name] = {
					set: function (o) {
						xmlrep[name] = getxmlrep(o);
						checkDone();
					}
				};
			} else if (intf === interfaces.set) {
				var cache = makeObjectHash();
				function update() {
					var sorted = cache.toArray().sort(function (a, b) {
						return (stringifyObject(a) > stringifyObject(b)) ? 1 : -1;
					});
					
					var container = document.createElementNS("", "container");
					var xr = [];
					forEach(sorted, function (o, i) {
						xr[i] = getxmlrep(o);
						container.appendChild(xr[i]);
					});
					if (xr.length === 0) {
						xr = emptyXPathResult;
					}
					
					xmlrep[name] = xr;
					checkDone();
				}
				update();
				processor[name] = {
					add: function (o) {
						cache.set(o, o);
						update();
					},
					remove: function (o) {
						cache.remove(o);
						update();
					}
				};
			}
		});
		
		function checkDone() {
			if (all(inputTypes, function (intf, name) {
				return xmlrep[name];
			})) {
				myOut.output.set(xmlrep);
				myOut.ids.set(ids);
			}
		}
		checkDone();
		
		return processor;
	});
});

var tensor = memoize(function () { // arguments
	var inputInterfaces = {};
	forEach(arguments, function (name) {
		inputInterfaces[name] = interfaces.unit(basic.js);
	});
	return makeGenericComponent(inputInterfaces, {output: interfaces.unit(basic.js)}, function (myOut, ambient) {
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






function makeCustomCom(xml) {
	var paramNodes = xpath("f:param", xml);
	
	var derivedNodes = xpath("f:derived", xml);
	
	var compiled = compileXSL(extractXSLFromCustomXML(xml));
	
	return function (inputs) {
		var context = merge(inputs);
		
		forEach(derivedNodes, function (n) {
			var name = n.getAttributeNS("", "name");
			context[name] = derive(n, context);
		});
		
		
		// to be replaced (pre-compiled)
		var inputTypes = {};
		forEach(context, function (val, name) {
			inputTypes[name] = val.getType();
		});
		var myCombiner = combiner(inputTypes);
		
		var combinedContext = myCombiner.makeApply(context);
		
		var xslCom = components.lift(interfaces.unit, basic.fun(basic.js, basic.js), function (params) {
			if (!params) return undefined;
			var res = compiled(blankXML, params);
			return res;
		});
		
		var transformed = simpleApply(xslCom, combinedContext.output);
		
		return tensor("xml", "ids").makeApply({xml: transformed, ids: combinedContext.ids});
	};
}


/*
integrate typeNames
makeCustomCom into component
*/

function domEndCap(ambient, input, node, relurl) {
	var ec = ambient.makeEndCap(function (myOut, amb) {
		return {
			input: {
				set: function (o) {
					if (o.xml && o.ids) {
						// This whole thing needs to be optimized, specifically it should use a more nuanced replace xml function so as not to reevaluate thunks

						var c = o.xml.cloneNode(true);
						node.ownerDocument.adoptNode(c);

						node.parentNode.replaceChild(c, node);
						node = c;

						// find thunks
						var thunks = xpath(".//f:thunk", node);

						forEach(thunks, function (thunk) {
							processThunk(amb, thunk, o.ids, relurl);
						});
					}
				}
			}
		};
	}, {input: input});
	return ec;
}

function processThunk(ambient, node, ids, relurl) {
	var funcEl = xpath("f:function", node)[0];
	var functionURL = funcEl.getAttributeNS("", "url");
	
	var url;
	if (functionURL) {
		url = urlRelPath(relurl, functionURL);
	} else {
		url = urlStripHash(relurl) + "#" + funcEl.getAttributeNS("", "name");
		console.log("using name", url);
	}
	
	var functionCom = documents.get(url);
	
	var paramNodes = xpath("f:with-param", node);
	var params = {};
	forEach(paramNodes, function (paramNode) {
		var value = paramNode.getAttributeNS("", "value");
		if (value) {
			params[paramNode.getAttributeNS("", "name")] = startCaps.unit(ids[value]);
		} else {
			params[paramNode.getAttributeNS("", "name")] = startCaps.unit(extractFromXML(paramNode));
		}
		
	});
	
	// will be a makeApply once makeCustomCom returns a component...
	var out = functionCom(params);
	
	out = out.output;
	
	return domEndCap(ambient, out, node, url);
}

function extractFromXML(node) {
	var els = xpath("*", node);
	if (els.length > 0) {
		return els[0];
	} else {
		var s = node.firstChild.nodeValue;
		s = replace(/^\s+|\s+$/g, '');
		return s;
	}
}

function trim(array) {
	function t(i) {
		if(array[i].nodeType==Node.TEXT_NODE && array[i].nodeValue.match(/^\s*$/)) {
			array.splice(i,1);
		}
	}
	t(0);
	t(array.length-1);
}



function urlRelPath(start, path) {
	if (path === ".") {
		return start;
	} else {
		return urlReduce(urlStripLast(start) + path);
	}
}
function urlReduce(url) {
	var index = url.indexOf("/../");
	if (index === -1) {
		return url;
	} else {
		return urlReduce(urlStripLast(url.substr(0, index)) + url.substr(index + 4));
	}
}
function urlStripLast(url) {
	return url.replace(/(\/|^)[^\/]*$/, "$1");
}
function urlStripHash(url) {
	return url.replace(/#.*/, "");
}





var documents = (function () {
	var cache = {};
	
	return {
		get: function (url) {
			if (!cache[url]) {
				var sharp = url.lastIndexOf("#");
				if (sharp === -1) {
					cache[url] = makeCustomCom(loadXMLNow(ROOTDIR + url), url);
				} else {
					var realurl = url.substring(0, sharp);
					var name = url.substring(sharp + 1);
					var xml = loadXMLNow(ROOTDIR + url);
					var funcxml = xpath("f:function[@name='" + name + "']", xml)[0];
					cache[url] = makeCustomCom(funcxml, url);
				}
				
			}
			return cache[url];
		}
	};
})();


/*
use getFromContext in processThunk
add a way to import utility xsl templates

put in ui bindings
including an onload binding (to initialize variables/structures)
*/