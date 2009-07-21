/*

XML
	{kind: "for-each", select: AST, lineTemplate: LINETEMPLATE} | // this lineTemplate should take one (or two) parameters. It will get called with the for-each's key (and value if a Map) as its parameters.
	{kind: "call", lineTemplate: LINETEMPLATE} | // this lineTemplate should take zero parameters.
	{kind: "on", event: EVENT, lineAction: LINEACTION} | // this action should take zero parameters.
	{kind: "trigger", trigger: AST, lineAction: LINEACTION} | // trigger should evaluate to a reactive value, action should take one (or two) parameters
	{kind: "case", test: AST, lineTemplate: LINETEMPLATE, otherwise?: LINETEMPLATE} |
	// test should evaluate to a cell, if it is non-empty then lineTemplate is run as if it were a for-each. If it is empty, otherwise is called.
	// lineTemplate should take one parameter
	// otherwise, if it exists, should take zero parameters
	XMLNODE 

XMLNODE
	{kind: "element", nodeName: STRING, attributes: {STRING: STRING | XMLINSERT}, style: {STRING: STRING | XMLINSERT}, children: [XML]} | // I have style separate from attributes just because the browser handles it separately
	{kind: "textElement", nodeValue: STRING | XMLINSERT}

XMLINSERT
	{kind: "insert", expr: AST}


*/


var DEBUGSPEED = false;



