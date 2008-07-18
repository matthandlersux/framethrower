
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
// Identifiables
// ========================================================================

function makeIded(id, my) {
	my = my || {};
	if (id === undefined || id === null || id === false) {
		id = idGenerator.get();
	}
	var o = {};
	
	objectCache.set(id, o);

	o.getId = function () {
		return id;
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

function makeSituation(parentSituation, id) {
	function makeObject(parentSituation, id, my) {
		my = my || {};

		var o = makeIded(id, my);
		
		o.getParentSituation = function () {
			return parentSituation;
		};

		var superRemove = o.remove;
		o.remove = function () {
			// remove all infons that i'm involved in
			involves.forEach(function (infons) {
				infons.forEach(function (infon) {
					infon.remove();
				});
			});
			
			// bridge any correspondences
			var newOut = null;
			if (correspondOut) {
				correspondOut.removeCorrespondIn(this);
				newOut = correspondOut;
			} else if (correspondsIn.count()>1) {
				newOut = parentSituation.makeGhost();
			}			
			correspondsIn.forEach(function (corresponderIn){
				if (newOut) {
					newOut.addCorrespondIn(corresponderIn);
				}
				corresponderIn.setCorrespondOut(newOut);
			});
			
			// remove any functions that have queried me
			// TODO ?
						
			// remove from parent situation
			if (parentSituation) {
				parentSituation.removeObject(o);
			}
			
			superRemove();
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
						ret.push(infon);
					});
				});
			} else {
				var infons = involves.get(role);
				if (infons) {
					infons.forEach(function (infon) {
						ret.push(infon);
					});
				}
			}
			return ret;
		};

		var queryInvolves = makeQuery(o.getInvolves);

		o.addInvolve = function (role, infon) {
			var infons = involves.getOrMake(role, makeObjectHash);
			infons.set(infon, infon);
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
		my.correspondsIn = correspondsIn;
		var correspondOut = null;
		my.correspondOut = correspondOut;

		o.getCorrespondsIn = function () {
			return correspondsIn.toArray();
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
	situation.getType = function () {
		return "situation";
	};
	
	// =============================
	// objects within the situation
	// =============================
	
	var objects = makeObjectHash();
	
	situation.getObjects = function () {
		return objects.toArray();
	};
	
	var queryObjects = makeQuery(situation.getObjects);
	situation.queryObjects = queryObjects.register;
	
	function makeChildObject(id, my) {
		var o = makeObject(situation, id, my);		
		return o;
	}
	
	situation.addObject = function (o) {
		objects.set(o, o);
		queryObjects.trigger();
	};
	
	situation.removeObject = function (o) {
		objects.remove(o);
		queryObjects.trigger();
	};
	
	// =============================
	// constructors
	// =============================
	
	situation.makeGhost = function (id, my) {
		my = my || {};
		var ghost = makeChildObject(id, my);
		ghost.getType = function () {
			return "ghost";
		};
		situation.addObject(ghost);

		//override the object.removeCorrespondIn method to remove useless ghosts
		var super_removeCorrespondIn = ghost.superior('removeCorrespondIn');		
		ghost.removeCorrespondIn = function (obj) {
			super_removeCorrespondIn(obj);
			//remove this ghost if it has less than 2 correspondsIn
			if (my.correspondsIn.count() < 2) {
				ghost.remove();
			}
		};
		
		return ghost;
	};
	
	situation.makeIndividual = function (id) {
		var individual = makeChildObject(id);
		individual.getType = function () {
			return "individual";
		};
		situation.addObject(individual);
		return individual;
	};
	situation.makeRole = function (id) {
		var role = makeChildObject(id);
		role.getType = function () {
			return "role";
		};
		situation.addObject(role);
		return role;
	};
	
	situation.makeRelation = function (id) {
		var relation = makeChildObject(id);
		relation.getType = function () {
			return "relation";
		};
		
		var infons = makeOhash(stringifyArcs);
		
		relation.makeInfon = function (id, arcs) {
			return infons.getOrMake(arcs, function () {
				var infon = makeChildObject(id);
				infon.getType = function () {
					return "infon";
				};
				
				// register involvement with args
				forEach(arcs, function (arc) {
					arc.arg.addInvolve(arc.role, infon);
				});
				
				var superRemove = infon.remove;
				infon.remove = function () {
					forEach(arcs, function (arc) {
						arc.arg.removeInvolve(arc.role, infon);
					});
					infons.remove(arcs);
					
					superRemove();
				};
				
				infon.getArcs = function () {
					return arcs;
				};
				
				infon.getRelation = function () {
					return relation;
				};
				
				situation.addObject(infon);
				
				return infon;
			});
		};
		
		var superRemove = relation.remove;
		relation.remove = function () {
			infons.forEach(function (infon) {
				infon.remove();
			});
			superRemove();
		};
		
		situation.addObject(relation);
		
		return relation;
	};
	
	/*situation.makeFunction = function (id, xml) {
		var func = makeChildObject(id);
		func.getType = function () {
			return "function";
		};
		
		var applies = makeOhash(stringifyParams);
		
		var compiled = compileCustom(xml);
		
		func.makeApply = function (id, params) {
			return applies.getOrMake(params, function () {
				var apply = makeChildObject(id);
				apply.getType = function () {
					return "apply";
				};
				
				var output = null;
				apply.getOutput = function () {
					return output;
				};
				var queryOutput = makeQuery(apply.getOutput);
				apply.queryOutput = queryOutput.register;
				
				getDerivements(xml, params, apply.getId(), function (ps) {
					output = compiled(ps);
					queryOutput.trigger();
				});
				
				apply.getParams = function () {
					return params;
				};
				apply.getFunction = function () {
					return func;
				};
				
				var superRemove = apply.remove;
				apply.remove = function () {
					applies.remove(params);
					superRemove();
				};
				
				situation.addObject(apply);
				return apply;
			});
		};
		
		func.getXML = function () {
			return xml;
		};
		
		var superRemove = func.remove;
		func.remove = function () {
			applies.forEach(function (apply) {
				apply.remove();
			});
			superRemove();
		};
		
		situation.addObject(func);
		return func;
	};*/
	
	situation.makeSituation = function (id) {
		var s = makeSituation(situation, id);
		situation.addObject(s);
		return s;
	};
	
	var superRemove = situation.remove;
	situation.remove = function () {
		//remove any contained objects
		objects.forEach(function(subObject){
			subObject.remove();
		});
		superRemove();
	};
	
	return situation;
}



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