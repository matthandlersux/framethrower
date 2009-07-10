(function () {
	listType = parseType("List");
	
	var nil = {
		kind: "list",
		type: parseType("List a"),
		name: "[]",
		remote: 2,
		outsideScope: 0,
		asArray: []
	};
	
	function cons(head, tail) {
		var newArray = [head].concat(tail.asArray);
		return {
			kind: "list",
			//type: typeApply(listType, getType(head)),
			//name: "[" + map(newArray, stringify).join(",") + "]",
			remote: 2,
			asArray: newArray
		};
	}
	
	base.add("nil", nil);
	addFun("cons", "a -> List a -> List a", cons);
})();