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
	
	o.queryContent = function () {
		// TODO
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
			involvements.forEach(function (infons) {
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
	
	o.queryInvolvements = function () {
		// TODO
	};
	
	// =============================
	// correspondences
	// =============================
	
	var correspondsIn = makeOhash(stringifyObject);
	var correspondOut = null;
	
	o.addCorrespondIn = function (obj) {
		correspondsIn.set(obj, obj);
	};
	o.removeCorrespondIn = function (obj) {
		correspondsIn.remove(obj);
	};
	
	o.setCorrespondOut = function (obj) {
		correspondOut = obj;
	};
	
	o.getCorrespondsIn = function () {
		var ret = [];
		correspondsIn.forEach(function (obj) {
			ret.push(obj);
		});
		return ret;
	};
	
	o.getCorrespondOut = function () {
		return correspondOut;
	};
	
	o.queryCorrespondsIn = function () {
		
	};
	
	o.queryCorrespondsOut = function () {
		
	};
	
	// =============================
	// reactively informs
	// =============================
	
	// TODO
	
	
	return o;
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
	
	situation.makeGhost = situation.makeObject;
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