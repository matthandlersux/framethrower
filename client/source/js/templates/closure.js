/*

LINE
	{kind: "lineExpr", expr: AST, type: TYPE} |
	{kind: "lineXML", xml: XML} |
	{kind: "lineJavascript", f: JAVASCRIPTFUNCTION, type: TYPE} |
	{kind: "lineState", lineAction: LINEACTION} | // action takes no parameters
	LINETEMPLATE |
	LINEACTION

LINETEMPLATE
	{kind: "lineTemplate", params: [VARTOCREATE], let: {VARTOCREATE: LINE}, output: LINE, type: TYPE}

LINEACTION
	{kind: "lineAction", params: [VARTOCREATE], [{name?: VARTOCREATE, action: ACTIONUNIT | LINE}], type: TYPE}

ACTIONUNIT
	{kind: "actionCreate", type: TYPE, prop: {PROPERTYNAME: AST}} |
	{kind: "actionUpdate", target: AST, actionType: "add" | "remove", key?: AST, value?: AST} |
	{kind: "extract", select: AST, lineAction: LINEACTION} // this lineAction should take one (or two) parameters.




XML
	{kind: "for-each", select: AST, lineTemplate: LINETEMPLATE} | // this lineTemplate should take one (or two) parameters. It will get called with the for-each's key (and value if a Map) as its parameters.
	{kind: "call", lineTemplate: LINETEMPLATE} | // this lineTemplate should take zero parameters.
	{kind: "on", event: EVENT, lineAction: LINEACTION} | // this action should take zero parameters.
	{kind: "trigger", trigger: AST, lineAction: LINEACTION} | // trigger should evaluate to a reactive value, action should take one (or two) parameters
	{kind: "case", test: AST, lineTemplate: LINETEMPLATE, otherwise?: LINETEMPLATE} |
	// test should evaluate to a cell, if it is non-empty then lineTemplate is run as if it were a for-each. If it is empty, otherwise is called.
	// lineTemplate should take one parameter
	// otherwise, if it exists, should take zero parameters
	XMLNODE 

XMLNODE
	{kind: "element", nodeName: STRING, attributes: {STRING: STRING | XMLINSERT}, style: {STRING: STRING | XMLINSERT}, children: [XML]} | // I have style separate from attributes just because the browser handles it separately
	{kind: "textElement", nodeValue: STRING | XMLINSERT}

XMLINSERT
	{kind: "insert", expr: AST}




where:
JAVASCRIPTFUNCTION is a javascript function,
TYPE is a string,
AST is an string for an expression,
VARTOCREATE is a STRING
PROPERTYNAME is a STRING
EVENT is a STRING
STRING is a string
BOOL is a boolean



Now,
a Template or closure (which is formed by template code plus an environment) is just a function of any number (including 0) of parameters resulting in XMLP

XMLP is XML along with an environment
	{xml: XML, env: ENV}

*/


var xmlpType = parseType("XMLP");

function makeXMLP(xml, env) {
	if (env === undefined) env = emptyEnv;
	return {kind: "xmlp", type: xmlpType, name: localIds(), remote: 2,
		xml: xml, env: env};
}


function makeClosure(lineTemplate, env) {
	var params = lineTemplate.params;
	var type = lineTemplate.type;
	
	var f = curry(function () {
		var scope = {};
		var args = arguments;
		forEach(params, function (param, i) {
			scope[param] = args[i];
		});
		var envWithParams = extendEnv(env, scope);
		
		var envWithLets = addLets(lineTemplate.let, envWithParams);
		
		return evaluateLine(lineTemplate.output, envWithLets);
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
		if (memo[s] !== undefined) {
			return memo[s];
		} else if (lets[s] !== undefined) {
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
		{kind: "lineExpr", expr: AST, type: TYPE} |
		{kind: "lineXML", xml: XML} |
		{kind: "lineJavascript", f: JAVASCRIPTFUNCTION, type: TYPE} |
		{kind: "lineState", lineAction: LINEACTION} | // action takes no parameters
		{kind: "lineTemplate", params: [VARTOCREATE], let: {VARTOCREATE: LINE}, output: LINE, type: TYPE} |
		{kind: "lineAction", params: [VARTOCREATE], [{name?: VARTOCREATE, action: ACTIONUNIT | LINE}], type: TYPE}
	*/
	
	if (line.kind === "lineExpr") {
		// var newEnv = addLets(line.let, env);
		// var expr = parseExpression(line.expr, newEnv);
		var expr = parseExpression(line.expr, env);
		//var expr = parseExpression(parse(line.expr), newEnv);
		return evaluate(expr);
	} else if (line.kind === "lineTemplate") {
		return makeClosure(line, env);
	} else if (line.kind === "lineJavascript") {
		return makeFun(line.type, curry(line.f));
		//return makeFun(parseType(line.type), line.f);
	} else if (line.kind === "lineXML") {
		return makeXMLP(line.xml, env);
	} else if (line.kind === "lineState") {
		var ac = makeActionClosure(line.lineAction, env);
		return executeAction(ac);
		
		//return makeCC(line.type);
		//return makeCC(parseType(line.type));
	} else if (line.kind === "lineAction") {
		return makeActionClosure(line, env);
	}
}