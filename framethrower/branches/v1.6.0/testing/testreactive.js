function onRemove () {
	console.log("onRemove");
}

var getState = undefined;

var type = parse("Set String");

var sc = makeStartCap(type, onRemove, getState);

sc.send([makeMessage.set("hello"), makeMessage.set("goodbye")]);


function processor (messages) {
	forEach(messages, function (message) {
		console.log("Got Message: ", message.action, message.value);
	});
}

var ec = makeEndCap(sc, processor);