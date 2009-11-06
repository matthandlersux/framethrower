
/************ 'fetch' keyword **********/
/* see doc/functions.txt for a description of fetching */


// the minimal collection of fetched expressions:
var fetchEnv = envAdd(falseEnv, "fetch", "fetch");

function desugarFetch(template, env) {
	if (!template) return;
	if (!env) env = fetchEnv;
	
	// {kind: "lineExpr", expr: AST, ?type: TYPE} |
	// {kind: "lineXML", xml: XML} |
	// {kind: "lineJavascript", f: JAVASCRIPTFUNCTION, type: TYPE} |
	// {kind: "lineState", action: LINETEMPLATE} | // action takes no parameters |
	// {kind: "lineTemplate", params: [VARTOCREATE], let: {VARTOCREATE: LINE}, output: LINE, type: TYPE} |
	// {kind: "lineAction", actions: [{name?: VARTOCREATE, action: LINE}], type: TYPE}
	
	var kind = template.kind;
	
	if (kind === "lineExpr")
		// make any fetches explicit and then desugar unfetches:
		template.expr = desugarUnfetch( substitute(template.expr, env) );
			
	else if(kind === "lineXML")
		template.xml = desugarFetchXML(template.xml, env);

	else if(kind === "lineState")
		desugarFetch(template.action, env);
	
	else if (kind === "lineTemplate") {
		// params hide previous bindings:
		env = envMinus(env, template.params);

		// lets hide previous bindings:
		env = envMinus(env, keys(template.let));
		
		// repeatedly go through lets, desugaring fetched ones into env until stable:
		// (since lets may refer to each other in unordered, weird ways)
		// [TODO could do this more cleanly with self-referencing environment, as in closure.js:addLets()?]
		var stable;
		do {
			stable = true; // assume nothing is going to happen
			for(var v in template.let) {
				var let = template.let[v];
			
				if(let.kind === "lineExpr") {
					desugarFetch(let, env); // desugar as much as possible for now
					
					if(hasVariable(let.expr, fetchEnv) && env(v)!==let.expr) {
						// expr is fetched, and either hadn't been stored before or has changed.
						env = envAdd(env, v, let.expr);
						stable = false; // things are happening
					}
				}
			}
		} while(!stable);
		
		// now get rid of fetched lets, since they are meaningless to anyone else:
		for(var v in template.let) {
			if(env(v))
				delete template.let[v];
		}
		
		// recurse on remaining lets:
		for(var v in template.let)
			desugarFetch(template.let[v], env);
		
		// recurse on output:
		var output = template.output;
		desugarFetch(output, env);
		if(output.kind==="lineExpr" && hasVariable(output.expr, fetchEnv)) {
			// console.warn("wrapping entire template output in &lt;f:each&gt; (may be inefficient; consider using 'unfetch'):<br/>",
			// 	unparse(output.expr)+"<br/>",
			// 	output.debugRef.file, output.debugRef.lineNumber);
			
			var varName = "_fetchLineExpr",
				val = output.expr,
			 	feach = makeFeach({kind: "lineExpr", expr: varName}, varName, unfetch(val));
			output = {kind: "lineXML", xml: feach};
			
			desugarFetch(output, env); // recurse in case nested fetches remain
			
			template.output = output;
		}
	}
	
	else if (kind === "lineAction") {
		// {kind: "lineExpr", expr: AST, ?type: TYPE} |
		// {kind: "actionCreate", type: TYPE, prop: {PROPERTYNAME: AST}} |
		// {kind: "extract", select: AST, action: LINETEMPLATE} // this action should take one (or two) parameters.
		
		// go through actions, recursing on each, and wrapping fetched actions in extracts:
		for(var i=0; i<template.actions.length; i++) {
			var v = template.actions[i].name,
				action = template.actions[i].action,
				vars = [],
				vals = [];
				
			desugarFetch(action, env);
			
			if(action.kind === "lineExpr")
				action.expr = processFetch(action.expr, env, "_fetchLineExpr", vars, vals);
			else if (action.kind === "actionCreate") {
				for(var j in action.prop)
					action.prop[j] = processFetch(action.prop[j], env, "_fetchCreateProp"+j, vars, vals);
			}
			else if (action.kind === "extract") {
				desugarFetch(action.action, env);
				action.select = processFetch(action.select, env, "_fetchExtractSelect", vars, vals);
			}

			if(v && env(v)) // new binding overrides a fetched binding
				env = envAdd(env, v, false);
			
			if(vars.length===0) // nothing was fetched, continue as usual
				continue;

			// otherwise, wrap this and all following actions in extracts:
			var lineAction = {kind: "lineAction", actions: template.actions.slice(i), type: template.type};
			for(var j=0; j<vars.length; j++) {
				var extract = makeExtract(lineAction, vars[j], vals[j]);
				lineAction = {kind: "lineAction", actions: [{action: extract}], type: template.type};
			}
			
			desugarFetch(lineAction, env); // recurse to process later actions, and in case nested fetches remain

			// replace this and later actions with the extract:
			template.actions = template.actions.slice(0,i);
			template.actions[i] = lineAction.actions[0];
		}
	}
}


