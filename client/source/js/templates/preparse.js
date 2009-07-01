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




function desugarFetch(template) {
	
	/*
	this function takes an AST (ie: as returned by parse()) and returns an AST
		where all instances of fetch have been removed and various mapUnit's have been added.
	examples:
		fetch x => x			[ or maybe this should be: mU1 (x0 -> x0) x ]
		plus (fetch x) 6 => mU1 (x0 -> plus x0 6) x
		plus (fetch x) (fetch y) => mU2 (x0 -> x1 -> plus x0 x1) x y
		plus (fetch x) (fetch x) => mU1 (x0 -> plus x0 x0) x
		plus (plus (fetch x) 6) 8 => mU1 (x0 -> plus (plus x0 6) 8) x
	
	Notice that if 
	*/
	function removeFetch(ast) {
		
	}
	
}
