function makeObject(parentSituation, id) {
	var o = {};
	
	o.getId = function () {
		return id;
	};
	
	o.getSituation = function () {
		return parentSituation;
	};
	
	o.remove = function () {
		involvements.forEach(function (infons) {
			infons.forEach(function (infon) {
				infon.remove();
			});
		});
	};
	
	// =============================
	// content
	// =============================
	
	var content = null;
	
	o.setContent = function (newContent) {
		content = newContent;
		// TODO add reactivity hook
	};
	
	o.getContent = function () {
		return content;
	};
	
	// =============================
	// involvements with infons
	// =============================
	
	function makeObjectHash() {
		return makeOhash(stringifyObject);
	}
	
	var involvements = makeObjectHash();
	
	o.addInvolvement = function (role, infon) {
		var infons = involvements.getOrMake(role, makeObjectHash);
		infons.set(o, infon);
	};
	
	o.removeInvolvement = function (role, infon) {
		var infons = involvements.get(role);
		if (infons) {
			infons.remove(infon);
		}
	};
	
	o.getInvolvements = function (role) {
		var ret = [];
		if (role === undefined) {
			// return all infons
			involvments.forEach(function (infons) {
				infons.forEach(function (infon) {
					ret.push[infon];
				});
			});
		} else {
			var infons = involvements.get(role);
			if (infons) {
				infons.forEach(function (infon) {
					ret.push[infon];
				});
			}
		}
		return ret;
	};
	
	// =============================
	// correspondences
	// =============================
	
	// TODO
	
	var correspondsIn = [];
	var correspondsOut = [];
	
	o.setCorrespondsIn = function (obj) {
		correspondsIn.push(obj);
	};
	
	o.setCorrespondsOut = function (obj) {
		correspondsOut.push(obj);
	};
	
	o.getCorrespondsIn = function () {
		return correspondsIn;
	};
	
	o.getCorrespondsOut = function () {
		return correspondsOut;
	};
	
	// =============================
	// reactively informs
	// =============================
	
	// TODO
	
	
	return o;
}

function makeCorrespondence(a, b) {
	// find the lowest situation that contains both a and b
	
}



// Queries TODO

function makeSituation(parentSituation, id, nextId) {
	var situation = makeObject(parentSituation, id);
	
	if (nextId === undefined) {
		nextId = 0;
	}
	function getNextId() {
		nextId += 1;
		return id + "." + nextId;
	}
	
	situation.makeObject = function (id) {
		if (id === undefined) {
			id = getNextId();
		}
		return makeObject(situation, id);
	};
	
	situation.makeIndividual = situation.makeObject;
	situation.makeRole = situation.makeObject;
	
	situation.makeRelation = function (id) {
		var relation = situation.makeObject(id);
		
		var infons = makeOhash(stringifyArcs);
		
		relation.makeInfon = function (id, arcs) {
			return infons.getOrMake(arcs, function () {
				var infon = situation.makeObject(id);
				
				// register involvement with args
				forEach(arcs, function (arc) {
					arc.arg.addInvolvement(arc.role, infon);
				});
				
				var oldRemove = infon.remove;
				infon.remove = function () {
					forEach(arcs, function (arc) {
						arc.arg.removeInvolvement(arc.role, infon);
					});
					oldRemove();
				};
				
				infon.getArcs = function () {
					return arcs;
				};
				
				return infon;
			});
		};
		
		var oldRemove = relation.remove;
		relation.remove = function () {
			infons.forEach(function (infon) {
				infon.remove();
			});
			oldRemove();
		};
		
		return relation;
	};
	
	situation.makeQuery = function () {
		
	};
	
	situation.makeSituation = function (id, nextId) {
		if (id === undefined) {
			id = getNextId();
		}
		return makeSituation(situation, id, nextId);
	};
	
	return situation;
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
	
	return ohash;
}

// ========================================================================
// Stringification
// ========================================================================

// The only stringification rule is that parens "()" must be balanced
// This makes it possible to reuse stringification functions while keeping uniqueness

function stringifyObject(o) {
	return o.getId();
}

// arcs :: [{role: Role, arg: Object}]
function stringifyArcs(arcs) {
	function stringifyArc(arc) {
		return "((" + stringifyObject(arc.role) + ")(" + stringifyObject(arc.arg) + "))";
	}
	var strings = [];
	forEach(arcs, function (arc) {
		strings.push(stringifyArc(arc));
	});
	strings.sort();
	return strings.join("");
}