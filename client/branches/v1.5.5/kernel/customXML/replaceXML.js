function replaceXML(node, replacer, ambient, ids, relurl) {
	var nln = node.localName;
	var nns = node.namespaceURI;
	var rln = replacer.localName;
	var rns = replacer.namespaceURI;
	
	var sizingAttNames = {"left": true, "top": true, "width": true, "height": true};
	
	if (nln === rln && nns === rns) {
		//console.log("DOING TRICKY REPLACE");
		
		// set attributes
		var sizingAtts = [];
		forEach(replacer.attributes, function (att) {
			var ns = att.namespaceURI;
			var ln = att.localName;
			var nv = att.nodeValue;
			if (sizingAttNames[ln] && nln === "div") {
				sizingAtts.push(att);
			} else if (!(ln === "style" && nln === "div")) {
				node.setAttributeNS(ns, ln, nv);
				if (ln === "value" && nln === "input") {
					node.value = nv;
				}
			}
		});
		
		var hasSizingAtts = sizingAtts.length > 0;
		
		var removals = [];
		forEach(node.attributes, function (att) {
			var ns = att.namespaceURI;
			var ln = att.localName;
			if (!replacer.hasAttributeNS(ns, ln) && !(ln === "style" && hasSizingAtts)) {
				removals.push(att);
			}
		});
		forEach(removals, function (att) {
			node.removeAttributeNode(att);
		});

		
		if (hasSizingAtts) {
			node.style.position = "absolute";
			if (!node.oldSize) node.oldSize = {};
		} else {
			node.setAttributeNS("", "style", replacer.getAttribute("style"));
			if (node.oldSize) {
				animation.removeAnimation(node);
			}
		}
		
		forEach(sizingAtts, function (att) {
			var ns = att.namespaceURI;
			var ln = att.localName;
			var nv = att.nodeValue;
			var old = node.oldSize[ln] || node.getAttributeNS(ns, ln);
			if (old === "") {
				node.style[ln] = nv + "px";
			} else if (node.getAttributeNS(ns, ln) !== nv) {
				node.oldSize[ln] = parseInt(old, 10);
				//node.style[ln] = nv + "px";
				animation.animateStyle(node, ln, parseInt(old, 10), parseInt(nv, 10));
			}
			node.setAttributeNS(ns, ln, nv);
			
		});
		
		
		
		if (node.endCap) {
			node.endCap.deactivate();
		}
		
		
		// set children
		
		function getNextNonIdentifier(node) {
			if (node && node.nodeType === 1 && node.hasAttributeNS(xmlns["f"], "identifier")) {
				return getNextNonIdentifier(node.nextSibling);
			}
			return node;
		}
		
		var identifierNodes = xpath("*[@f:identifier]", node);
		var identifiers = {};
		forEach(identifierNodes, function (idNode) {
			identifiers[idNode.getAttributeNS(xmlns["f"], "identifier")] = idNode;
		});
		
		var nNode = getNextNonIdentifier(node.firstChild);
		var rNode = replacer.firstChild;
		while (rNode) {
			if (rNode.nodeType === 1) {
				var identifier = rNode.getAttributeNS(xmlns["f"], "identifier");
				if (identifier) {
					var corresponder = identifiers[identifier];
					if (corresponder) {
						var c = replaceXML(corresponder, rNode, ambient, ids, relurl);
						//insertBefore(node, c, nNode);
						delete identifiers[identifier];
					} else {
						var c = copyBefore(node, rNode, nNode);
						processAll(ambient, c, ids, relurl);
					}
				} else if (nNode && nNode.nodeType === 1) {
					var nextNode = getNextNonIdentifier(nNode.nextSibling);
					replaceXML(nNode, rNode, ambient, ids, relurl);
					nNode = nextNode;
				} else {
					var c = copyBefore(node, rNode, nNode);
					processAll(ambient, c, ids, relurl);
				}
			} else {
				if (nNode && nNode.nodeType === rNode.nodeType) {
					nNode.nodeValue = rNode.nodeValue;
					nNode = getNextNonIdentifier(nNode.nextSibling);
				} else {
					copyBefore(node, rNode, nNode);
				}
			}

			rNode = rNode.nextSibling;
		}
		
		// remove remaining children
		forEach(identifiers, function (idNode) {
			deactivateEndCaps(idNode);
			node.removeChild(idNode);
		});
		while (nNode) {
			deactivateEndCaps(nNode);
			var nextNode = nNode.nextSibling;
			node.removeChild(nNode);
			nNode = nextNode;
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
			
			if (node.endCap) {
				node.endCap.deactivate();
			}
			
			processThunk(ambient, node, ids, relurl, replacer);
			// NOTE: because we're not returning anything here, we can't have a thunk that evaluates to another thunk directly (needs to be embedded in a html:div, for example)
		}

	} else if (replacer.localName === "embed" && replacer.namespaceURI === xmlns["f"]) {
		if (node.thunkEssence && node.endCap && node.endCap.getActive() && compareThunkEssences(getThunkEssence(replacer, ids, relurl), node.thunkEssence)) {
			return node;
		} else {
			if (node.endCap) {
				node.endCap.deactivate();
			}
			processEmbed(ambient, node, ids, replacer);
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
	//oldNode.ownerDocument.adoptNode(c);
	oldNode.parentNode.replaceChild(c, oldNode);
	return c;
}
function copyBefore(parentNode, newNode, node) {
	var c = newNode.cloneNode(true);
	//parentNode.ownerDocument.adoptNode(c);
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
	
	if (node.localName === "div" && node.hasAttributeNS("", "left")) {
		node.style.opacity = 0;
		animation.fadeIn(node);
	}
	
	// find sizings
	var sizings = xpath("descendant-or-self::html:div[@left]", node);
	forEach(sizings, function (sizing) {
		sizeNode(sizing);
	});
	
	var embeds = xpath("descendant-or-self::f:embed", node);
	forEach(embeds, function (embed) {
		processEmbed(ambient, embed, ids);
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

/*	
	// I (andrew) tried going down this path at one point and it worked
	// but turned out I didn't need it
	// find performs
	var performs = xpath("descendant-or-self::f:perform", node);
	forEach(performs, function (perform) {
		processPerforms(ambient, perform, ids, [], relurl);
	});
*/	
}

function registerBinding(binding, ids, relurl) {
	var parent = binding.parentNode;
	parent.bindingURL = getUrlFromXML(binding, relurl);
	
	var params = {};
	var paramNodes = xpath("f:with-param", binding);
	forEach(paramNodes, function (paramNode) {
		params[paramNode.getAttribute("name")] = convertXMLToPin(paramNode, ids, {});
	});
	parent.bindingParams = params;
}
function registerButton(button) {
	button.parentNode.bindingButtonName = button.getAttribute("name");
}

function sizeNode(node) {
	node.style.position = "absolute";
	function setAttr(name) {
		var att = node.getAttribute(name);
		if (att) {
			node.style[name] = att + "px";
		}
	}
	var attrs = ["width", "height", "left", "top"];
	forEach(attrs, function (name) {
		setAttr(name);
	});
}