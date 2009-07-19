
/************ 'fetch' keyword **********/

var fetchEnv = envAdd(falseEnv, "fetch", "fetch");

function desugarFetch(template, env) {
	if (!template) return;
	if (!env) env = fetchEnv;
	
	var kind = template.kind;
	
	if (kind === "lineTemplate") {
		// params hide previous bindings:
		env = envMinus(env, template.params);

		// go through lets, recursing on each, and remembering (and destroying) any fetched lineExprs:
		for(v in template.let) {
			var let = template.let[v];
			
			desugarFetch(let, env); // recurse, which makes fetches explicit if let is a lineExpr
			
			if(let.kind === "lineExpr" && hasVariable(let.expr, fetchEnv)) { // has a 'fetch'
					// store the value and get rid of the let, since it is meaningless to anyone else:
					env = envAdd(env, v, let.expr);
					delete template.let[v];
			}
			else if(env(v)) // v previously referred to a fetch, but has been reassigned
				env = envAdd(env, v, false);
		}

		desugarFetch(template.output,env);

		// we don't want to forEach() on this, since we've already taken care of everything:
		return;
	} else if (kind === "lineAction") {
		env = envMinus(env, template.params);

		// go through actions, recursing on each, remembering (and destroying) any fetched lineExprs,
		// and desugaring any fetched actions as extracts:
		for(i in template.actions) {
			var v = template.actions[i].name,
				action = template.actions[i].action;

			desugarFetch(action, env);

			if(action.kind === "lineExpr" && hasVariable(action.expr, fetchEnv)) {
				if(v) env = envAdd(env, v, action.expr);
				delete template.actions[i];
			}
			else if(v && env(v))
				env = envAdd(env, v, false);
		}

		// we don't want to forEach() on this, since we've already taken care of everything:
		return;
	} else if (kind === "lineExpr") {
		// make any fetches explicit and then desugar unfetches:
		template.expr = desugarUnfetch( substitute(template.expr, env) );
	}
	
	else if (kind === "actionCreate") {
		for(var i in template.prop) {
			template.prop[i] = desugarUnfetch( substitute(template.prop[i], env) );
			disallowFetch(template.prop[i], template);
		}
	} else if (kind === "actionUpdate") {
		template.target = desugarUnfetch( substitute(template.target, env) );
		disallowFetch(template.target, template);
		if(template.key) {
			template.key = desugarUnfetch( substitute(template.key, env) );
			disallowFetch(template.key, template);
		}
		if(template.value) {
			template.value = desugarUnfetch( substitute(template.value, env) );
			disallowFetch(template.value, template);
		}
	}
	
	else if (kind === "extract") {
		template.select = desugarUnfetch( substitute(template.select, env) );
		disallowFetch(template.select, template);
	} else if (kind === "case") {
		template.test = desugarUnfetch( substitute(template.test, env) );
		disallowFetch(template.test, template);
	} else if (kind === "for-each") {
		template.select = desugarUnfetch( substitute(template.select, env) );
		disallowFetch(template.select, template);
	} else if (kind === "trigger") {
		template.trigger = desugarUnfetch( substitute(template.trigger, env) );
		disallowFetch(template.trigger, template);
	}
	
	else if (kind === "insert") {
		template.expr = desugarUnfetch( substitute(template.expr, env) );
		// insert can handle any type, and works the same for t or Unit t,
		// so we don't care whether 'unfetch' is used -- we unfetch either way:
		while(hasVariable(template.expr, fetchEnv))
			template.expr = unfetch(template.expr);
	}

	if (arrayLike(template) || objectLike(template)) {
		forEach(template, function (x) {desugarFetch(x,env);});
	}
}

/*
* returns a version of env with everything in vars mapping to false.
* does not modify env.
*/
function envMinus(env, vars) {
	return function(s) {
		var v = env(s);
		if(v && vars.indexOf(v)===-1)
			return v;
		return false;
	};
}

function disallowFetch(ast, template) {
	if(hasVariable(ast, fetchEnv))
		console.error("fetched expression", JSONtoString(ast), "not supported in template", JSONtoString(template));
}

/*
* returns a monadic version of ast, with all first-level occurrences of 'fetch' removed.
* does not modify ast.
*/
function unfetch(ast) {
	vars = [];
	vals = [];
	ast = collapseFetches(ast, vars, vals);
	ast = makeLambdasAST(ast, vars);
	ast = {cons: "apply", left: "mapUnit"+vals.length, right: ast};
	ast = makeAppliesAST(ast, vals);
	
	if(vars.length===0)
		console.warn("unfetch applied to fetch-less ast:", JSONtoString(ast));

	return ast;
}

function desugarUnfetch(ast) {
	if(typeOf(ast) === "string")
		return ast;
	
	if(ast.cons==="apply" && ast.left==="unfetch")
		return unfetch(ast.right);
	
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
		if(i!==-1) // there was already a fetch of ast.right in the expression, so no need for a new variable
			return vars[i];
			
		var v = "_fetched"+vars.length; // new variable name
		vars.push(v);
		vals.push(ast.right);
		return v;
	}
	
	var l = collapseFetches(ast.left, vars, vals),
		r = collapseFetches(ast.right, vars, vals);
	if(l===ast.left && r===ast.right) // nothing changed
		return ast;
	return {cons: ast.cons, left: l, right: r};
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
* returns the application of ast to vars.
* does not modify ast.
*/
function makeAppliesAST(ast, vars) {
	for(var i=0; i<vars.length; i++) {
		ast = {cons: "apply", left: ast, right: vars[i]};
	}
	return ast;
}
