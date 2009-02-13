function makeBaseCell (toKey) {
	var cell = {kind: "startCap", remote: 2, name: localIds()};
	var funcs = makeObjectHash();
	var onRemoves = makeObjectHash();
	var funcColor = 0; //counter for coloring injected functions
	cell.isDone = false;

	cell.onRemoves = onRemoves;

	//temp debug functions
	cell.getFuncs = function(){return funcs;};

	var onAdd = function (dot) {
		funcs.forEach(function (func, id) {
			addLineResponse(dot, func.func, id);
		});
	};

	var onRemove = function(dot) {
		funcs.forEach(function (func, id) {
			removeLineResponse(dot, id);
		});
	};

	var dots = makeRangedSet(onAdd, onRemove);

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
	
	
	
	cell.injectFuncOnRemove = function (depender) {
		var id = funcColor++;
		var onRemove = {
			func:function () {
				cell.removeFunc(id);
			},
			cell:cell,
			id:id,
			done:false
		};
		if (depender.addOnRemove) {
			depender.addOnRemove(onRemove);
		}
		return onRemove;
	};
	
	cell.injectFuncHelper = function (depender, f, id) {
		funcs.set(id, {func:f, depender:depender});		
		dots.forRange(function (dot, key) {
			if(dot.num > 0) {
				addLineResponse(dot, f, id);
			}
		});
		if (cell.isDone) {
			if (depender.done) {
				depender.done(cell, id);
			} else {
				//depender is a function
				depender();
			}
		}
	};
	
	//if cell is of type Unit a or Set a, f is a function that takes one argument key::a
	//if cell is of type Map a b, f is a function that takes one javascript object: {key::a, val::b}
	//f(k) or f{key=k,val=v}) returns a callback function that will be called when k is removed from the Unit/Set/Map
	cell.injectFunc = function (depender, f) {
		var onRemove = cell.injectFuncOnRemove(depender);
		var id = onRemove.id;
		cell.injectFuncHelper(depender, f, id);
		return onRemove;
	};
	
	injectFuncs = function (depender, cellFuncs) {
		forEach(cellFuncs, function (cellFunc) {
			var onRemove = cellFunc.cell.injectFuncOnRemove(depender);
			cellFunc.id = onRemove.id;
		});
		forEach(cellFuncs, function (cellFuncId) {
			cellFuncId.cell.injectFuncHelper(depender, cellFuncId.f, cellFuncId.id);
		});
	};
		
	
	cell.addOnRemove = function (onRemove) {
		if (onRemove.cell) {
			onRemoves.set(onRemove.cell.name + "," + onRemove.id, onRemove);
		} else {
			onRemoves.set(onRemove, onRemove);
		}
		if (onRemove.done == false) {
			cell.isDone = false;
		}
	};
	
	cell.removeFunc = function (id) {
		var depender = funcs.get(id).depender;
		if (depender.removeDependency) {
			depender.removeDependency(cell, id);
		}
		funcs.remove(id);
		dots.forRange(function (dot, key) {
			removeLineResponse(dot, id);
		});
		if (funcs.isEmpty() && !cell.persist) {
			onRemoves.forEach(function(onRemove) {
				if (onRemove.func) {
					onRemove.func();
				} else {
					onRemove();
				}
			});
		}
	};

	function checkDone() {
		var allDone = true;
		onRemoves.forEach(function(onRemove, key) {
			if (onRemove.done !== undefined) {
				allDone = allDone && onRemove.done;
			}
		});
		if (allDone) {
			cell.isDone = true;
			funcs.forEach(function(func, funcId) {
				if (func.depender) {
					if (func.depender.done) {
						func.depender.done(cell, funcId);
					} else {
						func.depender();
					}
				}
			});
		}
	};

	cell.removeDependency = function (inputCell, inputId) {
		onRemoves.remove(inputCell.name + "," + inputId);
		checkDone();
	};

	cell.done = function (doneCell, id) {
		if (!cell.isDone) {
			var onRemove = onRemoves.get(doneCell.name + "," + id);
			if (onRemove) {
				onRemove.done = true;
			}
			checkDone();
		}
	};

	cell.setDone = function () {
		if (!cell.isDone) {
			cell.isDone = true;
			funcs.forEach(function(func, funcId) {
				if (func.depender) {
					if (func.depender.done) {
						func.depender.done(cell, funcId);
					} else {
						func.depender();
					}
				}
			});
		}
	};

	cell.addLine = function (value) {
		var key = toKey(value);
		var dot = dots.get(key);
		if (dot !== undefined && dot.num != 0) {
			dot.num++;
		} else {
			dot = {val:value, num:1, lines:makeObjectHash()};
			dots.set(key, dot);
			if (dots.inRange(key)) {
				onAdd(dot);
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
					onRemove(dot);
				}
			}
		}
	};
	
	var addLineResponse = function (dot, func, id) {
		var value = dot.val;
		var onRemove = func(value);
		if (onRemove !== undefined) {
			if (onRemove.func) {
				dots.get(toKey(value)).lines.set(id, onRemove.func);
			} else {
				dots.get(toKey(value)).lines.set(id, onRemove);
			}
		}
	};
	
	var removeLineResponse = function (dot, id) {
		if (dot !== undefined) {
			var removeFunc = dot.lines.get(id);
			if (removeFunc) {
				removeFunc();
			}
			dot.lines.remove(id);
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