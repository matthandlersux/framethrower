
function makeStartCap (type, getState) {
	var startCap = {};
	
	var informs = makeObjectHash();
	var state;
	if (!getState) {
		state = makeState(type);
	}
	
	function catchUp (endCap, messages) {
		endCap.send(messages);
	}
	
	startCap.send = function (messages) {
		if (state) {
			//keep track of messages
			state.update(messages);
		}
		informs.forEach(function (endCap) {
			endCap.send(messages);
		});
	};

	startCap.addInform = function (endCap) {
		informs.set(endCap, endCap);
		if (state) {
			catchUp(endCap, state.get());
		} else {
			catchUp(endCap, getState());
		}
	};
	
	startCap.removeInform = function (endCap) {
		informs.remove(endCap);
	};
	
	// ==================== For Debug
	startCap.getState = function () {
		if (state) {
			return state.get();
		} else {
			return getState();
		}
	};

	startCap.getInforms = function () {
		return informs.toArray();
	};
	
	return startCap;
}


function makeEndCap (startCap, processor) {
	var endCap = {};
	
	endCap.send = function (messages) {
		processor(messages);
	};
	
	endCap.deactivate = function () {
		startCap.removeInform(endCap);
	};

	startCap.addInform(endCap);
	
	return endCap;
}


function applyFunc (func, input) {
	//this will be changed...
	return func(input);
}