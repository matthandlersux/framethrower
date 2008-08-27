var actions = (function () {
	
	function makeObject(type, parentSituation) {
		var o = type.make();
		if (parentSituation) {
			o.control.parentSituation.set(parentSituation);
			parentSituation.control.childObjects.add(o);
		}
		return o;
	}
	
	return {
		makeSituation: function (parentSituation) {
			return makeObject(kernel.situation, parentSituation);
		},
		makeIndividual: function (parentSituation) {
			return makeObject(kernel.individual, parentSituation);
		},
		makeRelation: function (parentSituation) {
			return makeObject(kernel.relation, parentSituation);
		},
		makeInfon: function (parentSituation, relation, arcs) {
			var infon = makeObject(kernel.infon, parentSituation);
			infon.control.relation.set(relation);
			forEach(arcs, function (arg, role) {
				infon.control.arcs.set(role, arg);
				arg.control.involves.add(infon);
			});
		}
	};
})();

