function typeAnalyze(line) {
	
	var currentLine = null;
	var GlobalError = false;


	function staticAnalysisError(msg) {
		GlobalError = true;
		var debugRef = currentLine.debugRef;
		msg = msg.replace(/\n/g, "<br />");
		if(debugRef)
			console.log(
				"<div style=\"margin-left:15px;font:8px\"><a href=\"txmt://open/?url=file://"
				+ debugRef.file + "&line=" + debugRef.lineNumber + "\">error on line" + 
				debugRef.lineNumber + "</a> <br />" + msg + "<br /><br /></div>"
			);
		else
			console.log(
				"<div style=\"margin-left:15px;font:8px\">" + msg + "<br /><br /></div>"
			);
		//debug.error(msg, currentLine.debugRef);
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


	function getWords(ast, lambdaVariables) {
		if (!lambdaVariables) lambdaVariables = falseEnv;
		if (typeOf(ast) === "string") {
			if (lambdaVariables(ast)) {
				return [];
			} else {
				return [ast];
			}
		} else if (ast.cons === "apply") {
			return getWords(ast.left, lambdaVariables).concat(getWords(ast.right, lambdaVariables));			
		} else if (ast.cons === "lambda") {
			var newLambdaVariables = envAdd(lambdaVariables, ast.left, true);
			return getWords(ast.right, newLambdaVariables);
		}
	}

	function getWordsTypes(ast, env) {
		var words = getWords(ast);
		var wordTypes = {};

		forEach(words, function (word) {
			try {
				var found = env(word);
			} catch (e) {
				staticAnalysisError("Expression `"+unparse(ast)+"` has unknown word: `"+word+"`");
			}
			wordTypes[word] = unparseType(getType(found));
		});
		
		var wordTypesError = "";
		forEach(wordTypes, function (type, word) {
			wordTypesError += word + " :: " + type + "\n";
		});
		
		return wordTypesError;
	}

	
	function getTypeOfAST(ast, env) {
		wordsTypes = getWordsTypes(ast, env);

		try {
			var expr = parseExpression(ast, env);
			var type = getType(expr);			
		} catch (e) {

			staticAnalysisError("Type check failed on `"+unparse(ast)+"`.\n\n"+wordsTypes);
		}
		return type;
	}


	/*
	A static type analysis looks like:
	{
		type: TYPE,
		line: LINE,
		extra: {...}
	}

	Note: this really only checks that there are no type errors.. in the future it should return something that will tell you the type of every VTC

	*/

	function staticTypeAnalysis(line, env) {
		currentLine = line;

		function addLets(lets, env) {
			var memo = {};
			function newEnv(s) {
				if (memo[s] !== undefined) {
					return memo[s];
				} else if (lets[s] !== undefined) {
					// this is here to prevent infinite loop
					if (lets[s].kind === "lineTemplate") {
						memo[s] = makePlaceholder(lets[s].type);
					}

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
			type = getTypeOfAST(line.expr, env);
			if (line.type !== undefined && !compareTypes(type, line.type)) {
				var extraInfo = "\nwith `"+unparse(line.expr)+"`\n\n"+getWordsTypes(line.expr, env);
				staticAnalysisError("Expr is not the annotated type. Annotated type is: `"+unparseType(line.type)+"` but actual type is: `"+unparseType(type)+"`" + extraInfo);
			}
		} else if (line.kind === "lineTemplate") {
			if (line.type !== undefined) {
				type = line.type;

				var scope = {};
				var typeArray = typeCurriedToArray(type);
				forEach(line.params, function (param, i) {
					scope[param] = makePlaceholder(typeArray[i]);
				});
				var envWithParams = extendEnv(env, scope);

				var newEnv = addLets(line.let, envWithParams);
				let = {};
				forEach(line.let, function (junk, name) {
					let[name] = newEnv(name);
					//console.log("did a let", name, unparseType(getType(let[name])));
				});
				extra.let = let;

				// check that output matches the output type
				var outputAnalysis = staticTypeAnalysis(line.output, newEnv);
				extra.output = outputAnalysis;
				
				// TODO: take out the second condition from this when type annotations are worked out with Andrew -Toby
				if (!compareTypes(outputAnalysis.type, typeArray[typeArray.length - 1]) && unparseType(typeArray[typeArray.length - 1]) !== "Action a0") {
					var extraInfo = line.output.kind === "lineExpr" ? "\nwith `"+unparse(line.output.expr)+"`\n\n"+getWordsTypes(line.output.expr, newEnv) : "";
					staticAnalysisError("Template output is not the right type. Expected `"+unparseType(typeArray[typeArray.length - 1])+"` but got 1 `"+unparseType(outputAnalysis.type)+"`" + extraInfo);
				}
				
				typeArray[typeArray.length - 1] = outputAnalysis.type;
				type = arrayToCurriedType(typeArray);
			}

		} else if (line.kind === "lineJavascript") {
			type = line.type;
		} else if (line.kind === "lineXML") {
			type = parseType("XMLP");
			// check that all the XML inside is good to go
			staticTypeAnalysisXML(line.xml, env);
		} else if (line.kind === "lineState") {
			var actionType = staticTypeAnalysis(line.action, env).type;
			checkIsAction(actionType);
			type = actionType.right;
		} else if (line.kind === "lineAction") {
			type = getActionResultType(line.actions, env);
			//type = line.type;
		} else if (line.kind === "actionCreate") {
			// check that properties are appropriate
			// TODO
			
			type = makeTypeApply(parseType("Action"), line.type);
		} else if (line.kind === "extract") {
			// TODO
			
			var selectType = getTypeOfAST(line.select, env);
			var constructor = getTypeConstructor(selectType);
			
			var hackedLineTemplate = {
				kind: "lineTemplate",
				params: line.action.params,
				let: line.action.let,
				output: line.action.output
			};
			
			if (constructor === "Map") {
			    var keyType = selectType.left.right;
			    var valueType = selectType.right;

			    hackedLineTemplate.type = makeTypeLambda(keyType, makeTypeLambda(valueType, parseType("Action a0")));
			} else if (constructor === "Unit" || constructor === "Set" || constructor === "List") {
			    var keyType = selectType.right;

			    hackedLineTemplate.type = makeTypeLambda(keyType, parseType("Action a0"));
			} else {
			    staticAnalysisError("Extract select type is not a cell or list.");
			}
			
			staticTypeAnalysis(hackedLineTemplate, env);
			
			type = parseType("Action Void");
		}

		var ret = makePlaceholder(type);
		ret.line = line;
		ret.extra = extra;
		ret.success = !GlobalError;
		return ret;
	}
	
	
	function getActionResultType(actions, env) {
		var scope = {};
		var actionEnv = extendEnv(env, scope);
		
		var outputType = parseType("Action Void");
		forEach(actions, function (action) {
			var type = staticTypeAnalysis(action.action, actionEnv).type;
			checkIsAction(type);
			if (action.name !== undefined) {
				scope[action.name] = makePlaceholder(type.right);
			} else {
				outputType = type;
			}
		});
		
		return outputType;
	}
	
	function checkIsAction(type) {
		if (!type.left || type.left.value !== "Action") {
			//print("Is the thing even a type? "+JSON.stringify(type)+"<br><br>");
			staticAnalysisError("Expecting an Action but got `"+unparseType(type)+"`");
		}
	}



	/*

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

	*/

	var eventExtraTypes = map(eventExtras, function (extra) {
		return makePlaceholder(extra.type);
	});


	function staticTypeAnalysisXML(xml, env) {
		currentLine = xml;

		function checkInsert(ins) {
			if (typeOf(ins) === "string") return;
			else {
				getTypeOfAST(ins.expr, env);
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
			var selectType = getTypeOfAST(xml.select, env);

			var constructor = getTypeConstructor(selectType);

			// TODO might want to check that the type is really valid... but this should probably be guaranteed somewhere else

			var hackedLineTemplate = {
				kind: "lineTemplate",
				params: xml.lineTemplate.params,
				let: xml.lineTemplate.let,
				output: xml.lineTemplate.output
			};

			if (constructor === "Map") {
				var keyType = selectType.left.right;
				var valueType = selectType.right;

				hackedLineTemplate.type = makeTypeLambda(keyType, makeTypeLambda(valueType, parseType("XMLP")));
			} else if (constructor === "Unit" || constructor === "Set" || constructor === "List") {
				var keyType = selectType.right;

				hackedLineTemplate.type = makeTypeLambda(keyType, parseType("XMLP"));
			} else {
				staticAnalysisError("f:each select type is not a cell. But is instead of type `"+unparseType(selectType)+"`");
			}

			staticTypeAnalysis(hackedLineTemplate, env);
		} else if (xml.kind === "call") {
			staticTypeAnalysis(xml.lineTemplate, env);
		} else if (xml.kind === "on") {
			var actionType = staticTypeAnalysis(xml.action, extendEnv(env, eventExtraTypes));
			checkIsAction(actionType.type);
		} else if (xml.kind === "trigger") {
			// TODO
		}
	}
	
	
	return staticTypeAnalysis(line, base.env);
	
}


