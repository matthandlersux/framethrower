function testFile(filename) {
	//helper functions
	
	var scPatternMatch = {};
	
	function children (xml) {
		return xpath("*", xml);
	}
	

	function messagesEqual (message1, message2) {
		var returnVal = true;
		var propCount = 0;
		
		forEach(message1, function(property, pname) {
			if(!message2[pname]) {
				returnVal = false;
				return;
			}
			if(message2[pname].scPatternMatch == scPatternMatch) {
				message2[pname].callBack(property);
			} else if (property != message2[pname]) {
				returnVal = false;
				return;
			}
			propCount++;
		});
		
		forEach(message2, function(property, pname) {
			propCount--;
		});
		if(propCount != 0) {
			return false;
		}
		return returnVal;
	}
	
	
	//parse Functions
	
	function parsePrim (primNode, testWorld) {
		var primName = primNode.nodeName;
		if (primName == 'number') {
			var numAsString = primNode.getAttribute('value');
			return parseFloat(numAsString, 10);
		} else if (primName == 'sc') {
			var name = primNode.getAttribute('name');
			if (!testWorld.startCaps[name]) {
				return {
					scPatternMatch : scPatternMatch,
					callBack : function (inCap) {
						testWorld.startCaps[name] = inCap;
						lookupTable[name] = inCap;
					}
				};
			}
			return testWorld.startCaps[name];
		} else if (primName == 'undefined') {
			return undefined;
		}
		//TODO: add other primitive types
	}
	
	function parseStartCap (actionNode, testWorld) {
		var scname = actionNode.getAttribute('name');
		var sctype = actionNode.getAttribute('type');

		var sctypeFirstWord = sctype.split(" ")[0];

		testWorld.startCaps[scname] = makeStartCap(sctypeFirstWord);
		testWorld.startCaps[scname].type = parseType(sctype);
		
		// make this more functional
		lookupTable[scname] = testWorld.startCaps[scname];
		return testWorld;
	}

	function parseEndCap (actionNode, testWorld) {
		var endCapName = actionNode.getAttribute('name');
		var expression = actionNode.getAttribute('expression');

		var scFromExp = evaluate(parseExpr(expression));
		
		testWorld.outMessages[endCapName] = [];

		function processor (messages) {
			forEach(messages, function (message) {
				testWorld.outMessages[endCapName].push(message);
			});
		}

		testWorld.endCaps[endCapName] = makeEndCap(scFromExp, processor);
		return testWorld;
	}
	
	function parseMessages (actionNode, testWorld) {
		forEach(children(actionNode), function (messageNode) {
			var messageName = messageNode.nodeName;
			var scName = messageNode.getAttribute('scname');
			var args = [];
			forEach(children(messageNode), function (argNode){
				args.push(parsePrim(argNode, testWorld));
			});
			testWorld.startCaps[scName].send([makeMessage[messageName].apply(null, args)]);
		});
		return testWorld;
	}
	
	function messageToString (message, ecName) {
		if(message.action == "setAssoc") {
			return message.action + "(" + message.key + ", " + message.value + ") at endCap: " + ecName;
		} else {
			return message.action + "(" + message.value + ") at endCap: " + ecName;
		}
	}
	
	function parseExpectedMessages (actionNode, testWorld) {
		forEach(children(actionNode), function (messageNode) {
			var messageName = messageNode.nodeName;
			var ecName = messageNode.getAttribute('ecname');
			var args = [];
			forEach(children(messageNode), function (argNode){
				args.push(parsePrim(argNode, testWorld));
			});
			
			var messageToCheck = makeMessage[messageName].apply(null, args);
			
			if (testWorld.outMessages[ecName].length == 0) {
				testWorld.testOutput += "Error: Expected Message: " + messageToString(messageToCheck);
				testWorld.testOutput += ", but received NO Message\n";
			}
			else if (messagesEqual(testWorld.outMessages[ecName][0], messageToCheck)) {
				testWorld.testOutput += "Confirmed Message: " + messageToString(messageToCheck, ecName) + "\n";
				testWorld.outMessages[ecName].shift();
			} else {
				testWorld.testOutput += "Error: Expected Message: " + messageToString(messageToCheck);
				testWorld.testOutput += ", but received Message: " + messageToString(testWorld.outMessages[ecName][0]) + "\n";
			}
		});
		return testWorld;
	}
	
	function parseRemoveCap (actionNode, testWorld) {
		return testWorld;
	}

	
	function parseAndRun(xml) {
		var testNodes = xpath("test", xml);

		forEach(testNodes, function (testNode) {
			var testWorld = {startCaps:{}, endCaps:{}, outMessages:[], testOutput:""};
			forEach(children(testNode), function (actionNode) {
				var action = actionNode.nodeName;
				if (action == 'startcap') {
					testWorld = parseStartCap(actionNode, testWorld);
				} else if (action == 'endcap') {
					testWorld = parseEndCap(actionNode, testWorld);
				} else if (action == 'messages') {
					testWorld = parseMessages(actionNode, testWorld);
				} else if (action == 'expectedmessages') {
					testWorld = parseExpectedMessages(actionNode, testWorld);
				} else if (action == 'removecap') {
					testWorld = parseRemoveCap(actionNode, testWorld);
				}
			});
			var testName = testNode.getAttribute("name");
			console.log("Test", testName, "complete. Results: ");
			console.log(testWorld.testOutput);
		});
	}

	
	
	return function () {
		var xml = loadXMLNow(filename);
		parseAndRun(xml);
	}();
}