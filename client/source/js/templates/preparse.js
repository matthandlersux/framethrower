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
function removeFetch(ast) {
	
}


/*
this function goes through the template tree (see doc/template semantics.txt)
it keeps an environment mapping words (VTCs) to their expressions, but only if the expressions have fetch
whenever it encounters a new expression, it checks to see if it has fetch or makes reference to a word that has fetch
	if so, it replaces the word(s) with its expression(s) in the env, and replaces the expression in the template tree with its removeFetch'ed version
*/
function desugarFetch(template, env) {
	if (!env) env = falseEnv; // or maybe, to be clever, the starting environment should just be the word "fetch" mapped to "fetch"

	
}
