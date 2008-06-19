
function makeIdGenerator() {
	var gen = {};
	var count = 0;
	gen.get = function () {
		count += 1;
		return count;
	};
	return gen;
}


var qIds = makeIdGenerator();



function makeQ() {
	var q = {};
	
	var id = qIds.get();
	q.getId = function () {
		return id;
	};
	
	var inbound = makeObjectHash();
	var outbound = makeObjectHash();
	
	var output = makeObjectHash();
	
	q.addConnectIn = function (otherQ) {
		inbound.set(otherQ, otherQ);
		// catch the other Q up...
		output.forEach(function (o) {
			otherQ.inAdd(o);
		});
	};
	q.removeConnectIn = function (otherQ) {
		inbound.remove(otherQ);
	};
	
	q.addConnectOut = function (otherQ) {
		outbound.set(otherQ, otherQ);
	};
	q.removeConnectOut = function (otherQ) {
		outbound.remove(otherQ);
	};
	
	q.remove = function () {
		inbound.forEach(function (otherQ) {
			otherQ.removeConnectOut(q);
		});
		outbound.forEach(function (otherQ) {
			otherQ.removeConnectIn(q);
		});
		// remove from object cache?
	};
	
	q.outAdd = function (o) {
		output.set(o, o);
		outbound.forEach(function (otherQ) {
			otherQ.add(o);
		});
	};
	q.outRemove = function (o) {
		output.remove(o);
		outbound.forEach(function (otherQ) {
			otherQ.remove(o);
		});
	};
	
	return q;
}


function connectQs(inQ, outQ) {
	inQ.addConnectOut(outQ);
	outQ.addConnectIn(inQ);
}


function makeCrossReference() {
	var cr = {};
	
	var inputs = makeObjectHash();
	var outputs = makeObjectHash();
	
	cr.hasInput = function (input) {
		return inputs.get(input);
	};
	
	cr.addLink = function (input, output, callback) {
		inputs.getOrMake(input, makeObjectHash).set(output, output);
		outputs.getOrMake(output, makeObjectHash).set(input, input);
		callback(output);
	};
	
	function checkDead(output, callback) {
		var ins = outputs.get(output);
		if (ins.isEmpty()) {
			outputs.remove(output);
			callback(output);
		}
	}
	
	cr.removeLink = function (input, output, callback) {
		var outs = inputs.get(input);
		if (outs) {
			outs.remove(output);
			var ins = outputs.get(output);
			ins.remove(input);
			checkDead(output, callback);
		}
	};
	
	cr.removeInput = function (input, callback) {
		var outs = inputs.get(input);
		if (outs) {
			outs.forEach(function (output) {
				var ins = outputs.get(output);
				ins.remove(input);
				checkDead(output, callback);
			});
		}
		inputs.remove(input);
	};
	
	return cr;
}



// (Object -> [Object]) -> Q
function qLift(f) {
	var q = makeQ();
	
	var cr = makeCrossReference();
	
	q.inAdd = function (input) {
		if (!cr.hasInput(input)) {
			var outputList = f(input);
			forEach(outputList, function (output) {
				cr.link(input, output, q.outAdd);
			});
		}
	};
	
	q.inRemove = function (input) {
		cr.removeInput(input, q.outRemove);
	};
	
	return q;
}

function qUnion() {
	var q = makeQ();
	
	var cr = makeCrossReference();
	var inputs = makeObjectHash();
	
	q.inAdd = function (input) {
		inputs.getOrMake(input, function () {
			var qInner = makeQ();
			qInner.inAdd = function (innerInput) {
				cr.link(input, innerInput, q.outAdd);
			};
			qInner.inRemove = function (innerInput) {
				cr.removeLink(input, innerInput, q.outRemove);
			};
			return qInner;
		});
	};
	
	q.inRemove = function (input) {
		var qInner = inputs.get(input);
		qInner.remove();
		cr.removeInput(input, q.outRemove);
	};
	
	return q;
}

// (Object -> Q) -> Q
/*function qSelect(f) {
	var q = makeQ();
	
	var cr = makeCrossReference();
	
	q.inAdd = function (input) {
		if (!cr.inputs.get(input)) {
			var
		}
	};
}*/