
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

function makeIded(type) {
	var o = {};
	
	var id = idGenerator.get();
	
	objectCache.set(id, o);

	o.getId = function () {
		return id;
	};
	
	o.toJSON = function () {
		return "object:" + id;
	};
	
	o.getType = function () {
		return type;
	};
	
	o.remove = function () {
		// remove from object cache
		objectCache.remove(id);
	};
	
	return o;
}


// ========================================================================
// Objects, Situations, Relations, Infons
// ========================================================================

function makeSituation(parentSituation) {
	function makeObject(parentSituation, type) {
		var o = makeIded(type);
		
		o.getParentSituation = function () {
			return parentSituation;
		};
		
		o.remove = pCompose(function () {
			// TODO
		}, o.remove);
		
		var contentController = {};
		o.queryContent = makeSimpleStartCap(interfaces.unit, contentController);
		o.setContent = contentController.set;
		
		var involvesController = {};
		o.queryInvolves = makeSimpleStartCap(interfaces.set, involvesController);
		o.addInvolve = involvesController.add;
		o.removeInvolve = involvesController.remove;
		
		var correspondOutController = {};
		o.queryCorrespondOut = makeSimpleStartCap(interfaces.unit, correspondOutController);
		o.setCorrespondOut = correspondOutController.set;
		
		var correspondsInController = {};
		o.queryCorrespondsIn = makeSimpleStartCap(interfaces.set, correspondsInController);
		o.addCorrespondIn = correspondsInController.add;
		o.removeCorrespondIn = correspondsInController.remove;
		
		return o;
	}
	
	var situation = makeObject(parentSituation, "situation");
	
	var childObjectsController = {};
	situation.queryChildObjects = makeSimpleStartCap(interfaces.set, childObjectsController);
	
	function makeChildObject(type) {
		var child = makeObject(situation, type);
		childObjectsController.add(child);
		return child;
	}
	
	situation.makeIndividual = function () {
		return makeChildObject("individual");
	};
	
	situation.makeGhost = function () {
		return makeChildObject("ghost");
	};
	
	situation.makeRelation = function () {
		var relation = makeChildObject("relation");
		
		var infons = makeOhash(stringifyInputs);
		
		relation.makeInfon = function (arcs) {
			return infons.getOrMake(arcs, function () {
				var infon = makeChildObject("infon");
				
				// register involvement with args
				forEach(arcs, function (arg) {
					arg.addInvolve(infon);
				});
				
				infon.remove = pCompose(function () {
					forEach(arcs, function (arg) {
						arg.removeInvolve(infon);
					});
					infons.remove(arcs);
				}, infon.remove);
				
				infon.getArcs = function () {
					return arcs;
				};
				infon.getArc = function (role) {
					return arcs[role];
				};
				
				infon.getRelation = function () {
					return relation;
				};
				
				return infon;
			});
		};
		
		return relation;
	};
	
	situation.makeSituation = function () {
		var child = makeSituation(situation);
		childObjectsController.add(child);
		return child;
	};
	
	return situation;
}



// This for sure needs to be updated...
function makeCorrespondence(a, b) {
	// find the lowest situation that contains both a and b
	var aSit = a.getParentSituation();
	var bSit = b.getParentSituation();
	var aSits = [aSit];
	var bSits = [bSit];
	function checkMatch() {
		function check(sit, sits) {
			if (sit) {
				for (var i=0, len = sits.length; i < len; i++) {
					if (sit === sits[i]) {
						sits.splice(i+1, sits.length);
						return true;
					}
				}
			}
		}
		return check(aSit, bSits) || check(bSit, aSits);
	}
	while (!checkMatch()) {
		if (aSit) {
			aSit = aSit.getParentSituation();
			aSits.push(aSit);
		}
		if (bSit) {
			bSit = bSit.getParentSituation();
			bSits.push(bSit);
		}
		if (!aSit && !bSit) {
			throw "Objects not part of the same root situation";
		}
	}
	// okay, now aSits contains a's parent situations up to the lowest common situation, likewise for bSits
	var common = aSits[aSits.length - 1];
	
	
	// checks if o is in any of sits
	function isIn(o, sits) {
		var sit = o.getParentSituation();
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
	
	var aHighestSit = aHighest.getParentSituation();
	var bHighestSit = bHighest.getParentSituation();
	
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
		var ghost = common.makeGhost();
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

/*
// arcs : [{role: Role, arg: Object}]
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

// params : {String: Object}
function stringifyParams(params) {
	var strings = [];
	forEach(params, function (val, p) {
		strings.push("((" + p + ")(" + stringifyObject(val) + "))");
	});
	strings.sort();
	return strings.join("");
}
*/