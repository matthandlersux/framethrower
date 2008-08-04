/*

Query
	content : Object -> XML
	involves: Object -> Object
	childObjects: Situation -> Object
	arc(role): Infon -> Object
	
*/


var queryComponent = memoize(function (what, role) {
	if (what === "content") {
		return components.set.bind(function (o) {
			return o.queryContent;
		});
	} else if (what === "involves") {
		return components.set.bind(function (o) {
			return o.queryInvolves;
		});
	} else if (what === "childObjects") {
		return components.set.bind(function (o) {
			return o.queryChildObjects;
		});
	} else if (what === "arc") {
		return components.set.map(function (o) {
			return o.getArc(role);
		});
	}
});