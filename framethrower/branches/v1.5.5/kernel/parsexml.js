

var typeZero = memoize(function (type) {
	return makeSimpleStartCap(type, {});
});


var applyGet = memoize(function (input, what) {
	var t = input.getType();
	
	var intf = t.getConstructor();
	var intfargs = t.getArguments();
	
	
	var inType = intfargs[0];
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
		//console.log("derive done", focus.getOutputInterface().getName());
		return focus;
	}
}

// returns an XML representation of o
// adds to the ids hash if o has an id
function getXMLRep(o, ids) {
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



var combiner = memoize(function (inputTypes) {
	return makeGenericComponent(inputTypes, {output: interfaces.unit(basic.js), ids: interfaces.unit(basic.js)}, function (myOut, ambient) {
		//var done = {}; // boolean for each input saying whether done or not
		var xmlrep = {}; // xml representation for each input
		var ids = {}; // (id => object) pairs
		
		var processor = {};
		
		forEach(inputTypes, function (t, name) {
			var intf = t.getConstructor();
			var intfargs = t.getArguments();
			
			var intype = intfargs[0];
			
			if (intf === interfaces.unit) {
				processor[name] = {
					set: function (o) {
						xmlrep[name] = getXMLRep(o, ids);
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
						xr[i] = getXMLRep(o, ids);
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


// for getting the content from a with-param node
function extractFromXML(node) {
	var els = xpath("*", node);
	if (els.length > 0) {
		return els[0];
	} else {
		var s = node.firstChild.nodeValue;
		s = s.replace(/^\s+|\s+$/g, '');
		return s;
	}
}

// finds either @url, @absurl, or @name and returns an absolute url appropriately
function getUrlFromXML(node, relurl) {
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
	
	var atAbsurl = node.getAttributeNS("", "absurl");
	if (atAbsurl) {
		return atAbsurl;
	}
	
	var atUrl = node.getAttributeNS("", "url");
	if (atUrl) {
		return urlRelPath(relurl, atUrl);
	}
	
	var atName = node.getAttributeNS("", "name");
	if (atName) {
		return urlStripHash(relurl) + "#" + atName;
	}
	
	throw "No url specified on node";
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
	var url = getUrlFromXML(node, relurl);
	
	var functionCom = qtDocs.get(url);
	
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
	
	// will be a makeApply once makeCustomCom returns a component.. (this probably won't ever happen..)
	var out = functionCom(params);
	
	return domEndCap(ambient, out, node, url);
}

// this is just to get the engine started
function processAllThunks(ambient, node, ids, relurl) {
	var thunks = xpath(".//f:thunk", node);
	forEach(thunks, function (thunk) {
		processThunk(ambient, thunk, ids, relurl);
	});
}




function processPerforms(ambient, node, ids, vars, relurl) {
	var url = getUrlFromXML(node, relurl);
	
	var functionCom = qtDocs.get(url);
	
	var paramNodes = xpath("f:with-param", node);
	var params = {};
	forEach(paramNodes, function (paramNode) {
		var value = paramNode.getAttributeNS("", "value-id");
		if (value) {
			params[paramNode.getAttributeNS("", "name")] = startCaps.unit(ids[value]);
		} else {
			value = paramNode.getAttributeNS("", "value-var");
			if (value) {
				params[paramNode.getAttributeNS("", "name")] = startCaps.unit(vars[value]);
			} else {
				params[paramNode.getAttributeNS("", "name")] = startCaps.unit(extractFromXML(paramNode));
			}
		}
	});
	
	// will be a makeApply once makeCustomCom returns a component.. (this probably won't ever happen..)
	var out = functionCom(params);
	
	// hack... make an end cap to evaluate the transaction, then remove the end cap right away
	var transaction;
	var storeResultProc = {
		set: function (val) {
			transaction = val;
		}
	};
	
	var EC = makeSimpleEndCap(ambient, storeResultProc, out);
	EC.deactivate();
	
	//execute transaction
	var executeTransaction = function (transaction) {
		console.dirxml(transaction.xml);
		
		var newvars = {};
		var ids = transaction.ids;

		forEach(transaction.xml.childNodes, function(actionNode){
			var actionName = actionNode.localName;
			var type = actionNode.getAttributeNS("", "type");
			if (actionName == 'make') {
				var result = typeNames[type].make();
				var resultName = actionNode.getAttributeNS("", "name");
				if(resultName) {
					newvars[resultName] = result;
				}
			} else if (actionName == 'intact') {
				var prefix = actionNode.getAttributeNS("", "with-var");
				if (prefix) { 
					prefix = newvars[prefix];
				} else {
					prefix = actionNode.getAttributeNS("", "with-id");
					if (prefix) {
						prefix = ids[prefix];
					}
				}
				var prop = actionNode.getAttributeNS("", "prop");
				var action = actionNode.getAttributeNS("", "action");

				var params = [];
				//with-param nodes (put in xpath here?)
				forEach (actionNode.childNodes, function(paramNode){
					var value = paramNode.getAttributeNS("", "value-id");
					if (value) {
						params.push(ids[value]);
					} else {
						value = paramNode.getAttributeNS("", "value-var");
						if (value) {
							params.push(newvars[value]);
						} else {
							params.push(extractFromXML(paramNode));
						}
					}
				});
				prefix.control[prop][action].apply(null, params);
			} else if (actionName == 'perform') {
				var newvarprefix = actionNode.getAttributeNS("", "prefix");
				var result = processPerforms(ambient, actionNode, transaction.ids, newvars, relurl);
				forEach(result.newvars, function(addvar, key){
					newvars[newvarprefix + "." + key] = addvar;
				});
			}
		});
		return {success:true, newvars:newvars}; //add more nuanced return values
	};
	
	return executeTransaction(transaction);
}



function processAllPerforms(ambient, node, ids, vars, relurl) {
	var performs = xpath(".//f:perform", node);
	forEach(performs, function (perform) {
		var answer = processPerforms(ambient, perform, ids, vars, relurl);
	});
}





var documents = (function () {
	var cache = {};
	
	return {
		get: function (url) {
			if (!cache[url]) {
				var sharp = url.lastIndexOf("#");
				if (sharp === -1) {
					cache[url] = loadXMLNow(ROOTDIR + url);
				} else {
					var realurl = url.substring(0, sharp);
					var name = url.substring(sharp + 1);
					var xml = documents.get(realurl);
					var funcxml = xpath("f:function[@name='" + name + "']", xml)[0];
					cache[url] = funcxml;
				}
				
			}
			return cache[url];
		},
		debug: function () {
			return cache;
		}
	};
})();


// qt stands for Query Transform
var qtDocs = (function () {
	var cache = {};
	
	function makeCustomCom(xml) {
		var paramNodes = xpath("f:param", xml);

		var derivedNodes = xpath("f:derived", xml);

		var compiled = compileXSL(extractXSLFromCustomXML(xml));
		
		// takes in a hash of outputPins
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

			return tensor("xml", "ids").makeApply({xml: transformed, ids: combinedContext.ids}).output;
		};
	}
	
	return {
		get: function (url) {
			if (!cache[url]) {
				cache[url] = makeCustomCom(documents.get(url), url);
			}
			return cache[url];
		}
	};
})();


/*
var transactionDocs = (function () {
	var cache = {};
	
	function makeTransaction(xml, url) {
		var compiled = compileXSL(extractXSLFromCustomXML(xml));
		
		// takes in a hash of objects/strings/nulls
		return function (inputs) {
			var ids = {};
			var params = {};
			forEach(inputs, function (input, name) {
				params[name] = getXMLRep(input, ids);
			});
			
			var result = compiled(params);
		};
	}
	
	return {
		get: function (url) {
			if (!cache[url]) {
				cache[url] = makeTransaction(documents.get(url), url);
			}
			return cache[url];
		}
	};
})();*/


/*
add a way to import utility xsl templates

put in ui bindings
including an onload binding (to initialize variables/structures)
*/