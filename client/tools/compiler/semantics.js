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
		//this handles nodes that are already lists, such as with extractSugar
		if (arrayLike(node)) {
			if (def(onEachFunc)) {
				var output = [];
				forEach(node, function(elem) {
					output.push(onEachFunc(node));
				});
				return output;
			} else {
				return node;
			}
		} else {
			function helper(node) {
				if(node == undefined || node == {}) return [];
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

	function makeExtract (node) {
		var wrappedActiontpl = {
			arglist: makeAskeyval(node.askeyval),
			fullactlist: node.fullactlist,
			debugRef: node.debugRef
		};
	
		var lineAction = makeLineAction(wrappedActiontpl);
		return {
			kind: "extract",
			select: node.expr.exprcode,
			lineAction: lineAction,
			debugRef: node.debugRef
		};
	}

	function makeLineAction (node) {
		//give undefined param types a letter
		var params = makeList(node.arglist, 'arglist', 'variable');
		var actions = makeFullactlist(node.fullactlist);
	
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
		if (first) {
			typeString += "Action";
		} else {
			typeString += " -> Action";
		}

		return {
				kind: "lineAction",
				params: paramList,
				type: typeString,
				actions: actions,
				debugRef: node.debugRef
		};
	}

	function makeFullactlist(node) {
		var actlist = makeList(node.actlist, 'actlist', 'actline');
		if (def(node.action)) {
			actlist.push({action: node.action, debugRef: node.debugRef});
		}
		//look for extractSugar
		
		var outputList = [];
		for(var i=0; i< actlist.length; i++) {
			var actline = actlist[i];
			
			//find extractSugar
			if(def(actline.action.extract) && def(actline.action.extract.variable)) {
				var extractSugar = actline.action.extract;
				
				var restOfList = actlist.slice(i+1);
				
				var wrappedAction = {
					extract: {
						expr: extractSugar.expr,
						askeyval: {
							identifier: extractSugar.variable.identifier
						}, 
						fullactlist: {actlist:restOfList}
					}
				};
				addDebugRef(wrappedAction, extractSugar.debugRef);
				
				outputList.push({
					action: makeAction(wrappedAction),
					debugRef: extractSugar.debugRef
				});
				return outputList;
			} else {
				var output = {
					action: makeAction(actline.action),
					debugRef: actline.debugRef
				};
				if (def(actline.variable)) {
					output.name = actline.variable.identifier;
				}
				outputList.push(output);
			}
		}
		
		return outputList;
	}

	function makeAction (node) {
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

		function makeUpdate(node) {
			var update;
			var actionType;
			if (def(node.add)) {
				actionType = 'add';
				update = node.add;				
			} else if (def(node.remove)) {
				actionType = 'remove';
				update = node.remove;
			}

			var key, value;
			if(def(update.expr2)) {
				key = update.expr2.exprcode;
			}			
			if(def(update.expr3)) {
				value = update.expr3.exprcode;
			}

			return {
				kind: "actionUpdate",
				target: update.expr.exprcode,
				actionType: actionType,
				key: key,
				value: value,
				debugRef: node.debugRef
			};
		}
		
		function makeActionKind (name, node, origNode) {
			switch(name){
				case 'create':
					return makeCreate(node);
				case 'update':
					return makeUpdate(node);
				case 'extract':
					return makeExtract(node);
				default:
					//TODO: fix this to parse as a line
					return makeLine(origNode);
			}
		}
		var result;
		forEach(node, function(value, nodeName) {
			if (nodeName !== 'debugRef') {
				result = makeActionKind(nodeName, value, node);
			}
		});
		return result;
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
			typeString += " ->";
		}
		if (isBlock) {
			if (def(node.fullletlist.line.expr) && def(node.fullletlist.line.expr.type)) {
				typeString += node.fullletlist.line.expr.type;
			} else {
				typeString = null;
			}
		} else {
			typeString += "XMLP";
		}

		return {
			kind: "lineTemplate",
			params: paramList,
			type: typeString,
			let: lets,
			output: output,
			debugRef: node.debugRef
		};
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
							variable: {identifier:"x"}, 
							action: createAction
						}
					},
					actline: {
						action: {
							update: {
								add: {
									expr: {exprcode:"x"},
									expr2: node.expr
								}
							}
						}
					}
				};
				var action = {
					expr: {exprcode:"x"}
				};
				fullactlist = {actlist:actlist, action:action};
			} else {
				fullactlist = {actlist:{}, action:createAction};
			}
			addDebugRef(fullactlist, node.debugRef);
		} else if (def(node.fullactlist)) {
			fullactlist = node.fullactlist;
		}

		var lineAction = makeLineAction({arglist:{}, fullactlist:fullactlist, debugRef: node.debugRef});
		return {
			kind: "lineState",
			lineAction: lineAction,
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

		function makeTrigger (node) {
			var wrappedActiontpl = {
				arglist: makeAskeyval(node.askeyval),
				fullactlist: node.fullactlist,
				debugRef: node.debugRef
			};
			var lineAction = makeLineAction(wrappedActiontpl);
			return {
				kind: "trigger",
				trigger: node.expr.exprcode,
				lineAction: lineAction,
				debugRef: node.debugRef
			};
		}

		function makeOn (node) {
			var wrappedActiontpl = {
				arglist: {},
				fullactlist: node.fullactlist,
				debugRef: node.debugRef
			};
			
			var lineAction = makeLineAction(wrappedActiontpl);
			return {
				kind: "on",
				event: node.identifier,
				lineAction: lineAction,
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
						style[toCamelCase(node.attname)] = attribute;
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
				case 'trigger':
					return makeTrigger(node);
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

		switch(name){
			case 'function':
				var lineFunc = makeFunction(value);
				lineFunc.debugRef = node.debugRef;
				return lineFunc;
			case 'template':
				return makeLineTemplate(value);
			case 'state':
				return makeState(value);
			case 'actiontpl':
				return makeLineAction(value);
			case 'expr':
				return {kind: "lineExpr", expr: value.exprcode, type: value.type, debugRef: node.debugRef};
			case 'letlistblock':
				value.arglist = [];
				return makeLineTemplate(value);
			case 'ifblock':
				return {kind: "lineXML", xml:makeIfblock(value), debugRef: value.debugRef};
			case 'xml':
				return {kind:'lineXML', xml:makeXml(value)};
		}
	}

	function lineBreakCount(str){
		/* counts \n */
		try {
			return((str.match(/[^\n]*\n[^\n]*/gi).length));
		} catch(e) {
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
				return (makeString(tree)).replace(/\"/g, "\\\"");
			} else if (name == 'string') {
				return (makeString(tree)).replace(/\"/g, "");
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
			
			if (startsWith('type') || startsWith('exprcode') || startsWith('styletext') || startsWith('attname') || startsWith('tagname') || startsWith('text') || startsWith('string') || startsWith('stringescapequotes') || startsWith('function') || startsWith('xmltext')) {
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
	}
}();