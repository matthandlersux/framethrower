function typeAnalyze(line) {
	
	var currentLine = null;
	var GlobalError = false;


	function staticAnalysisError(msg) {
		GlobalError = true;
		var debugRef = currentLine.debugRef;
		msg = msg.replace(/\n/g, "<br />");
		print(
			"<div style=\"margin-left:15px;font:8px\"><a href=\"txmt://open/?url=file://"
			+ debugRef.file + "&line=" + debugRef.lineNumber + "\">error on line" + 
			debugRef.lineNumber + "</a> <br />" + msg + "<br /><br /></div>"
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




	/*
	A static type analysis looks like:
	{
		type: TYPE,
		line: LINE,
		extra: {...}
	}

	Note: this really only checks now.. in the future it should return something that will tell you the type of every VTC

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

				// check that output matches the output type (XMLP)
				var outputAnalysis = staticTypeAnalysis(line.output, newEnv);
				extra.output = outputAnalysis;
				if (!compareTypes(outputAnalysis.type, typeArray[typeArray.length - 1])) {
					var extraInfo = line.output.kind === "lineExpr" ? "\nwith `"+unparse(line.output.expr)+"`\n\n"+getWordsTypes(line.output.expr, newEnv) : "";
					staticAnalysisError("Template output is not the right type. Expected `"+unparseType(typeArray[typeArray.length - 1])+"` but got `"+unparseType(outputAnalysis.type)+"`" + extraInfo);
				}
			}

		} else if (line.kind === "lineJavascript") {
			type = line.type;
		} else if (line.kind === "lineXML") {
			type = parseType("XMLP");
			// check that everything inside is good to go
			staticTypeAnalysisXML(line.xml, env);
		} else if (line.kind === "lineState") {
			type = getActionReturnType(line.lineAction, env);
		} else if (line.kind === "lineAction") {
			type = getActionReturnType(line, env);
		}

		var ret = makePlaceholder(type);
		ret.line = line;
		ret.extra = extra;
		ret.success = !GlobalError;
		return ret;
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
			} else if (constructor === "Unit" || constructor === "Future" || constructor === "Set") {
				var keyType = selectType.right;

				hackedLineTemplate.type = makeTypeLambda(keyType, parseType("XMLP"));
			} else {
				staticAnalysisError("f:each select type is not a cell.");
			}

			staticTypeAnalysis(hackedLineTemplate, env);
		} else if (xml.kind === "call") {
			staticTypeAnalysis(xml.lineTemplate, env);
		} else if (xml.kind === "on") {
			getActionReturnType(xml.lineAction, extendEnv(env, eventExtraTypes));
		} else if (xml.kind === "trigger") {
			// TODO
		}
	}



	function getActionReturnType(lineAction, env) {
		var type = lineAction.type;

		var scope = {};
		var typeArray = typeCurriedToArray(type);
		forEach(lineAction.params, function (param, i) {
			scope[param] = makePlaceholder(typeArray[i]);
		});
		var envWithParams = extendEnv(env, scope);

		var returnType = parseType("Void");

		forEach(lineAction.actions, function (actionLine) {
			var ac = actionLine.action;
			currentLine = ac;

			var type;
			if (ac.kind === "actionCreate") {
				type = ac.type;
				// TODO: check that properties are correctly there
			} else if (ac.kind === "actionUpdate") {
				// check that it's actually a cell, and the supplied key/value expressions are the proper type
				var modifyingType = getTypeOfAST(ac.target, envWithParams);
				var keyType = ac.key ? getTypeOfAST(ac.key, envWithParams) : undefined;
				var valueType = ac.value ? getTypeOfAST(ac.value, envWithParams) : undefined;

				var constructor = getTypeConstructor(modifyingType);
				if (constructor === "Map") {
					if (keyType && !compareTypes(keyType, modifyingType.left.right)) {
						staticAnalysisError("Update key, `"+unparse(ac.key)+"`, has wrong type, expected `"+unparseType(modifyingType.right)+"` but got `"+unparseType(keyType)+"`" + "\n\n"+getWordsTypes(ac.key, envWithParams));
					}
					if (valueType && !compareTypes(valueType, modifyingType.right)) {
						staticAnalysisError("Update value, `"+unparse(ac.value)+"`, has wrong type, expected `"+unparseType(modifyingType.right)+"` but got `"+unparseType(valueType)+"`" + "\n\n"+getWordsTypes(ac.value, envWithParams));
					}
				} else if (constructor === "Unit" || constructor === "Set") {
					if (keyType && !compareTypes(keyType, modifyingType.right)) {
						staticAnalysisError("Update key, `"+unparse(ac.key)+"`, has wrong type, expected `"+unparseType(modifyingType.right)+"` but got `"+unparseType(keyType)+"`" + "\n\n"+getWordsTypes(ac.key, envWithParams));
					}
				} else {
					staticAnalysisError("Update action target not a Map, Set, or Unit");
				}
				// TODO check that the add/remove has key/value as appropriate
			} else if (ac.kind === "extract") {
				// TODO
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
	
	
	
	return staticTypeAnalysis(line, base.env);
	
}


