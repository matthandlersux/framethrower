function makeBaseCell (toKey) {
	var cell = {kind: "startCap"};
	var funcs = makeObjectHash();
	var dots = makeSortedSetStringify();
	var funcColor = 0; //counter for coloring injected functions
	var range;
	
	var removeRange = function (range) {
		forRange(range, dots, function(dot, key) {
			funcs.forEach(function (func, id) {
				removeLineResponse(key, func, id);
			});
		});
	};
	
	var addRange = function (range) {
		forRange(range, dots, function(dot, key) {
			funcs.forEach(function (func, id) {
				addLineResponse(dot.val, func, id);
			});
		});
	};
	
	var updateRange = function (oldRange, newRange) {
		if (range.start > oldRange.end || range.end < oldRange.start) {
			removeRange(oldRange);
			addRange(range);
		} else {
			if (range.start > oldRange.start) {
				removeRange({start:oldRange.start, end:range.end, type:'pos'});
			} else {
				addRange({start:range.start, end:oldRange.start, type:'pos'});
			}
			if (oldRange.end > range.end) {
				removeRange({start:range.start, end:oldRange.end, type:'pos'});
			} else {
				addRange({start:oldRange.end, end:range.end, type:'pos'});
			}
		}		
	};
	
	cell.setPosRange = function (start, end) {
		var oldRange;
		if (range) {
			oldRange = range;
		} else {
			oldRange = {start:0, end:dots.length, type:'pos'};
		}
		range = {start:start, end:end, type:'pos'};
		updateRange(oldRange, range);
	};
	
	cell.clearRange = function () {
		var oldRange;
		if (range.type == 'pos') {
		 	oldRange = range;
		} else {
			oldRange = {start:dots.getIndex(range.start), end:dots.getIndex(range.end), type:'pos'};
		}
		var newRange = {start:0, end:dots.length, type:'pos'};

		range = undefined;
		updateRange(oldRange, newRange);
	};
	
	cell.setKeyRange = function (start, end) {
		var oldRange;
		if (range) {
			oldRange = {start:dots.getIndex(range.start), end:dots.getIndex(range.end), type:'pos'};
		} else {
			oldRange = {start:0, end:dots.length, type:'pos'};
		}
		range = {start:start, end:end, type:'key'};
		newRange = {start:dots.getIndex(start), end:dots.getIndex(end), type:'pos'};
		updateRange(oldRange, newRange);
	};
	
	var forRange = function (range, hash, f) {
		if (range != undefined) {
			if (range.type = 'key') {
				var startInd = hash.getIndex(range.start);
				var endInd = hash.getIndex(range.end);
				for (; startInd <= endInd; startInd++) {
					f(hash.getByIndex(startInd), hash.getKeyByIndex(startInd));
				}
			} else {
				var startInd = range.start;
				var endInd = range.end;
				for (; startInd <= endInd; startInd++) {
					f(hash.getByIndex(startInd), hash.getKeyByIndex(startInd));
				}
			}
		} else {
			hash.forEach(f);
		}
	};
	
	var inRange = function (key) {
		if (range) {
			var startInd;
			var endInd;
			if (range.type = 'key') {
				startInd = hash.getIndex(range.start);
				endInd = hash.getIndex(range.end);
			} else {
				startInd = range.start;
				endInd = range.end;
			}
			var curInd = hash.getIndex(key);
			return (curInd >= startInd && curInd <= endInd);
		} else {
			return true;
		}
	};
	
	cell.injectFunc = function (f) {
		var id = funcColor++;
		funcs.set(id, f);
		
		forRange(range, dots, function (dot, key) {
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
		forRange(range, dots, function (dot, key) {
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
			if (inRange(key)) {
				funcs.forEach(function (func, id) {
					addLineResponse(value, func, id);
				});
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
				if (inRange(key)) {
					funcs.forEach(function (func, id) {
						removeLineResponse(key, func, id);
					});
				}
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