function testFile(filename) {
	//helper functions
	
	var scPatternMatch = {};
	
	function children(xml) {
		return xpath("*", xml);
	}
	

	function messagesEqual(message1, message2) {
		var returnVal = true;
		var propCount = 0;
		
		forEach(message1, function(property, pname) {
			if(message2[pname] == undefined) {
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
	
	function parsePrim(primNode, testWorld) {
		var primName = primNode.nodeName;
		if (primName == 'number') {
			var numAsString = primNode.getAttribute('value');
			return parseFloat(numAsString, 10);
		} else if (primName == 'bool') {
			var boolAsString = primNode.getAttribute('value');
			return (boolAsString == 'true');
		} else if (primName == 'func') {
			var name = primNode.getAttribute('name');
			return testWorld.testEnv.env(name);
		}
		else if (primName == 'sc') {
			var name = primNode.getAttribute('name');
			if (!testWorld.startCaps[name]) {
				return {
					scPatternMatch : scPatternMatch,
					callBack : function (inCap) {
						testWorld.startCaps[name] = inCap;
						testWorld.testEnv.add(name, inCap);
					}
				};
			}
			return testWorld.startCaps[name];
		} else if (primName == 'undefined') {
			return undefined;
		} else if (primName == 'null') {
			return nullObject;
		}
		//TODO: add other primitive types
	}
	
	function parseStartCap(actionNode, testWorld) {
		var scname = actionNode.getAttribute('name');
		var sctype = actionNode.getAttribute('type');

		var sctypeFirstWord = sctype.split(" ")[0];

		//testWorld.startCaps[scname] = makeStartCap(sctypeFirstWord);
		if(sctypeFirstWord == 'map') {
			testWorld.startCaps[scname] = makeCellMapInput();
		} else {
			testWorld.startCaps[scname] = makeCell();
		}
		
		testWorld.startCaps[scname].type = parseType(sctype);
		
		// make this more functional
		testWorld.testEnv.add(scname, testWorld.startCaps[scname]);
		return testWorld;
	}

	function parseEndCap(actionNode, testWorld) {
		var endCapName = actionNode.getAttribute('name');
		var expression = actionNode.getAttribute('expression');

		var scFromExp = evaluate(parseExpr(expression, testWorld.testEnv.env));

		testWorld.outMessages[endCapName] = [];

		var doneResponse = function() {
			debug.log("DONE Message from: " + endCapName);
		};

		scFromExp.injectFunc(doneResponse, function(keyVal) {
			if(keyVal.key != undefined && keyVal.val != undefined) {
				testWorld.outMessages[endCapName].push({action:'set', key:keyVal.key, value:keyVal.val});
			} else {
				testWorld.outMessages[endCapName].push({action:'set', key:keyVal});
			}
			return function () {
				if(keyVal.key != undefined && keyVal.val != undefined) {
					testWorld.outMessages[endCapName].push({action:'remove', key:keyVal.key});
				} else {
					testWorld.outMessages[endCapName].push({action:'remove', key:keyVal});
				}
			};
		});
		
		return testWorld;
	}
	
	function parseMessages(actionNode, testWorld) {
		forEach(children(actionNode), function (messageNode) {
			var messageName = messageNode.nodeName;
			var scName = messageNode.getAttribute('scname');
			
			var args = [];
			forEach(children(messageNode), function (childNode) {
				args.push(parsePrim(childNode, testWorld));
			});

			var value;
			if(args.length == 2) {
				value = {key:args[0], val:args[1]};
			} else if (args.length == 1) {
				value = args[0];
			}
			
			
			//testWorld.startCaps[scName].send([makeMessage[messageName].apply(null, args)]);
			if (messageName == "set") {
				testWorld.startCaps[scName].addLine(value);
			} else if (messageName == "remove") {
				testWorld.startCaps[scName].removeLine(value);
			}
		});
		return testWorld;
	}
	
	// hack for better test output for null objects
	nullObject.toString = function() {
		return "nullObj";
	};
	
	function messageToString(message, ecName) {
		if(message.value != undefined) {
			return message.action + "(" + message.key + ", " + message.value + ") at endCap: " + ecName;
		} else if (message.key != undefined) {
			//return message.action + "(" + message.value + ") at endCap: " + ecName;
			return message.action + "(" + message.key + ") at endCap: " + ecName;
		} else {
			return message.action + " at endCap: " + ecName;
		}
	}
	
	function parseExpectedMessages(actionNode, testWorld) {
		forEach(children(actionNode), function (messageNode) {
			var messageName = messageNode.nodeName;
			var ecName = messageNode.getAttribute('ecname');

			var childNodes = children(messageNode);
			var args = [];
			forEach(children(messageNode), function (childNode) {
				args.push(parsePrim(childNode, testWorld));
			});
			var messageToCheck;
			if(args.length == 2) {
				messageToCheck = {action:messageName, key:args[0], value:args[1]};
			} else if (args.length == 1) {
				messageToCheck = {action:messageName, key:args[0]};
			} else {
				messageToCheck = {action:messageName};
			}

			if (testWorld.outMessages[ecName] == undefined || (testWorld.outMessages[ecName].length == 0 && messageToCheck.action == 'none')) {
				testWorld.testOutput += "Confirmed Message: " + messageToString(messageToCheck, ecName) + "\n";
			}
			else if (testWorld.outMessages[ecName] == undefined || testWorld.outMessages[ecName].length == 0) {
				testWorld.testOutput += "Error: Expected Message: " + messageToString(messageToCheck, ecName);
				testWorld.testOutput += ", but received NO Message\n";
			}
			else if (messagesEqual(testWorld.outMessages[ecName][0], messageToCheck)) {
				testWorld.testOutput += "Confirmed Message: " + messageToString(messageToCheck, ecName) + "\n";
				testWorld.outMessages[ecName].shift();
			} else {
				testWorld.testOutput += "Error: Expected Message: " + messageToString(messageToCheck, ecName);
				testWorld.testOutput += ", but received Message: " + messageToString(testWorld.outMessages[ecName][0], ecName) + "\n";
			}
		});
		return testWorld;
	}
	
	function parseRemoveCap(actionNode, testWorld) {
		return testWorld;
	}

	
	function parseAndRun(xml) {
		var testNodes = xpath("test", xml);

		forEach(testNodes, function (testNode) {
			var testWorld = {startCaps:{}, endCaps:{}, outMessages:[], testOutput:"", testEnv:makeDynamicEnv(base.env)};
			var testName = testNode.getAttribute("name");
			console.log("Test", testName, "starting.");
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
			console.log("Test", testName, "complete. Results: ");
			console.log(testWorld.testOutput);
			forEach(testWorld.startCaps, function(startCap) {
				startCap.setDone();
			});
		});
	}

	
	
	return function () {
		var xml = loadXMLNow(filename);
		parseAndRun(xml);
	}();
}