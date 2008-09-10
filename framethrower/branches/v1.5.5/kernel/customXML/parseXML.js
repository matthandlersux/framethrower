
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
						//console.log("re/printing DOM XML");
						//console.dirxml(o.xml);
						//console.dir(o.ids);
						
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
	//console.log("processing thunk");
	//console.dirxml(node);
	//console.dir(ids);
	
	var url = getUrlFromXML(node, relurl);
	
	var functionCom = qtDocs.get(url);
	
	var paramNodes = xpath("f:with-param", node);
	var params = {};
	forEach(paramNodes, function (paramNode) {
		params[paramNode.getAttributeNS("", "name")] = convertXMLToPin(paramNode, ids, {});
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
		params[paramNode.getAttributeNS("", "name")] = convertXMLToPin(paramNode, ids, vars);
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
	
	console.dirxml(transaction.xml);
	
	//execute transaction
	var executeTransaction = function (transaction) {
		var newvars = {};
		var returnVars = {};
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
				//change code to accept params like this: <f:string value="kernel.individual" />
				forEach (actionNode.childNodes, function(paramNode){
					params.push(getObjectFromParam(paramNode, ids, newvars));
				});
				prefix.control[prop][action].apply(null, params);
			} else if (actionName == 'perform') {
				var newvarprefix = actionNode.getAttributeNS("", "prefix");
				var result = processPerforms(ambient, actionNode, transaction.ids, newvars, url);
				forEach(result.returnVars, function(addvar, key){
					if(newvarprefix){
						newvars[newvarprefix + "." + key] = addvar;
					}
				});
			} else if (actionName == 'return') {
				//store variable names to return
				returnVars[actionNode.getAttributeNS("", "as")] = actionNode.getAttributeNS("", "value");
			}
		});
		//take only the returnVars from the newvars
		forEach(returnVars, function(value, name){
			returnVars[name] = newvars[value];
		});
		return {success:true, returnVars:returnVars}; //add more nuanced return values
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
					var funcxml = xpath("f:*[local-name()='function' or local-name()='transaction'][@name='" + name + "']", xml)[0];
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


// takes in context as a hash of name:outputPin
// runs convertPinToXML on each outputPin,
// returns an object {xml: interfaces.unit(basic.js), ids: interfaces.unit(basic.js)}
// which is the combined result of the convertPinToXML's
function combineContext(context) {
	var convertedContext = {};
	forEach(context, function (pin, name) {
		convertedContext[name] = convertPinToXML(pin);
	});
	
	var box = makeBox({output: interfaces.unit(basic.js)}, function (myOut, ambient) {
		var xml = {};
		var ids = {};
		function update() {
			if (all(context, function (pin, name) {
				return xml[name];
			})) {
				
				var mergedIds = {};
				forEach(ids, function (someIds) {
					mergedIds = merge(mergedIds, someIds);
				});
				
				myOut.output.set({xml: xml, ids: mergedIds});
			}
		}
		update();
		
		var processor = {};
		
		forEach(convertedContext, function (pin, name) {
			processor[name] = {
				set: function (o) {
					xml[name] = o.xml;
					ids[name] = o.ids;
					update();
				}
			};
		});
		
		return processor;
	}, convertedContext);
	
	return box.outputPins.output;
}


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
			
			var combinedContext = combineContext(context);
			
			var xslCom = components.lift(interfaces.unit, basic.fun(basic.js, basic.js), function (o) {
				if (!o) return undefined;
				var res = compiled(blankXML, o.xml);
				return {xml: res, ids: o.ids};
			});

			var transformed = simpleApply(xslCom, combinedContext);

			return transformed;
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
add a way to import utility xsl templates

put in ui bindings
including an onload binding (to initialize variables/structures)
*/