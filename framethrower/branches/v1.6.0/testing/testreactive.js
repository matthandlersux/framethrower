

var returnSet = makeFun("a -> Set a", function(val){
	var sc = applyFunc(primFuncs.returnUnit, val);
	return applyFunc(primFuncs.returnUnitSet, sc);	
});

var sc = makeStartCap(parse("Set a"));
sc.send([makeMessage.set(2)]);
sc.send([makeMessage.set(1)]);
sc.send([makeMessage.set(3)]);

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


var boundSet = applyFunc(applyFunc(applyFunc(primFuncs.fold, add), 0), sc);


function processor (messages) {
	forEach(messages, function (message) {
		console.log("Got Message: ", message.action, message.value);
	});
}

var ec = makeEndCap(boundSet, processor);