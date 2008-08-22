var actions = (function () {
	
	function makeObject(type, parentSituation) {
		var o = type.make({parentSituation: parentSituation});
		if (parentSituation) {
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
		}
	};
})();

