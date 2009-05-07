/*

TEMPLATECODE
	{
		kind: "templateCode",
		params: [name: VARTOCREATE],
		type: TYPE, // this will always be a function (perhaps with 0 parameters) resulting in type XMLP
		let: LETS,
		output: LINE
	}

LETS
	{VARTOCREATE: LINE}

LINE
	{kind: "lineExpr", let: LETS, expr: AST},
	{kind: "lineTemplate", template: TEMPLATECODE},
	{kind: "lineJavascript", type: TYPE, f: JAVASCRIPTFUNCTION},
	{kind: "lineXML", xml: XML}
	// TODO actions, state


XML
	XMLNODE |
	{kind: "for-each", select: AST, templateCode: TEMPLATECODE} | // this templateCode should take one (or two) parameters. It will get called with the for-each's key (and value if a Map) as its parameters.
	{kind: "call", templateCode: TEMPLATECODE} // this templateCode should take zero parameters.
	// TODO: case, on-action

XMLNODE
	{kind: "element", nodeName: STRING, attributes: {STRING: STRING | XMLINSERT}, style: {STRING: STRING | XMLINSERT}, children: [XML]} | // I have style separate from attributes just because the browser handles it separately
	{kind: "textElement", nodeValue: STRING | XMLINSERT}

XMLINSERT
	{kind: "insert", expr: AST}




where:
JAVASCRIPTFUNCTION is a javascript function,
TYPE is a type,
AST is an AST (this is just a first-pass parsed Expr, so every leaf is a string that hasn't been bound yet),
VARTOCREATE is a STRING
STRING is a string



Now,
a Template or closure (which is formed by template code plus an environment) is just a function of any number (including 0) of parameters resulting in XMLP

XMLP is XML along with an environment
	{xml: XML, env: ENV}

*/


var xmlpType = parseType("XMLP");

function makeXMLP(xml, env) {
	return {kind: "xmlp", type: xmlpType, name: localIds(), remote: 2,
		xml: xml, env: env};
}


function makeClosure(templateCode, env) {
	var params = templateCode.params;
	//var type = templateCode.type;
	var type = parseType(templateCode.type);
	
	var f = curry(function () {
		var scope = {};
		var args = arguments;
		forEach(params, function (param, i) {
			scope[param] = args[i];
		});
		var envWithParams = extendEnv(env, scope);
		
		var envWithLets = addLets(templateCode.let, envWithParams);
		
		return evaluateLine(templateCode.output, envWithLets);
	}, params.length);
	
	if (params.length > 0) {
		return makeFun(type, f);
	} else {
		return f;
	}
}


// takes a LETS and an environment env,
// returns an environment that inherits from env and also includes everything from lets
// features laziness and therefore mutual recursion, so the lets can be in any order
function addLets(lets, env) {
	var memo = {};
	function newEnv(s) {
		if (memo[s]) {
			return memo[s];
		} else if (lets[s]) {
			memo[s] = evaluateLine(lets[s], newEnv);
			return memo[s];
		} else {
			return env(s);
		}
	}
	return newEnv;
}

function evaluateLine(line, env) {
	/*
	{kind: "lineExpr", let: LETS, expr: AST},
	{kind: "lineTemplate", template: TEMPLATECODE},
	{kind: "lineJavascript", type: TYPE, f: JAVASCRIPTFUNCTION},
	{kind: "lineXML", xml: XML}
	*/
	
	if (line.kind === "lineExpr") {
		var newEnv = addLets(line.let, env);
		//var expr = parseExpression(line.expr, newEnv);
		var expr = parseExpression(parse(line.expr), newEnv);
		return evaluate(expr);
	} else if (line.kind === "lineTemplate") {
		return makeClosure(line.template, env);
	} else if (line.kind === "lineJavascript") {
		//return makeFun(line.type, line.f);
		return makeFun(parseType(line.type), line.f);
	} else if (line.kind === "lineXML") {
		return makeXMLP(line.xml, env);
	} else if (line.kind === "lineState") {
		//return makeCC(line.type);
		return makeCC(parseType(line.type));
	}
}