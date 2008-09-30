function replaceXML(node, replacer, ambient, ids, relurl) {
	if (node.localName === replacer.localName && node.namespaceURI === replacer.namespaceURI) {
		//console.log("DOING TRICKY REPLACE");
		
		// set attributes
		var removals = [];
		forEach(node.attributes, function (att) {
			var ns = att.namespaceURI;
			var ln = att.localName;
			if (!replacer.hasAttributeNS(ns, ln)) {
				removals.push(att);
			}
		});
		forEach(removals, function (att) {
			node.removeAttributeNode(att);
		});
		forEach(replacer.attributes, function (att) {
			var ns = att.namespaceURI;
			var ln = att.localName;
			var nv = att.nodeValue;
			node.setAttributeNS(ns, ln, nv);
		});
		
		// should get rid of this when animation is implemented..
		if (node.localName === "div" && node.hasAttributeNS("", "left")) {
			sizeNode(node);
		}
		
		if (node.endCap) {
			node.endCap.deactivate();
		}

		
		var identifiers = xpath("*[@f:identifier]", replacer);
		if (identifiers.length > 0) {
			// var corresponding = xpath("*[@f:identifier = '" + identifier + "']", node);
			// if (corresponding.length > 0) {
			// 	var corresponder = corresponding[0];
			// 	insertBefore(node, corresponder, nNode);
			// 	replaceXML(corresponder, rNode, ambient, ids, relurl);
			// } else {
			// 	var c = copyBefore(node, rNode, nNode);
			// 	processAll(ambient, c, ids, relurl);
			// }
		} else {
			// set children
			var rNode = replacer.firstChild;
			var nNode = node.firstChild;
			while (rNode) {
				if (rNode.nodeType === 1) {
					if (nNode && nNode.nodeType === 1) {
						var nextNode = nNode.nextSibling;
						replaceXML(nNode, rNode, ambient, ids, relurl);
						nNode = nextNode;
					} else {
						var c = copyBefore(node, rNode, nNode);
						processAll(ambient, c, ids, relurl);
					}
				} else {
					if (nNode && nNode.nodeType === rNode.nodeType) {
						nNode.nodeValue = rNode.nodeValue;
						nNode = nNode.nextSibling;
					} else {
						copyBefore(node, rNode, nNode);
					}
				}

				rNode = rNode.nextSibling;
			}

			// remove remaining children
			while (nNode) {
				deactivateEndCaps(nNode);
				var nextNode = nNode.nextSibling;
				node.removeChild(nNode);
				nNode = nextNode;
			}
		}
		
		// if it's a binding or button, fix parent
		if (node.localName === "binding" && node.namespaceURI === xmlns["f"]) {
			registerBinding(node, ids, relurl);
		} else if (node.localName === "button" && node.namespaceURI === xmlns["f"]) {
			registerButton(node);
		}
		
		return node;
		
	} else if (replacer.localName === "thunk" && replacer.namespaceURI === xmlns["f"]) {
		if (node.thunkEssence && node.endCap && node.endCap.getActive() && compareThunkEssences(getThunkEssence(replacer, ids, relurl), node.thunkEssence)) {
			//console.log("computation reused!");
			return node;
		} else {
			//deacivateEndCaps(node);
			processThunk(ambient, node, ids, relurl, replacer);
			// NOTE: because we're not returning anything here, we can't have a thunk that evaluates to another thunk directly (needs to be embedded in a html:div, for example)
		}

	} else {
		deactivateEndCaps(node);
		var c = replaceWithCopy(replacer, node);
		processAll(ambient, c, ids, relurl);
		return c;
	}
	
	// else..

}

function deactivateEndCaps(node) {
	if (node.endCap) {
		node.endCap.deactivate();
	} else {
		forEach(node.childNodes, function (n) {
			deactivateEndCaps(n);
		});
	}
}

function replaceWithCopy(newNode, oldNode) {
	var c = newNode.cloneNode(true);
	oldNode.ownerDocument.adoptNode(c);
	oldNode.parentNode.replaceChild(c, oldNode);
	return c;
}
function copyBefore(parentNode, newNode, node) {
	var c = newNode.cloneNode(true);
	parentNode.ownerDocument.adoptNode(c);
	insertBefore(parentNode, c, node);
	return c;
}
function insertBefore(parentNode, newNode, node) {
	if (node) {
		parentNode.insertBefore(newNode, node);
	} else {
		parentNode.appendChild(newNode);
	}
}

function processAll(ambient, node, ids, relurl) {
	
	// find sizings
	var sizings = xpath("descendant-or-self::html:div[@left]", node);
	forEach(sizings, function (sizing) {
		sizeNode(sizing);
	});
	
	// find bindings
	var bindings = xpath("descendant-or-self::f:binding", node);
	forEach(bindings, function (binding) {
		registerBinding(binding, ids, relurl);
	});
	var buttons = xpath("descendant-or-self::f:button", node);
	forEach(buttons, function (button) {
		registerButton(button);
	});
	
	// find thunks
	var thunks = xpath("descendant-or-self::f:thunk", node);
	forEach(thunks, function (thunk) {
		processThunk(ambient, thunk, ids, relurl);
	});
}

