function makeBaseCell (toKey) {
	var cell = {kind: "startCap"};
	var funcs = makeObjectHash();
	var dots = makeObjectHash();
	var funcColor = 0; //counter for coloring injected functions
	
	cell.injectFunc = function (f) {
		var id = funcColor++;
		funcs.set(id, f);
		dots.forEach(function (dot, key) {
			if(dot.num > 0) {
				addLineResponse(dot.val, f, id);
			}
		});		
		
		return function () {
			cell.removeFunc(id);
		};
	};
	
	cell.removeFunc = function (id) {
		var fun = funcs.get(id);
		funcs.remove(id);
		dots.forEach(function (dot, key) {
			removeLineResponse(key, fun, id);
		});
	};

	cell.addLine = function (value) {
		var key = toKey(value);
		var dot = dots.get(key);
		if (dot !== undefined && dot.num != 0) {
			dot.num++;
		} else {
			dots.set(key, {val:value, num:1, lines:makeObjectHash()});
			funcs.forEach(function (func, id) {
				addLineResponse(value, func, id);
			});
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
				funcs.forEach(function (func, id) {
					removeLineResponse(key, func, id);
				});
				dots.remove(key);
			}
		}
	};
	
	var addLineResponse = function (value, func, id) {
		var onRemove = func(value);
		if (onRemove != undefined) {
			dots.get(toKey(value)).lines.set(id, onRemove);
		}
	};
	
	var removeLineResponse = function (key, func, id) {
		var dot = dots.get(key);
		if (dot != undefined) {
			dot.lines.get(id)();
			dot.lines.remove(id);
		}
	};
	
	//GetState for DEBUG
	cell.getState = function () {
		return dots.toArray();
	};
	
	return cell;
}

function makeCell () {
	var toKey = function (value) {
		return value;
	};
	
	return makeBaseCell(toKey);
}

function makeCellAssocInput () {
	var toKey = function (value) {
		return value.key;
	};
		
	return makeBaseCell(toKey);
}

function applyFunc (func, input) {
	//this will be changed...
	return evaluate(makeApply(func, input));
}