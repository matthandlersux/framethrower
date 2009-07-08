/*
Pipeline:
templates start out as .tpl and .let files
compiler (tools/compiler) takes these and turns them into .js files
next is preparse which just runs parse on all expressions (String -> AST), and parseType on all types (String -> TYPE)
next is desugarFetch which will rewrite some expressions so that a fetch is never encountered
finally the interpreter (js/templates/closure.js, action.js, writexml.js) interprets the result of all this
*/


function preparse(template) {
	if (!template) return;
	
	var kind = template.kind;
	if (kind === "lineTemplate") {
		template.type = parseType(template.type);
	} else if (kind === "lineExpr") {
		template.expr = parse(template.expr);
		if(template.type !== undefined) {
			template.type = parseType(template.type);
		}
	} else if (kind === "lineJavascript") {
		template.type = parseType(template.type);
	} else if (kind === "lineAction") {
		template.type = parseType(template.type);
	} else if (kind === "actionCreate") {
		template.type = parseType(template.type);
	} else if (kind === "actionUpdate") {
		template.target = parse(template.target);
		template.key = template.key ? parse(template.key) : undefined;
		template.value = template.value ? parse(template.value) : undefined;
	} else if (kind === "case") {
		template.test = parse(template.test);
	} else if (kind === "for-each") {
		template.select= parse(template.select);
	} else if (kind === "trigger") {
		template.trigger = parse(template.trigger);
	} else if (kind === "when") {
		template.test = parse(template.test);
	} else if (kind === "insert") {
		template.expr = parse(template.expr);
	}
	
	if (arrayLike(template) || objectLike(template)) {
		forEach(template, preparse);
	}
}



/********** AST utils ***********/

/*
* returns ast with all literals in env replaced by their values.
* does not modify ast.
*/
function substitute(ast, env) {
	if(typeOf(ast) === "string") {
		var v = env(ast);
		return v ? v : ast;  // substitute for variable?
	}
	return {cons: ast.cons, left: substitute(ast.left, env), right: substitute(ast.right, env)};
}

/*
* returns true iff ast uses at least one literal found in env
*/
function hasLiteral(ast, env) {
	if(typeOf(ast) === "string")
		return (env(ast)!=false);
	return hasLiteral(ast.left, env) || hasLiteral(ast.right, env);
}

/*
* returns the function on vars whose body is ast
*/
function makeLambdasAST(ast, vars) {
	for(var i=vars.length-1; i>=0; i--) {
		ast = {cons: "lambda", left: vars[i], right: ast};
	}
	return ast;
}

/*
* returns the application of ast to vars
*/
function makeAppliesAST(ast, vars) {
	for(var i=0; i<vars.length; i++) {
		ast = {cons: "apply", left: ast, right: vars[i]};
	}
	return ast;
}



/************ 'fetch' keyword **********/

/*
this function takes an AST (ie: as returned by parse()) and returns an AST
	where all instances of fetch have been removed and various mapUnit's have been added.
examples:
	fetch x => x			[ or maybe this should be: mU1 (x0 -> x0) x ]
	plus (fetch x) 6 => mU1 (x0 -> plus x0 6) x
	plus (fetch x) (fetch y) => mU2 (x0 -> x1 -> plus x0 x1) x y
	plus (fetch x) (fetch x) => mU1 (x0 -> plus x0 x0) x
	plus (plus (fetch x) 6) 8 => mU1 (x0 -> plus (plus x0 6) 8) x

Notice that if expr has type a, then the removeFetch version of expr will have type Unit (Unit (... (Unit a))) where the number of Unit's is equal to the number of nested fetch's.
But in practice, I don't expect to ever see more than one layer of fetch's
*/
/*
* returns a monadic version of ast, with all occurrences of 'fetch' removed
* does not modify ast.
*/
function withoutFetch(ast) {
	literals = [];
	ast = collapseFetchLiterals(ast, literals);
	if(literals===[]) // no fetches were involved
		return ast;
	ast = makeLambdasAST(ast, literals);

	ast = {cons: "apply", left: "mapUnit"+literals.length, right: ast};
	ast = makeAppliesAST(ast, literals);

	return ast;
}

/*
* return ast with things like 'fetch x' collapsed to 'x'
* and store all such 'x' in literals.
* does not modify ast.
*/
function collapseFetchLiterals(ast, literals) {
	if(typeOf(ast) === "string")
		return ast;
	if(ast.cons === "apply" && ast.left === "fetch") { // collapse
		if(literals.indexOf(ast.right)===-1)
			literals.push(ast.right);
		return ast.right;
	}
	return {cons: ast.cons,
		left: collapseFetchLiterals(ast.left, literals),
		right: collapseFetchLiterals(ast.right, literals)};
}


/*
this function goes through the template tree (see doc/template semantics.txt)
it keeps an environment mapping words (VTCs) to their expressions, but only if the expressions have fetch
whenever it encounters a new expression, it checks to see if it has fetch or makes reference to a word that has fetch
	if so, it replaces the word(s) with its expression(s) in the env, and replaces the expression in the template tree with its removeFetch'ed version
*/
// returns true iff template was a lineExpr involving a fetch
function desugarFetch(template, env) {	
	if (!template) return false;
	if (!env) {
		env = falseEnv;
		env = envAdd(env, "fetch", "fetch");
	}
	
	var kind = template.kind;
	
	if (kind === "lineTemplate") {
		console.log("lineTemplate:");
		for(v in template.let) {
			console.log(v+"=");
			if(desugarFetch(template.let[v],env)) {
				// template.let[v] was a lineExpr involving a fetch.
				// add expression containing fetch to environment:
				env = envAdd(env, v, template.let[v].expr);				
				// then optimize expression:
				template.let[v].expr = withoutFetch(template.let[v].expr);
				
				console.log("-- withoutFetch -->");
				console.log(JSONtoString(template.let[v].expr));
			}
		}
		desugarFetch(template.output,env);
		return false;
	} else if (kind === "lineExpr") {
		if(hasLiteral(template.expr, env)) {
			console.log("lineExpr:");
			console.log(JSONtoString(template.expr));
			
			template.expr = substitute(template.expr, env);
			
			console.log("-- expandFetch -->");
			console.log(JSONtoString(template.expr));
			return true;
		}
	} else if (kind === "actionUpdate") {
		// template.target = parse(template.target);
		// template.key = template.key ? parse(template.key) : undefined;
		// template.value = template.value ? parse(template.value) : undefined;
	} else if (kind === "case") {
		// template.test = parse(template.test);
	} else if (kind === "for-each") {
		// template.select= parse(template.select);
	} else if (kind === "trigger") {
		// template.trigger = parse(template.trigger);
	} else if (kind === "when") {
		// template.test = parse(template.test);
	} else if (kind === "insert") {
		if(hasLiteral(template.expr, env)) {
			console.log("insert:");
			console.log(JSONtoString(template.expr));
			template.expr = withoutFetch(substitute(template.expr, env));
			console.log("-- expandFetch --> withoutFetch -->");
			console.log(JSONtoString(template.expr))
			return true;
		}
	}
	
	if (arrayLike(template) || objectLike(template)) {
		forEach(template, function f(x) {desugarFetch(x,env);});
	}
	
	return false;
}