function registerBinding(binding, ids, relurl) {
	var parent = binding.parentNode;
	parent.bindingURL = getUrlFromXML(binding, relurl);
	
	var params = {};
	var paramNodes = xpath("f:with-param", binding);
	forEach(paramNodes, function (paramNode) {
		params[paramNode.getAttributeNS("", "name")] = convertXMLToPin(paramNode, ids, {});
	});
	parent.bindingParams = params;
}
function registerButton(button) {
	button.parentNode.bindingButtonName = button.getAttributeNS("", "name");
}

/*
integrate typeNames
makeCustomCom into component
*/

function sizeNode(node) {
	node.style.position = "absolute";
	function setAttr(name) {
		var att = node.getAttributeNS("", name);
		if (att) {
			node.style[name] = att + "px";
		}
	}
	var attrs = ["width", "height", "left", "top"];
	forEach(attrs, function (name) {
		setAttr(name);
	});
}


function domEndCap(ambient, input, node, relurl, thunkEssence) {
	var ec = ambient.makeEndCap(function (myOut, amb) {
		return {
			input: {
				set: function (o) {
					if (o.xml && o.ids) {
						
						//console.log("doing DOM update", relurl, node);
						delete node.endCap;
						node = replaceXML(node, o.xml, amb, o.ids, relurl);
						
						// if (ec === undefined) {
						// 	console.log("ENDCAP UNDEFINED");
						// }
						node.endCap = ec;
						node.thunkEssence = thunkEssence;
						
						
						
						// This whole thing needs to be optimized, specifically it should use a more nuanced replace xml function so as not to reevaluate thunks
						
						/*amb.deactivate();
						
						var c = o.xml.cloneNode(true);
						node.ownerDocument.adoptNode(c);

						// find sizings
						var sizings = xpath("descendant-or-self::html:div[@left]", c);
						forEach(sizings, function (sizing) {
							sizeNode(sizing);
						});
						
						// find bindings
						var bindings = xpath(".//f:binding", c);
						forEach(bindings, function (binding) {
							var parent = binding.parentNode;
							parent.bindingURL = getUrlFromXML(binding, relurl);
							
							var params = {};
							var paramNodes = xpath("f:with-param", binding);
							forEach(paramNodes, function (paramNode) {
								params[paramNode.getAttributeNS("", "name")] = convertXMLToPin(paramNode, o.ids, {}, c);
							});
							parent.bindingParams = params;
						});
						var buttons = xpath(".//f:button", c);
						forEach(buttons, function (button) {
							button.parentNode.bindingButtonName = button.getAttributeNS("", "name");
						});

						// find thunks
						var thunks = xpath(".//f:thunk", c);

						forEach(thunks, function (thunk) {
							processThunk(amb, thunk, o.ids, relurl);
						});
						
						node.parentNode.replaceChild(c, node);
						node = c;*/
					}
				}
			}
		};
	}, {input: input});
	node.endCap = ec;
	return ec;
}

function getThunkEssence(node, ids, relurl) {
	var url = getUrlFromXML(node, relurl);
	
	var paramNodes = xpath("f:with-param", node);
	var params = {};

	forEach(paramNodes, function (paramNode) {
		params[paramNode.getAttributeNS("", "name")] = convertXMLToPin(paramNode, ids, {});
	});
	
	return {url: url, params: params};
}
function compareThunkEssences(e1, e2) {
	if (e1.url !== e2.url) {
		return false;
	}
	if (any(e1.params, function (param, name) {
		return e2.params[name] !== param;
	})) {
		return false;
	}
	if (any(e2.params, function (param, name) {
		return e1.params[name] !== param;
	})) {
		return false;
	}
	return true;
}

function processThunk(ambient, node, ids, relurl, thunk) {
	//console.log("processing thunk");
	//console.dirxml(node);
	//console.dir(ids);
	
	if (!thunk) thunk = node;
	
	var essence = getThunkEssence(thunk, ids, relurl);
	
	var functionCom = qtDocs.get(essence.url);
	
	// will be a makeApply once makeCustomCom returns a component.. (this probably won't ever happen..)
	var out = functionCom(essence.params);
	
	//out = simpleApply(delayComponent, out);
	
	return domEndCap(ambient, out, node, essence.url, essence);
}

// this is just to get the engine started
function processAllThunks(ambient, node, ids, relurl) {
	var thunks = xpath(".//f:thunk", node);
	forEach(thunks, function (thunk) {
		processThunk(ambient, thunk, ids, relurl);
	});
}



/*
var delayComponent = makeSimpleComponent(interfaces.unit(basic.js), interfaces.unit(basic.js), function (myOut, ambient) {
	var cache;
	var timer;
	function pulse() {
		myOut.set(cache);
		timer = false;
	}
	return {
		set: function (o) {
			cache = o;
			if (!timer) {
				timer = setTimeout(pulse, 0);
			}
		}
	};
});
*/