
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
	var xslNodes = xpath("xsl:*", xml);
	
	if(xslNodes.length == 0) { //no xsl nodes... return undefined
		return undefined;
	}


	var xslDoc = createDocument();
	var ss = xslDoc.createElementNS(xmlns["xsl"], "stylesheet");
	ss.setAttributeNS("", "version", "1.0");

	var paramNodes = xpath("f:param | f:derived", xml);
	forEach(paramNodes, function (n) {
		var p = xslDoc.createElementNS(xmlns["xsl"], "param");
		p.setAttributeNS("", "name", n.getAttributeNS("", "name"));
		ss.appendChild(p);
	});

	
	forEach(xslNodes, function (n) {
		var c = appendCopy(ss, n);

		if (!n.hasAttribute("name") && !n.hasAttribute("match")) {
			c.setAttributeNS("", "match", "*");
		}
	});

	return ss;
}


function extractJSFromCustomXML(xml) {
	var jsNode = xpath("f:jsfunc", xml)[0];

	if(!jsNode) { //no xsl nodes... return undefined
		return undefined;
	}

	var funcName = jsNode.getAttributeNS("", "name");
	var func = JSTRANSFUNCS[funcName];
	
	
	return function(blankxml, args){
		
		console.log("xml args: ");
		console.log(args);
		
		var jsargs = {};
		forEach(args, function(node, key){
			jsargs[key] = convertXMLToJS(node);	
		});
		
		return func(jsargs);
	};
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

		var xsl = extractXSLFromCustomXML(xml);
		var compiled;
		if (xsl) {
			compiled = compileXSL(xsl);
		} else {
			compiled = extractJSFromCustomXML(xml);
		}
		
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
				cache[url] = makeIded(qtType, cache[url]);
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