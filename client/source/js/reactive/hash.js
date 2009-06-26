// ========================================================================
// Ohash
// ========================================================================
//depends on function stringify
function makeOhash() {
	var ohash = {};
	
	var hash = {};
	
	ohash.get = function(key) {
		var stringified = stringify(key);
		var entry = hash[stringified];
		if (entry) {
			return entry.value;
		} else {
			return undefined;
		}
	};
	
	ohash.set = function (key, value) {
		var stringified = stringify(key);
		hash[stringified] = {key: key, value: value};
	};
	
	ohash.remove = function (key) {
		var stringified = stringify(key);
		delete hash[stringified];
	};
	
	ohash.getOrMake = function (key, constructor) {
		var stringified = stringify(key);
		if (hash[stringified]) {
			return hash[stringified].value;
		} else {
			var value = constructor();
			hash[stringified] = {key: key, value: value};
			return value;
		}
	};
	
	ohash.forEach = function (f) {
		forEach(hash, function (entry) {
			f(entry.value, entry.key);
		});
	};
	
	ohash.count = function(){
		var i = 0;
		forEach(hash, function () {
			i++;
		});
		return i;
	};
	
	ohash.toArray = function () {
		var ret = [];
		ohash.forEach(function (val) {
			ret.push(val);
		});
		return ret;
	};
	ohash.keysToArray = function () {
		var ret = [];
		ohash.forEach(function (val, key) {
			ret.push(key);
		});
		return ret;
	};
	ohash.toObject = function () {
		var ret = {};
		ohash.forEach(function (value, key) {
			ret[key] = value;
		});
		return ret;
	};
	ohash.toFullObject = function () {
		var ret = {};
		forEach(hash, function (entry, stringified) {
			ret[stringified] = entry;
		});
		return ret;
	};
	
	ohash.isEmpty = function () {
		return isEmpty(hash);
	};
	
	return ohash;
}
