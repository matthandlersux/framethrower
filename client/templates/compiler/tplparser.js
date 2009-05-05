/*
	Default driver template for JS/CC generated parsers for Mozilla/Rhino
	
	WARNING: Do not use for parsers that should run as browser-based JavaScript!
			 Use driver_web.js_ instead!
	
	Features:
	- Parser trace messages
	- Step-by-step parsing
	- Integrated panic-mode error recovery
	- Pseudo-graphical parse tree generation
	
	Written 2007 by Jan Max Meyer, J.M.K S.F. Software Technologies
        Modified 2007 from driver.js_ to support Mozilla/Rhino
           by Louis P.Santillan <lpsantil@gmail.com>
	
	This is in the public domain.
*/

//UTIL - from util.js. TODO: import these functions util.js at compile time
			function typeOf(value){
			    var s = typeof value;
			    if (s === 'object') {
			        if (value) {
			            if (value instanceof Array) {
			                s = 'array';
			            }
			        }
			        else {
			            s = 'null';
			        }
			    }
			    return s;
			}

			function arrayLike(o) {
				if (typeOf(o.length) === "number" && typeof o !== "string") {
					return true;
				} else {
					return false;
				}
			}
			function objectLike(o) {
				if (typeOf(o) === "object") {
					return true;
				} else {
					return false;
				}
			}

			function forEach(o, f) {
				if (arrayLike(o)) {
					for (var i = 0, len = o.length; i < len; i++) {
						f(o[i], i);
					}
				} else if (objectLike(o)) {
					for (var i in o) if (o.hasOwnProperty(i)) {
						f(o[i], i);
					}
				}
			}


	var result; //global variable

	function makeTemplate(template) {
		//serialize template JSON to string
		result = template;
		return template;
	}

	function makeTemplateCode(params, lets, output) {
		//give undefined param types a letter
		var counter = 0;
		var paramList = [];
		var typeString = "";
		var first = true;
		
		forEach(params, function(param) {
			paramList.push(param.name);
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
			typeString += type;
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

	function makeVariable(name, type) {
		return {
			name: name,
			type: type
		};
	}

	function makeLet(variable, line) {
		return {
			name: variable.name,
			type: variable.type,
			value: line
		};
	}

	function makeExpr(expr, lets) {
		if (lets == undefined) {
			lets = {};
		}
		return {
			kind: "lineExpr",
			expr: expr,
			let: lets
		};
	}

	function makeState(typeString) {
		return {
			kind: "lineState",
			type: typeString
		};
	}

	function makeJSFun(argList, JS, outputType) {
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
			if (arg.type !== undefined) {
				typeString += arg.type;
			} else {
				typeString += "t" + typeCounter;
				typeCounter++;
			}
		});
		funcString += ") {" + JS + "}";
		if (outputType !== undefined) {
			typeString += " -> " + outputType;
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

	function makeForEach(attributes, lets, output) {
		var params = [];
		if (attributes.key !== undefined) {
			params.push({name:attributes.key});
		}
		if (attributes.value !== undefined) {
			params.push({name:attributes.value});
		}
		var templateCode = makeTemplateCode(params, lets, output);
		return {
			kind: "for-each",
			select: attributes.select,
			templateCode: templateCode
		};
	}

	function makeCall(lets, output) {
		var templateCode = makeTemplateCode([], lets, output);
		return {
			kind: "call",
			templateCode: templateCode
		};
	}

	function makeOn(attributes, lets, output) {
		var templateCode = makeAction([], lets, output);
		return {
			kind: "on",
			event: attributes.event,
			templateCode: templateCode
		};
	}


	function makeOpenTag(name, attributes) {
		return {
			name: name,
			attributes: attributes
		};
	}

	function checkForInsert (node) {
		var text = node.nodeValue;
		if(text == undefined) return undefined;
		var index = text.indexOf('{');
		var output = [];
		if(index == -1) {
			return undefined;
		}
		while(index > 0) {
			var rindex = text.indexOf('}');
			var first = text.substr(0, index);
			var insert = text.substr(index+1, rindex-index-1);
			text = text.substr(rindex+1);
			output.push(makeTextElement(first));
			output.push(makeTextElement(makeInsert(insert)));
			index = text.indexOf('{');
		}
		return output;
	}

	function makeNode(openTag, xmlp) {
		var attributes = openTag.attributes;
		var style;
		if (attributes.style !== undefined) {
			style = attributes.style;	
		} else {
			style = {};
		}
		
		attributes.style = undefined;
		var attributeObject = {};
		for (name in attributes) {
			if(attributes[name] !== undefined) {
				attributeObject[name] = attributes[name];
			}
		}
		
		//prepend textNode to xmlp
		if(openTag.textNode !== undefined) {
			xmlp.unshift(openTag.textNode);
		}
		
		//deal with inserts in textNodes
		for(var i=0; i<xmlp.length; ) {
			var textNodeList = checkForInsert(xmlp[i]);
			if(textNodeList !== undefined) {
				xmlp.splice(i, 1);
				for (var j=textNodeList.length-1; j>=0; j--) {
					xmlp.splice(i, 0, textNodeList[j]);
				}
				i += textNodeList.length;
			} else {
				i++;
			}
		}
		
		return {
			kind: "element",
			nodeName: openTag.name,
			attributes: attributeObject,
			style: style,
			children: xmlp
		};
	}

	function makeAttribute (name, value) {
		var a = {};
		a[name] = value;
		return a;
	}

	function makeTextElement (nodeVal) {
		return {
			kind: "textElement",
			nodeValue: nodeVal,
		};
	}

	function makeInsert (expr) {
		return {
			kind: "insert",
			expr: expr
		};
	}

	function makeXMLLine (node) {
		return {
			kind: "lineXML",
			xml: node
		};
	}

	function push (list, item) {
		list.push(item);
		return list;
	}
	
	function addLet (letObj, let) {
		letObj[let.name] = let.value;
		return letObj;
	}

	function makeAction(params, lets, output) {
		//give undefined param types a letter
		var counter = 0;
		var paramList = [];
		var typeString = "";
		var first = true;
		
		forEach(params, function(param) {
			paramList.push(param.name);
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
			typeString += type;
		});
		if (first) {
			typeString += "ACTION";
		} else {
			typeString += " -> ACTION";
		}

		var actions = lets.concat([output]);

		return {
			kind: "action",
			params: paramList,
			type: typeString,
			actions: actions
		};
	}

	function makeCreate(type, json) {
		return {
			kind: "actionCreate",
			type: type,
			prop: json
		};
	}

	function makeUpdate(actionType, target, key, val) {
		return {
			kind: "actionUpdate",
			target: target,
			actionType: actionType,
			key: key,
			val: val
		};
	}

	function stripQuotes (string) {
		return string.substr(1, string.length-2);
	}
	


var _dbg_withparsetree	= false;
var _dbg_withtrace		= false;
var _dbg_withstepbystep	= false;

function __dbg_print( text )
{
	print( text );
}

function __dbg_wait()
{
   var kbd = new java.io.BufferedReader(
                new java.io.InputStreamReader( java.lang.System[ "in" ] ) );

   kbd.readLine();
}

function __lex( info )
{
	var state		= 0;
	var match		= -1;
	var match_pos	= 0;
	var start		= 0;
	var pos			= info.offset + 1;

	do
	{
		pos--;
		state = 0;
		match = -2;
		start = pos;

		if( info.src.length <= start )
			return 68;

		do
		{

switch( state )
{
	case 0:
		if( ( info.src.charCodeAt( pos ) >= 9 && info.src.charCodeAt( pos ) <= 10 ) || info.src.charCodeAt( pos ) == 13 || info.src.charCodeAt( pos ) == 32 ) state = 1;
		else if( info.src.charCodeAt( pos ) == 33 || ( info.src.charCodeAt( pos ) >= 37 && info.src.charCodeAt( pos ) <= 38 ) || ( info.src.charCodeAt( pos ) >= 42 && info.src.charCodeAt( pos ) <= 43 ) || info.src.charCodeAt( pos ) == 45 || info.src.charCodeAt( pos ) == 63 || info.src.charCodeAt( pos ) == 94 || info.src.charCodeAt( pos ) == 124 ) state = 2;
		else if( info.src.charCodeAt( pos ) == 34 ) state = 3;
		else if( info.src.charCodeAt( pos ) == 40 ) state = 4;
		else if( info.src.charCodeAt( pos ) == 41 ) state = 5;
		else if( info.src.charCodeAt( pos ) == 44 ) state = 6;
		else if( info.src.charCodeAt( pos ) == 47 ) state = 7;
		else if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || info.src.charCodeAt( pos ) == 98 || ( info.src.charCodeAt( pos ) >= 100 && info.src.charCodeAt( pos ) <= 101 ) || ( info.src.charCodeAt( pos ) >= 103 && info.src.charCodeAt( pos ) <= 113 ) || ( info.src.charCodeAt( pos ) >= 117 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 58 ) state = 9;
		else if( info.src.charCodeAt( pos ) == 59 ) state = 10;
		else if( info.src.charCodeAt( pos ) == 60 ) state = 11;
		else if( info.src.charCodeAt( pos ) == 61 ) state = 12;
		else if( info.src.charCodeAt( pos ) == 62 ) state = 13;
		else if( info.src.charCodeAt( pos ) == 123 ) state = 14;
		else if( info.src.charCodeAt( pos ) == 125 ) state = 15;
		else if( info.src.charCodeAt( pos ) == 46 ) state = 30;
		else if( info.src.charCodeAt( pos ) == 102 ) state = 31;
		else if( info.src.charCodeAt( pos ) == 97 ) state = 70;
		else if( info.src.charCodeAt( pos ) == 115 ) state = 85;
		else if( info.src.charCodeAt( pos ) == 99 ) state = 91;
		else if( info.src.charCodeAt( pos ) == 114 ) state = 92;
		else if( info.src.charCodeAt( pos ) == 116 ) state = 97;
		else state = -1;
		break;

	case 1:
		state = -1;
		match = 1;
		match_pos = pos;
		break;

	case 2:
		state = -1;
		match = 27;
		match_pos = pos;
		break;

	case 3:
		state = -1;
		match = 26;
		match_pos = pos;
		break;

	case 4:
		state = -1;
		match = 16;
		match_pos = pos;
		break;

	case 5:
		state = -1;
		match = 17;
		match_pos = pos;
		break;

	case 6:
		state = -1;
		match = 18;
		match_pos = pos;
		break;

	case 7:
		if( info.src.charCodeAt( pos ) == 47 ) state = 29;
		else state = -1;
		match = 23;
		match_pos = pos;
		break;

	case 8:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else state = -1;
		match = 28;
		match_pos = pos;
		break;

	case 9:
		state = -1;
		match = 20;
		match_pos = pos;
		break;

	case 10:
		state = -1;
		match = 19;
		match_pos = pos;
		break;

	case 11:
		if( info.src.charCodeAt( pos ) == 47 ) state = 16;
		else if( info.src.charCodeAt( pos ) == 112 ) state = 32;
		else state = -1;
		match = 24;
		match_pos = pos;
		break;

	case 12:
		state = -1;
		match = 21;
		match_pos = pos;
		break;

	case 13:
		state = -1;
		match = 25;
		match_pos = pos;
		break;

	case 14:
		state = -1;
		match = 14;
		match_pos = pos;
		break;

	case 15:
		state = -1;
		match = 15;
		match_pos = pos;
		break;

	case 16:
		state = -1;
		match = 22;
		match_pos = pos;
		break;

	case 17:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else state = -1;
		match = 8;
		match_pos = pos;
		break;

	case 18:
		state = -1;
		match = 12;
		match_pos = pos;
		break;

	case 19:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else state = -1;
		match = 6;
		match_pos = pos;
		break;

	case 20:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else state = -1;
		match = 13;
		match_pos = pos;
		break;

	case 21:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else state = -1;
		match = 5;
		match_pos = pos;
		break;

	case 22:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else state = -1;
		match = 7;
		match_pos = pos;
		break;

	case 23:
		state = -1;
		match = 11;
		match_pos = pos;
		break;

	case 24:
		state = -1;
		match = 10;
		match_pos = pos;
		break;

	case 25:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else state = -1;
		match = 9;
		match_pos = pos;
		break;

	case 26:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else state = -1;
		match = 4;
		match_pos = pos;
		break;

	case 27:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else state = -1;
		match = 3;
		match_pos = pos;
		break;

	case 28:
		state = -1;
		match = 2;
		match_pos = pos;
		break;

	case 29:
		if( info.src.charCodeAt( pos ) == 10 ) state = 1;
		else if( ( info.src.charCodeAt( pos ) >= 0 && info.src.charCodeAt( pos ) <= 9 ) || ( info.src.charCodeAt( pos ) >= 11 && info.src.charCodeAt( pos ) <= 254 ) ) state = 29;
		else state = -1;
		break;

	case 30:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else state = -1;
		match = 27;
		match_pos = pos;
		break;

	case 31:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 116 ) || ( info.src.charCodeAt( pos ) >= 118 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 58 ) state = 34;
		else if( info.src.charCodeAt( pos ) == 117 ) state = 95;
		else state = -1;
		match = 28;
		match_pos = pos;
		break;

	case 32:
		if( info.src.charCodeAt( pos ) == 58 ) state = 36;
		else state = -1;
		break;

	case 33:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 99 ) || ( info.src.charCodeAt( pos ) >= 101 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 100 ) state = 17;
		else state = -1;
		match = 28;
		match_pos = pos;
		break;

	case 34:
		if( info.src.charCodeAt( pos ) == 99 ) state = 38;
		else if( info.src.charCodeAt( pos ) == 111 ) state = 40;
		else if( info.src.charCodeAt( pos ) == 101 ) state = 71;
		else state = -1;
		break;

	case 35:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 100 ) || ( info.src.charCodeAt( pos ) >= 102 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 101 ) state = 19;
		else state = -1;
		match = 28;
		match_pos = pos;
		break;

	case 36:
		if( info.src.charCodeAt( pos ) == 116 ) state = 42;
		else state = -1;
		break;

	case 37:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 100 ) || ( info.src.charCodeAt( pos ) >= 102 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 101 ) state = 20;
		else state = -1;
		match = 28;
		match_pos = pos;
		break;

	case 38:
		if( info.src.charCodeAt( pos ) == 97 ) state = 44;
		else state = -1;
		break;

	case 39:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 109 ) || ( info.src.charCodeAt( pos ) >= 111 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 110 ) state = 21;
		else state = -1;
		match = 28;
		match_pos = pos;
		break;

	case 40:
		if( info.src.charCodeAt( pos ) == 110 ) state = 18;
		else state = -1;
		break;

	case 41:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 100 ) || ( info.src.charCodeAt( pos ) >= 102 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 101 ) state = 22;
		else state = -1;
		match = 28;
		match_pos = pos;
		break;

	case 42:
		if( info.src.charCodeAt( pos ) == 101 ) state = 48;
		else state = -1;
		break;

	case 43:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 100 ) || ( info.src.charCodeAt( pos ) >= 102 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 101 ) state = 25;
		else state = -1;
		match = 28;
		match_pos = pos;
		break;

	case 44:
		if( info.src.charCodeAt( pos ) == 108 ) state = 49;
		else state = -1;
		break;

	case 45:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 109 ) || ( info.src.charCodeAt( pos ) >= 111 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 110 ) state = 26;
		else state = -1;
		match = 28;
		match_pos = pos;
		break;

	case 46:
		if( info.src.charCodeAt( pos ) == 99 ) state = 50;
		else state = -1;
		break;

	case 47:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 100 ) || ( info.src.charCodeAt( pos ) >= 102 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 101 ) state = 27;
		else state = -1;
		match = 28;
		match_pos = pos;
		break;

	case 48:
		if( info.src.charCodeAt( pos ) == 120 ) state = 51;
		else state = -1;
		break;

	case 49:
		if( info.src.charCodeAt( pos ) == 108 ) state = 23;
		else state = -1;
		break;

	case 50:
		if( info.src.charCodeAt( pos ) == 104 ) state = 24;
		else state = -1;
		break;

	case 51:
		if( info.src.charCodeAt( pos ) == 116 ) state = 52;
		else state = -1;
		break;

	case 52:
		if( info.src.charCodeAt( pos ) == 110 ) state = 53;
		else state = -1;
		break;

	case 53:
		if( info.src.charCodeAt( pos ) == 111 ) state = 54;
		else state = -1;
		break;

	case 54:
		if( info.src.charCodeAt( pos ) == 100 ) state = 55;
		else state = -1;
		break;

	case 55:
		if( info.src.charCodeAt( pos ) == 101 ) state = 56;
		else state = -1;
		break;

	case 56:
		if( info.src.charCodeAt( pos ) == 62 ) state = 57;
		else state = -1;
		break;

	case 57:
		if( ( info.src.charCodeAt( pos ) >= 0 && info.src.charCodeAt( pos ) <= 59 ) || info.src.charCodeAt( pos ) == 61 || ( info.src.charCodeAt( pos ) >= 63 && info.src.charCodeAt( pos ) <= 93 ) || ( info.src.charCodeAt( pos ) >= 95 && info.src.charCodeAt( pos ) <= 254 ) ) state = 57;
		else if( info.src.charCodeAt( pos ) == 60 ) state = 58;
		else state = -1;
		break;

	case 58:
		if( info.src.charCodeAt( pos ) == 47 ) state = 59;
		else state = -1;
		break;

	case 59:
		if( info.src.charCodeAt( pos ) == 112 ) state = 60;
		else state = -1;
		break;

	case 60:
		if( info.src.charCodeAt( pos ) == 58 ) state = 61;
		else state = -1;
		break;

	case 61:
		if( info.src.charCodeAt( pos ) == 116 ) state = 62;
		else state = -1;
		break;

	case 62:
		if( info.src.charCodeAt( pos ) == 101 ) state = 63;
		else state = -1;
		break;

	case 63:
		if( info.src.charCodeAt( pos ) == 120 ) state = 64;
		else state = -1;
		break;

	case 64:
		if( info.src.charCodeAt( pos ) == 116 ) state = 65;
		else state = -1;
		break;

	case 65:
		if( info.src.charCodeAt( pos ) == 110 ) state = 66;
		else state = -1;
		break;

	case 66:
		if( info.src.charCodeAt( pos ) == 111 ) state = 67;
		else state = -1;
		break;

	case 67:
		if( info.src.charCodeAt( pos ) == 100 ) state = 68;
		else state = -1;
		break;

	case 68:
		if( info.src.charCodeAt( pos ) == 101 ) state = 69;
		else state = -1;
		break;

	case 69:
		if( info.src.charCodeAt( pos ) == 62 ) state = 28;
		else state = -1;
		break;

	case 70:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 98 ) || ( info.src.charCodeAt( pos ) >= 101 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 100 ) state = 33;
		else if( info.src.charCodeAt( pos ) == 99 ) state = 86;
		else state = -1;
		match = 28;
		match_pos = pos;
		break;

	case 71:
		if( info.src.charCodeAt( pos ) == 97 ) state = 46;
		else state = -1;
		break;

	case 72:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 115 ) || ( info.src.charCodeAt( pos ) >= 117 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 116 ) state = 35;
		else state = -1;
		match = 28;
		match_pos = pos;
		break;

	case 73:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 107 ) || ( info.src.charCodeAt( pos ) >= 109 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 108 ) state = 37;
		else state = -1;
		match = 28;
		match_pos = pos;
		break;

	case 74:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 110 ) || ( info.src.charCodeAt( pos ) >= 112 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 111 ) state = 39;
		else state = -1;
		match = 28;
		match_pos = pos;
		break;

	case 75:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 115 ) || ( info.src.charCodeAt( pos ) >= 117 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 116 ) state = 41;
		else state = -1;
		match = 28;
		match_pos = pos;
		break;

	case 76:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 117 ) || ( info.src.charCodeAt( pos ) >= 119 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 118 ) state = 43;
		else state = -1;
		match = 28;
		match_pos = pos;
		break;

	case 77:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 110 ) || ( info.src.charCodeAt( pos ) >= 112 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 111 ) state = 45;
		else state = -1;
		match = 28;
		match_pos = pos;
		break;

	case 78:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 115 ) || ( info.src.charCodeAt( pos ) >= 117 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 116 ) state = 47;
		else state = -1;
		match = 28;
		match_pos = pos;
		break;

	case 79:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 98 && info.src.charCodeAt( pos ) <= 120 ) || info.src.charCodeAt( pos ) == 122 ) state = 8;
		else if( info.src.charCodeAt( pos ) == 97 ) state = 72;
		else if( info.src.charCodeAt( pos ) == 121 ) state = 73;
		else state = -1;
		match = 28;
		match_pos = pos;
		break;

	case 80:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 104 ) || ( info.src.charCodeAt( pos ) >= 106 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 105 ) state = 74;
		else state = -1;
		match = 28;
		match_pos = pos;
		break;

	case 81:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 98 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 97 ) state = 75;
		else state = -1;
		match = 28;
		match_pos = pos;
		break;

	case 82:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 110 ) || ( info.src.charCodeAt( pos ) >= 112 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 111 ) state = 76;
		else state = -1;
		match = 28;
		match_pos = pos;
		break;

	case 83:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 104 ) || ( info.src.charCodeAt( pos ) >= 106 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 105 ) state = 77;
		else state = -1;
		match = 28;
		match_pos = pos;
		break;

	case 84:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 98 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 97 ) state = 78;
		else state = -1;
		match = 28;
		match_pos = pos;
		break;

	case 85:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 115 ) || ( info.src.charCodeAt( pos ) >= 117 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 116 ) state = 79;
		else state = -1;
		match = 28;
		match_pos = pos;
		break;

	case 86:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 115 ) || ( info.src.charCodeAt( pos ) >= 117 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 116 ) state = 80;
		else state = -1;
		match = 28;
		match_pos = pos;
		break;

	case 87:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 100 ) || ( info.src.charCodeAt( pos ) >= 102 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 101 ) state = 81;
		else state = -1;
		match = 28;
		match_pos = pos;
		break;

	case 88:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 108 ) || ( info.src.charCodeAt( pos ) >= 110 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 109 ) state = 82;
		else state = -1;
		match = 28;
		match_pos = pos;
		break;

	case 89:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 115 ) || ( info.src.charCodeAt( pos ) >= 117 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 116 ) state = 83;
		else state = -1;
		match = 28;
		match_pos = pos;
		break;

	case 90:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 107 ) || ( info.src.charCodeAt( pos ) >= 109 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 108 ) state = 84;
		else state = -1;
		match = 28;
		match_pos = pos;
		break;

	case 91:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 113 ) || ( info.src.charCodeAt( pos ) >= 115 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 114 ) state = 87;
		else state = -1;
		match = 28;
		match_pos = pos;
		break;

	case 92:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 100 ) || ( info.src.charCodeAt( pos ) >= 102 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 101 ) state = 88;
		else state = -1;
		match = 28;
		match_pos = pos;
		break;

	case 93:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 98 ) || ( info.src.charCodeAt( pos ) >= 100 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 99 ) state = 89;
		else state = -1;
		match = 28;
		match_pos = pos;
		break;

	case 94:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 111 ) || ( info.src.charCodeAt( pos ) >= 113 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 112 ) state = 90;
		else state = -1;
		match = 28;
		match_pos = pos;
		break;

	case 95:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 109 ) || ( info.src.charCodeAt( pos ) >= 111 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 110 ) state = 93;
		else state = -1;
		match = 28;
		match_pos = pos;
		break;

	case 96:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 108 ) || ( info.src.charCodeAt( pos ) >= 110 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 109 ) state = 94;
		else state = -1;
		match = 28;
		match_pos = pos;
		break;

	case 97:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 100 ) || ( info.src.charCodeAt( pos ) >= 102 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 101 ) state = 96;
		else state = -1;
		match = 28;
		match_pos = pos;
		break;

}


			pos++;

		}
		while( state > -1 );

	}
	while( 1 > -1 && match == 1 );

	if( match > -1 )
	{
		info.att = info.src.substr( start, match_pos - start );
		info.offset = match_pos;
		
switch( match )
{
	case 2:
		{
		 info.att = info.att.substr(12, info.att.length - 25); 
		}
		break;

}


	}
	else
	{
		info.att = new String();
		match = -1;
	}

	return match;
}


