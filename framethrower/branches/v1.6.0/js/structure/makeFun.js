function makeFun(typeString, fun) {
	// this is used for making our primitive functions
	return {
		type: uniqueifyType(parse(typeString)),
		fun: fun
	};
}