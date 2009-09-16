//ConSortedSet

var scount = 0;

function makeConSortedSet(compFunc) {
	var hash = makeOhash();
	var css = {};
	
	css.set = function (key, value) {
		hash.set(key, value);
	};
	css.get = function (key) {
		return hash.get(key);
	};
	css.remove = function (key) {
		hash.remove(key);
	};
	
	css.forEach = function (f) {
		return hash.forEach(f);
	};
	
	css.toArray = function () {
		var retArray = [];
		hash.forEach(function(val, key) {
			retArray.push({k:key, v:val});
		});
		return retArray;
	};
	
	css.debug = function () {
		return hash;
	};

	var sorted = [];

	function lookup (start, end, key) {
		function helper (start, end) {
			var halfway = start + Math.floor((end - start) / 2);
			var cmp = compFunc(sorted[halfway].k, key);
			if (cmp === 0) {
				return [true, halfway];
			} else { 
				if (start === end || start > end) {
					if (cmp < 0){
						return [false, start+1];
					} else {
						return [false, start];
					}
				}
				if (cmp < 0) {
					return helper(halfway+1, end);
				} else {
					return helper(start, halfway);
				}
			}
		}
		if (sorted.length === 0) {
			return [false, 0];
		} else if (start > end) {
			return [false, start];
		} else {
			var result = helper(start, end);
			return result;
		}
	}


	css.makeSorted = function() {
		css.forEach(function (val, key) {
			sorted.push({k:key, v:val});
		});
		sorted.sort(function(a, b) {
			return compFunc(a.k, b.k);
		});
		
		css.set = function(key, value) {
			var len = sorted.length;
			var found = false;
			var index;
			if (len > 0) {
				var l = lookup(0, len-1, key);
				found = l[0];
				index = l[1];
			}
			if (found === true) {
				sorted[index].v = value;
			} else {
				var insert = {k:key, v:value};
				sorted.splice(index, 0, insert);
			}
			hash.set(key, value);
		};
		
		css.remove = function(key) {
			var l = lookup(0, sorted.length-1, key);
			if (l[0] === true) {
				sorted.splice(l[1], 1);
			}
			delete hash[key];
		};
		
		function getNearestIndex (key, right) {
			var len = sorted.length;
			var l = lookup(0, len-1, key);
			if (l[0]) { //found
				return l[1];
			} else {
				if (right) {
					return l[1];
				} else {
					if (l[1]-1 < 0) {
						return l[1];
					} else {
						return l[1] - 1;
					}
				}
			}
		}
		
		css.getNearestIndexRight = function (key) {
			return getNearestIndex(key, true);
		};
		
		css.getNearestIndexLeft = function (key) {
			return getNearestIndex(key, false);
		};
		
		css.getIndex = function (key) {
			var len = sorted.length;
			var l = lookup(0, len-1, key);
			var found = l[0];
			var index = l[1];
			if (found) return index;
			else {
				return undefined;
			}
		};
		css.getByIndex = function (ind) {
			var value = sorted[ind];
			if (value !== undefined) {
				return value.v;
			} else {
				return undefined;
			}			
		};
		css.getKeyByIndex = function (ind) {
			var value = sorted[ind];
			if (value !== undefined) {
				return sorted[ind].k;
			} else {
				return undefined;
			}
		};
		css.forEach = function (f) {
			return sorted.forEach(function(keyVal, pos) {
				f(keyVal.v, keyVal.k);
			});
		};
		
		css.getLength = function () {
			return sorted.length;
		};
		css.toArray = function () {
			return sorted;
		};
		css.debug = function () {
			return sorted;
		};
		css.makeSorted = function () {};
	};


	return css;
}

function makeConSortedSetNumbers() {
	return makeConSortedSet(function (a, b) {
		if (a < b) return -1;
		else if (a === b) return 0;
		else return 1;	
	});
}

// I've changed this so that it sorts numbers correctly also. Maybe we should remove the above function? -Toby
function makeConSortedSetStringify() {
	return makeConSortedSet(function (a, b) {
		var sa, sb;
		if (typeOf(a) === "number") {
			if (isNaN(a)) {
				if (isNaN(b)) {
					return 0;
				}
				return 1;
			} else if (isNaN(b)) {
				return -1;
			}
			sa = a;
			sb = b;
		} else {
			sa = stringify(a);
			sb = stringify(b);
		}
		if (sa < sb) return -1;
		else if (sa === sb) return 0;
		else return 1;
	});
}