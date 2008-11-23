


var sc = makeStartCap("Assoc");


sc.send([makeMessage.setAssoc(2, 'andrew')]);
sc.send([makeMessage.setAssoc(1, 'matt')]);
sc.send([makeMessage.setAssoc(3, 'toby')]);

/*
var setCap0 = makeStartCap(parse("Unit Bool"));
setCap0.send([makeMessage.set(false)]);

var setCap1 = makeStartCap(parse("Unit Bool"));
setCap1.send([makeMessage.set(false)]);

var setCap2 = makeStartCap(parse("Unit Bool"));
setCap2.send([makeMessage.set(true)]);
*/

var add = function (val1) {
	return function (val2) {
		return val1 + val2;
	};
};


function processor (messages) {
	forEach(messages, function (message) {
		console.log("Got Message: ", message.action, message.value);
	});
}

var ec = makeEndCap(sc, processor);