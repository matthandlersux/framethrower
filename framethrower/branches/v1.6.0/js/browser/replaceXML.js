function replaceXML(node, replacer, scopeVars) {
/*	if replacer is a thunk
		if node was a thunk && thunk essences the same
			return node
		else
			return bruteReplace(node, replacer)
	else
		if nodenames not the same,
			return bruteReplace(node, replacer)
		else
			replace node's attributes with replacer's attributes
			replaceChildren(node, replacer)
			return node
*/
}




function bruteReplace(node, replacer, scopeVars) {
	unloadXML(node);
	
	// dom replace node with replacer
	node.parentNode.replaceChild(replacer, node);
	
	// evaluate any thunks in replacer
	var thunks = xpath(".//f:thunk", replacer);
	forEach(thunks, function (thunk) {
		evalThunk(thunk, scopeVars);
	});
	
	return replacer;
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

function replaceChildren(node, replacer) {
	// TODO
}


function unloadXML(node) {
	// TODO
}