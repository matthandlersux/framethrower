function addFun(name, typeString, f, numArguments, remote) {
	/*
	This creates a new Fun object and binds it (by putting it in lookupTable)
	*/
	
	if (!remote) remote = 0;
	
	var type = parseType(typeString);
	
	var fun;
	if (typeof f === "function") {
		fun = curry(f, numArguments);		
	} else {
		fun = f;
	}
	
	var exprFun = makeFun(type, fun, name, remote);
	
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


// fetch will never actually be called (it gets factored out in the initial transformation), we just need it to be properly typed
addFun("fetch", "Unit a -> a");


