function makeBaseCell (toKey) {
	var cell = {kind: "startCap", remote: 2};
	var funcs = makeObjectHash();
	var onRemoves = [];
	var funcColor = 0; //counter for coloring injected functions

	var onAdd = function (dot) {
		funcs.forEach(function (func, id) {
			addLineResponse(dot, func, id);
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
	
	//if cell is of type Unit a or Set a, f is a function that takes one argument key::a
	//if cell is of type Map a b, f is a function that takes one javascript object: {key::a, val::b}
	//f(k) or f{key=k,val=v}) returns a callback function that will be called when k is removed from the Unit/Set/Map
	cell.injectFunc = function (f) {
		var id = funcColor++;
		funcs.set(id, f);
		dots.forRange(function (dot, key) {
			if(dot.num > 0) {
				addLineResponse(dot, f, id);
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
			removeLineResponse(dot, id);
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
			dots.get(toKey(value)).lines.set(id, onRemove);
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