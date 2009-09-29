
/*********** expr utils ***********/

/*
* returns the application of expr to args.
* does not modify expr.
*/
function makeApplies(expr, args) {
	for(var i=0; i<args.length; i++)
		expr = makeApply(expr, args[i]);
	return expr;
}



/********** AST utils ***********/

/*
* returns ast with all variables in env replaced by their values.
* does not modify ast.
*/
function substitute(ast, env) {
	if(typeOf(ast) === "string") {
		var v = env(ast);
		return v ? v : ast;  // substitute for variable?
	}

	if(typeOf(ast) === "lambda" && env(ast.left)) // lambda overrides one of our variables
		env = envAdd(env, ast.left, false); // so remove it from env

	var l = substitute(ast.left, env),
		r = substitute(ast.right, env);
	if(l===ast.left && r===ast.right) // nothing changed
		return ast;
	return {cons: ast.cons, left: l, right: r};
}

/*
* returns true iff ast uses at least one variable found in env
*/
function hasVariable(ast, env) {
	if(typeOf(ast) === "string")
		return (env(ast)!=false);
	if(typeOf(ast) === "lambda" && env(ast.left)) // lambda overrides one of our variables
		return hasVariable(ast.right, envAdd(env, ast.left, false)); // so remove it from env
	return hasVariable(ast.left, env) || hasVariable(ast.right, env);
}

/*
* returns the function on vars whose body is ast.
* does not modify ast.
*/
function makeLambdasAST(ast, vars) {
	for(var i=vars.length-1; i>=0; i--) {
		ast = {cons: "lambda", left: vars[i], right: ast};
	}
	return ast;
}

/*
* returns the application of ast to vals.
* does not modify ast.
*/
function makeAppliesAST(ast, vals) {
	for(var i=0; i<vals.length; i++) {
		ast = {cons: "apply", left: ast, right: vals[i]};
	}
	return ast;
}

function makeTupleAST(elements) {
	if(elements.length>1)
		return makeAppliesAST("makeTuple"+elements.length, elements);
	else
		return elements[0];
}

function makeListAST(elements) {
	if(elements.length===0)
		return "nil";
	var cons = {cons: "apply", left: "cons", right: elements.shift()};
	return {cons: "apply", left: cons, right: makeListAST(elements)};
}



/********** other utils ***********/

/*
* returns a version of env with everything in vars mapping to false.
* does not modify env.
*/
function envMinus(env, vars) {
	return function(s) {
		var val = env(s);
		if(val && vars.indexOf(s)===-1)
			return val;
		return false;
	};
}

function makeFeach(output, varName, value) {
	var lineTemplate = {kind: "lineTemplate",
		params: [varName], let: {}, output: output}; // TODO compute type?
	return {kind: "for-each", select: value, lineTemplate: lineTemplate};
}

function makeExtract(output, varName, value) {
	var lineTemplate = {kind: "lineTemplate",
		params: [varName], let: {}, output: output, type: makeTypeLambda(makeFreshTypeVar(),output.type)};
	return {kind: "extract", select: value, action: lineTemplate};
}
