function makeFun(typeString, fun) {
	// this is used for making our primitive functions
	return {
		kind: "fun",
		type: uniqueifyType(parse(typeString)),
		fun: fun
	};
}