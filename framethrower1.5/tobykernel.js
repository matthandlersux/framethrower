function makeList(array) {
	function makeListWithIndex(a, i) {
		return {
			head: function () {
				return a[i];
			},
			tail: function () {
				return makeListWithIndex(a, i + 1);
			},
			isEmpty: function () {
				return i >= a.length;
			}
		};
	}
	return makeListWithIndex(array, 0);
}


var localIdGenerator = function () {
	var count = 0;
	return {
		get: function () {
			count += 1;
			return "local." + count;
		}
	};
};

var objectCache = {};


function makeObject(content, func, input) {
	var o = {};
	
	var id = localIdGenerator.get();
	objectCache[id] = o;
	o.getId = function () {
		return id;
	};
	
	o.getFunc = function () {
		return func;
	};
	o.getInput = function () {
		return input;
	};
	
	// keep track of connections
	var asInput = {};
	var asFunc = {};
	
	// informs tables, for queries
	var informAsInput = {};
	var informAsFunc = {};
	
	o.registerAsInput = function (func, result) {
		asInput[func.getId()] = result;
		// inform.....
	};
	
	o.registerAsFunc = function (input, result) {
		asFunc[input.getId()] = result;
		// inform..
	};
	
	
	
	
	function setContent(newContent) {
		content = newContent;
		// propagate the change
		forEach(asInput, function (result) {
			result.reevaluate();
		});
		forEach(asFunc, function (result) {
			result.reevaluate();
		});
	}
	
	o.getContent = function () {
		return content;
	};
	o.setContent = function (newContent) {
		if (!func && !input) {
			setContent(newContent);
		} else {
			throw "object cannot have its content set manually";
		}
	};
	
	
	// makes a result object from a func given an input
	o.runOnInput = function (input) {
		var inputId = input.getId();
		var alreadyDone = asFunc[inputId];
		if (alreadyDone) {
			return alreadyDone;
		} else {
			var result = makeObject(null, o, input);
			o.registerAsFunc(input, result);
			input.registerAsInput(o, result);
			result.reevaluate();
			return result;
		}
	};
	
	
	// should be called when a result object needs to reevaluate
	o.reevaluate = function () {
		setContent(runFuncOnInput(func, input));
	};
	
	return o;
}


function runFuncOnInput(func, input) {
	if (func.content.withContent) {
		return func.content.content(func, input, input.content);
	} else {
		return func.content.content(func, input);
	}
}


function makeContent(type, content, withContent, withEffects) {
	return {
		type: type,
		content: content,
		withContent: withContent,
		withEffects: withEffects
	};
}

// supply with a function f(self, p1, p2, ..., pn) and numArgs === n
function makeFunctionContent(f, numArgs) {	
	function make(f, numArgs, soFar) {
		return function (self, input) {
			soFar = soFar.slice(0); // copy soFar
			if (soFar.length === 0) {
				soFar.push(self);
			}
			soFar.push(input);
			numArgs -= 1;
			if (numArgs === 0) {
				return f.apply(null, soFar);
			} else {
				return make(f, numArgs, soFar);
			}
		};
	}
	return make(f, numArgs, []);
}

function makeRelationContent(numArgs) {
	return makeFunctionContent(function () {
		return makeInfonContent(arguments[0], Array.prototype.slice.apply(arguments, [1]));
	}, numArgs);
}

function makeInfonContent(rel, args) {
	return makeContent("infon", {
		relation: rel,
		parameters: args
	});
}