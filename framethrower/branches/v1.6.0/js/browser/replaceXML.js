function replaceXML(node, replacer, pass, firstRun) {
	/*
	if replacer is a thunk or on
		if node was a thunk/on && thunk essences the same
			return node
		else
			return bruteReplace(node, replacer)
	else
		if nodenames the same,
			unloadXMLNode(node) if necessary (and not the first run)
			replace node's attributes with replacer's attributes
			replaceChildren(node, replacer)
			return node
		else
			return bruteReplace(node, replacer)
	*/
	
	
	if (xpath("self::f:thunk | self::f:on", replacer).length > 0) {
		if (node.custom && node.custom.thunkEssence) {
			var replacerTe = getThunkEssence(replacer, pass.baseUrl, pass.ids);
			if (compareThunkEssences(replacerTe, node.custom.thunkEssence)) {
				// node is already the thunk that would replace it
				return node;
			}
		}
		
		return bruteReplace(node, replacer, pass);
	} else {
		var rln = replacer.localName;
		var rns = replacer.namespaceURI;
		var nln = node.localName;
		var nns = node.namespaceURI;
		
		if (rln === nln && rns === nns) {
			if (!firstRun && node.custom) {
				unloadXMLNode(node);
			}
			replaceAttributes(node, replacer);
			replaceChildren(node, replacer, pass);
			return node;			
		} else {
			return bruteReplace(node, replacer, pass);
		}
	}
}




function bruteReplace(node, replacer, pass) {
	unloadXML(node);
	
	// clone the replacer node
	replacer = cloneNode(replacer);
	
	// dom replace node with replacer
	node.parentNode.replaceChild(replacer, node);
	
	processThunks(replacer, pass);
	
	return replacer;
}

function processThunks(node, pass) {
	// note: all new XML must be processed by this function
	// bootstrap uses this method with pass = {baseUrl: "", ids: {}}
	
	// first, tag thunkEssence on any bindings, or actions that need it (f:on, f:create, f:intact, f:servercall)
	var nodesNeedingTagging = xpath(".//*[self::f:thunk or self::f:on or self::f:create or self::f:intact or self::f:servercall]", node);
	forEach(nodesNeedingTagging, function (node) {
		tagThunkEssence(node, pass.baseUrl, pass.ids);
	});

	// process "on load" events
	var onloadNodes = xpath(".//f:on[@event='load']", node);
	forEach(onloadNodes, function (node) {
		triggerAction(node.custom.thunkEssence);
	});
	
	// evaluate any thunks
	var thunks = xpath(".//f:thunk", node);
	forEach(thunks, function (thunk) {
		evalThunk(thunk);
		// setTimeout(function () {
		// 			evalThunk(thunk);
		// 		}, 1);
	});
}

function replaceAttributes(node, replacer) {
	var nln = node.localName;
	
	forEach(replacer.attributes, function (att) {
		var ns = att.namespaceURI;
		var ln = att.localName;
		var nv = att.nodeValue;
		
		node.setAttributeNS(ns, ln, nv);
		if (ln === "value" && nln === "input") {
			node.value = nv;
		}
	});
	
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
}

function replaceChildren(node, replacer, pass) {
	
	function getNextNonIdentifier(node) {
		if (node && node.nodeType === 1 && getAttr(node, "f:identifier")) {
			return getNextNonIdentifier(node.nextSibling);
		}
		return node;
	}
	
	var identifierNodes = xpath("*[@f:identifier]", node);
	var identifiers = {};
	forEach(identifierNodes, function (idNode) {
		identifiers[getAttr(idNode, "f:identifier")] = idNode;
	});
	
	var nNode = getNextNonIdentifier(node.firstChild);
	var rNode = replacer.firstChild;
	while (rNode) {
		if (rNode.nodeType === 1) {
			var identifier = getAttr(rNode, "f:identifier");
			if (identifier) {
				var corresponder = identifiers[identifier];
				if (corresponder) {
					var c = replaceXML(corresponder, rNode, pass);
					delete identifiers[identifier];
				} else {
					var c = copyBefore(node, rNode, nNode);
					processThunks(c, pass);
				}
			} else if (nNode && nNode.nodeType === 1) {
				var nextNode = getNextNonIdentifier(nNode.nextSibling);
				replaceXML(nNode, rNode, pass);
				nNode = nextNode;
			} else {
				var c = copyBefore(node, rNode, nNode); // this just appends rNode to node
				processThunks(c, pass);
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
	
	// remove identified nodes that weren't in the replacer
	forEach(identifiers, function (idNode) {
		unloadXML(idNode);
		node.removeChild(idNode);
	});
	// remove any remaining children from node
	while (nNode) {
		unloadXML(nNode);
		var nextNode = nNode.nextSibling;
		node.removeChild(nNode);
		nNode = nextNode;
	}
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



function unloadXML(node) {
	var concerns = xpath(".//f:on | .//f:result", node);
	forEach(concerns, unloadXMLNode);
}

function unloadXMLNode(node) {
	// call remove function on active thunks
	if (node.custom.removeFunc) {
		node.custom.removeFunc();
	}
	// null out custom property (for garbage collection)
	delete node.custom;	
}