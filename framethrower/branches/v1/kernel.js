// Node -> String
function getPath(node) {
	return node.getAttributeNS(xmlns["f"], "path");
}


var pathCache = {};


// makes oldNode's name the same as newNode's
// returns true if there was a change
/*function replaceNodeName(oldNode, newNode) {
	var changed = false;
	if (oldNode.nodeName !== newNode.nodeName) {
		oldNode.nodeName = newNode.nodeName;
		changed = true;
	}
	if (oldNode.namespaceURI !== newNode.namespaceURI) {
		oldNode.namespaceURI = newNode.namespaceURI;
		changed = true;
	}
	return changed;
}*/

// makes all of oldNode's attributes the same as newNode's
// returns true if there was a change
function replaceAttributes(oldNode, newNode) {
	var changed = false;
	var attsToDelete = [];
	forEach(oldNode.attributes, function (att) {
		if (!newNode.hasAttributeNS(att.namespaceURI, att.nodeName)) {
			changed = true;
			attsToDelete.push(att);
		}
	});
	
	forEach(attsToDelete, function (att) {
		oldNode.removeAttributeNode(att);
	});
	
	
	forEach(newNode.attributes, function (att) {
		if (!oldNode.getAttributeNS(att.namespaceURI, att.nodeName) === att.nodeValue) {
			changed = true;
			oldNode.setAttributeNS(att.namespaceURI, att.nodeName, att.nodeValue);
		}
	});
	return changed;
}


function replaceXML(oldNode, newNode) {
	var changed = false;
	
	// if newNode is a thunk, see if we really have to replace
	
	//changed = replaceNodeName(oldNode, newNode) || changed;
	
	if (oldNode.nodeName !== newNode.nodeName || oldNode.namespaceURI !== newNode.namespaceURI) {
		var newOldNode = newNode.cloneNode(false);
		var focus = oldNode.firstChild;
		while (focus) {
			console.log("moving child", focus);
			newOldNode.appendChild(focus);
			focus = oldNode.firstChild;
		}
		//console.log("printing newoldnode:");
		//console.dirxml(newOldNode);
		oldNode.parentNode.replaceChild(newOldNode, oldNode);
		oldNode = newOldNode;
		pathCache[getPath(oldNode)] = oldNode;
		changed = true;
	} else {
		changed = replaceAttributes(oldNode, newNode) || changed;
	}
	
	// note the paths of newNode's children
	var newChildren = {};
	forEach(newNode.childNodes, function (child) {
		if (child.nodeType === 1) {
			newChildren[getPath(child)] = child;
		}
	});
	
	// note the paths of oldNode's children
	// delete child if newNode doesn't have child
	var oldChildren = {};
	var focus = oldNode.firstChild;
	while (focus) {
		if (focus.nodeType === 1) {
			var path = getPath(focus);
			if (newChildren[path]) {
				oldChildren[path] = focus;
				focus = focus.nextSibling;
			} else {
				var del = focus;
				focus = focus.nextSibling;
				deleteXML(del);
				changed = true;
			}
		} else {
			focus = focus.nextSibling;
		}
	}
	
	var atOld = oldNode.firstChild;
	var atNew = newNode.firstChild;
	function insert(node) {
		if (atOld) {
			oldNode.insertBefore(node, atOld);
		} else {
			oldNode.appendChild(node);
		}
	}
	
	// steps through newNode's and oldNode's children
	while (atNew) {
		if (atNew.nodeType === 1) {
			var path = getPath(atNew);
			if (atOld && atOld.nodeType === 1 && getPath(atOld) === path) {
				// already correspond
				replaceXML(atOld, atNew);
				atOld = atOld.nextSibling;
				atNew = atNew.nextSibling;
			} else {
				var existing = oldChildren[path];
				if (existing) {
					insert(existing);
					replaceXML(existing, atNew);
					atNew = atNew.nextSibling;
				} else {
					var ins = atNew;
					atNew = atNew.nextSibling;
					insert(ins);
					addXML(getPath(ins), ins);
				}
				changed = true;
			}
		} else {
			if (atOld && atNew.nodeType === atOld.nodeType) {
				if (atNew.nodeValue !== atOld.nodeValue) {
					atOld.nodeValue = atNew.nodeValue;
					changed = true;
				}
				atOld = atOld.nextSibling;
				atNew = atNew.nextSibling;
			} else {
				var ins = atNew;
				atNew = atNew.nextSibling;
				insert(ins);
				changed = true;
			}
		}
	}
	
	// delete any additional nodes
	while (atOld) {
		var del = atOld;
		atOld = atOld.nextSibling;
		deleteXML(del);
		changed = true;
	}
}

function deleteXML(node) {
	function removeCache(node) {
		if (node.nodeType === 1) {
			delete pathCache[getPath(node)];
			forEach(node.childNodes, function (child) {
				removeCache(child);
			});
		}
	}
	removeCache(node);
	node.parentNode.removeChild(node);
}

// this just registers the node in the cache
function addXML(node) {
	if (node.nodeType === 1) {
		pathCache[getPath(node)] = node;
		forEach(node.childNodes, function (child) {
			addXML(child);
		});
	}
}