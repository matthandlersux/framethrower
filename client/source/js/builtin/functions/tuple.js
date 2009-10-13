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

})();


function makeTuple2(x, y) {
    return {
        kind: "tuple2",
        remote: 2,
        asArray: [x, y]
    };
}