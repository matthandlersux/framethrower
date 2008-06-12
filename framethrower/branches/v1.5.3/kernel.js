function makeObject(parentSituation, id) {
	var o = {};
	var content = null;
	var correspondsIn = [];
	var correspondsOut = [];
	
	o.getId = function () {
		return id;
	};
	
	o.remove = function () {
		
	};
	
	o.setContent = function (inContent) {
		content = inContent;
	};
	
	o.getContent = function () {
		return content;
	};
	
	o.getSituation = function () {
		return parentSituation;
	};
	
	// TODO
	
	// involvements with infons
	
	// correspondences
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
	
	// reactively informs
	
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