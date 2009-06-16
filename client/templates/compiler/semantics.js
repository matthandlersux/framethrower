var semantics = function(){

	// ==================================
	// UTIL
	// ==================================
	
	function def(obj) {
		return obj !== undefined;
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
		load(["../../js/util/util.js"]);
	}


	// ====================================================
	// Make Functions
	// ====================================================

	var result; //global variable
	function makeTop(tomakeLine) {
		result = tomakeLine;
		return tomakeLine;
	}

	function makeLet(node) {
		return {
			name: node.variable.name,
			type: node.variable.type,
			value: makeLine(node.line)
		};
	}

	function makeLineExpr (expr) {
		return {
			kind: "lineExpr",
			expr: expr,
			let: {}
		};
	}

	function makeLetlistblock(node) {
		var lets = makeListObject(node.letlist, 'letlist', 'let', getLetKeyVal);
		var expr = node.expr;
		
		return {
			kind: "lineExpr",
			expr: expr,
			let: lets
		};
	}

	//TODO
	function makeExtract (node) {
		var wrappedActiontpl = {
			arglist: makeAskeyval(node.askeyval),
			fullactlist: node.fullactlist
		};
	
		var actiontpl = makeActiontpl(wrappedActiontpl);
		return {
			kind: "extract",
			select: node.expr,
			action: actiontpl
		};
	}

	function makeActiontpl(node) {
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
				kind: "action",
				params: paramList,
				type: typeString,
				actions: actions
		};
	}

	function makeFullactlist(node) {
		var actlist = makeList(node.actlist, 'actlist', 'actline');
		if (def(node.action)) {
			actlist.push({action: node.action});
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
				outputList.push({
					action: makeAction(wrappedAction)
				});
				return outputList;
			} else {
				var output = {};
				if (def(actline.variable)) {
					output.name = actline.variable.identifier;
				}
				output.action = makeAction(actline.action);				
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
					val: node.expr
				};
			};
			var proplist = makeListObject(node.proplist, 'proplist', 'prop', getKeyVal);
			return {
				kind: "actionCreate",
				type: node.type,
				prop: proplist
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

			return {
				kind: "actionUpdate",
				target: update.expr,
				actionType: actionType,
				key: update.expr2,
				value: update.expr3
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
			result = makeActionKind(nodeName, value, node);
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
			fullletlist: node.fullletlist
		};
		
		var template = makeTemplate(wrappedTemplate);

		var wrappedElseblock;
		if (def(node.fullletlist2)) {
			wrappedElseblock = {
				arglist: {},
				fullletlist: node.fullletlist2
			};
			otherwise = makeTemplate(wrappedElseblock);			
		} else if (def(node.ifblock)) {
			//if block else if sugar
			wrappedElseblock = {
				arglist: {},
				fullletlist: {
					list: {},
					line: makeIfblock(node.ifblock)
				}
			};
		}
		var otherwise = makeTemplate(wrappedElseblock);
	
		return makeXMLLine({
			kind: "case", 
			test: node.expr,
			templateCode: template,
			otherwise: otherwise
		});
	}

	function stripQuotes (string) {
		return string.substr(1, string.length-2);
	}
	
	
	function makeJSFun(funcText) {
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
			key: node.variable.identifier,
			val: makeLine(node.line)
		};
	}
	
	
	function makeTemplate(node) {
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
		if (first) {
			typeString += "XMLP";
		} else {
			typeString += " -> XMLP";
		}

		return {
			kind: "templateCode",
			params: paramList,
			type: typeString,
			let: lets,
			output: output
		};
	}
	
	function makeState(node) {
		var action;
		if (def(node.type)) {
			var createAction = {
				create:{type:node.type}
			};
			action = makeActiontpl({arglist:{}, fullactlist:{actlist:{}, action:createAction}});
		} else if (def(node.fullactlist)) {
			action = makeActiontpl({arglist:{}, fullactlist:node.fullactlist});
		}
		
		return {
			kind: "lineState",
			action: action
		};
	}
	
	function makeXml (node) {
		
		function makeForeach (node) {
			var arglist;
			if (def(node.askeyval)) {
				arglist = makeAskeyval(node.askeyval);
			} else {
				arglist = {};
			}
			var wrappedTemplate = {
				arglist: arglist,
				fullletlist: node.fullletlist
			};
						
			var template = makeTemplate(wrappedTemplate);
			return {
				kind: "for-each",
				select: node.expr,
				templateCode: template
			};
		}

		function makeCall (node) {
			var wrappedTemplate = {
				arglist: {},
				fullletlist: node.fullletlist
			};
			
			var template = makeTemplate(wrappedTemplate);
			return {
				kind: "call",
				templateCode: template
			};
		}

		function makeTrigger (node) {
			var wrappedActiontpl = {
				arglist: makeAskeyval(node.askeyval),
				fullactlist: node.fullactlist 
			};
			var actiontpl = makeActiontpl(wrappedActiontpl);
			return {
				kind: "trigger",
				trigger: node.expr,
				action: actiontpl
			};
		}

		function makeOn (node) {
			var wrappedActiontpl = {
				arglist: {},
				fullactlist: node.fullactlist
			};
			
			var action = makeActiontpl(wrappedActiontpl);
			return {
				kind: "on",
				event: node.identifier,
				action: action
			};
		}

		function makeInsert (node) {
			return {
				kind: "insert",
				expr: node.expr
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
				children: xmllist
			};
		}


		function makeTextNode (text) {
			function makeTextElement (nodeVal) {
				return {
					kind: "textElement",
					nodeValue: nodeVal,
				};
			}

			//deal with inserts in textNodes
			var index = text.indexOf('{');
			var output = [];
			if (index == -1) {
				output.push(makeTextElement(text));
			}
			while(index !== -1) {
				var rindex = text.indexOf('}');
				var first = text.substr(0, index);
				var insert = text.substr(index+1, rindex-index-1);
				text = text.substr(rindex+1);
				if (first.length > 0) {
					output.push(makeTextElement(first));
				}
				output.push(makeTextElement(makeInsert({expr: insert})));
				index = text.indexOf('{');
			}
			return output;
		}



		function makeXmlKind (name, node) {
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
				case 'textnode':
					return makeTextNode(node);
			}
		}
		var result;
		forEach(node, function(value, nodeName) {
			result = makeXmlKind(nodeName, value);
		});
		return result;
	}
	
	function makeLine (node) {
		function makeLineKind (name, node) {
			switch(name){
				case 'jsfun':
					return makeJSFun(node);
				case 'template':
					//TODO: put kind in makeTemplate
					return {kind:'lineTemplate', template: makeTemplate(node)};
				case 'state':
					return makeState(node);
				case 'actiontpl':
					return {kind:'lineAction', action: makeActiontpl(node)};
				case 'expr':
					return makeLineExpr(node);
				case 'letlistblock':
					return makeLetlistblock(node);
				case 'ifblock':
					return makeIfblock(node);
				case 'xml':
					return {kind:'lineXML', xml:makeXml(node)};
			}
		}
		var result;
		forEach(node, function(value, nodeName) {
			result = makeLineKind(nodeName, value);
		});
		return result;	
	}

	function handleWhiteSpace(tree) {
		function stripSpaces(string) {
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
		
		forEach(tree, function(value, nodeName) {
			function startsWith (string) {
				return nodeName.indexOf(string) == 0;
			}
			
			if (startsWith('type') || startsWith('expr') || startsWith('styletext') || startsWith('attname') || startsWith('tagname') || startsWith('text') || startsWith('string') || startsWith('stringescapequotes')) {
				tree[nodeName] = stripSpaces(makeString(value, nodeName));
			} else {
				if(objectLike(value)) {
					handleWhiteSpace(value);
				} else {
					tree[nodeName] = stripSpaces(value);
				}
			}
		});
	}
	
	
	return {
		processTree: function(tree) {
			handleWhiteSpace(tree);
			return makeLine(tree.line);
		}
	}
}();