/*
This takes some xml (in js form) and an environment and creates a DOM Node, returning
	{node: NODE, cleanup: FUNCTION}
By calling this function, endCaps may be created which will update the node reactively.
When cleanup() is called, these endCaps are removed.
cleanup may be returned as null, in which case there's nothing to clean up.
*/ 
function xmlToDOM(xml, env, context) {
	
	// I've added this convenience, XMLP can have as its xml property a {node: --, cleanup: --} in which case it is already DOM.
	// I use this for javascript creating quicktime embeds.
	if (xml.node) {
		return xml;
	}
	
	if (context === undefined) context = "html";
	
	function createWrapper() {
		if (context === "html") return createEl("f:wrapper");
		else if (context === "svg") return createEl("svg:g");
	}
	
	var cleanupFunctions = [];
	function pushCleanup(f) {
		if (f) cleanupFunctions.push(f);
	}
	
	var node;
	
	if (xml.kind === "element") {
		node = (xml.nodeName === "f:wrapper") ? createWrapper() : createEl(xml.nodeName);
		
		var newContext = (xml.nodeName.substring(0,4) === "svg:") ? "svg" : context;
		
		forEach(xml.attributes, function (att, attName) {
			pushCleanup(evaluateXMLInsert(att, env, function (value) {
				// if (attName === "class") {
				// 	console.log("changing a class", "["+value+"]");
				// }
				setNodeAttribute(node, attName, value);
			}));
		});
		
		forEach(xml.style, function (att, attName) {
			pushCleanup(evaluateXMLInsert(att, env, function (value) {
				setNodeStyle(node, attName, value);
			}));
		});
		
		forEach(xml.children, function (child) {
			var childNodeCleanup = xmlToDOM(child, env, newContext);
			try {
				node.appendChild(childNodeCleanup.node);
			} catch (e) {
				console.log("had a problem", childNodeCleanup, xml, child);
				throw e;
			}
			
			pushCleanup(childNodeCleanup.cleanup);
		});
	} else if (xml.kind === "textElement") {
		node = createTextNode();
		
		pushCleanup(evaluateXMLInsert(xml.nodeValue, env, function (value) {
			node.nodeValue = value;
		}));
	} else if (xml.kind === "for-each") {
		//var select = parseExpression(parse(xml.select), env);
		var select = parseExpression(xml.select, env);
		var result = evaluate(select);
		
		var wrapper = createWrapper();
		
		var innerTemplate = makeClosure(xml.lineTemplate, env);
		
		if (result.kind === "list") {
			forEach(result.asArray, function (value) {
				var newNode = evaluate(makeApply(innerTemplate, value));
				newNode = xmlToDOM(newNode.xml, newNode.env, context);
				wrapper.appendChild(newNode.node);
				pushCleanup(newNode.cleanup);
			});
			node = wrapper;
		} else {
			// set up an endCap to listen to result and change the children of the wrapper

			function cmp(a, b) {
				// returns -1 if a < b, 0 if a = b, 1 if a > b
				if (/^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$/.test(a)) {
					return a - b;
				} else {
					if (a < b) return -1;
					else if (a > b) return 1;
					else return 0;
				}
			}



			var entries = {}; // this is a hash of stringified values (from the Unit/Set/Map result) to the evaluated template's {node: NODE, cleanup: FUNCTION}


			var feachCleanup = result.inject(emptyFunction, function (value) {

				var newNode, keyString;

				if (result.isMap) {
					//DEBUG
					if (xml.lineTemplate.params.length !== 2) debug.error("f:each running on map, but as doesn't have key, value");
					newNode = evaluate(makeApply(makeApply(innerTemplate, value.key), value.val));
					keyString = stringify(value.key);
				} else {
					newNode = evaluate(makeApply(innerTemplate, value));
					keyString = stringify(value);
				}

				newNode = xmlToDOM(newNode.xml, newNode.env, context);


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

					if (newNode.cleanup) {
						newNode.cleanup();
					}
					wrapper.removeChild(newNode.node);

					delete entries[keyString];
				};
			});

			function cleanupAllEntries() {
				//console.log("cleaning up an entire f:each", entries);

				// I don't need the below because when feachCleanup is called, all entries are removed, one-by-one, automatically (by cell logic)
				// forEach(entries, function (entry, entryKey) {
				// 	console.log("cleaning up an entry", entry, entryKey);
				// 	if (entry.cleanup) entry.cleanup();
				// });

				feachCleanup();
			}

			return {node: wrapper, cleanup: cleanupAllEntries};
		}
		
		

	} else if (xml.kind === "case") {
		// TODO: right now, case only works if the predicate is of type Unit a. Figure out what we want it to do for other types...
		
		// TODO: test this for memory leaks, I think it's good though.
		
		// {kind: "case", test: AST, lineTemplate: LINETEMPLATE, otherwise?: LINETEMPLATE | CASE}
		
		var select = parseExpression(xml.test, env);
		var result = evaluate(select);
		
		var wrapper = createWrapper();
		
		// set up an endCap to listen to result and change the children of the wrapper
		
		var innerTemplate = makeClosure(xml.lineTemplate, env);
		var otherwiseTemplate = xml.otherwise ? makeClosure(xml.otherwise, env) : undefined;
		
		var childNode = null;
		
		function clearIt() {
			if (childNode) {
				if (childNode.cleanup) childNode.cleanup();
				wrapper.removeChild(childNode.node);
				childNode = null;
			}
		}
		
		function printOccupied(value) {
			clearIt();
			var tmp = evaluate(makeApply(innerTemplate, value));
			childNode = xmlToDOM(tmp.xml, tmp.env, context);
			wrapper.appendChild(childNode.node);
		}
		function printOtherwise() {
			clearIt();
			if (otherwiseTemplate) {
				childNode = xmlToDOM(otherwiseTemplate.xml, otherwiseTemplate.env, context);
				wrapper.appendChild(childNode.node);
			}
		}
		
		var occupied = false;
		var cleanupInjection = result.inject(emptyFunction, function (value) {
			occupied = true;
			printOccupied(value);
			return function () {
				printOtherwise();
			};
		});
		
		function cleanupCase() {
			cleanupInjection();
			clearIt();
		}
		
		if (!occupied) {
			printOtherwise();
		}
		
		return {node: wrapper, cleanup: cleanupCase};
	} else if (xml.kind === "call") {
		var xmlp = makeClosure(xml.lineTemplate, env);
		return xmlToDOM(xmlp.xml, xmlp.env, context);
	} else if (xml.kind === "on") {
		var node = createEl("f:on");
		if (xml.event === "init") {
			setTimeout(function () {
				var action = makeActionClosure(xml.lineAction, env);
				executeAction(action);
			}, 0);
			return {node: node, cleanup: null};
		} else {
			var eventName, eventGlobal;
			if (xml.event.substr(0, 6) === "global") {
				eventName = xml.event.substr(6);
				eventGlobal = true;
			} else {
				eventName = xml.event;
				eventGlobal = false;
			}
			setAttr(node, "event", eventName);
			node.custom = {};
			node.custom.lineAction = xml.lineAction;
			node.custom.env = env;
			
			if (eventGlobal) {
				document.body.appendChild(node);
				function cleanupGlobal() {
					node.custom = null;
					document.body.removeChild(node);
				}
				return {node: createWrapper(), cleanup: cleanupGlobal};
			} else {
				function cleanupOn() {
					node.custom = null; // for garbage collection in stupid browsers
				}
				return {node: node, cleanup: cleanupOn};				
			}
		}
	} else if (xml.kind === "trigger") {
		var node = createWrapper(); // I just need to return something
		var cleanupFunc = null;
		
		// I wrap the registering of triggers in a setTimeout to ensure that they come after everything else. Otherwise there are timing bugs.
		var myTimer = setTimeout(function () {
			
			cleanupFunc = false;
			
			var actionClosure = makeActionClosure(xml.lineAction, env);

			//var expr = parseExpression(parse(xml.trigger), env);
			var expr = parseExpression(xml.trigger, env);
			//var cell = evaluate(expr);
			var removeTrigger = evaluateAndInject(expr, emptyFunction, function (val) { // TODO: maybe we should be doing key/val for Map's...

				var action = evaluate(makeApply(actionClosure, val));
				executeAction(action);
			});
			cleanupFunc = function () {
				removeTrigger();
			};
		}, 0);
		
		function cleanupTrigger() {
			if (cleanupFunc) cleanupFunc();
			else if (cleanupFunc === null) {
				clearTimeout(myTimer);
			} else if (cleanupFunc === false) {
				debug.error("A trigger has triggered its own removal. The culprit:", unparse(xml.trigger));
				//setTimeout(cleanup, 0);
			}
		}
		
		return {node: node, cleanup: cleanupTrigger};
	}
	
	var cleanupDefault = null;
	if (cleanupFunctions.length > 0) {
		cleanupDefault = function () {
			forEach(cleanupFunctions, function (cleanupFunction) {
				cleanupFunction();
			});
		};
	}
	
	return {node: node, cleanup: cleanupDefault};
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
		//var expr = parseExpression(parse(xmlInsert.expr), env);
		var result = evaluate(expr);
		
		//console.log("doing an insert", expr, result);

		// if result is a cell, hook it into an endcap that converts it to a string
		if (result.kind === "cell") {
			var serialized = makeApply(serializeCell, result);
			
			return evaluateAndInject(serialized, emptyFunction, callback); // NOTE: might want to wrap callback so that it returns an empty function?
		} else {
			callback(result);
			return null;
		}
	}
}




