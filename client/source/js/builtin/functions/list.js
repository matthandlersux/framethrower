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
	
	function head(list) {
		if (list.asArray.length === 0) {
			debug.error("Trying to take head of empty list");
		}
		return list.asArray[0];
	}
	function tail(list) {
		if (list.asArray.length === 0) {
			debug.error("Trying to take tail of empty list");
		}
		return {
			kind: "list",
			type: list.type,
			remote: 2,
			asArray: list.asArray.slice(1)
		};
	}
	
	base.add("nil", nil);
	addFun("cons", "a -> List a -> List a", cons);
	addFun("head", "List a -> a", head);
	addFun("tail", "List a -> List a", tail);
})();