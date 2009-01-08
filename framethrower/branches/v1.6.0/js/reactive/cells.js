function makeBaseCell (toKey) {
	var cell = {kind: "startCap"};
	var funcs = makeObjectHash();
	var onRemoves = [];
	var funcColor = 0; //counter for coloring injected functions

	var onAdd = function (val) {
		funcs.forEach(function (func, id) {
			addLineResponse(val, func, id);
		});
	};

	var onRemove = function(key) {
		funcs.forEach(function (func, id) {
			removeLineResponse(key, id);
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
	
	cell.injectFunc = function (f) {
		var id = funcColor++;
		funcs.set(id, f);
		dots.forRange(function (dot, key) {
			if(dot.num > 0) {
				addLineResponse(dot.val, f, id);
			}
		});
		
		return function () {
			cell.removeFunc(id);
		};
	};
	
	cell.addOnRemove = function (onRemove) {
		onRemoves.push(onRemove);
	};
	
	cell.removeFunc = function (id) {
		funcs.remove(id);
		dots.forRange(function (dot, key) {
			removeLineResponse(key, id);
		});
		if (funcs.isEmpty() && !cell.persist) {
			forEach(onRemoves, function(onRemove) {
				onRemove();
			});
		}
	};

	cell.addLine = function (value) {
		var key = toKey(value);
		var dot = dots.get(key);
		if (dot !== undefined && dot.num != 0) {
			dot.num++;
		} else {
			dots.set(key, {val:value, num:1, lines:makeObjectHash()});
			if (dots.inRange(key)) {
				onAdd(value);
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
				if (dots.inRange(key)) {
					onRemove(key);
				}
				dots.remove(key);
			}
		}
	};
	
	var addLineResponse = function (value, func, id) {
		var onRemove = func(value);
		if (onRemove !== undefined) {
			dots.get(toKey(value)).lines.set(id, onRemove);
		}
	};
	
	var removeLineResponse = function (key, id) {
		var dot = dots.get(key);
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