/*

XML
	XMLNODE |
	{kind: "for-each", select: AST, templateCode: TEMPLATECODE} | // this templateCode should take one (or two) parameters. It will get called with the for-each's key (and value if a Map) as its parameters.
	{kind: "call", templateCode: TEMPLATECODE} // this templateCode should take zero parameters.
	// TODO: case, on-action

XMLNODE
	{kind: "element", nodeName: STRING, attributes: {STRING: STRING | XMLINSERT}, style: {STRING: STRING | XMLINSERT}, children: [XML]} | // I have style separate from attributes just because the browser handles it separately
	{kind: "textElement", nodeValue: STRING | XMLINSERT}

XMLINSERT
	{kind: "insert", expr: AST}


*/


/*
This takes some xml (in js form) and creates a DOM Node, returning
	{node: NODE, cleanup: FUNCTION}
By calling this function, endCaps may be created which will update the node reactively.
When cleanup() is called, these endCaps are removed.
cleanup may be returned as null, in which case there's nothing to clean up.
*/ 
function xmlToDOM(xml, env) {
	var cleanupFunctions = [];
	function pushCleanup(f) {
		if (f) cleanupFunctions.push(f);
	}
	
	var node;
	
	if (xml.kind === "element") {
		node = createEl(xml.nodeName);
		
		forEach(xml.attributes, function (att, attName) {
			pushCleanup(evaluateXMLInsert(att, env, function (value) {
				setAttr(node, attName, value);
			}));
		});
		
		forEach(xml.style, function (att, attName) {
			pushCleanup(evaluateXMLInsert(att, env, function (value) {
				setNodeStyle(node, attName, value);
			}));
		});
		
		forEach(xml.children, function (child) {
			var childNodeCleanup = xmlToDOM(child, env);
			node.appendChild(childNodeCleanup.node);
			pushCleanup(childNodeCleanup.cleanup);
		});
	} else if (xml.kind === "textElement") {
		node = createTextNode();
		
		pushCleanup(evaluateXMLInsert(xml.nodeValue, env, function (value) {
			node.nodeValue = value;
		}));
	} else if (xml.kind === "for-each") {
		// TODO
	} else if (xml.kind === "call") {
		// TODO
	}
	
	var cleanup = null;
	if (cleanupFunctions.length > 0) {
		cleanup = function () {
			forEach(cleanupFunctions, function (cleanupFunction) {
				cleanupFunction();
			});
		};
	}
	
	return {node: node, cleanup: cleanup};
}











var serializeCell = parseExpr("serialize");


// this evaluates an xml insert (or just a string) and sends the result through the callback (perhaps reactively)
// returns null or a function that when called does cleanup (removes all created endCaps)
function evaluateXMLInsert(xmlInsert, env, callback) {
	if (typeOf(xmlInsert) === "string") {
		callback(xmlInsert);
		return null;
	} else {
		var expr = parseExpression(xmlInsert.expr, env);
		var result = evaluate(expr);

		// if result is a cell, hook it into an endcap that converts it to a string
		if (result.kind === "startCap") {
			var serialized = makeApply(serializeCell, result);
			
			
			
			// TODO
		} else {
			callback(result);
			return null;
		}
	}	
}


function setNodeStyle(node, styleName, styleValue) {
	// TODO this will need some additional code for convenience/browser bullshit (px, etc)
	// https://developer.mozilla.org/en/DOM/CSS
	node.style[attName] = value;
}
























/*
// this takes some xml (in js form) and converts it to a DOM Node, then calls callback with that DOM Node
// returns a function that when called does cleanup (removes all created endCaps)
function writeXML(xml, env, callback) {
	var cleanupFunctions = [];
	function pushCleanup(f) {
		if (f) cleanupFunctions.push(f);
	}
	
	if (xml.kind === "element") {
		var node = createEl(xml.nodeName);
		
		forEach(xml.attributes, function (att, attName) {
			pushCleanup(evaluateXMLInsert(att, env, function (value) {
				setAttr(node, attName, value);
			}));
		});
		
		forEach(xml.style, function (att, attName) {
			pushCleanup(evaluateXMLInsert(att, env, function (value) {
				setNodeStyle(node, attName, value);
			}));
		});
		
		
		var childPositions = []; // this array maps indexes to DOM nodes. The idea is you can always insertBefore whatever DOM node is supposed to come after you (or appendChild if there's nothing after you).
		
		forEach(xml.children, function (child, index) {
			childPositions[index] = null;
			pushCleanup(writeXML(child, env, function (childNode) {
				// put the childNode in the childPositions array
				childPositions[index] = childNode;
				
				// find next child
				var nextChild = null;
				for (var i = index + 1, len = childPositions.length; i < len; i++) {
					if (childPositions[i]) {
						nextChild = childPositions[i];
						break;
					}
				}
				
				if (nextChild) {
					node.insertBefore(childNode, nextChild);
				} else {
					node.appendChild(childNode);
				}
			}));
		});
		
		callback(node);
	} else if (xml.kind === "textElement") {
		var node = createTextNode();
		
		pushCleanup(evaluateXMLInsert(xml.nodeValue, env, function (value) {
			node.nodeValue = value;
		}));
		
		callback(node);
	} else if (xml.kind === "for-each") {
		// TODO
	} else if (xml.kind === "call") {
		// TODO
	}
	
	if (cleanupFunctions.length > 0) {
		return function () {
			forEach(cleanupFunctions, function (cleanupFunction) {
				cleanupFunction();
			});
		};
	} else {
		return null;
	}
}*/
