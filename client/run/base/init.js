preparse(mainTemplate);

function initialize() {
	
	// forEach(base.debug(), function (o, name) {
	// 	console.log(name, unparseType(getType(o)));
	// });
}




/*
A static type analysis looks like:
{
	type: TYPE,
	line: LINE,
	let?: {VTC: STATICTYPEANALYSIS}
}
*/

function staticAnalysisError(msg) {
	debug.error(msg);
}


function makePlaceholder(type) {
	return {
		type: type,
		name: localIds()
	};
}



function typeCurriedToArray(type) {
	if (type.kind === "typeLambda") {
		return [type.left].concat(typeCurriedToArray(type.right));
	} else {
		return [type];
	}
}
function arrayToCurriedType(a) {
	var ret;
	forEachReverse(a, function (t) {
		if (!ret) {
			ret = t;
		} else {
			ret = makeTypeLambda(t, ret);
		}
	});
	return ret;
}


function staticTypeAnalysis(line, env) {
	function addLets(lets, env) {
		var memo = {};
		function newEnv(s) {
			if (memo[s] !== undefined) {
				return memo[s];
			} else if (lets[s] !== undefined) {
				memo[s] = staticTypeAnalysis(lets[s], newEnv);
				return memo[s];
			} else {
				return env(s);
			}
		}
		return newEnv;
	}
	
	var type;
	
	var extra = {};
	
	if (line.kind === "lineExpr") {
		try {
			var expr = parseExpression(line.expr, env);
			type = getType(expr);			
		} catch (e) {
			staticAnalysisError("Type check failed.");
		}
	} else if (line.kind === "lineTemplate") {
		type = line.template.type;
		
		var scope = {};
		var typeArray = typeCurriedToArray(type);
		forEach(line.template.params, function (param, i) {
			scope[param] = makePlaceholder(typeArray[i]);
		});
		var envWithParams = extendEnv(env, scope);
		
		var newEnv = addLets(line.template.let, envWithParams);
		let = {};
		forEach(line.template.let, function (junk, name) {
			let[name] = newEnv(name);
			console.log("did a let", name, unparseType(getType(let[name])));
		});
		extra.let = let;
		
		// check that output matches the output type (ie: XMLP i guess)
		var outputAnalysis = staticTypeAnalysis(line.template.output, newEnv);
		extra.output = outputAnalysis;
		if (!compareTypes(outputAnalysis.type, typeArray[typeArray.length - 1])) {
			staticAnalysisError("Template output is not the right type (XMLP)");
		}
		
	} else if (line.kind === "lineJavascript") {
		type = line.type;
	} else if (line.kind === "lineXML") {
		type = parseType("XMLP");
		// check that everything inside is good to go
		staticTypeAnalysisXML(line.xml, env);
	} else if (line.kind === "lineState") {
		type = getActionReturnType(line.action, env);
	} else if (line.kind === "lineAction") {
		type = getActionReturnType(line.action, env);
	} else if (line.kind === "lineBlock") {
		var newEnv = addLets(line.let, env);
		var let = {};
		forEach(line.let, function (junk, name) {
			let[name] = newEnv(name);
		});
		extra.let = extra;
		var innerSA = staticTypeAnalysis(line.output, newEnv);
		type = innerSA.type;
	}
	
	var ret = makePlaceholder(type);
	ret.line = line;
	ret.extra = extra;
	return ret;
}



/*

XML
	XMLNODE | 
	CASE |
	{kind: "for-each", select: AST, templateCode: TEMPLATECODE} | // this templateCode should take one (or two) parameters. It will get called with the for-each's key (and value if a Map) as its parameters.
	{kind: "call", templateCode: TEMPLATECODE} // this templateCode should take zero parameters.
	{kind: "on", event: EVENT, action: ACTION} // this action should take zero parameters.
	{kind: "trigger", trigger: AST, action: ACTION} // trigger should evaluate to a reactive value, action should take one (or two) parameters

CASE
	{kind: "case", test: AST, templateCode: TEMPLATECODE, otherwise?: TEMPLATECODE}
	// test should evaluate to a cell, if it is non-empty then templateCode is run as if it were a for-each. If it is empty, otherwise is called.
	// templateCode should take one parameter
	// otherwise, if it exists, should take zero parameters

XMLNODE
	{kind: "element", nodeName: STRING, attributes: {STRING: STRING | XMLINSERT}, style: {STRING: STRING | XMLINSERT}, children: [XML]} | // I have style separate from attributes just because the browser handles it separately
	{kind: "textElement", nodeValue: STRING | XMLINSERT}

XMLINSERT
	{kind: "insert", expr: AST}

*/


function staticTypeAnalysisXML(xml, env) {
	function checkInsert(ins) {
		if (typeOf(ins) === "string") return;
		else {
			try {
				var expr = parseExpression(ins.expr, env);
				var type = getType(expr);
			} catch (e) {
				console.log("having trouble..", xml, unparse(ins));
				staticAnalysisError("Type check failed.");
			}
		}
	}
	if (xml.kind === "element") {
		forEach(xml.attributes, checkInsert);
		forEach(xml.style, checkInsert);
		forEach(xml.children, function (child) {
			staticTypeAnalysisXML(child, env);
		});
	} else if (xml.kind === "textElement") {
		checkInsert(xml.nodeValue);
	} else if (xml.kind === "for-each") {
		try {
			var select = parseExpression(xml.select, env);
			var selectType = getType(select);			
		} catch (e) {
			staticAnalysisError("f:each select type check failed.");
		}
		
		var constructor = getTypeConstructor(type);
		
		if (constructor === "Map") {
			
		} else if (constructor === "Unit" || constructor === "Future" || constructor === "Set") {
			
		} else {
			staticAnalysisError("f:each select type is not a cell.");
		}
		
		// TODO
	} else if (xml.kind === "call") {
		staticTypeAnalysis({kind: "lineTemplate", template: xml.templateCode}, env);
	} else if (xml.kind === "on") {
		// TODO
	} else if (xml.kind === "trigger") {
		// TODO
	}
}






function getActionReturnType(action, env) {
	var type = action.type;
	
	var scope = {};
	var typeArray = typeCurriedToArray(type);
	forEach(action.params, function (param, i) {
		scope[param] = makePlaceholder(typeArray[i]);
	});
	var envWithParams = extendEnv(env, scope);
	
	var returnType = parseType("Void");
	
	forEach(action.actions, function (actionLine) {
		var ac = actionLine.action;
		var type;
		if (ac.kind === "actionCreate") {
			type = ac.type;
			// TODO: check that properties are correctly there
		} else if (ac.kind === "actionUpdate") {
			// TODO: check that it's actually a cell I guess
		} else {
			type = staticTypeAnalysis(ac, envWithParams).type;
		}
		if (actionLine.name) {
			scope[actionLine.name] = makePlaceholder(type);
		} else if (type) {
			returnType = type;
		}
	});
	
	var newTypeArray = typeArray.slice(0, -1).concat([returnType]);
	
	return arrayToCurriedType(newTypeArray);
}

