function makeTuple() {
	var n = arguments.length;
    return {
        kind: "tuple"+n,
        remote: 2,
        asArray: Array.prototype.slice.call(arguments)
    };
}

// legacy:
var makeTuple2 = makeTuple;
