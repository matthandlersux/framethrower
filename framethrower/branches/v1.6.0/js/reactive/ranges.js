function makeRangedSet(onAdd, onRemove) {
	var sSet = makeSortedSetStringify();
	var range;
	
	var forInd = function (startInd, endInd, f) {
		for (; startInd <= endInd; startInd++) {
			f(sSet.getByIndex(startInd), sSet.getKeyByIndex(startInd));
		}
	};
	
	var forCustomRange = function (range, f) {
		if (range == undefined) {
			sSet.forEach(f);
			return;
		}
		if (range.type == 'key') {
			forInd(sSet.getIndex(range.start), sSet.getIndex(range.end), f);
		} else {
			forInd(range.start, range.end, f);
		}		
	};
	
	var removeRange = function (range) {
		forCustomRange(range, function(dot, key) {
			onRemove(key);
		});
	};
	
	var addRange = function (range) {
		forCustomRange(range, function(dot, key) {
			onAdd(dot.val);
		});
	};
	
	sSet.forRange = function (f) {
		forCustomRange(range, f);
	};
	
	sSet.inRange = function (key) {
		if (range == undefined) return true;
		var curInd = sSet.getIndex(key);
		if (range.type = 'key') {
			return (curInd >= sSet.getIndex(range.start) && curInd <= sSet.getIndex(range.end));
		} else {
			return (curInd >= range.start && curInd <= range.end);
		}
	};
	
	sSet.updateRange = function (oldRange, newRange) {
		if (newRange.start > oldRange.end || newRange.end < oldRange.start) {
			removeRange(oldRange);
			addRange(newRange);
		} else {
			if (newRange.start > oldRange.start) {
				removeRange({start:oldRange.start, end:newRange.start-1, type:'pos'});
			} else if (newRange.start < oldRange.start){
				addRange({start:newRange.start, end:oldRange.start-1, type:'pos'});
			}
			if (oldRange.end > newRange.end) {
				removeRange({start:newRange.end+1, end:oldRange.end, type:'pos'});
			} else if (oldRange.end < newRange.end){
				addRange({start:oldRange.end+1, end:newRange.end, type:'pos'});
			}
		}
	};
	
	sSet.clearRange = function () {
		var oldRange;
		if (range.type == 'pos') {
		 	oldRange = range;
		} else {
			oldRange = {start:sSet.getIndex(range.start), end:sSet.getIndex(range.end), type:'pos'};
		}
		var newRange = {start:0, end:sSet.length, type:'pos'};

		sSet.updateRange(oldRange, newRange);
		
		range = undefined;
	};
	
	sSet.setPosRange = function (start, end) {
		var oldRange;
		if (range) {
			oldRange = range;
		} else {
			oldRange = {start:0, end:sSet.length, type:'pos'};
		}
		range = {start:start, end:end, type:'pos'};
		
		sSet.updateRange(oldRange, range);
	};
	
	sSet.setKeyRange = function (start, end) {
		var oldRange;
		if (range) {
			oldRange = {start:sSet.getIndex(range.start), end:sSet.getIndex(range.end), type:'pos'};
		} else {
			oldRange = {start:0, end:sSet.length, type:'pos'};
		}
		range = {start:start, end:end, type:'key'};
		newRange = {start:sSet.getIndex(start), end:sSet.getIndex(end), type:'pos'};
		sSet.updateRange(oldRange, newRange);
	};
	
	return sSet;
}