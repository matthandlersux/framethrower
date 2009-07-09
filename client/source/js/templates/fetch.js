
/************ 'fetch' keyword **********/

/*
this function goes through the template tree (see doc/template semantics.txt)
it keeps an environment mapping words (VTCs) to their expressions, but only if the expressions have fetch
whenever it encounters a new expression, it checks to see if it has fetch or makes reference to a word that has fetch
	if so, it replaces the word(s) with its expression(s) in the env, and replaces the expression in the template tree with its removeFetch'ed version
*/
// returns true iff template was a lineExpr involving a fetch
function desugarFetch(template, env) {	
	if (!template) return false;
	if (!env)
		env = envAdd(falseEnv, "fetch", "fetch");
	
	var kind = template.kind;
	
	if (kind === "lineTemplate") {
		console.log("lineTemplate:");
		for(v in template.let) {
			console.log(v+"=");
			if(desugarFetch(template.let[v], env)) {
				// template.let[v] was a lineExpr involving a fetch.
				// add expression containing fetch to environment:
				env = envAdd(env, v, template.let[v].expr);
				
				// then get rid of the let, since it is meaningless if interpreted by anyone else:
				delete template.let[v];
			}
			else if(env(v)) // v previously referred to a fetch, but has been reassigned
				env = envAdd(env, v, false);
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
		}
	}
	
	if (arrayLike(template) || objectLike(template)) {
		forEach(template, function (x) {desugarFetch(x,env);});
	}
	
	return false;
}


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
	vars = [];
	vals = [];
	ast = collapseFetches(ast, vars, vals);
	if(vars===[]) // no fetches were involved
		return ast;
	ast = makeLambdasAST(ast, vars);

	ast = {cons: "apply", left: "mapUnit"+vals.length, right: ast};
	ast = makeAppliesAST(ast, vals);

	return ast;
}

/*
* return ast with things like 'fetch <someAST>' collapsed to '_fetchedI'
* and store vars[I]='_fetchedI' and vals[I]=<someAST>
* does not modify ast.
*/
function collapseFetches(ast, vars, vals) {
	if(typeOf(ast) === "string")
		return ast;
	if(ast.cons === "apply" && ast.left === "fetch") { // collapse
		var i = vals.indexOf(ast.right);
		if(i!==-1) // there was already a fetch of ast.left in the expression, so no need for a new variable
			return vars[i];
			
		var v = "_fetched"+vars.length; // new variable name
		vars.push(v);
		vals.push(ast.right);
		return v;
	}
	return {cons: ast.cons,
		left: collapseFetches(ast.left, vars, vals),
		right: collapseFetches(ast.right, vars, vals)};
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
	if(typeOf(ast) === "lambda" && env(ast.left)) // lambda overrides one of our variables
		return substitute(ast, envAdd(env, ast.left, false)); // so remove it from env
	return {cons: ast.cons, left: substitute(ast.left, env), right: substitute(ast.right, env)};
}

/*
* returns true iff ast uses at least one literal found in env
*/
function hasLiteral(ast, env) {
	if(typeOf(ast) === "string")
		return (env(ast)!=false);
	if(typeOf(ast) === "lambda" && env(ast.left)) // lambda overrides one of our variables
		return hasLiteral(ast.right, envAdd(env, ast.left, false)); // so remove it from env
	return hasLiteral(ast.left, env) || hasLiteral(ast.right, env);
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
* returns the application of ast to vars.
* does not modify ast.
*/
function makeAppliesAST(ast, vars) {
	for(var i=0; i<vars.length; i++) {
		ast = {cons: "apply", left: ast, right: vars[i]};
	}
	return ast;
}
