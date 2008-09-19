
// ========================================================================
// Keeping track of objects and their unique id's
// ========================================================================

var idGenerator = (function (prefix) {
	var count = 0;
	return {
		get: function () {
			count += 1;
			return prefix + count;
		}
	};
})("local.");

var objectCache = makeOhash();


// ========================================================================
// Identifiables
// ========================================================================

function makeIded(type, o) {
	if (o === undefined) {
		o = {};
	}
	
	var id = idGenerator.get();
	
	//objectCache.set(id, o);

	o.getId = getter(id);
	o.toJSON = getter("object:" + id);
	o.getType = getter(type);
	
	o.remove = function () {
		// remove from object cache
		//objectCache.remove(id);
	};
	
	return o;
}

Node.prototype.toJSON = function () {
	makeIded(basic.xml, this);
	return this.toJSON();
};


// ========================================================================
// Ohash
// ========================================================================

function makeOhash(stringify) {
	var ohash = {};
	
	var hash = {};
	
	if (stringify === undefined) {
		stringify = function (x) {
			return x;
		};
	}
	
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
	
	ohash.isEmpty = function () {
		return isEmpty(hash);
	};
	
	return ohash;
}



// ========================================================================
// Stringification
// ========================================================================

// The only stringification rule is that parens "()" must be balanced
// This makes it possible to reuse stringification functions while keeping uniqueness

function stringifyObject(o) {
	if (o.getId) {
		return o.getId();
	} else {
		return o;
	}
}
function makeObjectHash() {
	return makeOhash(stringifyObject);
}