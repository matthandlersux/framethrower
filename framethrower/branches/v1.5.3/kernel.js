
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

// ========================================================================
// Reactive Queries
// ========================================================================

function makeQuery(getter) {
	var ohash = makeOhash();
	return {
		register: function (callback, func) {
			callback(getter());
			var entry = ohash.getOrMake(func, function () {
				return [];
			});
			entry.push(callback);
		},
		trigger: function () {
			ohash.forEach(function (callbacks) {
				forEach(callbacks, function (callback) {
					callback(getter());
				});
			});
		}
	};
}

// ========================================================================
// Objects, Situations, Relations, Infons
// ========================================================================

function makeSituation(parentSituation, id) {
	if (id === undefined) {
		id = idGenerator.get();
	}
	
	function makeObject(parentSituation, id) {
		if (id === undefined) {
			id = idGenerator.get();
		}
		
		var o = {};

		o.getId = function () {
			return id;
		};

		o.getSituation = function () {
			return parentSituation;
		};

		o.remove = function () {
			// remove all infons that i'm involved in
			involves.forEach(function (infons) {
				infons.forEach(function (infon) {
					infon.remove();
				});
			});
			// bridge any correspondences
			// TODO
			// remove any functions that have queried me
			// TODO
			// remove from parent situation
			if (parentSituation) {
				parentSituation.removeObject(o);
			}
		};

		// =============================
		// content
		// =============================

		var content = null;

		o.getContent = function () {
			return content;
		};

		var queryContent = makeQuery(o.getContent);

		o.setContent = function (newContent) {
			content = newContent;
			queryContent.trigger(newContent);
		};

		o.queryContent = queryContent.register;

		// =============================
		// involvements with infons
		// =============================

		var involves = makeObjectHash();

		o.getInvolves = function (role) {
			var ret = [];
			if (role === undefined) {
				// return all infons
				involves.forEach(function (infons) {
					infons.forEach(function (infon) {
						ret.push[infon];
					});
				});
			} else {
				var infons = involves.get(role);
				if (infons) {
					infons.forEach(function (infon) {
						ret.push[infon];
					});
				}
			}
			return ret;
		};

		var queryInvolves = makeQuery(o.getInvolves);

		o.addInvolve = function (role, infon) {
			var infons = involves.getOrMake(role, makeObjectHash);
			infons.set(o, infon);
			queryInvolves.trigger();
		};

		o.removeInvolve = function (role, infon) {
			var infons = involves.get(role);
			if (infons) {
				infons.remove(infon);
			}
			queryInvolves.trigger();
		};

		o.queryInvolves = queryInvolves.register;

		// =============================
		// correspondences
		// =============================

		var correspondsIn = makeOhash(stringifyObject);
		var correspondOut = null;

		o.getCorrespondsIn = function () {
			return correspondsIn.asArray();
		};

		o.getCorrespondOut = function () {
			return correspondOut;
		};

		var queryCorrespondsIn = makeQuery(o.getCorrespondsIn);
		var queryCorrespondOut = makeQuery(o.getCorrespondOut);

		o.addCorrespondIn = function (obj) {
			correspondsIn.set(obj, obj);
			queryCorrespondsIn.trigger();
		};
		o.removeCorrespondIn = function (obj) {
			correspondsIn.remove(obj);
			queryCorrespondsIn.trigger();
		};

		o.setCorrespondOut = function (obj) {
			correspondOut = obj;
			queryCorrespondOut.trigger();
		};

		o.queryCorrespondsIn = queryCorrespondsIn.register;
		o.queryCorrespondOut = queryCorrespondOut.register;


		return o;
	}
	
	
	var situation = makeObject(parentSituation, id);
	
	var objects = makeObjectHash();
	
	situation.getObjects = function () {
		return objects.asArray();
	};
	
	var queryObjects = makeQuery(situation.getObjects);
	situation.queryObjects = queryObjects.register;
	
	function makeChildObject(id) {
		var o = makeObject(situation, id);
		objects.set(o, o);
		queryObjects.trigger();
		return o;
	}
	
	situation.removeObject = function (o) {
		objects.remove(o);
		queryObjects.trigger();
	};
	
	situation.makeGhost = makeChildObject;
	situation.makeIndividual = makeChildObject;
	situation.makeRole = makeChildObject;
	
	situation.makeRelation = function (id) {
		var relation = makeChildObject(id);
		
		var infons = makeOhash(stringifyArcs);
		
		relation.makeInfon = function (id, arcs) {
			return infons.getOrMake(arcs, function () {
				var infon = makeChildObject(id);
				
				// register involvement with args
				forEach(arcs, function (arc) {
					arc.arg.addInvolve(arc.role, infon);
				});
				
				var oldRemove = infon.remove;
				infon.remove = function () {
					forEach(arcs, function (arc) {
						arc.arg.removeInvolve(arc.role, infon);
					});
					infons.remove(arcs);
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
	
	situation.makeSituation = function (id) {
		return makeSituation(situation, id);
	};
	
	return situation;
}



function makeCorrespondence(a, b) {
	// find the lowest situation that contains both a and b
	var aSit = a.getSituation();
	var bSit = b.getSituation();
	var aSits = [aSit];
	var bSits = [bSit];
	function checkMatch() {
		function check(sit, sits) {
			for (var i=0, len = sits.length; i < len; i++) {
				if (sit === sits[i]) {
					sits.splice(i+1, sits.length);
					return true;
				}
			}
		}
		return check(aSit, bSits) || check(bSit, aSits);
	}
	while (!checkMatch()) {
		aSit = aSit.getSituation();
		bSit = bSit.getSituation();
		aSits.push(aSit);
		bSits.push(bSit);
	}
	// okay, now aSits contains a's parent situations up to the lowest common situation, likewise for bSits
	var common = aSits[aSits.length - 1];
	
	
	// checks if o is in any of sits
	function isIn(o, sits) {
		var sit = o.getSituation();
		return any(sits, function (s) {
			return s === sit;
		});
	}
	
	// go up correspond out while staying within sits
	function getHighest(start, sits) {
		var highest = start;
		var next = start.getCorrespondOut();
		while (next && isIn(next, sits)) {
			highest = next;
			next = highest.getCorrespondOut();
		}
		return highest;
	}
	var aHighest = getHighest(a, aSits);
	var bHighest = getHighest(b, bSits);
	
	var aHighestSit = aHighest.getSituation();
	var bHighestSit = bHighest.getSituation();
	
	// go down corresponds in while staying within sits
	function getLowest(start, sits) {
		function choosePath(choices) {
			var ret = false;
			forEach(choices, function (choice) {
				if (isIn(choice, sits)) {
					ret = choice;
				}
			});
			return ret;
		}
		
		var lowest = start;
		var next = choosePath(start.getCorrespondsIn());
		while (next) {
			lowest = next;
			next = choosePath(next.getCorrespondsIn());
		}
		return lowest;
	}
	
	function makeC(high, low) {
		var p = low.getCorrespondOut();
		if (p) {
			p.removeCorrespondIn(low);
			p.addCorrespondIn(high);
		}
		high.addCorrespondIn(low);
		low.setCorrespondOut(high);
	}
	
	if (aHighestSit === common && bHighestSit === common) {
		// merge aHighest and bHighest
		// TODO
	} else if (aHighestSit === common) {
		var lowest = getLowest(aHighest, bSits);
		makeC(lowest, bHighest);
	} else if (bHighestSit === common) {
		var lowest = getLowest(bHighest, aSits);
		makeC(lowest, aHighest);
	} else {
		// make "ghost" object in common situation
		var ghost = situation.makeGhost();
		makeC(ghost, aHighest);
		makeC(ghost, bHighest);
	}
}



// ========================================================================
// Utility
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
	
	ohash.asArray = function () {
		var ret = [];
		ohash.forEach(function (val) {
			ret.push(val);
		});
		return ret;
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

function makeObjectHash() {
	return makeOhash(stringifyObject);
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