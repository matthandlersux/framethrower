var semantics = function(){
	var filename;


	// ==================================
	// UTIL
	// ==================================
	
	function def(obj) {
		return obj !== undefined;
	}

	function addDebugRef(obj, debugRef) {
		if(objectLike(obj)) {
			forEach(obj, function(value) {
				addDebugRef(value, debugRef);
			});
			obj.debugRef = debugRef;
		}
	}
	
	//this should cover all the weird constructs that need to be made into lists
	//TODO: make all these constructs uniform in the parser
	function makeList(node, listName, nextName, onEachFunc) {
		//this handles nodes that are already lists
		if (node !== undefined && arrayLike(node)) {
			if (def(onEachFunc)) {
				var output = [];
				forEach(node, function(elem) {
					output.push(onEachFunc(elem));
				});
				return output;
			} else {
				return node;
			}
		} else {
			function helper(node) {
				if(node === undefined || node === {}) return [];
				if(def(node[nextName]) && node[nextName] !== {}) {
					var ret = helper(node[listName]);
					if(def(onEachFunc)) {
						ret.push(onEachFunc(node[nextName]));
					} else {
						ret.push(node[nextName]);
					}
					return ret;
				} else {
					return helper(node[listName]);
				}
			}
			return helper(node);
		}
	}
	
	function makeListFlatten(node, listName, nextName, onEachFunc) {
		function helper(node) {
			if(node == undefined || node == {}) return [];
			if(def(node[nextName]) && node[nextName] !== {}) {
				var ret = helper(node[listName]);
				if(def(onEachFunc)) {
					return ret.concat(onEachFunc(node[nextName]));
				} else {
					return ret.concat(node[nextName]);
				}
			} else {
				return helper(node[listName]);
			}
		}
		return helper(node);
	}
	
	//this does the same thing as makeList but return an object
	function makeListObject(node, listName, nextName, getKeyVal) {
		if (node !== undefined && arrayLike(node)) {
			var output = {};
			forEach(node, function(elem) {
				var keyval = getKeyVal(elem);
				output[keyval.key] = keyval.val;
			});
			return output;
		} else {		
			function helper (node) {
				if(node == undefined || node == {}) return {};
				if(def(node[nextName]) && node[nextName] !== {}) {
					var ret = helper(node[listName]);
					var keyval = getKeyVal(node[nextName]);
					ret[keyval.key] = keyval.val;
					return ret;
				} else {
					return helper(node[listName]);
				}
			}
			return helper(node);
		}
	}

	function toCamelCase(hyphenatedString) {
		function cnvrt(string) {
	        return string.substr(1, 1).toUpperCase();
	    }
		return hyphenatedString.replace(/\-./g, cnvrt);
	}

	function printObj(obj) {
		function helper(obj) {
			var output = "";
			if(objectLike(obj)) {
				output += "{";
				forEach(obj, function(value, name) {
					output += name + ":";
					output += helper(value) + ",";
				});
				output += "}";
			} else {
				output += obj;
			}
			return output;
		}
		print(helper(obj));
	}

	if (def(load)) {
		load(["../../source/js/util/util.js"]);
	}


	// ====================================================
	// Make Functions
	// ====================================================

	function makeActionTemplate (node) {
		var fullActList = node.fullactlist;
		
		var allActList = makeList(fullActList.actlist, 'actlist', 'actline');
		if (def(fullActList.action)) {
			allActList.push({action: fullActList.action, debugRef: fullActList.action.debugRef});
		}
		
		//split list into lets (something = something) and actionLine (something <- something)
		var actlist = [];
		var lets = [];
		var actionFound = false;
		
		for(var i=0; i<allActList.length; i++) {
			var listElement = allActList[i];
			if (def(listElement.equals)) {
				if (actionFound) {
					var subActionTemplate = {actiontpl: {fullactlist: {actlist: allActList.slice(i)}, debugRef:listElement.debugRef}};
					var lineAction = {
						action: makeLine(subActionTemplate),
						debugRef: listElement.debugRef
					};
					actlist.push(lineAction);
					break;
				}
				lets.push({identifier:listElement.identifier, line:listElement.action, debugRef:listElement.debugRef});
			} else {
				var output = {
					action: makeLine(listElement.action),
					debugRef: listElement.debugRef
				};
				if (def(listElement.identifier)) {
					output.name = listElement.identifier;
				}
				actlist.push(output);				
				
				actionFound = true;
			}
		}

		var lastActionType = node.type;
		if (!def(lastActionType)) {
			lastActionType = "Action a0";
		} else {
			lastActionType = "Action (" + lastActionType + ")";
		}
		
		var actionLine = {lineAction: {kind: "lineAction", actions: actlist, type:lastActionType}};
		
		var wrappedTemplate = {
			arglist: node.arglist,
			fullletlist: {
				letlist: lets,
				line: actionLine
			},
			debugRef: node.debugRef
		};

		return makeLineTemplate(wrappedTemplate);
	}

	function makeAskeyval (node) {
		var arglist = {};
		if (def(node.identifier)) {
			arglist = {variable:{identifier:node.identifier}, arglist: arglist};
		}
		if (def(node.identifier2)) {
			arglist = {variable:{identifier:node.identifier2}, arglist: arglist};
		}
		return arglist;
	}


	function makeIfblock (node) {
		var wrappedTemplate = {
			arglist: makeAskeyval(node.askeyval),
			fullletlist: node.fullletlist,
			debugRef: node.debugRef
		};
		
		var template = makeLineTemplate(wrappedTemplate);

		var wrappedElseblock;
		if (def(node.fullletlist2)) {
			wrappedElseblock = {
				arglist: {},
				fullletlist: node.fullletlist2,
				debugRef: node.debugRef
			};
			otherwise = makeLineTemplate(wrappedElseblock);			
		} else if (def(node.ifblock)) {
			//if block else if sugar
			wrappedElseblock = {
				arglist: {},
				fullletlist: {
					list: {},
					line: makeIfblock(node.ifblock)
				},
				debugRef: node.debugRef
			};
		}
		var otherwise = makeLineTemplate(wrappedElseblock);
	
		return {
			kind: "case", 
			test: node.expr.exprcode,
			lineTemplate: template,
			otherwise: otherwise,
			debugRef: node.debugRef
		};
	}

	function makeFunction(funcText) {
		//8 characters in 'function'
		var bracketIndex = funcText.indexOf('{');
		var args = funcText.substr(8, bracketIndex - 8);
		var JS = funcText.substr(bracketIndex);
		var parenIndex = args.indexOf(")");
		var outputType = args.substr(parenIndex+3);
		if (outputType.length == 0) {
			outputType = undefined;
		}
		args = args.substr(0, parenIndex);

		//remove parens
		args = args.replace(/[\(\)]/g, "");
		args = args.split(",");
		var argList = [];
		forEach(args, function(arg) {
			var newArg = {};
			argList.push(newArg);
			var parts = arg.split("::");
			if(def(parts[0])) {
				newArg.name = parts[0];
			}
			if(def(parts[1])) {
				newArg.type = parts[1];
			}
		});

		var funcString = "function (";
		var first = true;
		var typeString = "";
		var typeCounter = 0;
		forEach(argList, function(arg) {
			if(!first) {
				funcString += ", ";
				typeString += " -> ";
			} else {
				first = false;
			}
			funcString += arg.name;
			if (def(arg.type)) {
				typeString += "(" + arg.type + ")";
			} else {
				typeString += "t" + typeCounter;
				typeCounter++;
			}
		});
		funcString += ") " + JS + "";
		if (def(outputType)) {
			typeString += " -> " + "(" + outputType + ")";
		} else {
			typeString += " -> " + "t" + typeCounter;
		}
		return {
			kind: "lineJavascript",
			type: typeString,
			f: {
				kind: "jsFunction",
				func: funcString
			}
		};
	}	

	function getLetKeyVal (node) {
		return {
			key: node.identifier,
			val: makeLine(node.line),
			debugRef: node.debugRef
		};
	}
	
	
	function makeLineTemplate(node, isBlock) {
		var params = makeList(node.arglist, 'arglist', 'variable');
		
		var lets = makeListObject(node.fullletlist.letlist, 'letlist', 'let', getLetKeyVal);
		var output = makeLine(node.fullletlist.line);
		
		//give undefined param types a letter
		var counter = 0;
		var paramList = [];
		var typeString = "";
		var first = true;
	
		forEach(params, function(param) {
			paramList.push(param.identifier);
			var type = param.type;
			if(type == undefined) {
				type = "t" + counter;
				counter++;
			}
			if (!first) {
				typeString += " -> ";
			} else {
				first = false;
			}
			typeString += "(" + type + ")";
		});
		if (!first) {
			typeString += " -> ";
		}
		if (isBlock) {
			if (def(node.fullletlist.line.expr) && def(node.fullletlist.line.expr.type)) {
				typeString += node.fullletlist.line.expr.type;
			} else {
				typeString = undefined;
			}
		} else if (def(node.type)) {
			typeString += node.type;
		} else if (def(output.type)) {
			typeString += output.type;
		} else {
			typeString += "XMLP";
		}

		var ret = {
			kind: "lineTemplate",
			params: paramList,
			let: lets,
			output: output,
			debugRef: node.debugRef
		};

		if (typeString !== undefined) {
			ret.type = typeString;
		}

		return ret;
	}
	
	function makeState(node) {
		var fullactlist;
		if (def(node.type)) {
			var createAction = {
				create:{
					type:node.type
				}
			};
			//state(TYPE, EXPR) sugar
			if(def(node.expr)) {
				var actlist = {
					actlist: {
						actline: {
							identifier:"x",
							action: createAction
						}
					},
					actline: {
						action: {
							expr: {
								exprcode: "set x " + node.expr.exprcode
							}
						}
					}
				};
				var action = {
					expr: {exprcode:"return x"}
				};
				fullactlist = {actlist:actlist, action:action};
			} else {
				fullactlist = {actlist:{}, action:createAction};
			}
			addDebugRef(fullactlist, node.debugRef);
		} else if (def(node.fullactlist)) {
			fullactlist = node.fullactlist;
		}

		var lineTemplate = makeActionTemplate({arglist:{}, fullactlist:fullactlist, debugRef: node.debugRef});
		return {
			kind: "lineState",
			action: lineTemplate,
			debugRef: node.debugRef
		};
	}
	
	function makeXml (node) {
		
		function makeForeach (node) {
			var arglist;
			if (def(node.askeyval)) {
				arglist = makeAskeyval(node.askeyval);
			} else {
				arglist = {variable:{identifier:"_"}};
			}
			var wrappedTemplate = {
				arglist: arglist,
				fullletlist: node.fullletlist,
				debugRef: node.debugRef
			};
						
			var template = makeLineTemplate(wrappedTemplate);
			return {
				kind: "for-each",
				select: node.expr.exprcode,
				lineTemplate: template,
				debugRef: node.debugRef
			};
		}

		function makeCall (node) {
			var wrappedTemplate = {
				arglist: {},
				fullletlist: node.fullletlist,
				debugRef: node.debugRef
			};
			
			var template = makeLineTemplate(wrappedTemplate);
			return {
				kind: "call",
				lineTemplate: template,
				debugRef: node.debugRef
			};
		}

		function makeOn (node) {
			var wrappedActiontpl = {
				arglist: {},
				fullactlist: node.fullactlist,
				debugRef: node.debugRef
			};
			
			var lineTemplate = makeActionTemplate(wrappedActiontpl);
			return {
				kind: "on",
				event: node.identifier,
				action: lineTemplate,
				debugRef: node.debugRef
			};
		}

		function makeInsert (node) {
			return {
				kind: "insert",
				expr: node.expr.exprcode,
				debugRef: node.debugRef
			};
		}

		function makeTag (node) {
			var style = {};
			var attributeObject = {};
			function makeAttassign (node) {
				function makeAttribute (node) {
					if (def(node.string)) {
						return node.string;
					} else if (def(node.insert)) {
						return makeInsert(node.insert);
					}
				}			
				
				if (def(node.stylelist)) {
					makeList(node.stylelist, 'stylelist', 'styleassign', function (node) {
						var attribute;
						if (def(node.styletext)) {
							attribute = node.styletext;
						} else if (def(node.insert)) {
							attribute = makeInsert(node.insert);
						}
						style[toCamelCase(node.styleattname)] = attribute;
					});
				} else if (def(node.attname) && def(node.attribute)) {
					var name = node.attname;
					if(name.indexOf("style-") == 0) {
						var styleAttName = name.substr(6);
						style[toCamelCase(styleAttName)] = makeAttribute(node.attribute);
					} else {
						attributeObject[name] = makeAttribute(node.attribute);
					}
				}
			}
			
			//this fills style and attributeObject as a side effect
			//this is very sloppy, TODO: make it more functional
			makeList(node.attributes, 'attributes', 'attassign', makeAttassign);
			
			function makeXmlFlattenTextNodes (node) {
				result = makeXml(node);
				if (arrayLike(result)) {
					return result;
				} else {
					return [result];
				}
			}
			
			var xmllist = makeListFlatten(node.xmllist, 'xmllist', 'xml', makeXmlFlattenTextNodes);

			return {
				kind: "element",
				nodeName: node.tagname,
				attributes: attributeObject,
				style: style,
				children: xmllist,
				debugRef: node.debugRef
			};
		}


		function makeTextNode (node) {
			var text = node.xmltext;
			
			function makeTextElement (nodeVal) {
				return {
					kind: "textElement",
					nodeValue: nodeVal,
					debugRef: node.debugRef
				};
			}

			//deal with inserts in textNodes
			var index = text.indexOf('{');
			var output = [];
			while(index !== -1) {
				var rindex = text.indexOf('}');
				var first = text.substr(0, index);
				var insert = text.substr(index+1, rindex-index-1);
				text = text.substr(rindex+1);
				if (first.length > 0) {
					output.push(makeTextElement(first));
				}
				output.push(makeTextElement(makeInsert({expr: {exprcode: insert}, debugRef: node.debugRef})));
				index = text.indexOf('{');
			}
			if (text.length > 0) {
				output.push(makeTextElement(text));
			}
			return output;
		}



		function makeXmlKind (name, node, parentNode) {
			switch(name){
				case 'foreach':
					return makeForeach(node);
				case 'on':
					return makeOn(node);
				case 'call':
					return makeCall(node);
				case 'tag':
					return makeTag(node);
				case 'xmltext':
					return makeTextNode(parentNode);
			}
		}
		var result;
		forEach(node, function(value, nodeName) {
			if (nodeName !== 'debugRef') {
				result = makeXmlKind(nodeName, value, node);
			}
		});
		return result;
	}
	
	function makeLine (node) {
		var name, value;
		any(node, function(nodeValue, nodeName) {
			if (nodeName !== 'debugRef') {
				name = nodeName;
				value = nodeValue;
				return true;
			}
			return false;
		});


		function makeCreate (node) {
			var getKeyVal = function(node) {
				return {
					key: node.identifier,
					val: node.expr.exprcode
				};
			};
			var proplist = makeListObject(node.proplist, 'proplist', 'prop', getKeyVal);
			return {
				kind: "actionCreate",
				type: node.type,
				prop: proplist,
				debugRef: node.debugRef
			};
		}

		function makeExtract (node) {
			var wrappedActiontpl = {
				arglist: makeAskeyval(node.askeyval),
				fullactlist: node.fullactlist,
				debugRef: node.debugRef
			};

			var lineTemplate = makeActionTemplate(wrappedActiontpl);
			return {
				kind: "extract",
				select: node.expr.exprcode,
				action: lineTemplate,
				debugRef: node.debugRef
			};
		}

		switch (name) {
			case 'function':
				var lineFunc = makeFunction(value);
				lineFunc.debugRef = node.debugRef;
				return lineFunc;
			case 'template':
				return makeLineTemplate(value);
			case 'state':
				return makeState(value);
			case 'actiontpl':
				return makeActionTemplate(value);
			case 'lineAction':
				return value;
			case 'expr':
				return {kind: "lineExpr", expr: value.exprcode, type: value.type, debugRef: node.debugRef};
			case 'letlistblock':
				value.arglist = [];
				return makeLineTemplate(value, true);
			case 'ifblock':
				return {kind: "lineXML", xml:makeIfblock(value), debugRef: value.debugRef};
			case 'xml':
				return {kind:'lineXML', xml:makeXml(value)};
			case 'create':
				return makeCreate(value);
			case 'extract':
				return makeExtract(value);
		}
	}

	function lineBreakCount(str){
		/* counts \n */
		var match = str.match(/\n/gi);
		if (match !== null) {
			return match.length;
		} else {
			return 0;
		}
	}

	var lineNum;

	function handleWhiteSpace(tree) {
		function stripSpaces(string) {
			string = string.replace(/\/\/[^\n]*\n/g, "");
			return string.replace(/^\s+|\s+$/g,"");
		}
		
		function makeString (tree, name) {
			if(tree === undefined) return undefined;
			if (name == 'stringescapequotes') {
				var string = makeString(tree);
				lineNum += lineBreakCount(string);
				//string = string.replace(/\\/g, "\\\\");
				string = string.replace(/\\\"/g, "\\\\\"");
				string = string.replace(/\"/g, "\\\"");
				// string = string.replace(/\n/g, "\\n");
				return string;
			} else if (name == 'string') {
				var string = makeString(tree);
				lineNum += lineBreakCount(string);
				string = string.replace(/\"/g, "");
				string = string.replace(/\n/g, "\\n");
				return string;
			} else {
				if(!arrayLike(tree) && !objectLike(tree)) {
					return tree;
				}
				var output = "";
				forEach(tree, function(node, name) {
					output += (makeString(node, name));
				});
				return output;
			}
		}

		
		var startLine = lineNum;
		forEach(tree, function(value, nodeName) {
			function startsWith (string) {
				return nodeName.indexOf(string) == 0;
			}
			
			if (startsWith('type') || startsWith('exprcode') || startsWith('styletext') || startsWith('attname') || startsWith('styleattname') || startsWith('tagname') || startsWith('text') || startsWith('string') || startsWith('stringescapequotes') || startsWith('function') || startsWith('xmltext')) {
				var string = makeString(value, nodeName);
				lineNum += lineBreakCount(string);
				tree[nodeName] = stripSpaces(string);
			} else {
				if(objectLike(value)) {
					handleWhiteSpace(value);
				} else {
					lineNum += lineBreakCount(value);
					tree[nodeName] = stripSpaces(value);
				}
			}
		});
		tree.debugRef = {lineNumber: startLine, file: filename};
	}
	
	function makeIncludeblock (node) {
		var lets = makeListObject(node.letlist, 'letlist', 'let', getLetKeyVal);
		if (def(node.let)) {
			var lastLet = getLetKeyVal(node.let);
			lets[lastLet.key] = lastLet.val;
		}
		return lets;
	}
	
	
	return {
		processTree: function(tree, inFilename) {
			filename = inFilename;
			lineNum = 1;
			handleWhiteSpace(tree);
			if (def(tree.line)) {
				var ret = makeLine(tree.line);
				return ret;
			} else if (def(tree.includeblock)) {
				var ret = makeIncludeblock(tree.includeblock);
				return ret;
			}
		}
	};
}();