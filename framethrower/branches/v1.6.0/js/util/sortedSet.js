function makeSortedSet(compFunc) {
	var sorted = [];
	
	function lookup(start, end, key) {
		if (start === end) {
			return [false, start];
		} else {
			var halfway = start + Math.floor((end - start) / 2);
			var cmp = compFunc(sorted[halfway].k, key);
			if (cmp === 0) {
				return [true, halfway];
			} else if (cmp < 0) {
				return lookup(halfway + 1, end, key);
			} else {
				return lookup(start, halfway, key);
			}
		}
	}
		
	return {
		set: function (key, value) {
			var len = sorted.length;
			var l = lookup(0, len, key);
			var found = l[0];
			var index = l[1];
			if (found === true) {
				sorted[index].v = value;
			} else {
				var insert = {k:key, v:value};
				if (index === len) {
					sorted.push(insert);
				} else {
					sorted.splice(index, 0, insert);
				}
			}
		},
		get: function (key) {
			var l = lookup(0, sorted.length, key);
			if (l[0] === true) {
				return sorted[l[1]].v;
			} else {
				return undefined;
			}
		},
		remove: function (key) {
			var l = lookup(0, sorted.length, key);
			if (l[0] === true) {
				sorted.splice(l[1], 1);
			}
		},
		getIndex: function (key) {
			var len = sorted.length;
			var l = lookup(0, len, key);
			var found = l[0];
			var index = l[1];
			if (found) return index;
			else return undefined;
		},
		getByIndex: function (ind) {
			return sorted[ind].v;
		},
		getKeyByIndex: function (ind) {
			return sorted[ind].k;
		},
		length: sorted.length,
		forEach: function (f) {
			forEach(sorted, function (entry) {
				f(entry.v, entry.k);
			});
		},
		
		
		toArray: function () {
			return map(sorted, function (entry) {
				return entry.v;
			});
		},
		debug: function () {
			return sorted;
		}
	};
}

function makeSortedSetNumbers() {
	return makeSortedSet(function (a, b) {
		if (a < b) return -1;
		else if (a === b) return 0;
		else return 1;	
	});
}

function makeSortedSetStringify() {
	return makeSortedSet(function (a, b) {
		var sa = stringify(a);
		var sb = stringify(b);
		if (a < b) return -1;
		else if (a === b) return 0;
		else return 1;
	});
}