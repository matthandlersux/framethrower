function makeObject(parentSituation, id) {
	var o = {};
	
	o.getId = function () {
		return id;
	};
	
	o.remove = function () {
		
	};
	
	o.setContent = function () {
		
	};
	
	o.getSituation = function () {
		return parentSituation;
	};
	
	// TODO
	
	// involvements with infons
	
	// correspondences
	
	// reactively informs
	
	return o;
}

// Queries TODO

function makeSituation(parentSituation, id, nextId) {
	var situation = makeObject(id);
	
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
		
		relation.makeInfon = function (id, arcs) {
			var infon = situation.makeObject(id);
			
			// check if already exists
			// register involvement among args
			// register invovlement of relation? query informing?
			
			// TODO
			forEach(arcs, function (arc) {
				var role = arc.role;
				var arg = arc.arg;
			});
			
			return infon;
		};
		
		return relation;
	};
	
	situation.makeSituation = function (id, nextId) {
		if (id === undefined) {
			id = getNextId();
		}
		return makeSituation(situation, id, nextId);
	};
	
	return situation;
}