function __parse( src, err_off, err_la )
{
	var		sstack			= new Array();
	var		vstack			= new Array();
	var 	err_cnt			= 0;
	var		act;
	var		go;
	var		la;
	var		rval;
	var 	parseinfo		= new Function( "", "var offset; var src; var att;" );
	var		info			= new parseinfo();
	
	//Visual parse tree generation
	var 	treenode		= new Function( "", "var sym; var att; var child;" );
	var		treenodes		= new Array();
	var		tree			= new Array();
	var		tmptree			= null;

/* Pop-Table */
var pop_tab = new Array(
	new Array( 0/* TOP' */, 1 ),
	new Array( 31/* TOP */, 1 ),
	new Array( 31/* TOP */, 1 ),
	new Array( 29/* TEMPLATE */, 8 ),
	new Array( 32/* ARGLIST */, 3 ),
	new Array( 32/* ARGLIST */, 1 ),
	new Array( 32/* ARGLIST */, 0 ),
	new Array( 35/* TYPE */, 2 ),
	new Array( 35/* TYPE */, 1 ),
	new Array( 30/* LETLIST */, 3 ),
	new Array( 30/* LETLIST */, 0 ),
	new Array( 36/* LET */, 3 ),
	new Array( 39/* ACTIONTPL */, 8 ),
	new Array( 37/* ACTLIST */, 3 ),
	new Array( 37/* ACTLIST */, 0 ),
	new Array( 40/* ACTSTMT */, 3 ),
	new Array( 40/* ACTSTMT */, 1 ),
	new Array( 38/* ACTION */, 1 ),
	new Array( 38/* ACTION */, 1 ),
	new Array( 38/* ACTION */, 1 ),
	new Array( 41/* CREATE */, 6 ),
	new Array( 42/* UPDATE */, 6 ),
	new Array( 42/* UPDATE */, 8 ),
	new Array( 42/* UPDATE */, 6 ),
	new Array( 33/* STMT */, 1 ),
	new Array( 33/* STMT */, 1 ),
	new Array( 33/* STMT */, 1 ),
	new Array( 33/* STMT */, 1 ),
	new Array( 33/* STMT */, 1 ),
	new Array( 33/* STMT */, 1 ),
	new Array( 33/* STMT */, 1 ),
	new Array( 43/* EXPR */, 1 ),
	new Array( 43/* EXPR */, 1 ),
	new Array( 43/* EXPR */, 1 ),
	new Array( 43/* EXPR */, 1 ),
	new Array( 43/* EXPR */, 4 ),
	new Array( 43/* EXPR */, 2 ),
	new Array( 47/* LETLISTBLOCK */, 4 ),
	new Array( 45/* JSFUN */, 7 ),
	new Array( 45/* JSFUN */, 10 ),
	new Array( 44/* JS */, 1 ),
	new Array( 44/* JS */, 1 ),
	new Array( 44/* JS */, 3 ),
	new Array( 44/* JS */, 3 ),
	new Array( 44/* JS */, 1 ),
	new Array( 44/* JS */, 1 ),
	new Array( 44/* JS */, 1 ),
	new Array( 44/* JS */, 1 ),
	new Array( 44/* JS */, 1 ),
	new Array( 44/* JS */, 1 ),
	new Array( 44/* JS */, 1 ),
	new Array( 44/* JS */, 1 ),
	new Array( 44/* JS */, 2 ),
	new Array( 44/* JS */, 0 ),
	new Array( 46/* STATE */, 4 ),
	new Array( 34/* VARIABLE */, 1 ),
	new Array( 34/* VARIABLE */, 4 ),
	new Array( 48/* XML */, 4 ),
	new Array( 48/* XML */, 4 ),
	new Array( 48/* XML */, 4 ),
	new Array( 48/* XML */, 3 ),
	new Array( 48/* XML */, 1 ),
	new Array( 48/* XML */, 1 ),
	new Array( 57/* XMLLIST */, 2 ),
	new Array( 57/* XMLLIST */, 0 ),
	new Array( 60/* INSERT */, 3 ),
	new Array( 61/* TEXT */, 1 ),
	new Array( 61/* TEXT */, 1 ),
	new Array( 61/* TEXT */, 1 ),
	new Array( 61/* TEXT */, 1 ),
	new Array( 61/* TEXT */, 1 ),
	new Array( 61/* TEXT */, 1 ),
	new Array( 61/* TEXT */, 1 ),
	new Array( 61/* TEXT */, 1 ),
	new Array( 61/* TEXT */, 1 ),
	new Array( 61/* TEXT */, 2 ),
	new Array( 50/* OPENFOREACH */, 4 ),
	new Array( 51/* CLOSEFOREACH */, 3 ),
	new Array( 54/* OPENCALL */, 3 ),
	new Array( 55/* CLOSECALL */, 3 ),
	new Array( 52/* OPENON */, 4 ),
	new Array( 53/* CLOSEON */, 3 ),
	new Array( 56/* OPENTAG */, 4 ),
	new Array( 58/* CLOSETAG */, 3 ),
	new Array( 59/* SINGLETAG */, 5 ),
	new Array( 63/* TAGNAME */, 1 ),
	new Array( 63/* TAGNAME */, 3 ),
	new Array( 62/* ATTRIBUTES */, 6 ),
	new Array( 62/* ATTRIBUTES */, 4 ),
	new Array( 62/* ATTRIBUTES */, 0 ),
	new Array( 65/* ATTRIBUTE */, 1 ),
	new Array( 65/* ATTRIBUTE */, 3 ),
	new Array( 49/* STRINGKEEPQUOTES */, 3 ),
	new Array( 66/* STRING */, 3 ),
	new Array( 64/* STYLE */, 3 ),
	new Array( 64/* STYLE */, 1 ),
	new Array( 64/* STYLE */, 0 ),
	new Array( 67/* STYLEATTRIBUTE */, 3 )
);

/* Action-Table */
var act_tab = new Array(
	/* State 0 */ new Array( 3/* "template" */,4 , 68/* "$" */,-10 , 28/* "IDENTIFIER" */,-10 ),
	/* State 1 */ new Array( 68/* "$" */,0 ),
	/* State 2 */ new Array( 68/* "$" */,-1 ),
	/* State 3 */ new Array( 28/* "IDENTIFIER" */,7 , 68/* "$" */,-2 ),
	/* State 4 */ new Array( 16/* "(" */,8 ),
	/* State 5 */ new Array( 18/* "," */,9 ),
	/* State 6 */ new Array( 21/* "=" */,10 ),
	/* State 7 */ new Array( 20/* ":" */,11 , 21/* "=" */,-55 , 17/* ")" */,-55 , 18/* "," */,-55 ),
	/* State 8 */ new Array( 28/* "IDENTIFIER" */,7 , 17/* ")" */,-6 , 18/* "," */,-6 ),
	/* State 9 */ new Array( 68/* "$" */,-9 , 28/* "IDENTIFIER" */,-9 , 3/* "template" */,-9 , 4/* "function" */,-9 , 5/* "action" */,-9 , 16/* "(" */,-9 , 17/* ")" */,-9 , 6/* "state" */,-9 , 14/* "{" */,-9 , 2/* "TEXTNODE" */,-9 , 26/* "QUOTE" */,-9 , 24/* "<" */,-9 ),
	/* State 10 */ new Array( 4/* "function" */,22 , 3/* "template" */,4 , 5/* "action" */,23 , 16/* "(" */,24 , 17/* ")" */,25 , 28/* "IDENTIFIER" */,26 , 6/* "state" */,28 , 14/* "{" */,29 , 2/* "TEXTNODE" */,35 , 26/* "QUOTE" */,36 , 24/* "<" */,37 ),
	/* State 11 */ new Array( 20/* ":" */,38 ),
	/* State 12 */ new Array( 18/* "," */,39 , 17/* ")" */,40 ),
	/* State 13 */ new Array( 17/* ")" */,-5 , 18/* "," */,-5 ),
	/* State 14 */ new Array( 18/* "," */,-11 ),
	/* State 15 */ new Array( 18/* "," */,-24 , 15/* "}" */,-24 , 22/* "</" */,-24 ),
	/* State 16 */ new Array( 18/* "," */,-25 , 15/* "}" */,-25 , 22/* "</" */,-25 ),
	/* State 17 */ new Array( 18/* "," */,-26 , 15/* "}" */,-26 , 22/* "</" */,-26 ),
	/* State 18 */ new Array( 16/* "(" */,24 , 17/* ")" */,25 , 28/* "IDENTIFIER" */,26 , 26/* "QUOTE" */,36 , 18/* "," */,-27 , 15/* "}" */,-27 , 22/* "</" */,-27 ),
	/* State 19 */ new Array( 18/* "," */,-28 , 15/* "}" */,-28 , 22/* "</" */,-28 ),
	/* State 20 */ new Array( 18/* "," */,-29 , 15/* "}" */,-29 , 22/* "</" */,-29 ),
	/* State 21 */ new Array( 18/* "," */,-30 , 15/* "}" */,-30 , 22/* "</" */,-30 ),
	/* State 22 */ new Array( 16/* "(" */,42 ),
	/* State 23 */ new Array( 16/* "(" */,43 ),
	/* State 24 */ new Array( 18/* "," */,-31 , 16/* "(" */,-31 , 17/* ")" */,-31 , 28/* "IDENTIFIER" */,-31 , 26/* "QUOTE" */,-31 , 15/* "}" */,-31 , 22/* "</" */,-31 ),
	/* State 25 */ new Array( 18/* "," */,-32 , 16/* "(" */,-32 , 17/* ")" */,-32 , 28/* "IDENTIFIER" */,-32 , 26/* "QUOTE" */,-32 , 15/* "}" */,-32 , 22/* "</" */,-32 ),
	/* State 26 */ new Array( 20/* ":" */,44 , 18/* "," */,-33 , 16/* "(" */,-33 , 17/* ")" */,-33 , 28/* "IDENTIFIER" */,-33 , 26/* "QUOTE" */,-33 , 15/* "}" */,-33 , 22/* "</" */,-33 ),
	/* State 27 */ new Array( 18/* "," */,-34 , 16/* "(" */,-34 , 17/* ")" */,-34 , 28/* "IDENTIFIER" */,-34 , 26/* "QUOTE" */,-34 , 15/* "}" */,-34 , 22/* "</" */,-34 ),
	/* State 28 */ new Array( 16/* "(" */,45 ),
	/* State 29 */ new Array( 3/* "template" */,-10 , 4/* "function" */,-10 , 5/* "action" */,-10 , 16/* "(" */,-10 , 17/* ")" */,-10 , 28/* "IDENTIFIER" */,-10 , 6/* "state" */,-10 , 14/* "{" */,-10 , 2/* "TEXTNODE" */,-10 , 26/* "QUOTE" */,-10 , 24/* "<" */,-10 ),
	/* State 30 */ new Array( 3/* "template" */,-10 , 4/* "function" */,-10 , 5/* "action" */,-10 , 16/* "(" */,-10 , 17/* ")" */,-10 , 28/* "IDENTIFIER" */,-10 , 6/* "state" */,-10 , 14/* "{" */,-10 , 2/* "TEXTNODE" */,-10 , 26/* "QUOTE" */,-10 , 24/* "<" */,-10 ),
	/* State 31 */ new Array( 7/* "create" */,-14 , 8/* "add" */,-14 , 9/* "remove" */,-14 , 16/* "(" */,-14 , 17/* ")" */,-14 , 28/* "IDENTIFIER" */,-14 , 26/* "QUOTE" */,-14 ),
	/* State 32 */ new Array( 3/* "template" */,-10 , 4/* "function" */,-10 , 5/* "action" */,-10 , 16/* "(" */,-10 , 17/* ")" */,-10 , 28/* "IDENTIFIER" */,-10 , 6/* "state" */,-10 , 14/* "{" */,-10 , 2/* "TEXTNODE" */,-10 , 26/* "QUOTE" */,-10 , 24/* "<" */,-10 ),
	/* State 33 */ new Array( 22/* "</" */,-64 , 2/* "TEXTNODE" */,-64 , 24/* "<" */,-64 ),
	/* State 34 */ new Array( 18/* "," */,-61 , 15/* "}" */,-61 , 22/* "</" */,-61 , 2/* "TEXTNODE" */,-61 , 24/* "<" */,-61 ),
	/* State 35 */ new Array( 18/* "," */,-62 , 15/* "}" */,-62 , 22/* "</" */,-62 , 2/* "TEXTNODE" */,-62 , 24/* "<" */,-62 ),
	/* State 36 */ new Array( 28/* "IDENTIFIER" */,52 , 18/* "," */,53 , 16/* "(" */,54 , 17/* ")" */,55 , 20/* ":" */,56 , 19/* ";" */,57 , 21/* "=" */,58 , 15/* "}" */,59 , 14/* "{" */,60 ),
	/* State 37 */ new Array( 11/* "f:call" */,62 , 12/* "f:on" */,63 , 10/* "f:each" */,64 , 28/* "IDENTIFIER" */,65 ),
	/* State 38 */ new Array( 28/* "IDENTIFIER" */,67 ),
	/* State 39 */ new Array( 28/* "IDENTIFIER" */,7 ),
	/* State 40 */ new Array( 14/* "{" */,69 ),
	/* State 41 */ new Array( 16/* "(" */,24 , 17/* ")" */,25 , 28/* "IDENTIFIER" */,26 , 26/* "QUOTE" */,36 , 18/* "," */,-36 , 15/* "}" */,-36 , 22/* "</" */,-36 ),
	/* State 42 */ new Array( 28/* "IDENTIFIER" */,7 , 17/* ")" */,-6 , 18/* "," */,-6 ),
	/* State 43 */ new Array( 28/* "IDENTIFIER" */,7 , 17/* ")" */,-6 , 18/* "," */,-6 ),
	/* State 44 */ new Array( 20/* ":" */,72 ),
	/* State 45 */ new Array( 28/* "IDENTIFIER" */,67 ),
	/* State 46 */ new Array( 4/* "function" */,22 , 3/* "template" */,4 , 5/* "action" */,23 , 16/* "(" */,24 , 17/* ")" */,25 , 28/* "IDENTIFIER" */,75 , 6/* "state" */,28 , 14/* "{" */,29 , 2/* "TEXTNODE" */,35 , 26/* "QUOTE" */,36 , 24/* "<" */,37 ),
	/* State 47 */ new Array( 4/* "function" */,22 , 3/* "template" */,4 , 5/* "action" */,23 , 16/* "(" */,24 , 17/* ")" */,25 , 28/* "IDENTIFIER" */,75 , 6/* "state" */,28 , 14/* "{" */,29 , 2/* "TEXTNODE" */,35 , 26/* "QUOTE" */,36 , 24/* "<" */,37 ),
	/* State 48 */ new Array( 7/* "create" */,83 , 8/* "add" */,84 , 9/* "remove" */,85 , 16/* "(" */,24 , 17/* ")" */,25 , 28/* "IDENTIFIER" */,75 , 26/* "QUOTE" */,36 ),
	/* State 49 */ new Array( 4/* "function" */,22 , 3/* "template" */,4 , 5/* "action" */,23 , 16/* "(" */,24 , 17/* ")" */,25 , 28/* "IDENTIFIER" */,75 , 6/* "state" */,28 , 14/* "{" */,29 , 2/* "TEXTNODE" */,35 , 26/* "QUOTE" */,36 , 24/* "<" */,37 ),
	/* State 50 */ new Array( 22/* "</" */,89 , 2/* "TEXTNODE" */,35 , 24/* "<" */,37 ),
	/* State 51 */ new Array( 26/* "QUOTE" */,91 , 28/* "IDENTIFIER" */,52 , 18/* "," */,53 , 16/* "(" */,54 , 17/* ")" */,55 , 20/* ":" */,56 , 19/* ";" */,57 , 21/* "=" */,58 , 15/* "}" */,59 , 14/* "{" */,60 ),
	/* State 52 */ new Array( 26/* "QUOTE" */,-66 , 28/* "IDENTIFIER" */,-66 , 18/* "," */,-66 , 16/* "(" */,-66 , 17/* ")" */,-66 , 20/* ":" */,-66 , 19/* ";" */,-66 , 21/* "=" */,-66 , 15/* "}" */,-66 , 14/* "{" */,-66 ),
	/* State 53 */ new Array( 26/* "QUOTE" */,-67 , 28/* "IDENTIFIER" */,-67 , 18/* "," */,-67 , 16/* "(" */,-67 , 17/* ")" */,-67 , 20/* ":" */,-67 , 19/* ";" */,-67 , 21/* "=" */,-67 , 15/* "}" */,-67 , 14/* "{" */,-67 ),
	/* State 54 */ new Array( 26/* "QUOTE" */,-68 , 28/* "IDENTIFIER" */,-68 , 18/* "," */,-68 , 16/* "(" */,-68 , 17/* ")" */,-68 , 20/* ":" */,-68 , 19/* ";" */,-68 , 21/* "=" */,-68 , 15/* "}" */,-68 , 14/* "{" */,-68 ),
	/* State 55 */ new Array( 26/* "QUOTE" */,-69 , 28/* "IDENTIFIER" */,-69 , 18/* "," */,-69 , 16/* "(" */,-69 , 17/* ")" */,-69 , 20/* ":" */,-69 , 19/* ";" */,-69 , 21/* "=" */,-69 , 15/* "}" */,-69 , 14/* "{" */,-69 ),
	/* State 56 */ new Array( 26/* "QUOTE" */,-70 , 28/* "IDENTIFIER" */,-70 , 18/* "," */,-70 , 16/* "(" */,-70 , 17/* ")" */,-70 , 20/* ":" */,-70 , 19/* ";" */,-70 , 21/* "=" */,-70 , 15/* "}" */,-70 , 14/* "{" */,-70 ),
	/* State 57 */ new Array( 26/* "QUOTE" */,-71 , 28/* "IDENTIFIER" */,-71 , 18/* "," */,-71 , 16/* "(" */,-71 , 17/* ")" */,-71 , 20/* ":" */,-71 , 19/* ";" */,-71 , 21/* "=" */,-71 , 15/* "}" */,-71 , 14/* "{" */,-71 ),
	/* State 58 */ new Array( 26/* "QUOTE" */,-72 , 28/* "IDENTIFIER" */,-72 , 18/* "," */,-72 , 16/* "(" */,-72 , 17/* ")" */,-72 , 20/* ":" */,-72 , 19/* ";" */,-72 , 21/* "=" */,-72 , 15/* "}" */,-72 , 14/* "{" */,-72 ),
	/* State 59 */ new Array( 26/* "QUOTE" */,-73 , 28/* "IDENTIFIER" */,-73 , 18/* "," */,-73 , 16/* "(" */,-73 , 17/* ")" */,-73 , 20/* ":" */,-73 , 19/* ";" */,-73 , 21/* "=" */,-73 , 15/* "}" */,-73 , 14/* "{" */,-73 ),
	/* State 60 */ new Array( 26/* "QUOTE" */,-74 , 28/* "IDENTIFIER" */,-74 , 18/* "," */,-74 , 16/* "(" */,-74 , 17/* ")" */,-74 , 20/* ":" */,-74 , 19/* ";" */,-74 , 21/* "=" */,-74 , 15/* "}" */,-74 , 14/* "{" */,-74 ),
	/* State 61 */ new Array( 23/* "/" */,-89 , 25/* ">" */,-89 , 13/* "style" */,-89 , 28/* "IDENTIFIER" */,-89 ),
	/* State 62 */ new Array( 25/* ">" */,93 ),
	/* State 63 */ new Array( 25/* ">" */,-89 , 13/* "style" */,-89 , 28/* "IDENTIFIER" */,-89 ),
	/* State 64 */ new Array( 25/* ">" */,-89 , 13/* "style" */,-89 , 28/* "IDENTIFIER" */,-89 ),
	/* State 65 */ new Array( 20/* ":" */,96 , 13/* "style" */,-85 , 28/* "IDENTIFIER" */,-85 , 25/* ">" */,-85 , 23/* "/" */,-85 ),
	/* State 66 */ new Array( 28/* "IDENTIFIER" */,97 , 21/* "=" */,-56 , 17/* ")" */,-56 , 18/* "," */,-56 ),
	/* State 67 */ new Array( 21/* "=" */,-8 , 17/* ")" */,-8 , 18/* "," */,-8 , 28/* "IDENTIFIER" */,-8 , 14/* "{" */,-8 ),
	/* State 68 */ new Array( 17/* ")" */,-4 , 18/* "," */,-4 ),
	/* State 69 */ new Array( 3/* "template" */,-10 , 4/* "function" */,-10 , 5/* "action" */,-10 , 16/* "(" */,-10 , 17/* ")" */,-10 , 28/* "IDENTIFIER" */,-10 , 6/* "state" */,-10 , 14/* "{" */,-10 , 2/* "TEXTNODE" */,-10 , 26/* "QUOTE" */,-10 , 24/* "<" */,-10 ),
	/* State 70 */ new Array( 18/* "," */,39 , 17/* ")" */,99 ),
	/* State 71 */ new Array( 18/* "," */,39 , 17/* ")" */,100 ),
	/* State 72 */ new Array( 28/* "IDENTIFIER" */,101 ),
	/* State 73 */ new Array( 28/* "IDENTIFIER" */,97 , 17/* ")" */,102 ),
	/* State 74 */ new Array( 15/* "}" */,103 ),
	/* State 75 */ new Array( 20/* ":" */,104 , 15/* "}" */,-33 , 16/* "(" */,-33 , 17/* ")" */,-33 , 28/* "IDENTIFIER" */,-33 , 26/* "QUOTE" */,-33 , 22/* "</" */,-33 , 18/* "," */,-33 , 21/* "=" */,-55 ),
	/* State 76 */ new Array( 22/* "</" */,106 ),
	/* State 77 */ new Array( 18/* "," */,107 ),
	/* State 78 */ new Array( 22/* "</" */,109 , 18/* "," */,-16 ),
	/* State 79 */ new Array( 22/* "</" */,-17 , 18/* "," */,-17 , 15/* "}" */,-17 ),
	/* State 80 */ new Array( 22/* "</" */,-18 , 18/* "," */,-18 , 15/* "}" */,-18 ),
	/* State 81 */ new Array( 16/* "(" */,24 , 17/* ")" */,25 , 28/* "IDENTIFIER" */,26 , 26/* "QUOTE" */,36 , 22/* "</" */,-19 , 18/* "," */,-19 , 15/* "}" */,-19 ),
	/* State 82 */ new Array( 21/* "=" */,110 ),
	/* State 83 */ new Array( 16/* "(" */,111 ),
	/* State 84 */ new Array( 16/* "(" */,112 ),
	/* State 85 */ new Array( 16/* "(" */,113 ),
	/* State 86 */ new Array( 22/* "</" */,115 ),
	/* State 87 */ new Array( 22/* "</" */,-63 , 2/* "TEXTNODE" */,-63 , 24/* "<" */,-63 ),
	/* State 88 */ new Array( 18/* "," */,-60 , 15/* "}" */,-60 , 22/* "</" */,-60 , 2/* "TEXTNODE" */,-60 , 24/* "<" */,-60 ),
	/* State 89 */ new Array( 28/* "IDENTIFIER" */,65 ),
	/* State 90 */ new Array( 28/* "IDENTIFIER" */,52 , 18/* "," */,53 , 16/* "(" */,54 , 17/* ")" */,55 , 20/* ":" */,56 , 19/* ";" */,57 , 21/* "=" */,58 , 15/* "}" */,59 , 14/* "{" */,60 , 26/* "QUOTE" */,-75 ),
	/* State 91 */ new Array( 18/* "," */,-92 , 16/* "(" */,-92 , 17/* ")" */,-92 , 28/* "IDENTIFIER" */,-92 , 26/* "QUOTE" */,-92 , 15/* "}" */,-92 , 22/* "</" */,-92 , 14/* "{" */,-92 , 21/* "=" */,-92 , 19/* ";" */,-92 , 20/* ":" */,-92 , 24/* "<" */,-92 , 25/* ">" */,-92 , 23/* "/" */,-92 , 27/* "JSSEP" */,-92 ),
	/* State 92 */ new Array( 28/* "IDENTIFIER" */,117 , 13/* "style" */,118 , 23/* "/" */,119 , 25/* ">" */,120 ),
	/* State 93 */ new Array( 28/* "IDENTIFIER" */,-78 , 3/* "template" */,-78 , 4/* "function" */,-78 , 5/* "action" */,-78 , 16/* "(" */,-78 , 17/* ")" */,-78 , 6/* "state" */,-78 , 14/* "{" */,-78 , 2/* "TEXTNODE" */,-78 , 26/* "QUOTE" */,-78 , 24/* "<" */,-78 ),
	/* State 94 */ new Array( 28/* "IDENTIFIER" */,117 , 13/* "style" */,118 , 25/* ">" */,121 ),
	/* State 95 */ new Array( 28/* "IDENTIFIER" */,117 , 13/* "style" */,118 , 25/* ">" */,122 ),
	/* State 96 */ new Array( 28/* "IDENTIFIER" */,123 ),
	/* State 97 */ new Array( 21/* "=" */,-7 , 17/* ")" */,-7 , 18/* "," */,-7 , 28/* "IDENTIFIER" */,-7 , 14/* "{" */,-7 ),
	/* State 98 */ new Array( 4/* "function" */,22 , 3/* "template" */,4 , 5/* "action" */,23 , 16/* "(" */,24 , 17/* ")" */,25 , 28/* "IDENTIFIER" */,75 , 6/* "state" */,28 , 14/* "{" */,29 , 2/* "TEXTNODE" */,35 , 26/* "QUOTE" */,36 , 24/* "<" */,37 ),
	/* State 99 */ new Array( 14/* "{" */,125 , 20/* ":" */,126 ),
	/* State 100 */ new Array( 14/* "{" */,127 ),
	/* State 101 */ new Array( 18/* "," */,-35 , 16/* "(" */,-35 , 17/* ")" */,-35 , 28/* "IDENTIFIER" */,-35 , 26/* "QUOTE" */,-35 , 15/* "}" */,-35 , 22/* "</" */,-35 ),
	/* State 102 */ new Array( 18/* "," */,-54 , 15/* "}" */,-54 , 22/* "</" */,-54 ),
	/* State 103 */ new Array( 18/* "," */,-37 , 15/* "}" */,-37 , 22/* "</" */,-37 ),
	/* State 104 */ new Array( 20/* ":" */,128 ),
	/* State 105 */ new Array( 18/* "," */,-57 , 15/* "}" */,-57 , 22/* "</" */,-57 , 2/* "TEXTNODE" */,-57 , 24/* "<" */,-57 ),
	/* State 106 */ new Array( 10/* "f:each" */,129 ),
	/* State 107 */ new Array( 7/* "create" */,-13 , 8/* "add" */,-13 , 9/* "remove" */,-13 , 16/* "(" */,-13 , 17/* ")" */,-13 , 28/* "IDENTIFIER" */,-13 , 26/* "QUOTE" */,-13 ),
	/* State 108 */ new Array( 18/* "," */,-58 , 15/* "}" */,-58 , 22/* "</" */,-58 , 2/* "TEXTNODE" */,-58 , 24/* "<" */,-58 ),
	/* State 109 */ new Array( 12/* "f:on" */,130 ),
	/* State 110 */ new Array( 7/* "create" */,83 , 8/* "add" */,84 , 9/* "remove" */,85 , 16/* "(" */,24 , 17/* ")" */,25 , 28/* "IDENTIFIER" */,26 , 26/* "QUOTE" */,36 ),
	/* State 111 */ new Array( 28/* "IDENTIFIER" */,67 ),
	/* State 112 */ new Array( 16/* "(" */,24 , 17/* ")" */,25 , 28/* "IDENTIFIER" */,26 , 26/* "QUOTE" */,36 ),
	/* State 113 */ new Array( 16/* "(" */,24 , 17/* ")" */,25 , 28/* "IDENTIFIER" */,26 , 26/* "QUOTE" */,36 ),
	/* State 114 */ new Array( 18/* "," */,-59 , 15/* "}" */,-59 , 22/* "</" */,-59 , 2/* "TEXTNODE" */,-59 , 24/* "<" */,-59 ),
	/* State 115 */ new Array( 11/* "f:call" */,135 ),
	/* State 116 */ new Array( 25/* ">" */,136 ),
	/* State 117 */ new Array( 21/* "=" */,137 ),
	/* State 118 */ new Array( 21/* "=" */,138 ),
	/* State 119 */ new Array( 25/* ">" */,139 ),
	/* State 120 */ new Array( 2/* "TEXTNODE" */,-82 , 24/* "<" */,-82 , 22/* "</" */,-82 ),
	/* State 121 */ new Array( 28/* "IDENTIFIER" */,-80 , 7/* "create" */,-80 , 8/* "add" */,-80 , 9/* "remove" */,-80 , 16/* "(" */,-80 , 17/* ")" */,-80 , 26/* "QUOTE" */,-80 ),
	/* State 122 */ new Array( 28/* "IDENTIFIER" */,-76 , 3/* "template" */,-76 , 4/* "function" */,-76 , 5/* "action" */,-76 , 16/* "(" */,-76 , 17/* ")" */,-76 , 6/* "state" */,-76 , 14/* "{" */,-76 , 2/* "TEXTNODE" */,-76 , 26/* "QUOTE" */,-76 , 24/* "<" */,-76 ),
	/* State 123 */ new Array( 13/* "style" */,-86 , 28/* "IDENTIFIER" */,-86 , 25/* ">" */,-86 , 23/* "/" */,-86 ),
	/* State 124 */ new Array( 15/* "}" */,140 ),
	/* State 125 */ new Array( 28/* "IDENTIFIER" */,142 , 16/* "(" */,144 , 14/* "{" */,145 , 18/* "," */,146 , 21/* "=" */,147 , 19/* ";" */,148 , 20/* ":" */,149 , 24/* "<" */,150 , 25/* ">" */,151 , 23/* "/" */,152 , 27/* "JSSEP" */,153 , 26/* "QUOTE" */,36 , 15/* "}" */,-53 ),
	/* State 126 */ new Array( 20/* ":" */,154 ),
	/* State 127 */ new Array( 7/* "create" */,-14 , 8/* "add" */,-14 , 9/* "remove" */,-14 , 16/* "(" */,-14 , 17/* ")" */,-14 , 28/* "IDENTIFIER" */,-14 , 26/* "QUOTE" */,-14 ),
	/* State 128 */ new Array( 28/* "IDENTIFIER" */,156 ),
	/* State 129 */ new Array( 25/* ">" */,157 ),
	/* State 130 */ new Array( 25/* ">" */,158 ),
	/* State 131 */ new Array( 18/* "," */,-15 ),
	/* State 132 */ new Array( 28/* "IDENTIFIER" */,97 , 18/* "," */,159 ),
	/* State 133 */ new Array( 18/* "," */,160 , 16/* "(" */,24 , 17/* ")" */,25 , 28/* "IDENTIFIER" */,26 , 26/* "QUOTE" */,36 ),
	/* State 134 */ new Array( 18/* "," */,161 , 16/* "(" */,24 , 17/* ")" */,25 , 28/* "IDENTIFIER" */,26 , 26/* "QUOTE" */,36 ),
	/* State 135 */ new Array( 25/* ">" */,162 ),
	/* State 136 */ new Array( 18/* "," */,-83 , 15/* "}" */,-83 , 22/* "</" */,-83 , 2/* "TEXTNODE" */,-83 , 24/* "<" */,-83 ),
	/* State 137 */ new Array( 26/* "QUOTE" */,165 ),
	/* State 138 */ new Array( 26/* "QUOTE" */,166 ),
	/* State 139 */ new Array( 18/* "," */,-84 , 15/* "}" */,-84 , 22/* "</" */,-84 , 2/* "TEXTNODE" */,-84 , 24/* "<" */,-84 ),
	/* State 140 */ new Array( 68/* "$" */,-3 , 18/* "," */,-3 , 15/* "}" */,-3 , 22/* "</" */,-3 ),
	/* State 141 */ new Array( 15/* "}" */,168 , 28/* "IDENTIFIER" */,142 , 16/* "(" */,144 , 14/* "{" */,145 , 18/* "," */,146 , 21/* "=" */,147 , 19/* ";" */,148 , 20/* ":" */,149 , 24/* "<" */,150 , 25/* ">" */,151 , 23/* "/" */,152 , 27/* "JSSEP" */,153 , 26/* "QUOTE" */,36 ),
	/* State 142 */ new Array( 15/* "}" */,-40 , 28/* "IDENTIFIER" */,-40 , 16/* "(" */,-40 , 14/* "{" */,-40 , 18/* "," */,-40 , 21/* "=" */,-40 , 19/* ";" */,-40 , 20/* ":" */,-40 , 24/* "<" */,-40 , 25/* ">" */,-40 , 23/* "/" */,-40 , 27/* "JSSEP" */,-40 , 26/* "QUOTE" */,-40 , 17/* ")" */,-40 ),
	/* State 143 */ new Array( 15/* "}" */,-41 , 28/* "IDENTIFIER" */,-41 , 16/* "(" */,-41 , 14/* "{" */,-41 , 18/* "," */,-41 , 21/* "=" */,-41 , 19/* ";" */,-41 , 20/* ":" */,-41 , 24/* "<" */,-41 , 25/* ">" */,-41 , 23/* "/" */,-41 , 27/* "JSSEP" */,-41 , 26/* "QUOTE" */,-41 , 17/* ")" */,-41 ),
	/* State 144 */ new Array( 28/* "IDENTIFIER" */,142 , 16/* "(" */,144 , 14/* "{" */,145 , 18/* "," */,146 , 21/* "=" */,147 , 19/* ";" */,148 , 20/* ":" */,149 , 24/* "<" */,150 , 25/* ">" */,151 , 23/* "/" */,152 , 27/* "JSSEP" */,153 , 26/* "QUOTE" */,36 , 17/* ")" */,-53 ),
	/* State 145 */ new Array( 28/* "IDENTIFIER" */,142 , 16/* "(" */,144 , 14/* "{" */,145 , 18/* "," */,146 , 21/* "=" */,147 , 19/* ";" */,148 , 20/* ":" */,149 , 24/* "<" */,150 , 25/* ">" */,151 , 23/* "/" */,152 , 27/* "JSSEP" */,153 , 26/* "QUOTE" */,36 , 15/* "}" */,-53 ),
	/* State 146 */ new Array( 15/* "}" */,-44 , 28/* "IDENTIFIER" */,-44 , 16/* "(" */,-44 , 14/* "{" */,-44 , 18/* "," */,-44 , 21/* "=" */,-44 , 19/* ";" */,-44 , 20/* ":" */,-44 , 24/* "<" */,-44 , 25/* ">" */,-44 , 23/* "/" */,-44 , 27/* "JSSEP" */,-44 , 26/* "QUOTE" */,-44 , 17/* ")" */,-44 ),
	/* State 147 */ new Array( 15/* "}" */,-45 , 28/* "IDENTIFIER" */,-45 , 16/* "(" */,-45 , 14/* "{" */,-45 , 18/* "," */,-45 , 21/* "=" */,-45 , 19/* ";" */,-45 , 20/* ":" */,-45 , 24/* "<" */,-45 , 25/* ">" */,-45 , 23/* "/" */,-45 , 27/* "JSSEP" */,-45 , 26/* "QUOTE" */,-45 , 17/* ")" */,-45 ),
	/* State 148 */ new Array( 15/* "}" */,-46 , 28/* "IDENTIFIER" */,-46 , 16/* "(" */,-46 , 14/* "{" */,-46 , 18/* "," */,-46 , 21/* "=" */,-46 , 19/* ";" */,-46 , 20/* ":" */,-46 , 24/* "<" */,-46 , 25/* ">" */,-46 , 23/* "/" */,-46 , 27/* "JSSEP" */,-46 , 26/* "QUOTE" */,-46 , 17/* ")" */,-46 ),
	/* State 149 */ new Array( 15/* "}" */,-47 , 28/* "IDENTIFIER" */,-47 , 16/* "(" */,-47 , 14/* "{" */,-47 , 18/* "," */,-47 , 21/* "=" */,-47 , 19/* ";" */,-47 , 20/* ":" */,-47 , 24/* "<" */,-47 , 25/* ">" */,-47 , 23/* "/" */,-47 , 27/* "JSSEP" */,-47 , 26/* "QUOTE" */,-47 , 17/* ")" */,-47 ),
	/* State 150 */ new Array( 15/* "}" */,-48 , 28/* "IDENTIFIER" */,-48 , 16/* "(" */,-48 , 14/* "{" */,-48 , 18/* "," */,-48 , 21/* "=" */,-48 , 19/* ";" */,-48 , 20/* ":" */,-48 , 24/* "<" */,-48 , 25/* ">" */,-48 , 23/* "/" */,-48 , 27/* "JSSEP" */,-48 , 26/* "QUOTE" */,-48 , 17/* ")" */,-48 ),
	/* State 151 */ new Array( 15/* "}" */,-49 , 28/* "IDENTIFIER" */,-49 , 16/* "(" */,-49 , 14/* "{" */,-49 , 18/* "," */,-49 , 21/* "=" */,-49 , 19/* ";" */,-49 , 20/* ":" */,-49 , 24/* "<" */,-49 , 25/* ">" */,-49 , 23/* "/" */,-49 , 27/* "JSSEP" */,-49 , 26/* "QUOTE" */,-49 , 17/* ")" */,-49 ),
	/* State 152 */ new Array( 15/* "}" */,-50 , 28/* "IDENTIFIER" */,-50 , 16/* "(" */,-50 , 14/* "{" */,-50 , 18/* "," */,-50 , 21/* "=" */,-50 , 19/* ";" */,-50 , 20/* ":" */,-50 , 24/* "<" */,-50 , 25/* ">" */,-50 , 23/* "/" */,-50 , 27/* "JSSEP" */,-50 , 26/* "QUOTE" */,-50 , 17/* ")" */,-50 ),
	/* State 153 */ new Array( 15/* "}" */,-51 , 28/* "IDENTIFIER" */,-51 , 16/* "(" */,-51 , 14/* "{" */,-51 , 18/* "," */,-51 , 21/* "=" */,-51 , 19/* ";" */,-51 , 20/* ":" */,-51 , 24/* "<" */,-51 , 25/* ">" */,-51 , 23/* "/" */,-51 , 27/* "JSSEP" */,-51 , 26/* "QUOTE" */,-51 , 17/* ")" */,-51 ),
	/* State 154 */ new Array( 28/* "IDENTIFIER" */,67 ),
	/* State 155 */ new Array( 7/* "create" */,83 , 8/* "add" */,84 , 9/* "remove" */,85 , 16/* "(" */,24 , 17/* ")" */,25 , 28/* "IDENTIFIER" */,75 , 26/* "QUOTE" */,36 ),
	/* State 156 */ new Array( 15/* "}" */,-35 , 16/* "(" */,-35 , 17/* ")" */,-35 , 28/* "IDENTIFIER" */,-8 , 26/* "QUOTE" */,-35 , 22/* "</" */,-35 , 18/* "," */,-35 , 21/* "=" */,-8 ),
	/* State 157 */ new Array( 18/* "," */,-77 , 15/* "}" */,-77 , 22/* "</" */,-77 , 2/* "TEXTNODE" */,-77 , 24/* "<" */,-77 ),
	/* State 158 */ new Array( 18/* "," */,-81 , 15/* "}" */,-81 , 22/* "</" */,-81 , 2/* "TEXTNODE" */,-81 , 24/* "<" */,-81 ),
	/* State 159 */ new Array( 28/* "IDENTIFIER" */,142 , 16/* "(" */,144 , 14/* "{" */,145 , 18/* "," */,146 , 21/* "=" */,147 , 19/* ";" */,148 , 20/* ":" */,149 , 24/* "<" */,150 , 25/* ">" */,151 , 23/* "/" */,152 , 27/* "JSSEP" */,153 , 26/* "QUOTE" */,36 , 17/* ")" */,-53 ),
	/* State 160 */ new Array( 16/* "(" */,24 , 17/* ")" */,25 , 28/* "IDENTIFIER" */,26 , 26/* "QUOTE" */,36 ),
	/* State 161 */ new Array( 16/* "(" */,24 , 17/* ")" */,25 , 28/* "IDENTIFIER" */,26 , 26/* "QUOTE" */,36 ),
	/* State 162 */ new Array( 18/* "," */,-79 , 15/* "}" */,-79 , 22/* "</" */,-79 , 2/* "TEXTNODE" */,-79 , 24/* "<" */,-79 ),
	/* State 163 */ new Array( 23/* "/" */,-88 , 25/* ">" */,-88 , 13/* "style" */,-88 , 28/* "IDENTIFIER" */,-88 ),
	/* State 164 */ new Array( 23/* "/" */,-90 , 25/* ">" */,-90 , 13/* "style" */,-90 , 28/* "IDENTIFIER" */,-90 ),
	/* State 165 */ new Array( 14/* "{" */,178 , 28/* "IDENTIFIER" */,52 , 18/* "," */,53 , 16/* "(" */,54 , 17/* ")" */,55 , 20/* ":" */,56 , 19/* ";" */,57 , 21/* "=" */,58 , 15/* "}" */,59 ),
	/* State 166 */ new Array( 28/* "IDENTIFIER" */,181 , 26/* "QUOTE" */,-96 , 19/* ";" */,-96 ),
	/* State 167 */ new Array( 28/* "IDENTIFIER" */,142 , 16/* "(" */,144 , 14/* "{" */,145 , 18/* "," */,146 , 21/* "=" */,147 , 19/* ";" */,148 , 20/* ":" */,149 , 24/* "<" */,150 , 25/* ">" */,151 , 23/* "/" */,152 , 27/* "JSSEP" */,153 , 26/* "QUOTE" */,36 , 15/* "}" */,-52 , 17/* ")" */,-52 ),
	/* State 168 */ new Array( 18/* "," */,-38 , 15/* "}" */,-38 , 22/* "</" */,-38 ),
	/* State 169 */ new Array( 17/* ")" */,182 , 28/* "IDENTIFIER" */,142 , 16/* "(" */,144 , 14/* "{" */,145 , 18/* "," */,146 , 21/* "=" */,147 , 19/* ";" */,148 , 20/* ":" */,149 , 24/* "<" */,150 , 25/* ">" */,151 , 23/* "/" */,152 , 27/* "JSSEP" */,153 , 26/* "QUOTE" */,36 ),
	/* State 170 */ new Array( 15/* "}" */,183 , 28/* "IDENTIFIER" */,142 , 16/* "(" */,144 , 14/* "{" */,145 , 18/* "," */,146 , 21/* "=" */,147 , 19/* ";" */,148 , 20/* ":" */,149 , 24/* "<" */,150 , 25/* ">" */,151 , 23/* "/" */,152 , 27/* "JSSEP" */,153 , 26/* "QUOTE" */,36 ),
	/* State 171 */ new Array( 28/* "IDENTIFIER" */,97 , 14/* "{" */,184 ),
	/* State 172 */ new Array( 15/* "}" */,185 , 18/* "," */,-16 ),
	/* State 173 */ new Array( 17/* ")" */,186 , 28/* "IDENTIFIER" */,142 , 16/* "(" */,144 , 14/* "{" */,145 , 18/* "," */,146 , 21/* "=" */,147 , 19/* ";" */,148 , 20/* ":" */,149 , 24/* "<" */,150 , 25/* ">" */,151 , 23/* "/" */,152 , 27/* "JSSEP" */,153 , 26/* "QUOTE" */,36 ),
	/* State 174 */ new Array( 18/* "," */,187 , 17/* ")" */,188 , 16/* "(" */,24 , 28/* "IDENTIFIER" */,26 , 26/* "QUOTE" */,36 ),
	/* State 175 */ new Array( 17/* ")" */,189 , 16/* "(" */,24 , 28/* "IDENTIFIER" */,26 , 26/* "QUOTE" */,36 ),
	/* State 176 */ new Array( 26/* "QUOTE" */,190 , 28/* "IDENTIFIER" */,52 , 18/* "," */,53 , 16/* "(" */,54 , 17/* ")" */,55 , 20/* ":" */,56 , 19/* ";" */,57 , 21/* "=" */,58 , 15/* "}" */,59 , 14/* "{" */,60 ),
	/* State 177 */ new Array( 26/* "QUOTE" */,191 ),
	/* State 178 */ new Array( 16/* "(" */,24 , 17/* ")" */,25 , 28/* "IDENTIFIER" */,26 , 26/* "QUOTE" */,36 , 18/* "," */,-74 , 20/* ":" */,-74 , 19/* ";" */,-74 , 21/* "=" */,-74 , 15/* "}" */,-74 , 14/* "{" */,-74 ),
	/* State 179 */ new Array( 19/* ";" */,193 , 26/* "QUOTE" */,194 ),
	/* State 180 */ new Array( 26/* "QUOTE" */,-95 , 19/* ";" */,-95 ),
	/* State 181 */ new Array( 20/* ":" */,195 ),
	/* State 182 */ new Array( 15/* "}" */,-42 , 28/* "IDENTIFIER" */,-42 , 16/* "(" */,-42 , 14/* "{" */,-42 , 18/* "," */,-42 , 21/* "=" */,-42 , 19/* ";" */,-42 , 20/* ":" */,-42 , 24/* "<" */,-42 , 25/* ">" */,-42 , 23/* "/" */,-42 , 27/* "JSSEP" */,-42 , 26/* "QUOTE" */,-42 , 17/* ")" */,-42 ),
	/* State 183 */ new Array( 15/* "}" */,-43 , 28/* "IDENTIFIER" */,-43 , 16/* "(" */,-43 , 14/* "{" */,-43 , 18/* "," */,-43 , 21/* "=" */,-43 , 19/* ";" */,-43 , 20/* ":" */,-43 , 24/* "<" */,-43 , 25/* ">" */,-43 , 23/* "/" */,-43 , 27/* "JSSEP" */,-43 , 26/* "QUOTE" */,-43 , 17/* ")" */,-43 ),
	/* State 184 */ new Array( 28/* "IDENTIFIER" */,142 , 16/* "(" */,144 , 14/* "{" */,145 , 18/* "," */,146 , 21/* "=" */,147 , 19/* ";" */,148 , 20/* ":" */,149 , 24/* "<" */,150 , 25/* ">" */,151 , 23/* "/" */,152 , 27/* "JSSEP" */,153 , 26/* "QUOTE" */,36 , 15/* "}" */,-53 ),
	/* State 185 */ new Array( 18/* "," */,-12 , 15/* "}" */,-12 , 22/* "</" */,-12 ),
	/* State 186 */ new Array( 22/* "</" */,-20 , 18/* "," */,-20 , 15/* "}" */,-20 ),
	/* State 187 */ new Array( 16/* "(" */,24 , 17/* ")" */,25 , 28/* "IDENTIFIER" */,26 , 26/* "QUOTE" */,36 ),
	/* State 188 */ new Array( 22/* "</" */,-21 , 18/* "," */,-21 , 15/* "}" */,-21 , 17/* ")" */,-32 , 16/* "(" */,-32 , 28/* "IDENTIFIER" */,-32 , 26/* "QUOTE" */,-32 ),
	/* State 189 */ new Array( 22/* "</" */,-23 , 18/* "," */,-23 , 15/* "}" */,-23 , 17/* ")" */,-32 , 16/* "(" */,-32 , 28/* "IDENTIFIER" */,-32 , 26/* "QUOTE" */,-32 ),
	/* State 190 */ new Array( 23/* "/" */,-93 , 25/* ">" */,-93 , 13/* "style" */,-93 , 28/* "IDENTIFIER" */,-93 ),
	/* State 191 */ new Array( 23/* "/" */,-91 , 25/* ">" */,-91 , 13/* "style" */,-91 , 28/* "IDENTIFIER" */,-91 ),
	/* State 192 */ new Array( 15/* "}" */,198 , 16/* "(" */,24 , 17/* ")" */,25 , 28/* "IDENTIFIER" */,26 , 26/* "QUOTE" */,36 ),
	/* State 193 */ new Array( 28/* "IDENTIFIER" */,181 ),
	/* State 194 */ new Array( 23/* "/" */,-87 , 25/* ">" */,-87 , 13/* "style" */,-87 , 28/* "IDENTIFIER" */,-87 ),
	/* State 195 */ new Array( 28/* "IDENTIFIER" */,52 , 18/* "," */,53 , 16/* "(" */,54 , 17/* ")" */,55 , 20/* ":" */,56 , 19/* ";" */,57 , 21/* "=" */,58 , 15/* "}" */,59 , 14/* "{" */,60 ),
	/* State 196 */ new Array( 15/* "}" */,201 , 28/* "IDENTIFIER" */,142 , 16/* "(" */,144 , 14/* "{" */,145 , 18/* "," */,146 , 21/* "=" */,147 , 19/* ";" */,148 , 20/* ":" */,149 , 24/* "<" */,150 , 25/* ">" */,151 , 23/* "/" */,152 , 27/* "JSSEP" */,153 , 26/* "QUOTE" */,36 ),
	/* State 197 */ new Array( 17/* ")" */,202 , 16/* "(" */,24 , 28/* "IDENTIFIER" */,26 , 26/* "QUOTE" */,36 ),
	/* State 198 */ new Array( 26/* "QUOTE" */,-65 ),
	/* State 199 */ new Array( 26/* "QUOTE" */,-94 , 19/* ";" */,-94 ),
	/* State 200 */ new Array( 28/* "IDENTIFIER" */,52 , 18/* "," */,53 , 16/* "(" */,54 , 17/* ")" */,55 , 20/* ":" */,56 , 19/* ";" */,57 , 21/* "=" */,58 , 15/* "}" */,59 , 14/* "{" */,60 , 26/* "QUOTE" */,-97 ),
	/* State 201 */ new Array( 18/* "," */,-39 , 15/* "}" */,-39 , 22/* "</" */,-39 ),
	/* State 202 */ new Array( 22/* "</" */,-22 , 18/* "," */,-22 , 15/* "}" */,-22 , 17/* ")" */,-32 , 16/* "(" */,-32 , 28/* "IDENTIFIER" */,-32 , 26/* "QUOTE" */,-32 )
);

/* Goto-Table */
var goto_tab = new Array(
	/* State 0 */ new Array( 31/* TOP */,1 , 29/* TEMPLATE */,2 , 30/* LETLIST */,3 ),
	/* State 1 */ new Array(  ),
	/* State 2 */ new Array(  ),
	/* State 3 */ new Array( 36/* LET */,5 , 34/* VARIABLE */,6 ),
	/* State 4 */ new Array(  ),
	/* State 5 */ new Array(  ),
	/* State 6 */ new Array(  ),
	/* State 7 */ new Array(  ),
	/* State 8 */ new Array( 32/* ARGLIST */,12 , 34/* VARIABLE */,13 ),
	/* State 9 */ new Array(  ),
	/* State 10 */ new Array( 33/* STMT */,14 , 45/* JSFUN */,15 , 29/* TEMPLATE */,16 , 39/* ACTIONTPL */,17 , 43/* EXPR */,18 , 46/* STATE */,19 , 47/* LETLISTBLOCK */,20 , 48/* XML */,21 , 49/* STRINGKEEPQUOTES */,27 , 50/* OPENFOREACH */,30 , 52/* OPENON */,31 , 54/* OPENCALL */,32 , 56/* OPENTAG */,33 , 59/* SINGLETAG */,34 ),
	/* State 11 */ new Array(  ),
	/* State 12 */ new Array(  ),
	/* State 13 */ new Array(  ),
	/* State 14 */ new Array(  ),
	/* State 15 */ new Array(  ),
	/* State 16 */ new Array(  ),
	/* State 17 */ new Array(  ),
	/* State 18 */ new Array( 43/* EXPR */,41 , 49/* STRINGKEEPQUOTES */,27 ),
	/* State 19 */ new Array(  ),
	/* State 20 */ new Array(  ),
	/* State 21 */ new Array(  ),
	/* State 22 */ new Array(  ),
	/* State 23 */ new Array(  ),
	/* State 24 */ new Array(  ),
	/* State 25 */ new Array(  ),
	/* State 26 */ new Array(  ),
	/* State 27 */ new Array(  ),
	/* State 28 */ new Array(  ),
	/* State 29 */ new Array( 30/* LETLIST */,46 ),
	/* State 30 */ new Array( 30/* LETLIST */,47 ),
	/* State 31 */ new Array( 37/* ACTLIST */,48 ),
	/* State 32 */ new Array( 30/* LETLIST */,49 ),
	/* State 33 */ new Array( 57/* XMLLIST */,50 ),
	/* State 34 */ new Array(  ),
	/* State 35 */ new Array(  ),
	/* State 36 */ new Array( 61/* TEXT */,51 ),
	/* State 37 */ new Array( 63/* TAGNAME */,61 ),
	/* State 38 */ new Array( 35/* TYPE */,66 ),
	/* State 39 */ new Array( 34/* VARIABLE */,68 ),
	/* State 40 */ new Array(  ),
	/* State 41 */ new Array( 43/* EXPR */,41 , 49/* STRINGKEEPQUOTES */,27 ),
	/* State 42 */ new Array( 32/* ARGLIST */,70 , 34/* VARIABLE */,13 ),
	/* State 43 */ new Array( 32/* ARGLIST */,71 , 34/* VARIABLE */,13 ),
	/* State 44 */ new Array(  ),
	/* State 45 */ new Array( 35/* TYPE */,73 ),
	/* State 46 */ new Array( 36/* LET */,5 , 33/* STMT */,74 , 45/* JSFUN */,15 , 29/* TEMPLATE */,16 , 39/* ACTIONTPL */,17 , 43/* EXPR */,18 , 46/* STATE */,19 , 47/* LETLISTBLOCK */,20 , 48/* XML */,21 , 34/* VARIABLE */,6 , 49/* STRINGKEEPQUOTES */,27 , 50/* OPENFOREACH */,30 , 52/* OPENON */,31 , 54/* OPENCALL */,32 , 56/* OPENTAG */,33 , 59/* SINGLETAG */,34 ),
	/* State 47 */ new Array( 36/* LET */,5 , 33/* STMT */,76 , 45/* JSFUN */,15 , 29/* TEMPLATE */,16 , 39/* ACTIONTPL */,17 , 43/* EXPR */,18 , 46/* STATE */,19 , 47/* LETLISTBLOCK */,20 , 48/* XML */,21 , 34/* VARIABLE */,6 , 49/* STRINGKEEPQUOTES */,27 , 50/* OPENFOREACH */,30 , 52/* OPENON */,31 , 54/* OPENCALL */,32 , 56/* OPENTAG */,33 , 59/* SINGLETAG */,34 ),
	/* State 48 */ new Array( 40/* ACTSTMT */,77 , 38/* ACTION */,78 , 41/* CREATE */,79 , 42/* UPDATE */,80 , 43/* EXPR */,81 , 34/* VARIABLE */,82 , 49/* STRINGKEEPQUOTES */,27 ),
	/* State 49 */ new Array( 36/* LET */,5 , 33/* STMT */,86 , 45/* JSFUN */,15 , 29/* TEMPLATE */,16 , 39/* ACTIONTPL */,17 , 43/* EXPR */,18 , 46/* STATE */,19 , 47/* LETLISTBLOCK */,20 , 48/* XML */,21 , 34/* VARIABLE */,6 , 49/* STRINGKEEPQUOTES */,27 , 50/* OPENFOREACH */,30 , 52/* OPENON */,31 , 54/* OPENCALL */,32 , 56/* OPENTAG */,33 , 59/* SINGLETAG */,34 ),
	/* State 50 */ new Array( 48/* XML */,87 , 58/* CLOSETAG */,88 , 50/* OPENFOREACH */,30 , 52/* OPENON */,31 , 54/* OPENCALL */,32 , 56/* OPENTAG */,33 , 59/* SINGLETAG */,34 ),
	/* State 51 */ new Array( 61/* TEXT */,90 ),
	/* State 52 */ new Array(  ),
	/* State 53 */ new Array(  ),
	/* State 54 */ new Array(  ),
	/* State 55 */ new Array(  ),
	/* State 56 */ new Array(  ),
	/* State 57 */ new Array(  ),
	/* State 58 */ new Array(  ),
	/* State 59 */ new Array(  ),
	/* State 60 */ new Array(  ),
	/* State 61 */ new Array( 62/* ATTRIBUTES */,92 ),
	/* State 62 */ new Array(  ),
	/* State 63 */ new Array( 62/* ATTRIBUTES */,94 ),
	/* State 64 */ new Array( 62/* ATTRIBUTES */,95 ),
	/* State 65 */ new Array(  ),
	/* State 66 */ new Array(  ),
	/* State 67 */ new Array(  ),
	/* State 68 */ new Array(  ),
	/* State 69 */ new Array( 30/* LETLIST */,98 ),
	/* State 70 */ new Array(  ),
	/* State 71 */ new Array(  ),
	/* State 72 */ new Array(  ),
	/* State 73 */ new Array(  ),
	/* State 74 */ new Array(  ),
	/* State 75 */ new Array(  ),
	/* State 76 */ new Array( 51/* CLOSEFOREACH */,105 ),
	/* State 77 */ new Array(  ),
	/* State 78 */ new Array( 53/* CLOSEON */,108 ),
	/* State 79 */ new Array(  ),
	/* State 80 */ new Array(  ),
	/* State 81 */ new Array( 43/* EXPR */,41 , 49/* STRINGKEEPQUOTES */,27 ),
	/* State 82 */ new Array(  ),
	/* State 83 */ new Array(  ),
	/* State 84 */ new Array(  ),
	/* State 85 */ new Array(  ),
	/* State 86 */ new Array( 55/* CLOSECALL */,114 ),
	/* State 87 */ new Array(  ),
	/* State 88 */ new Array(  ),
	/* State 89 */ new Array( 63/* TAGNAME */,116 ),
	/* State 90 */ new Array( 61/* TEXT */,90 ),
	/* State 91 */ new Array(  ),
	/* State 92 */ new Array(  ),
	/* State 93 */ new Array(  ),
	/* State 94 */ new Array(  ),
	/* State 95 */ new Array(  ),
	/* State 96 */ new Array(  ),
	/* State 97 */ new Array(  ),
	/* State 98 */ new Array( 36/* LET */,5 , 33/* STMT */,124 , 45/* JSFUN */,15 , 29/* TEMPLATE */,16 , 39/* ACTIONTPL */,17 , 43/* EXPR */,18 , 46/* STATE */,19 , 47/* LETLISTBLOCK */,20 , 48/* XML */,21 , 34/* VARIABLE */,6 , 49/* STRINGKEEPQUOTES */,27 , 50/* OPENFOREACH */,30 , 52/* OPENON */,31 , 54/* OPENCALL */,32 , 56/* OPENTAG */,33 , 59/* SINGLETAG */,34 ),
	/* State 99 */ new Array(  ),
	/* State 100 */ new Array(  ),
	/* State 101 */ new Array(  ),
	/* State 102 */ new Array(  ),
	/* State 103 */ new Array(  ),
	/* State 104 */ new Array(  ),
	/* State 105 */ new Array(  ),
	/* State 106 */ new Array(  ),
	/* State 107 */ new Array(  ),
	/* State 108 */ new Array(  ),
	/* State 109 */ new Array(  ),
	/* State 110 */ new Array( 38/* ACTION */,131 , 41/* CREATE */,79 , 42/* UPDATE */,80 , 43/* EXPR */,81 , 49/* STRINGKEEPQUOTES */,27 ),
	/* State 111 */ new Array( 35/* TYPE */,132 ),
	/* State 112 */ new Array( 43/* EXPR */,133 , 49/* STRINGKEEPQUOTES */,27 ),
	/* State 113 */ new Array( 43/* EXPR */,134 , 49/* STRINGKEEPQUOTES */,27 ),
	/* State 114 */ new Array(  ),
	/* State 115 */ new Array(  ),
	/* State 116 */ new Array(  ),
	/* State 117 */ new Array(  ),
	/* State 118 */ new Array(  ),
	/* State 119 */ new Array(  ),
	/* State 120 */ new Array(  ),
	/* State 121 */ new Array(  ),
	/* State 122 */ new Array(  ),
	/* State 123 */ new Array(  ),
	/* State 124 */ new Array(  ),
	/* State 125 */ new Array( 44/* JS */,141 , 49/* STRINGKEEPQUOTES */,143 ),
	/* State 126 */ new Array(  ),
	/* State 127 */ new Array( 37/* ACTLIST */,155 ),
	/* State 128 */ new Array( 35/* TYPE */,66 ),
	/* State 129 */ new Array(  ),
	/* State 130 */ new Array(  ),
	/* State 131 */ new Array(  ),
	/* State 132 */ new Array(  ),
	/* State 133 */ new Array( 43/* EXPR */,41 , 49/* STRINGKEEPQUOTES */,27 ),
	/* State 134 */ new Array( 43/* EXPR */,41 , 49/* STRINGKEEPQUOTES */,27 ),
	/* State 135 */ new Array(  ),
	/* State 136 */ new Array(  ),
	/* State 137 */ new Array( 65/* ATTRIBUTE */,163 , 66/* STRING */,164 ),
	/* State 138 */ new Array(  ),
	/* State 139 */ new Array(  ),
	/* State 140 */ new Array(  ),
	/* State 141 */ new Array( 44/* JS */,167 , 49/* STRINGKEEPQUOTES */,143 ),
	/* State 142 */ new Array(  ),
	/* State 143 */ new Array(  ),
	/* State 144 */ new Array( 44/* JS */,169 , 49/* STRINGKEEPQUOTES */,143 ),
	/* State 145 */ new Array( 44/* JS */,170 , 49/* STRINGKEEPQUOTES */,143 ),
	/* State 146 */ new Array(  ),
	/* State 147 */ new Array(  ),
	/* State 148 */ new Array(  ),
	/* State 149 */ new Array(  ),
	/* State 150 */ new Array(  ),
	/* State 151 */ new Array(  ),
	/* State 152 */ new Array(  ),
	/* State 153 */ new Array(  ),
	/* State 154 */ new Array( 35/* TYPE */,171 ),
	/* State 155 */ new Array( 40/* ACTSTMT */,77 , 38/* ACTION */,172 , 41/* CREATE */,79 , 42/* UPDATE */,80 , 43/* EXPR */,81 , 34/* VARIABLE */,82 , 49/* STRINGKEEPQUOTES */,27 ),
	/* State 156 */ new Array(  ),
	/* State 157 */ new Array(  ),
	/* State 158 */ new Array(  ),
	/* State 159 */ new Array( 44/* JS */,173 , 49/* STRINGKEEPQUOTES */,143 ),
	/* State 160 */ new Array( 43/* EXPR */,174 , 49/* STRINGKEEPQUOTES */,27 ),
	/* State 161 */ new Array( 43/* EXPR */,175 , 49/* STRINGKEEPQUOTES */,27 ),
	/* State 162 */ new Array(  ),
	/* State 163 */ new Array(  ),
	/* State 164 */ new Array(  ),
	/* State 165 */ new Array( 61/* TEXT */,176 , 60/* INSERT */,177 ),
	/* State 166 */ new Array( 64/* STYLE */,179 , 67/* STYLEATTRIBUTE */,180 ),
	/* State 167 */ new Array( 44/* JS */,167 , 49/* STRINGKEEPQUOTES */,143 ),
	/* State 168 */ new Array(  ),
	/* State 169 */ new Array( 44/* JS */,167 , 49/* STRINGKEEPQUOTES */,143 ),
	/* State 170 */ new Array( 44/* JS */,167 , 49/* STRINGKEEPQUOTES */,143 ),
	/* State 171 */ new Array(  ),
	/* State 172 */ new Array(  ),
	/* State 173 */ new Array( 44/* JS */,167 , 49/* STRINGKEEPQUOTES */,143 ),
	/* State 174 */ new Array( 43/* EXPR */,41 , 49/* STRINGKEEPQUOTES */,27 ),
	/* State 175 */ new Array( 43/* EXPR */,41 , 49/* STRINGKEEPQUOTES */,27 ),
	/* State 176 */ new Array( 61/* TEXT */,90 ),
	/* State 177 */ new Array(  ),
	/* State 178 */ new Array( 43/* EXPR */,192 , 49/* STRINGKEEPQUOTES */,27 ),
	/* State 179 */ new Array(  ),
	/* State 180 */ new Array(  ),
	/* State 181 */ new Array(  ),
	/* State 182 */ new Array(  ),
	/* State 183 */ new Array(  ),
	/* State 184 */ new Array( 44/* JS */,196 , 49/* STRINGKEEPQUOTES */,143 ),
	/* State 185 */ new Array(  ),
	/* State 186 */ new Array(  ),
	/* State 187 */ new Array( 43/* EXPR */,197 , 49/* STRINGKEEPQUOTES */,27 ),
	/* State 188 */ new Array(  ),
	/* State 189 */ new Array(  ),
	/* State 190 */ new Array(  ),
	/* State 191 */ new Array(  ),
	/* State 192 */ new Array( 43/* EXPR */,41 , 49/* STRINGKEEPQUOTES */,27 ),
	/* State 193 */ new Array( 67/* STYLEATTRIBUTE */,199 ),
	/* State 194 */ new Array(  ),
	/* State 195 */ new Array( 61/* TEXT */,200 ),
	/* State 196 */ new Array( 44/* JS */,167 , 49/* STRINGKEEPQUOTES */,143 ),
	/* State 197 */ new Array( 43/* EXPR */,41 , 49/* STRINGKEEPQUOTES */,27 ),
	/* State 198 */ new Array(  ),
	/* State 199 */ new Array(  ),
	/* State 200 */ new Array( 61/* TEXT */,90 ),
	/* State 201 */ new Array(  ),
	/* State 202 */ new Array(  )
);



/* Symbol labels */
var labels = new Array(
	"TOP'" /* Non-terminal symbol */,
	"WHITESPACE" /* Terminal symbol */,
	"TEXTNODE" /* Terminal symbol */,
	"template" /* Terminal symbol */,
	"function" /* Terminal symbol */,
	"action" /* Terminal symbol */,
	"state" /* Terminal symbol */,
	"create" /* Terminal symbol */,
	"add" /* Terminal symbol */,
	"remove" /* Terminal symbol */,
	"f:each" /* Terminal symbol */,
	"f:call" /* Terminal symbol */,
	"f:on" /* Terminal symbol */,
	"style" /* Terminal symbol */,
	"{" /* Terminal symbol */,
	"}" /* Terminal symbol */,
	"(" /* Terminal symbol */,
	")" /* Terminal symbol */,
	"," /* Terminal symbol */,
	";" /* Terminal symbol */,
	":" /* Terminal symbol */,
	"=" /* Terminal symbol */,
	"</" /* Terminal symbol */,
	"/" /* Terminal symbol */,
	"<" /* Terminal symbol */,
	">" /* Terminal symbol */,
	"QUOTE" /* Terminal symbol */,
	"JSSEP" /* Terminal symbol */,
	"IDENTIFIER" /* Terminal symbol */,
	"TEMPLATE" /* Non-terminal symbol */,
	"LETLIST" /* Non-terminal symbol */,
	"TOP" /* Non-terminal symbol */,
	"ARGLIST" /* Non-terminal symbol */,
	"STMT" /* Non-terminal symbol */,
	"VARIABLE" /* Non-terminal symbol */,
	"TYPE" /* Non-terminal symbol */,
	"LET" /* Non-terminal symbol */,
	"ACTLIST" /* Non-terminal symbol */,
	"ACTION" /* Non-terminal symbol */,
	"ACTIONTPL" /* Non-terminal symbol */,
	"ACTSTMT" /* Non-terminal symbol */,
	"CREATE" /* Non-terminal symbol */,
	"UPDATE" /* Non-terminal symbol */,
	"EXPR" /* Non-terminal symbol */,
	"JS" /* Non-terminal symbol */,
	"JSFUN" /* Non-terminal symbol */,
	"STATE" /* Non-terminal symbol */,
	"LETLISTBLOCK" /* Non-terminal symbol */,
	"XML" /* Non-terminal symbol */,
	"STRINGKEEPQUOTES" /* Non-terminal symbol */,
	"OPENFOREACH" /* Non-terminal symbol */,
	"CLOSEFOREACH" /* Non-terminal symbol */,
	"OPENON" /* Non-terminal symbol */,
	"CLOSEON" /* Non-terminal symbol */,
	"OPENCALL" /* Non-terminal symbol */,
	"CLOSECALL" /* Non-terminal symbol */,
	"OPENTAG" /* Non-terminal symbol */,
	"XMLLIST" /* Non-terminal symbol */,
	"CLOSETAG" /* Non-terminal symbol */,
	"SINGLETAG" /* Non-terminal symbol */,
	"INSERT" /* Non-terminal symbol */,
	"TEXT" /* Non-terminal symbol */,
	"ATTRIBUTES" /* Non-terminal symbol */,
	"TAGNAME" /* Non-terminal symbol */,
	"STYLE" /* Non-terminal symbol */,
	"ATTRIBUTE" /* Non-terminal symbol */,
	"STRING" /* Non-terminal symbol */,
	"STYLEATTRIBUTE" /* Non-terminal symbol */,
	"$" /* Terminal symbol */
);


	
	info.offset = 0;
	info.src = src;
	info.att = new String();
	
	if( !err_off )
		err_off	= new Array();
	if( !err_la )
	err_la = new Array();
	
	sstack.push( 0 );
	vstack.push( 0 );
	
	la = __lex( info );
			
	while( true )
	{
		act = 204;
		for( var i = 0; i < act_tab[sstack[sstack.length-1]].length; i+=2 )
		{
			if( act_tab[sstack[sstack.length-1]][i] == la )
			{
				act = act_tab[sstack[sstack.length-1]][i+1];
				break;
			}
		}

		/*
		_print( "state " + sstack[sstack.length-1] + " la = " + la + " info.att = >" +
				info.att + "< act = " + act + " src = >" + info.src.substr( info.offset, 30 ) + "..." + "<" +
					" sstack = " + sstack.join() );
		*/
		
		if( _dbg_withtrace && sstack.length > 0 )
		{
			__dbg_print( "\nState " + sstack[sstack.length-1] + "\n" +
							"\tLookahead: " + labels[la] + " (\"" + info.att + "\")\n" +
							"\tAction: " + act + "\n" + 
							"\tSource: \"" + info.src.substr( info.offset, 30 ) + ( ( info.offset + 30 < info.src.length ) ?
									"..." : "" ) + "\"\n" +
							"\tStack: " + sstack.join() + "\n" +
							"\tValue stack: " + vstack.join() + "\n" );
			
			if( _dbg_withstepbystep )
				__dbg_wait();
		}
		
			
		//Panic-mode: Try recovery when parse-error occurs!
		if( act == 204 )
		{
			if( _dbg_withtrace )
				__dbg_print( "Error detected: There is no reduce or shift on the symbol " + labels[la] );
			
			err_cnt++;
			err_off.push( info.offset - info.att.length );			
			err_la.push( new Array() );
			for( var i = 0; i < act_tab[sstack[sstack.length-1]].length; i+=2 )
				err_la[err_la.length-1].push( labels[act_tab[sstack[sstack.length-1]][i]] );
			
			//Remember the original stack!
			var rsstack = new Array();
			var rvstack = new Array();
			for( var i = 0; i < sstack.length; i++ )
			{
				rsstack[i] = sstack[i];
				rvstack[i] = vstack[i];
			}
			
			while( act == 204 && la != 68 )
			{
				if( _dbg_withtrace )
					__dbg_print( "\tError recovery\n" +
									"Current lookahead: " + labels[la] + " (" + info.att + ")\n" +
									"Action: " + act + "\n\n" );
				if( la == -1 )
					info.offset++;
					
				while( act == 204 && sstack.length > 0 )
				{
					sstack.pop();
					vstack.pop();
					
					if( sstack.length == 0 )
						break;
						
					act = 204;
					for( var i = 0; i < act_tab[sstack[sstack.length-1]].length; i+=2 )
					{
						if( act_tab[sstack[sstack.length-1]][i] == la )
						{
							act = act_tab[sstack[sstack.length-1]][i+1];
							break;
						}
					}
				}
				
				if( act != 204 )
					break;
				
				for( var i = 0; i < rsstack.length; i++ )
				{
					sstack.push( rsstack[i] );
					vstack.push( rvstack[i] );
				}
				
				la = __lex( info );
			}
			
			if( act == 204 )
			{
				if( _dbg_withtrace )
					__dbg_print( "\tError recovery failed, terminating parse process..." );
				break;
			}


			if( _dbg_withtrace )
				__dbg_print( "\tError recovery succeeded, continuing" );
		}
		
		/*
		if( act == 204 )
			break;
		*/
		
		
		//Shift
		if( act > 0 )
		{
			//Parse tree generation
			if( _dbg_withparsetree )
			{
				var node = new treenode();
				node.sym = labels[ la ];
				node.att = info.att;
				node.child = new Array();
				tree.push( treenodes.length );
				treenodes.push( node );
			}
			
			if( _dbg_withtrace )
				__dbg_print( "Shifting symbol: " + labels[la] + " (" + info.att + ")" );
		
			sstack.push( act );
			vstack.push( info.att );
			
			la = __lex( info );
			
			if( _dbg_withtrace )
				__dbg_print( "\tNew lookahead symbol: " + labels[la] + " (" + info.att + ")" );
		}
		//Reduce
		else
		{		
			act *= -1;
			
			if( _dbg_withtrace )
				__dbg_print( "Reducing by producution: " + act );
			
			rval = void(0);
			
			if( _dbg_withtrace )
				__dbg_print( "\tPerforming semantic action..." );
			
switch( act )
{
	case 0:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 1:
	{
		 rval = makeTemplate( vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 2:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 3:
	{
		 rval = makeTemplateCode( vstack[ vstack.length - 6 ], vstack[ vstack.length - 3 ], vstack[ vstack.length - 2 ]); 
	}
	break;
	case 4:
	{
		 rval = push(vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ]); 
	}
	break;
	case 5:
	{
		 rval = [vstack[ vstack.length - 1 ]] ; 
	}
	break;
	case 6:
	{
		 rval = [] ; 
	}
	break;
	case 7:
	{
		 rval = vstack[ vstack.length - 2 ] + " " + vstack[ vstack.length - 1 ]; 
	}
	break;
	case 8:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 9:
	{
		 rval = addLet(vstack[ vstack.length - 3 ], vstack[ vstack.length - 2 ]); 
	}
	break;
	case 10:
	{
		 rval = {}; 
	}
	break;
	case 11:
	{
		 rval = makeLet(vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ]); 
	}
	break;
	case 12:
	{
		 rval = makeAction(vstack[ vstack.length - 6 ], vstack[ vstack.length - 3 ], makeLet({}, vstack[ vstack.length - 2 ])); 
	}
	break;
	case 13:
	{
		 rval = push(vstack[ vstack.length - 3 ], vstack[ vstack.length - 2 ]); 
	}
	break;
	case 14:
	{
		 rval = []; 
	}
	break;
	case 15:
	{
		 rval = makeLet(vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ]); 
	}
	break;
	case 16:
	{
		 rval = makeLet({}, vstack[ vstack.length - 1 ]); 
	}
	break;
	case 17:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 18:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 19:
	{
		 rval = makeExpr(vstack[ vstack.length - 1 ]); 
	}
	break;
	case 20:
	{
		 rval = makeCreate(vstack[ vstack.length - 4 ], vstack[ vstack.length - 2 ]); 
	}
	break;
	case 21:
	{
		 rval = makeUpdate(vstack[ vstack.length - 6 ], vstack[ vstack.length - 4 ], vstack[ vstack.length - 2 ]); 
	}
	break;
	case 22:
	{
		 rval = makeUpdate(vstack[ vstack.length - 8 ], vstack[ vstack.length - 6 ], vstack[ vstack.length - 4 ], vstack[ vstack.length - 2 ]); 
	}
	break;
	case 23:
	{
		 rval = makeUpdate(vstack[ vstack.length - 6 ], vstack[ vstack.length - 4 ], vstack[ vstack.length - 2 ]); 
	}
	break;
	case 24:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 25:
	{
		 rval = {kind: "lineTemplate", template: vstack[ vstack.length - 1 ]} ; 
	}
	break;
	case 26:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 27:
	{
		 rval = makeExpr(vstack[ vstack.length - 1 ]); 
	}
	break;
	case 28:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 29:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 30:
	{
		 rval = makeXMLLine(vstack[ vstack.length - 1 ]); 
	}
	break;
	case 31:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 32:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 33:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 34:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 35:
	{
		 rval = vstack[ vstack.length - 4 ] + "::" + vstack[ vstack.length - 1 ]; 
	}
	break;
	case 36:
	{
		 rval = vstack[ vstack.length - 2 ] + " " + vstack[ vstack.length - 1 ]; 
	}
	break;
	case 37:
	{
		 rval = makeExpr(vstack[ vstack.length - 2 ], vstack[ vstack.length - 3 ]); 
	}
	break;
	case 38:
	{
		 rval = makeJSFun(vstack[ vstack.length - 5 ], vstack[ vstack.length - 2 ]); 
	}
	break;
	case 39:
	{
		 rval = makeJSFun(vstack[ vstack.length - 8 ], vstack[ vstack.length - 2 ], vstack[ vstack.length - 4 ]); 
	}
	break;
	case 40:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 41:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 42:
	{
		 rval = "(" + vstack[ vstack.length - 2 ] + ")" 
	}
	break;
	case 43:
	{
		 rval = "{" + vstack[ vstack.length - 2 ] + "}"; 
	}
	break;
	case 44:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 45:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 46:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 47:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 48:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 49:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 50:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 51:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 52:
	{
		 rval = vstack[ vstack.length - 2 ] + " " + vstack[ vstack.length - 1 ]; 
	}
	break;
	case 53:
	{
		rval = vstack[ vstack.length - 0 ];
	}
	break;
	case 54:
	{
		 rval = makeState(vstack[ vstack.length - 2 ]); 
	}
	break;
	case 55:
	{
		 rval = makeVariable( vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 56:
	{
		 rval = makeVariable( vstack[ vstack.length - 4 ], vstack[ vstack.length - 1 ]); 
	}
	break;
	case 57:
	{
		 rval = makeForEach(vstack[ vstack.length - 4 ], vstack[ vstack.length - 3 ], vstack[ vstack.length - 2 ]); 
	}
	break;
	case 58:
	{
		 rval = makeOn(vstack[ vstack.length - 4 ], vstack[ vstack.length - 3 ], vstack[ vstack.length - 2 ]); 
	}
	break;
	case 59:
	{
		 rval = makeCall(vstack[ vstack.length - 3 ], vstack[ vstack.length - 2 ]); 
	}
	break;
	case 60:
	{
		 rval = makeNode(vstack[ vstack.length - 3 ], vstack[ vstack.length - 2 ]); 
	}
	break;
	case 61:
	{
		 rval = makeNode(vstack[ vstack.length - 1 ], []); 
	}
	break;
	case 62:
	{
		 rval = makeTextElement(vstack[ vstack.length - 1 ]); 
	}
	break;
	case 63:
	{
		 rval = push(vstack[ vstack.length - 2 ], vstack[ vstack.length - 1 ]); 
	}
	break;
	case 64:
	{
		 rval = []; 
	}
	break;
	case 65:
	{
		 rval = makeInsert(vstack[ vstack.length - 2 ]); 
	}
	break;
	case 66:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 67:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 68:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 69:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 70:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 71:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 72:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 73:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 74:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 75:
	{
		 rval = "" + vstack[ vstack.length - 2 ] + " " + vstack[ vstack.length - 1 ]; 
	}
	break;
	case 76:
	{
		 rval = vstack[ vstack.length - 2 ]; 
	}
	break;
	case 77:
	{
		 rval = undefined; 
	}
	break;
	case 78:
	{
		rval = vstack[ vstack.length - 3 ];
	}
	break;
	case 79:
	{
		 rval = undefined; 
	}
	break;
	case 80:
	{
		 rval = vstack[ vstack.length - 2 ]; 
	}
	break;
	case 81:
	{
		 rval = undefined; 
	}
	break;
	case 82:
	{
		 rval = makeOpenTag(vstack[ vstack.length - 3 ], vstack[ vstack.length - 2 ]); 
	}
	break;
	case 83:
	{
		 rval = undefined; 
	}
	break;
	case 84:
	{
		 rval = {openTag: makeOpenTag(vstack[ vstack.length - 4 ], vstack[ vstack.length - 3 ])}; 
	}
	break;
	case 85:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 86:
	{
		 rval = vstack[ vstack.length - 3 ] + vstack[ vstack.length - 2 ] + vstack[ vstack.length - 1 ]; 
	}
	break;
	case 87:
	{
		 vstack[ vstack.length - 6 ][vstack[ vstack.length - 5 ]] = vstack[ vstack.length - 2 ]; rval = vstack[ vstack.length - 6 ];
	}
	break;
	case 88:
	{
		 vstack[ vstack.length - 4 ][vstack[ vstack.length - 3 ]] = vstack[ vstack.length - 1 ]; rval = vstack[ vstack.length - 4 ];
	}
	break;
	case 89:
	{
		 rval = {}; 
	}
	break;
	case 90:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 91:
	{
		 rval = vstack[ vstack.length - 2 ]; 
	}
	break;
	case 92:
	{
		 rval = vstack[ vstack.length - 3 ] + vstack[ vstack.length - 2 ] + vstack[ vstack.length - 1 ]; 
	}
	break;
	case 93:
	{
		 rval = vstack[ vstack.length - 2 ]; 
	}
	break;
	case 94:
	{
		 rval = push(vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ]); 
	}
	break;
	case 95:
	{
		 rval = [vstack[ vstack.length - 1 ]]; 
	}
	break;
	case 96:
	{
		 rval = []; 
	}
	break;
	case 97:
	{
		 rval = makeAttribute(vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ]); 
	}
	break;
}


			
			if( _dbg_withparsetree )
				tmptree = new Array();

			if( _dbg_withtrace )
				__dbg_print( "\tPopping " + pop_tab[act][1] + " off the stack..." );
				
			for( var i = 0; i < pop_tab[act][1]; i++ )
			{
				if( _dbg_withparsetree )
					tmptree.push( tree.pop() );
					
				sstack.pop();
				vstack.pop();
			}
									
			go = -1;
			for( var i = 0; i < goto_tab[sstack[sstack.length-1]].length; i+=2 )
			{
				if( goto_tab[sstack[sstack.length-1]][i] == pop_tab[act][0] )
				{
					go = goto_tab[sstack[sstack.length-1]][i+1];
					break;
				}
			}
			
			if( _dbg_withparsetree )
			{
				var node = new treenode();
				node.sym = labels[ pop_tab[act][0] ];
				node.att = new String();
				node.child = tmptree.reverse();
				tree.push( treenodes.length );
				treenodes.push( node );
			}
			
			if( act == 0 )
				break;
				
			if( _dbg_withtrace )
				__dbg_print( "\tPushing non-terminal " + labels[ pop_tab[act][0] ] );
				
			sstack.push( go );
			vstack.push( rval );			
		}
	}

	if( _dbg_withtrace )
		__dbg_print( "\nParse complete." );

	if( _dbg_withparsetree )
	{
		if( err_cnt == 0 )
		{
			__dbg_print( "\n\n--- Parse tree ---" );
			__dbg_parsetree( 0, treenodes, tree );
		}
		else
		{
			__dbg_print( "\n\nParse tree cannot be viewed. There where parse errors." );
		}
	}
	
	return err_cnt;
}


function __dbg_parsetree( indent, nodes, tree )
{
	var str = new String();
	for( var i = 0; i < tree.length; i++ )
	{
		str = "";
		for( var j = indent; j > 0; j-- )
			str += "\t";
		
		str += nodes[ tree[i] ].sym;
		if( nodes[ tree[i] ].att != "" )
			str += " >" + nodes[ tree[i] ].att + "<" ;
			
		__dbg_print( str );
		if( nodes[ tree[i] ].child.length > 0 )
			__dbg_parsetree( indent + 1, nodes, nodes[ tree[i] ].child );
	}
}


