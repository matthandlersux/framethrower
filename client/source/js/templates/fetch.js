
/************ 'fetch' keyword **********/

var fetchEnv = envAdd(falseEnv, "fetch", "fetch");

function desugarFetch(template, env) {
	if (!template) return;
	if (!env) env = fetchEnv;
	
	var kind = template.kind;
	
	if (kind === "lineExpr") {
		// make any fetches explicit and then desugar unfetches:
		template.expr = desugarUnfetch( substitute(template.expr, env) );
	}
	
	else if (kind === "lineTemplate") {
		// params hide previous bindings:
		env = envMinus(env, template.params);

		// go through lets, recursing on each, and remembering (and destroying) any fetched lineExprs:
		for(var v in template.let) {
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
		
		// recurse on output:
		var output = template.output;
		desugarFetch(output, env);
		
		// if output is fetched, wrap it in an f:each:
		if(output.kind==="lineExpr" && hasVariable(output.expr, fetchEnv)) {
			var type = template.type;
			if(type) { // figure out output type (by 'applying' template.type to template.params):
				for(var i in template.params) {
					if(type.kind!=="typeLambda") {
						console.error("template has bad type:");
						console.error(JSONtoString(template));
					}
					type = type.right;
				}
			}
			if(!type || !compareTypes(type, parseType("XMLP"))) {
				console.error("fetched output not supported in non-XML template:");
				console.error(JSONtoString(template));
			}
			
			var feach = makeFeach(output, "_fetchLineExpr", unfetch(output.expr));
			output.expr = "_fetchLineExpr";
			template.output = {kind:"lineXML", xml:feach};

			// console.debug("lineTemplate.output desugared to:");
			// console.debug(JSONtoString(template.output));

			desugarFetch(template.output, env); // recurse in case more fetches remain
		}

		// we don't want to forEach() on this, since we've already taken care of everything:
		return;
	}
	
	else if (kind === "lineAction") {
		env = envMinus(env, template.params);

		// go through actions, recursing on each, remembering (and destroying) any fetched lineExprs,
		// and wrapping fetched actions in extracts:
		for(var i=0; i<template.actions.length; i++) {
			var v = template.actions[i].name,
				action = template.actions[i].action;

			desugarFetch(action, env);

			if(action.kind === "lineExpr" && hasVariable(action.expr, fetchEnv)) {
				if(v)
					env = envAdd(env, v, action.expr);
				else
					console.warn("removing pointless fetched line: "+JSONtoString(template.actions[i]));
				template.actions.splice(i,1); // remove element i
				i--;
				continue;
			}
			
			if(v && env(v))
				env = envAdd(env, v, false);

			var vars = [],
				vals = [];
			
			if (action.kind === "actionCreate") {
				for(var j in action.prop)
					action.prop[j] = processFetch(action.prop[j], env, "_fetchCreateProp"+j, vars, vals);
			}
			else if (action.kind === "actionUpdate") {
				action.target = processFetch(action.target, env, "_fetchUpdateTarget", vars, vals);
				if(action.key)
					action.key = processFetch(action.key, env, "_fetchCreateKey", vars, vals);
				if(action.value)
					action.value = processFetch(action.value, env, "_fetchCreateValue", vars, vals);
			}
			else if (action.kind === "extract")
				action.select = processFetch(action.select, env, "_fetchExtractSelect", vars, vals);
			
			if(vars.length===0) // nothing was fetched, continue as usual
				continue;

			// wrap this and later actions in extracts:
			var lineAction = {kind:"lineAction", params:[], actions:template.actions.slice(i)};
			for(var j=0; j<vars.length; j++) {
				lineAction.params = [vars[j]];
				lineAction.type = parseType("a -> Action");
				var extract = {kind:"extract", select:unfetch(vals[j]), lineAction:lineAction};
				lineAction = {kind:"lineAction", params:[], actions:[{action:extract}]};
			}

			// console.debug("lineAction.action desugared to:");
			// console.debug(JSONtoString(lineAction.actions[0]));
			
			desugarFetch(lineAction, env); // recurse to process later actions, and in case more fetches remain

			// replace this and later actions with the extract:
			template.actions = template.actions.slice(0,i);
			template.actions[i] = lineAction.actions[0];
			return;
		}

		return;
	}
	
	else if(kind === "lineXML") {
		template.xml = desugarFetchXML(template.xml, env);
	}
	else if(kind === "element") {
		for(var i in template.children)
			template.children[i] = desugarFetchXML(template.children[i], env);
	}
	
	else if (kind === "insert") {
		template.expr = desugarUnfetch( substitute(template.expr, env) );
		// insert can handle any type, and works the same for t or Unit t,
		// so we don't care whether 'unfetch' is used -- we unfetch either way:
		while(hasVariable(template.expr, fetchEnv))
			template.expr = unfetch(template.expr);
		
		// console.debug("desugared insert to:");
		// console.debug(JSONtoString(template));
	}

	if (arrayLike(template) || objectLike(template)) {
		forEach(template, function (x) {desugarFetch(x,env);});
	}
}

function desugarFetchXML(xml, env) {
	var kind = xml.kind,
		vars = [],
		vals = [];
	if (kind === "case")
		xml.test = processFetch(xml.test, env, "_fetchCaseTest", vars, vals);
	else if (kind === "for-each")
		xml.select = processFetch(xml.select, env, "_fetchForEachSelect", vars, vals);
	else if (kind === "trigger")
		xml.trigger = processFetch(xml.trigger, env, "_fetchTriggerTrigger", vars, vals);
	
	if(vars.length===0)
		return xml;

	var feach = makeFeach({kind:"lineXML", xml:xml}, vars[0], unfetch(vals[0]));
	
	// console.debug("xml desugared to:");
	// console.debug(JSONtoString(feach));
	// (note feach will be recursed on by forEach() at end of desugarFetch(lineXML,env),
	// in case there are remaining fetches)
	return feach;
}

/*
* returns a version of env with everything in vars mapping to false.
* does not modify env.
*/
function envMinus(env, vars) {
	return function(s) {
		var v = env(s);
		if(v && vars.indexOf(s)===-1)
			return v;
		return false;
	};
}

function disallowFetch(ast, template) {
	if(hasVariable(ast, fetchEnv))
		console.error("the fetched expression ("+unparse(ast)+") is not supported in the context: "+JSONtoString(template));
}

/*
* let ast=desugarUnfetch(substitute(ast, env)).
* if ast is fetched, return varName, and record vals[varName]=ast.
* otherwise just return ast.
* does not modify ast.
*/
function processFetch(ast, env, varName, vars, vals) {
	ast = desugarUnfetch( substitute(ast, env) );
	if(hasVariable(ast, fetchEnv)) {
		var i=vals.indexOf(ast);
		if(i!==-1) // already have a var for ast
			return vars[i];
		vars.push(varName);
		vals.push(ast);
		return varName;
	}
	return ast;
}

/*
* returns a monadic version of ast, with all first-level occurrences of 'fetch' removed.
* does not modify ast.
*/
function unfetch(ast) {
	var vars = [],
		vals = [];
	ast = collapseFetches(ast, vars, vals);
	ast = makeLambdasAST(ast, vars);
	ast = {cons: "apply", left: "mapUnit"+vals.length, right: ast};
	ast = makeAppliesAST(ast, vals);
	
	if(vars.length===0)
		console.warn("unfetch applied to fetch-less expression ("+unparse(ast)+")");

	return ast;
}

function desugarUnfetch(ast) {
	if(typeOf(ast) === "string")
		return ast;
	
	if(ast.cons==="apply" && ast.left==="unfetch")
		return unfetch(ast.right);
	
	var l = desugarUnfetch(ast.left),
		r = desugarUnfetch(ast.right);
	if(l===ast.left && r===ast.right) // nothing changed
		return ast;
	return {cons: ast.cons, left: l, right: r};
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
* returns the application of ast to vals.
* does not modify ast.
*/
function makeAppliesAST(ast, vals) {
	for(var i=0; i<vals.length; i++) {
		ast = {cons: "apply", left: ast, right: vals[i]};
	}
	return ast;
}

function makeFeach(template, varName, value) {
	return {kind:"for-each", select:value,
		lineTemplate:{kind:"lineTemplate", params:[varName], let:{}, output:template}};
}
