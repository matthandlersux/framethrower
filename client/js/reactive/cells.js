var CELLCOUNT = 0;
var CELLSCREATED = 0;

function makeBaseCell (toKey) {
	CELLCOUNT++;
	CELLSCREATED++;
	var cell = {kind: "startCap", remote: 2, name: localIds()};
	var funcs = {};
	var onRemoves = [];
	var dependencies = {};
	var funcColor = 0; //counter for coloring injected functions
	cell.isDone = false;

	cell.onRemoves = onRemoves;

	//temp debug functions
	cell.getFuncs = function(){return funcs;};

	var addFirstLine = function (dot) {
		forEach(funcs, function (func, id) {
			runFunOnDot(dot, func.func, id);
		});
	};

	var removeLastLine = function(dot) {
		forEach(funcs, function (func, id) {
			undoFunOnDot(dot, id);
		});
	};

	var dots = makeRangedSet(addFirstLine, removeLastLine);

	cell.clearRange = function () {
		dots.clearRange();
	};
	
	cell.setPosRange = function (start, end) {
		dots.setPosRange(start, end);
	};
	
	cell.setKeyRange = function (start, end) {
		dots.setKeyRange(start, end);
	};
	
	cell.getIndex = function (key) {
		return dots.getIndex(key);
	};
	
	cell.makeSorted = function () {
		dots.makeSorted();
	};
	
	cell.leash = function() {
		cell.addDependency("leash", 1);
	};
	
	cell.unleash = function() {
		cell.done("leash", 1);
	};
	
	
	// ----------------------------------------------------------------------
	//  Function: inject
	//  Purpose: Injects a function to be run on all dots in the cell, and a depender to inform when the cell is done
	//  			If the depender is a cell, this also injects on onRemove into depender to inform this cell when depender dies
	//  Args: Depender is cell | function (use an empty function if there is no dependency behavior))
	//  Returns: A function to remove this injected function
	// ----------------------------------------------------------------------	
	//if cell is of type Unit a or Set a, f is a function that takes one argument key::a
	//if cell is of type Map a b, f is a function that takes one javascript object: {key::a, val::b}
	//f(k) or f({key=k,val=v}) returns a callback function that will be called when k is removed from the Unit/Set/Map
	cell.inject = function (depender, f) {
		var id = funcColor++;
		if (depender.addDependency) {
			depender.addDependency(cell, id);
		}
		funcs[id] = {func:f, depender:depender};
		if (f !== undefined) {
			dots.forRange(function (dot, key) {
				if(dot.num > 0) {
					runFunOnDot(dot, f, id);
				}
			});
		}
		informDepender(depender, cell, id);
		var onRemove = function () {
			cell.removeFunc(id);
		};
		return onRemove;
	};

	// ----------------------------------------------------------------------
	//  Function: injectDependency
	//  Purpose: Set up the same dependency behavior as with inject, but not tied to any injected function
	//  Args: Depender is cellPointer | function
	//  Returns: A function to remove this dependency
	// ----------------------------------------------------------------------
	cell.injectDependency = function (depender) {
		cell.inject(depender, undefined);
	};


	function informDepender(depender, cell, funcId) {
		if (depender.done) {
			depender.done(cell, funcId);
		} else {
			//depender is a function
			depender();
		}
	}


	cell.addOnRemove = function (onRemove) {
		onRemoves.push(onRemove);
	};
	
	cell.addDependency = function (depCell, id) {
		if(depCell.name !== undefined) {
			dependencies[depCell.name + "," + id] = true;
		} else {
			dependencies[depCell + "," + id] = true;
		}
	};
	
	cell.removeFunc = function (id) {
		var depender = funcs[id].depender;
		if (depender.done !== undefined) {
			depender.done(cell, id);
		}
		delete funcs[id];
		dots.forRange(function (dot, key) {
			undoFunOnDot(dot, id);
		});
		if (isEmpty(funcs) && !cell.persist) {
			// console.log("removing a cell");
			CELLCOUNT--;
			forEach(onRemoves, function(onRemove) {
				onRemove();
			});
		}
	};

	function checkDone() {
		if (isEmpty(dependencies)) {
			cell.isDone = true;
			forEach(funcs, function(func, funcId) {
				informDepender(func.depender, cell, funcId);
			});
		}
	};

	cell.done = function (doneCell, id) {
		delete dependencies[doneCell.name + "," + id];
		checkDone();
	};

	cell.setDone = function () {
		if (!cell.isDone) {
			cell.isDone = true;
			forEach(funcs, function(func, funcId) {
				informDepender(func.depender, cell, funcId);
			});
		}
	};

	cell.addLine = function (value) {
		var key = toKey(value);
		var dot = dots.get(key);
		if (dot !== undefined && dot.num != 0) {
			dot.num++;
		} else {
			dot = {val:value, num:1, lines:{}};
			dots.set(key, dot);
			if (dots.inRange(key)) {
				addFirstLine(dot);
			}
		}
		return function () {
			cell.removeLine(key);
		};
	};
	
	cell.removeLine = function (key) {
		var dot = dots.get(key);
		if(dot != undefined) {
			dot.num--;
			if(dot.num == 0) {
				dots.remove(key);
				if (dots.inRange(key)) {
					removeLastLine(dot);
				}
			}
		}
	};
	
	var runFunOnDot = function (dot, func, id) {
		var value = dot.val;
		var onRemove = func(value);
		if (onRemove !== undefined) {
			if (onRemove.func) {
				dots.get(toKey(value)).lines[id] = onRemove.func;
			} else {
				var temp = dots.get(toKey(value));
				if(temp == undefined) {
					console.log("Dot num", dot.num);
				}
				temp.lines[id] = onRemove;
			}
		}
	};
	
	var undoFunOnDot = function (dot, id) {
		if (dot !== undefined) {
			var removeFunc = dot.lines[id];
			if (removeFunc) {
				removeFunc();
			}
			delete dot.lines[id];
		}
	};
	
	//GetState for DEBUG (and for convertExprXML.js)
	cell.getState = function () {
		return map(dots.toArray(), function (x) {return x.v.val;});
	};
	
	return cell;
}

function makeCell() {
	var toKey = function (value) {
		return value;
	};
	
	return makeBaseCell(toKey);
}

function makeCellMapInput() {
	var toKey = function (value) {
		return value.key;
	};

	return makeBaseCell(toKey);
}