
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

var objectCache = {};


// ========================================================================
// Main object constructors
// ========================================================================

/*
Inheritance Structure:

Object
	TrackedObject (on creation, also makes an associated query object with involves constraint)
		Individual
		Relation
		Infon (created with Relation.makeInfon)
	Query
*/

function makeObject(input) {
	var o = {};
	
	var id = idGenerator.get();
	objectCache[id] = o;
	o.getId = function () {
		return id;
	};
	
	o.getInput = function () {
		return input;
	};
	o.setInput = function (newInput) {
		input = newInput;
		// propagate...
	};
	
	o.getOutput = function () {
		return input;
	};
	
	return o;
}

function makeTrackedObject(input) {
	var o = makeObject(input);
	
	var q = makeQuery([{type:"involves", which: o}]);
	
	o.register = function (infon) {
		q.register(infon);
	};
	
	return o;
}

function makeRelation(input) {
	var relation = makeTrackedObject(input);
	
	var infons = makeOhash(stringifyParams);
	
	function makeInfon(params) {
		var infon = makeTrackedObject({
			relation: relation,
			params: params
		});
		infon.xmlize = function () {
			var content = infon.getOutput();
			// construct XML from content (relation and params)
		};
		relation.register(infon);
		forEach(params, function (o) {
			o.register(infon);
		});
		return infon;
	}
	
	o.makeInfon = function (params) {
		return infons.getOrMake(params, function () {
			makeInfon(params);
		});
	};
	
	return o;
}

function makeQuery(constraints) {
	var query = makeObject(constraints);
	
	var furtherQueries = makeOhash(stringifyConstraint);
	var satisfiedBy = {};
	
	query.getOutput = function () {
		return satisfiedBy;
	};
	
	query.register = function (infon) {
		satisfiedBy[infon.getId()] = infon;
		// inform furtherQueries...
	};
	
	return query;
}


// ========================================================================
// Utility
// ========================================================================

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
			f(entry.key, entry.value);
		});
	};
	
	return ohash;
}


// ========================================================================
// Data structures and stringification functions
// ========================================================================

/*
a constraint is either
	{
		type: "involves",
		which: Object
	}
or
	{
		type: "role",
		relation: Relation
		role: String,
		which: Object
	}
*/
function stringifyConstraint(constraint) {
	if (constraint.type === "involves") {
		return "type:" + constraint.type + ",which:" + constraint.which.getId();
	} else if (constraint.type === "role") {
		return "type:" + constraint.type + ",relation:" + constraint.relation.getId() + ",role:" + constraint.role + ",which:" + constraint.which.getId();
	} else {
		throw {
			name: "InvalidConstraint",
			constraint: constraint
		};
	}
}

/*
a params is a hash whose keys are the "role names" and values are TrackedObjects
*/
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