function desugarFetchXML(xml, env) {
	// XML
	// 	{kind: "for-each", select: AST, lineTemplate: LINETEMPLATE} | // this lineTemplate should take one (or two) parameters. It will get called with the for-each's key (and value if a Map) as its parameters.
	// 	{kind: "call", lineTemplate: LINETEMPLATE} | // this lineTemplate should take zero parameters.
	// 	{kind: "on", event: EVENT, action: LINETEMPLATE} | // this action should take zero parameters.
	// 	{kind: "case", test: AST, lineTemplate: LINETEMPLATE, otherwise?: LINETEMPLATE} |
	// 	// test should evaluate to a cell, if it is non-empty then lineTemplate is run as if it were a for-each. If it is empty, otherwise is called.
	// 	// lineTemplate should take one parameter
	// 	// otherwise, if it exists, should take zero parameters
	// 	XMLNODE 
	// 
	// XMLNODE
	// 	{kind: "element", nodeName: STRING, attributes: {STRING: STRING | XMLINSERT}, style: {STRING: STRING | XMLINSERT}, children: [XML]} | // I have style separate from attributes just because the browser handles it separately
	// 	{kind: "textElement", nodeValue: STRING | XMLINSERT}
	// 
	// XMLINSERT
	// 	{kind: "insert", expr: AST}

	// put any fetched expressions in vars and vals,
	// and then wrap in an f:each:
	
	var kind = xml.kind,
		vars = [],
		vals = [];
		
	if (kind === "for-each") {
		desugarFetch(xml.lineTemplate, env);
		xml.select = processFetch(xml.select, env, "_fetchForEachSelect", vars, vals);
	}
	
	else if (kind === "call")
		desugarFetch(xml.lineTemplate, env);
		
	else if (kind === "on")
		desugarFetch(xml.action, env);
		
	else if (kind === "case") {
		desugarFetch(xml.lineTemplate, env);
		desugarFetch(xml.otherwise, env);
		xml.test = processFetch(xml.test, env, "_fetchCaseTest", vars, vals);
	}
	
	else if(kind === "element") {
		for(var i in xml.children)
			xml.children[i] = desugarFetchXML(xml.children[i], env);
		function desugarInsert1(x) {desugarInsert(x, env);}
		forEach(xml.attributes, desugarInsert1);
		forEach(xml.style, desugarInsert1);
	}

	else if(kind === "textElement")
		desugarInsert(xml.nodeValue, env);

	// note that all xml kinds above actually have at most one fetched expression,
	// i.e. processFetch is called at most once per kind,
	// so we only worry about vars[0]/vals[0], and create at most one f:each:
	if(vars.length>0) {
		xml = makeFeach({kind:"lineXML", xml:xml}, vars[0], vals[0]);
		desugarFetchXML(xml, env); // recurse in case more fetches remain
	}
	
	return xml;
}


function desugarInsert(insert, env) {
	if(typeOf(insert) === "string") return;
	if(insert.kind !== "insert") throw "desugarInsert() passed non-insert: "+JSONtoString(insert);
		
	insert.expr = desugarUnfetch( substitute(insert.expr, env) );
	// insert can handle any type, and works the same for t or Unit t,
	// so even if 'unfetch' wasn't given explicitly, we unfetch until no fetches remain:
	while(hasVariable(insert.expr, fetchEnv))
		insert.expr = unfetch(insert.expr);
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
		vars.push( varName );
		vals.push( unfetch(ast) );
		return varName;
	}
	return ast;
}

/*
* returns a reactive version of ast, with all first-level occurrences of 'fetch' removed.
* does not modify ast.
*/
function unfetch(ast) {
	var vars = [],
		vals = [];
	ast = collapseFetches(ast, vars, vals);
	ast = makeLambdasAST(ast, vars);
	ast = makeApplyAST("mapUnit"+vals.length, ast);
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
	if(ast.cons==="apply")
		return makeApplyAST(l, r);
	if(ast.cons==="lambda")
		return makeLambdaAST(l, r);
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
	if(ast.cons==="apply")
		return makeApplyAST(l, r);
	if(ast.cons==="lambda")
		return makeLambdaAST(l, r);
}
