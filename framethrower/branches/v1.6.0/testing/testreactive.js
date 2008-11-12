

var returnSet = makeFun("a -> Set a", function(val){
	var sc = applyFunc(primFuncs.returnUnit, val);
	return applyFunc(primFuncs.returnUnitSet, sc);	
});

var sc = makeStartCap(parse("Set a"));
sc.send([makeMessage.set(0)]);
sc.send([makeMessage.set(1)]);


var setCap0 = makeStartCap(parse("Set a"));
setCap0.send([makeMessage.set("cap0 0")]);
setCap0.send([makeMessage.set("cap0 1")]);

var setCap1 = makeStartCap(parse("Set a"));
setCap1.send([makeMessage.set("cap1 0")]);
setCap1.send([makeMessage.set("cap1 1")]);


var getSet = makeFun("a -> Set a", function(val){
	if(val == 0){
		return setCap0;
	} else if (val == 1){
		return setCap1;
	}
});


var boundSet = applyFunc(applyFunc(primFuncs.bindSet, getSet), sc);


function processor (messages) {
	forEach(messages, function (message) {
		console.log("Got Message: ", message.action, message.value);
	});
}

var ec = makeEndCap(boundSet, processor);