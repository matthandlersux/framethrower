(function () {
	function makeTuple2(x, y) {
		return {
			kind: "tuple2",
			remote: 2,
			asArray: [x, y]
		};
	}
	
	function fst(pair) {
		return pair.asArray[0];
	}
	function snd(pair) {
		return pair.asArray[1];
	}
	
	addFun("makeTuple2", "a -> b -> (a, b)", makeTuple2);
	addFun("fst", "(a, b) -> a", fst);
	addFun("snd", "(a, b) -> b", snd);
	
	
	// These should be removed when we have something more generic
	addFun("makeTuple3", "a -> b -> c -> (a, b, c)", function (x, y, z) {
		return {
			kind: "tuple3",
			remote: 2,
			asArray: [x, y, z]
		};
	});
	addFun("tuple3get1", "(a, b, c) -> a", function (tuple) {return tuple.asArray[0];});
	addFun("tuple3get2", "(a, b, c) -> b", function (tuple) {return tuple.asArray[1];});
	addFun("tuple3get3", "(a, b, c) -> c", function (tuple) {return tuple.asArray[2];});

})();


function makeTuple2(x, y) {
    return {
        kind: "tuple2",
        remote: 2,
        asArray: [x, y]
    };
}