function addFun(name, typeString, fun, numArguments, remote) {
	/*
	This creates a new Fun object and binds it (by putting it in lookupTable)
	*/
	
	if (!remote) remote = 0;
	
	var type = parseType(typeString);
	
	var args = numArguments === undefined ? fun.length : numArguments;
	
	var exprFun = makeFun(type, fun, args, name, remote);
	
	base.add(name, exprFun);
	
	return exprFun;
}

function addExpr(name, typeString, exprString) {
	var expr = parseExpr(exprString);
	
	var type = parseType(typeString);
	if (!compareTypes(getType(expr), type)) {
		debug.error("Expression `"+name+"` has type `"+unparseType(getType(expr))+"` but expected `"+optionalTypeString+"`");
	}
	
	expr = fullBetaReduce(expr);
	
	expr.stringifyForServer = name;
	
	base.add(name, expr);
}


// TODO: remove this when \ bug is fixed in templates
var hackNewLine = "\n";