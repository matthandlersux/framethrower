// ========================================================================
// unitHash
// ========================================================================
//depends on function stringify
function makeUnitHash() {
	var uhash = {};
	
	var hash = {occupied:false};
	
	uhash.get = function(key) {
		if (hash.occupied && stringify(key) === hash.skey) {
			return hash.value;
		} else {
			return undefined;
		}
	};
	
	uhash.set = function (key, value) {
		var stringified = stringify(key);
		hash = {occupied:true, skey:stringified, key:key, value:value};
	};
	
	uhash.remove = function () {
		if (hash.occupied) {
			hash = {occupied:false}
		}
	};
	
	uhash.forEach = function (f) {
		if (hash.occupied) {
			f(hash.value, hash.key);
		}
	};
	
	uhash.count = function(){
		if (hash.occupied) return 1;
		return 0;
	};
	
	uhash.getCurrent = function () {
		if (hash.occupied) return hash.value;
		return undefined;
	};
	
	uhash.toArray = function () {
		var ret = [];
		uhash.forEach(function (val, key) {
			ret.push({k:key, v:val});
		});
		return ret;
	};
	
	uhash.keysToArray = function () {
		var ret = [];
		uhash.forEach(function (val, key) {
			ret.push(key);
		});
		return ret;
	};
	
	uhash.isEmpty = function () {
		return !hash.occupied;
	};
	
	return uhash;
}
