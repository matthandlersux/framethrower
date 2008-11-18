function testFile(filename) {
	//helper functions
	
	function children (xml) {
		return xpath("*", xml);
	}
	
	function messagesEqual (message1, message2) {
		var argsCheck = true;
		forEach(message1, function(property, pname) {
			if(property != message2[pname]) {
				argsCheck = false;
			}
		});
		forEach(message2, function(property, pname) {
			if(property != message1[pname]) {
				argsCheck = false;
			}
		});
		return argsCheck;
	}
	
	
	//parse Functions
	
	function parsePrim (primNode) {
		var primName = primNode.nodeName;
		if(primName == 'number') {
			var numAsString = primNode.getAttribute('value');
			return parseFloat(numAsString, 10);
		}
		//TODO: add other primitive types
	}
	
	function parseStartCap (actionNode, testWorld) {
		var scname = actionNode.getAttribute('name');
		var sctype = actionNode.getAttribute('type');

		testWorld.startCaps[scname] = makeStartCap(parse(sctype));
		
		// make this more functional
		lookupTable[scname] = testWorld.startCaps[scname];
		
		return testWorld;
	}

	function parseEndCap (actionNode, testWorld) {
		var endCapName = actionNode.getAttribute('name');
		var expression = actionNode.getAttribute('expression');

		console.log(expression);

		var scFromExp = evaluate(parse(expression));

		function processor (messages) {
			forEach(messages, function (message) {
				console.log("Got Message: ", message.action, message.value);
				testWorld.outMessages.push(message);
			});
		}

		testWorld.endCaps[endCapName] = makeEndCap(scFromExp, processor);
		console.log('end cap setup');
		return testWorld;
	}
	
	function parseMessages (actionNode, testWorld) {
		forEach(children(actionNode), function (messageNode) {
			var messageName = messageNode.nodeName;
			var scName = messageNode.getAttribute('scname');
			var args = [];
			forEach(children(messageNode), function (argNode){
				args.push(parsePrim(argNode));
			});
			testWorld.startCaps[scName].send([makeMessage[messageName].apply(null, args)]);
		});
		return testWorld;
	}
	
	function parseExpectedMessages (actionNode, testWorld) {
		forEach(children(actionNode), function (messageNode) {
			var messageName = messageNode.nodeName;
			var ecName = messageNode.getAttribute('ecname');
			var args = [];
			forEach(children(messageNode), function (argNode){
				args.push(parsePrim(argNode));
			});
			
			var messageToCheck = makeMessage[messageName].apply(null, args);
			if (messagesEqual(testWorld.outMessages[0], messageToCheck)) {
				testWorld.testOutput += "Confirmed Message: " + messageToCheck.action + " " + messageToCheck.value + "\n";
				testWorld.outMessages.shift();
			} else {
				testWorld.testOutput += "Error: Expected Message: " + messageToCheck.action + " " + messageToCheck.value;
				testWorld.testOutput += ", but received Message: " + testWorld.outMessages[0].action + " " + testWorld.outMessages[0].value + "\n";
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