function debugShow(objects) {
	
}

function testConsistency(objects) {
	forEach(objects, function (o) {
		var input = o.getInput();
		var func = o.getFunc();
		if (input && func) {
			assert(input.debug().asInput[func.getId()] === o);
			assert(func.debug().asFunc[input.getId()] === o);
		}
	});
}

function assert(bool) {
	if (!bool) {
		throw "Assert failed";
	}
}