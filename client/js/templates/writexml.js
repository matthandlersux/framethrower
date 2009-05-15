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
This takes some xml (in js form) and an environment and creates a DOM Node, returning
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
		var select = parseExpression(xml.select, env);
		var result = evaluate(select);
		
		var wrapper = createEl("f:wrapper");
		
		// set up an endCap to listen to result and change the children of the wrapper
		
		var type = getType(result);
		var constructor = getTypeConstructor(type);
		var isNumber = (constructor === "Map" && type.left.right.value === "Number") || type.right.value === "Number";
		function cmp(a, b) {
			// returns -1 if a < b, 0 if a = b, 1 if a > b
			if (isNumber) {
				return a - b;
			} else {
				if (a < b) return -1;
				else if (a > b) return 1;
				else return 0;
			}
		}
		
		var innerTemplate = makeClosure(xml.templateCode, env);
		
		var entries = {}; // this is a hash of stringified values (from the Unit/Set/Map result) to the evaluated template's {node: NODE, cleanup: FUNCTION}
		
		result.inject(emptyFunction, function (value) {
			var newNode, keyString;
			
			if (constructor === "Map") {
				newNode = evaluate(makeApply(makeApply(innerTemplate, value.key), value.val));
				keyString = stringify(value.key);
			} else {
				newNode = evaluate(makeApply(innerTemplate, value));
				keyString = stringify(value);
			}
			
			newNode = xmlToDOM(newNode.xml, newNode.env);

			
			// find where to put the new node
			// NOTE: this is linear time but could be log time with clever algorithm
			var place = null; // this will be the key which comes immediately after the new node
			forEach(entries, function (entry, entryKey) {
				if (cmp(keyString, entryKey) < 0 && (place === null || cmp(entryKey, place) < 0)) {
					place = entryKey;
				}
			});
			
			if (place === null) {
				// tack it on at the end
				wrapper.appendChild(newNode.node);
			} else {
				// put it before the one that comes immediately afterwards
				wrapper.insertBefore(newNode.node, entries[place].node);
			}
			
			entries[keyString] = newNode;
			
			return function () {
				if (newNode.cleanup) newNode.cleanup();
				wrapper.removeChild(newNode.node);
				delete entries[keyString];
			};
		});
		
		function cleanupAllEntries() {
			forEach(entries, function (entry) {
				if (entry.cleanup) entry.cleanup();
			});
		}
		
		return {node: wrapper, cleanup: cleanupAllEntries};
	} else if (xml.kind === "call") {
		var xmlp = makeClosure(xml.templateCode, env);
		return xmlToDOM(xmlp.xml, xmlp.env);
	} else if (xml.kind === "on") {
		var node = createEl("f:on");
		if (xml.event === "init") {
			var action = makeActionClosure(xml.action, env);
			executeAction(action);
			return {node: node, cleanup: null};
		} else {
			setAttr(node, "event", xml.event);
			node.custom = {};
			node.custom.action = xml.action;
			node.custom.env = env;
			function cleanup() {
				node.custom = null; // for garbage collection in stupid browsers
			}
			return {node: node, cleanup: cleanup};
		}
	} else if (xml.kind === "trigger") {
		var node = createEl("f:trigger"); // I just need to return something
		var cleanupFunc = null;
		function cleanup() {
			if (cleanupFunc) cleanupFunc();
		}
		
		// I wrap the registering of triggers in a setTimeout to ensure that they come after everything else. Otherwise there are timing bugs.
		setTimeout(function () {
			var actionClosure = makeActionClosure(xml.action, env);

			var expr = parseExpression(parse(xml.trigger), env);
			//var cell = evaluate(expr);
			var removeTrigger = evaluateAndInject(expr, emptyFunction, function (val) { // TODO: maybe we should be doing key/val for Map's...

				//console.log("doing a trigger", val, cell.isDone);

				var action = evaluate(makeApply(actionClosure, val));
				executeAction(action);
			});
			cleanupFunc = removeTrigger.func;
		}, 0);
		
		return {node: node, cleanup: cleanup};
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
		//var expr = parseExpression(xmlInsert.expr, env);
		var expr = parseExpression(parse(xmlInsert.expr), env);
		var result = evaluate(expr);
		
		//console.log("doing an insert", expr, result);

		// if result is a cell, hook it into an endcap that converts it to a string
		if (result.kind === "startCap") {
			var serialized = makeApply(serializeCell, result);
			
			return evaluateAndInject(serialized, emptyFunction, callback).func; // NOTE: might want to wrap callback so that it returns an empty function?
		} else {
			callback(result);
			return null;
		}
	}
}
