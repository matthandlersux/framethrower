
var idGenerator = (function (prefix) {
	var count = 0;
	return {
		get: function () {
			count += 1;
			return prefix + count;
		}
	};
})("local.");

var objectCache = {};



function makeObject(content) {
	var o = {};
	
	var id = idGenerator.get();
	objectCache[id] = o;
	o.getId = function () {
		return id;
	};
	
	o.getContent = function () {
		return content;
	};
	o.setContent = function (newContent) {
		content = newContent;
		// propagate...
	};
	
	o.getOutput = function () {
		return content;
	};
	
	return o;
}


function makeRelation() {
	var relation = makeObject();
	
	var infons = makeOhash(stringifyParams);
	
	function makeInfon(params) {
		var infon = makeObject({
			relation: relation,
			params: params
		});
		infon.xmlize = function () {
			var content = infon.getContent();
			// construct XML from content (relation and params)
		};
		return infon;
	}
	
	o.makeInfon = function (params) {
		var existing = infons.get(params);
		if (existing) {
			return existing;
		} else {
			var infon = makeInfon(params);
			infons.set(params, infon);
			return infon;
		}
	};
	
	return o;
}




/*
constraints

type: "involves",
which: Object

type: "relation",
which: Relation

type: "role",
relation: Relation
role: String,
which: Object

*/

function makeQuery(constraints) {
	var query = makeObject(constraints);
	
	var ohash = makeOhash(stringifyConstraint);
	
	query.getOutput = function () {
		
	};
	
	return query;
}





function makeOhash(stringify) {
	var ohash = {};
	
	var hash = {};
	
	ohash.get = function(key) {
		var stringified = stringify(key);
		return hash[stringified].value;
	};
	
	ohash.set = function (key, value) {
		var stringified = stringify(key);
		hash[stringified] = {key: key, value: value};
	};
	
	ohash.forEach = function (f) {
		forEach(hash, function (entry) {
			f(entry.key, entry.value);
		});
	};
	
	return ohash;
}






function stringifyParams(params) {
	var ret = "";
	var sorted = keys(params).sort();
	forEach(sorted, function (k) {
		ret += stringifyKeyValue(k, params[k].getId());
	});
}
function stringifyKeyValue(key, value) {
	return key + ":" + value;
}