// serialize :: a -> Unit String

/*
uses cell.getState() recursively to generate a string representation for the cell
*/
function convertStateToString(cell) {
	var lit = unparseLiteral(cell);
	if (lit !== undefined) {
		if (typeOf(cell) === "string") return cell;
		else return lit;
	} else {
		var type = getType(cell);
		if (isReactive(type)) {
			var constructor = getTypeConstructor(type);
			
			cell.makeSorted();
			var state = cell.getState();
			
			if (constructor === "Unit" || constructor === "Future") {
				var ret = "";
				forEach(state, function (entry) {
					ret = convertStateToString(entry);
				});
				return ret;
			} else if (constructor === "Set") {
				var ret = [];
				forEach(state, function (entry) {
					ret.push(convertStateToString(entry));
				});
				return "[" + ret.join(", ") + "]";
			} else if (constructor === "Map") {
				var ret = [];
				forEach(state, function (entry) {
					ret.push(convertStateToString(entry.key) + ": " + convertStateToString(entry.val));
				});
				return "{" + ret.join(", ") + "}";
			}
		} else {
			return stringify(cell);
		}
	}
}



/*
uses cell.getState() recursively to generate a JSON-ish representation for the cell
	Units, Futures, and Sets turn into arrays [],
	Maps turn into arrays of {key: --, value: --}
*/
function convertStateToJSON(cell) {
	var type = getType(cell);
	if (isReactive(type)) {
		var constructor = getTypeConstructor(type);
		
		cell.makeSorted();
		var state = cell.getState();
		
		if (constructor === "Unit" || constructor === "Future" || constructor === "Set") {
			var ret = [];
			forEach(state, function (entry) {
				ret.push(convertStateToJSON(entry));
			});
			return ret;
		} else if (constructor === "Map") {
			var ret = [];
			forEach(state, function (entry) {
				ret.push({key: convertStateToJSON(entry.key), value: convertStateToJSON(entry.val)});
			});
			return ret;
		}
	} else {
		return cell;
	}
}




/*
Sets up cell so that whenever cell is updated, or whenever one of its children cells is updated, callback gets called
Returns a function to remove this behavior.
*/
function callOnUpdate(cell, depender, callback) {
	function listenToCell(c) {
		// TODO: at some point we need to do a total audit on whether things get removed correctly w.r.t. cells and injected functions
		
		// TODO: not sure how depender works...

		// returns a function to stop listening to the cell
		c = evaluate(c);

		setTimeout(session.flush,0);

		var childRemovers = [];

		var removeFunc = c.inject(depender, function (x) {
			callback();
			if (x && x.key !== undefined && x.val !== undefined) {
				// we have a Map entry
				var entryNums = [];

				if (isReactive(getType(x.key))) {
					var keyRemover = listenToCell(x.key);
					entryNums.push(childRemovers.length);
					childRemovers.push(keyRemover);
				}
				if (isReactive(getType(x.val))) {
					var valRemover = listenToCell(x.val);
					entryNums.push(childRemovers.length);
					childRemovers.push(valRemover);
				}
				return function () {
					callback();
					forEach(entryNums, function (entryNum) {
						childRemovers[entryNum]();
						childRemovers[entryNum] = null;
					});
				};
			} else {
				var entryNum;
				if (isReactive(getType(x))) {
					entryNum = childRemovers.length;
					childRemovers.push(listenToCell(x));
				}
				return function () {
					callback();
					if (entryNum) {
						childRemovers[entryNum]();
						childRemovers[entryNum] = null;
					}
				};
			}
		});
		return function () {
			forEach(childRemovers, function (childRemover) {
				if (childRemover) childRemover();
			});
			removeFunc.func();
		};
	}
	
	return listenToCell(cell);
}




function convertHelper(converter) {
	return function (cell) {
		var outputCell = makeControlledCell("Unit String");

		var called = false;
		function callback() {
			called = true;
			var s = converter(cell);
			outputCell.control.add(s);
		}

		callOnUpdate(cell, outputCell, callback);
		if (!called) callback(); // so that it's at least called once

		return outputCell;	
	};
}


addFun("serialize", "a -> Unit String", convertHelper(convertStateToString));

addFun("jsonify", "a -> Unit JSON", function (cell) {
	var outputCell = makeControlledCell("Unit JSON");
	
	callOnUpdate(cell, outputCell, function () {
		var s = convertStateToJSON(cell);
		outputCell.control.add(s);
	});
	
	return outputCell;	
});




// takes a function and returns a function that takes the same arguments but all as Unit's and returns its value (of type outputType) as a Unit.
// Then whenever all the Unit's are occupied, the output Unit is occupied. If any input is not occupied, output is not occupied.
// numArgs is optional
function mapUnitJS(f, outputType, numArgs) {
	if (numArgs === undefined) numArgs = f.length;
	return function () {
		var args = arguments;
		
		var currentValue;
		var outputCell = makeCell();
		outputCell.type = makeTypeApply(parseType("Unit"), outputType);
		
		var inputs = [];
		
		function update() {
			var allDone = all(args, function (arg, i) {
				return inputs[i] !== undefined; 
			});
			if (allDone) {
				if (currentValue !== undefined) outputCell.removeLine(currentValue);
				currentValue = f.apply(null, inputs);
				outputCell.addLine(currentValue);
			} else {
				if (currentValue !== undefined) {
					outputCell.removeLine(currentValue);
					currentValue = undefined;
				}
			}
		}
		
		forEach(args, function (arg, i) {
			arg.inject(outputCell, function (val) {
				inputs[i] = val;
				update();
				return function () {
					inputs[i] = undefined;
					update();
				};
			});
		});
		
		return outputCell;
	};
}