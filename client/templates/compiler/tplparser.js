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

	function makeState(typeString, initExpr) {
		return {
			kind: "lineState",
			type: typeString,
			init: initExpr
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
			return 55;

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
		else if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 101 ) || ( info.src.charCodeAt( pos ) >= 103 && info.src.charCodeAt( pos ) <= 114 ) || ( info.src.charCodeAt( pos ) >= 117 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 58 ) state = 9;
		else if( info.src.charCodeAt( pos ) == 59 ) state = 10;
		else if( info.src.charCodeAt( pos ) == 60 ) state = 11;
		else if( info.src.charCodeAt( pos ) == 61 ) state = 12;
		else if( info.src.charCodeAt( pos ) == 62 ) state = 13;
		else if( info.src.charCodeAt( pos ) == 123 ) state = 14;
		else if( info.src.charCodeAt( pos ) == 125 ) state = 15;
		else if( info.src.charCodeAt( pos ) == 46 ) state = 25;
		else if( info.src.charCodeAt( pos ) == 102 ) state = 26;
		else if( info.src.charCodeAt( pos ) == 115 ) state = 68;
		else if( info.src.charCodeAt( pos ) == 116 ) state = 75;
		else state = -1;
		break;

	case 1:
		state = -1;
		match = 1;
		match_pos = pos;
		break;

	case 2:
		state = -1;
		match = 22;
		match_pos = pos;
		break;

	case 3:
		state = -1;
		match = 21;
		match_pos = pos;
		break;

	case 4:
		state = -1;
		match = 11;
		match_pos = pos;
		break;

	case 5:
		state = -1;
		match = 12;
		match_pos = pos;
		break;

	case 6:
		state = -1;
		match = 13;
		match_pos = pos;
		break;

	case 7:
		if( info.src.charCodeAt( pos ) == 47 ) state = 24;
		else state = -1;
		match = 18;
		match_pos = pos;
		break;

	case 8:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else state = -1;
		match = 23;
		match_pos = pos;
		break;

	case 9:
		state = -1;
		match = 15;
		match_pos = pos;
		break;

	case 10:
		state = -1;
		match = 14;
		match_pos = pos;
		break;

	case 11:
		if( info.src.charCodeAt( pos ) == 47 ) state = 16;
		else if( info.src.charCodeAt( pos ) == 112 ) state = 27;
		else state = -1;
		match = 19;
		match_pos = pos;
		break;

	case 12:
		state = -1;
		match = 16;
		match_pos = pos;
		break;

	case 13:
		state = -1;
		match = 20;
		match_pos = pos;
		break;

	case 14:
		state = -1;
		match = 9;
		match_pos = pos;
		break;

	case 15:
		state = -1;
		match = 10;
		match_pos = pos;
		break;

	case 16:
		state = -1;
		match = 17;
		match_pos = pos;
		break;

	case 17:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else state = -1;
		match = 5;
		match_pos = pos;
		break;

	case 18:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else state = -1;
		match = 8;
		match_pos = pos;
		break;

	case 19:
		state = -1;
		match = 7;
		match_pos = pos;
		break;

	case 20:
		state = -1;
		match = 6;
		match_pos = pos;
		break;

	case 21:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else state = -1;
		match = 4;
		match_pos = pos;
		break;

	case 22:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else state = -1;
		match = 3;
		match_pos = pos;
		break;

	case 23:
		state = -1;
		match = 2;
		match_pos = pos;
		break;

	case 24:
		if( info.src.charCodeAt( pos ) == 10 ) state = 1;
		else if( ( info.src.charCodeAt( pos ) >= 0 && info.src.charCodeAt( pos ) <= 9 ) || ( info.src.charCodeAt( pos ) >= 11 && info.src.charCodeAt( pos ) <= 254 ) ) state = 24;
		else state = -1;
		break;

	case 25:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else state = -1;
		match = 22;
		match_pos = pos;
		break;

	case 26:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 116 ) || ( info.src.charCodeAt( pos ) >= 118 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 58 ) state = 29;
		else if( info.src.charCodeAt( pos ) == 117 ) state = 73;
		else state = -1;
		match = 23;
		match_pos = pos;
		break;

	case 27:
		if( info.src.charCodeAt( pos ) == 58 ) state = 31;
		else state = -1;
		break;

	case 28:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 100 ) || ( info.src.charCodeAt( pos ) >= 102 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 101 ) state = 17;
		else state = -1;
		match = 23;
		match_pos = pos;
		break;

	case 29:
		if( info.src.charCodeAt( pos ) == 99 ) state = 33;
		else if( info.src.charCodeAt( pos ) == 101 ) state = 61;
		else state = -1;
		break;

	case 30:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 100 ) || ( info.src.charCodeAt( pos ) >= 102 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 101 ) state = 18;
		else state = -1;
		match = 23;
		match_pos = pos;
		break;

	case 31:
		if( info.src.charCodeAt( pos ) == 116 ) state = 35;
		else state = -1;
		break;

	case 32:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 109 ) || ( info.src.charCodeAt( pos ) >= 111 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 110 ) state = 21;
		else state = -1;
		match = 23;
		match_pos = pos;
		break;

	case 33:
		if( info.src.charCodeAt( pos ) == 97 ) state = 36;
		else state = -1;
		break;

	case 34:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 100 ) || ( info.src.charCodeAt( pos ) >= 102 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 101 ) state = 22;
		else state = -1;
		match = 23;
		match_pos = pos;
		break;

	case 35:
		if( info.src.charCodeAt( pos ) == 101 ) state = 38;
		else state = -1;
		break;

	case 36:
		if( info.src.charCodeAt( pos ) == 108 ) state = 39;
		else state = -1;
		break;

	case 37:
		if( info.src.charCodeAt( pos ) == 99 ) state = 40;
		else state = -1;
		break;

	case 38:
		if( info.src.charCodeAt( pos ) == 120 ) state = 41;
		else state = -1;
		break;

	case 39:
		if( info.src.charCodeAt( pos ) == 108 ) state = 19;
		else state = -1;
		break;

	case 40:
		if( info.src.charCodeAt( pos ) == 104 ) state = 20;
		else state = -1;
		break;

	case 41:
		if( info.src.charCodeAt( pos ) == 116 ) state = 42;
		else state = -1;
		break;

	case 42:
		if( info.src.charCodeAt( pos ) == 110 ) state = 43;
		else state = -1;
		break;

	case 43:
		if( info.src.charCodeAt( pos ) == 111 ) state = 44;
		else state = -1;
		break;

	case 44:
		if( info.src.charCodeAt( pos ) == 100 ) state = 45;
		else state = -1;
		break;

	case 45:
		if( info.src.charCodeAt( pos ) == 101 ) state = 46;
		else state = -1;
		break;

	case 46:
		if( info.src.charCodeAt( pos ) == 62 ) state = 47;
		else state = -1;
		break;

	case 47:
		if( ( info.src.charCodeAt( pos ) >= 0 && info.src.charCodeAt( pos ) <= 59 ) || info.src.charCodeAt( pos ) == 61 || ( info.src.charCodeAt( pos ) >= 63 && info.src.charCodeAt( pos ) <= 93 ) || ( info.src.charCodeAt( pos ) >= 95 && info.src.charCodeAt( pos ) <= 254 ) ) state = 47;
		else if( info.src.charCodeAt( pos ) == 60 ) state = 48;
		else state = -1;
		break;

	case 48:
		if( info.src.charCodeAt( pos ) == 47 ) state = 49;
		else state = -1;
		break;

	case 49:
		if( info.src.charCodeAt( pos ) == 112 ) state = 50;
		else state = -1;
		break;

	case 50:
		if( info.src.charCodeAt( pos ) == 58 ) state = 51;
		else state = -1;
		break;

	case 51:
		if( info.src.charCodeAt( pos ) == 116 ) state = 52;
		else state = -1;
		break;

	case 52:
		if( info.src.charCodeAt( pos ) == 101 ) state = 53;
		else state = -1;
		break;

	case 53:
		if( info.src.charCodeAt( pos ) == 120 ) state = 54;
		else state = -1;
		break;

	case 54:
		if( info.src.charCodeAt( pos ) == 116 ) state = 55;
		else state = -1;
		break;

	case 55:
		if( info.src.charCodeAt( pos ) == 110 ) state = 56;
		else state = -1;
		break;

	case 56:
		if( info.src.charCodeAt( pos ) == 111 ) state = 57;
		else state = -1;
		break;

	case 57:
		if( info.src.charCodeAt( pos ) == 100 ) state = 58;
		else state = -1;
		break;

	case 58:
		if( info.src.charCodeAt( pos ) == 101 ) state = 59;
		else state = -1;
		break;

	case 59:
		if( info.src.charCodeAt( pos ) == 62 ) state = 23;
		else state = -1;
		break;

	case 60:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 115 ) || ( info.src.charCodeAt( pos ) >= 117 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 116 ) state = 28;
		else state = -1;
		match = 23;
		match_pos = pos;
		break;

	case 61:
		if( info.src.charCodeAt( pos ) == 97 ) state = 37;
		else state = -1;
		break;

	case 62:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 107 ) || ( info.src.charCodeAt( pos ) >= 109 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 108 ) state = 30;
		else state = -1;
		match = 23;
		match_pos = pos;
		break;

	case 63:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 110 ) || ( info.src.charCodeAt( pos ) >= 112 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 111 ) state = 32;
		else state = -1;
		match = 23;
		match_pos = pos;
		break;

	case 64:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 115 ) || ( info.src.charCodeAt( pos ) >= 117 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 116 ) state = 34;
		else state = -1;
		match = 23;
		match_pos = pos;
		break;

	case 65:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 98 && info.src.charCodeAt( pos ) <= 120 ) || info.src.charCodeAt( pos ) == 122 ) state = 8;
		else if( info.src.charCodeAt( pos ) == 97 ) state = 60;
		else if( info.src.charCodeAt( pos ) == 121 ) state = 62;
		else state = -1;
		match = 23;
		match_pos = pos;
		break;

	case 66:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 104 ) || ( info.src.charCodeAt( pos ) >= 106 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 105 ) state = 63;
		else state = -1;
		match = 23;
		match_pos = pos;
		break;

	case 67:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 98 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 97 ) state = 64;
		else state = -1;
		match = 23;
		match_pos = pos;
		break;

	case 68:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 115 ) || ( info.src.charCodeAt( pos ) >= 117 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 116 ) state = 65;
		else state = -1;
		match = 23;
		match_pos = pos;
		break;

	case 69:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 115 ) || ( info.src.charCodeAt( pos ) >= 117 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 116 ) state = 66;
		else state = -1;
		match = 23;
		match_pos = pos;
		break;

	case 70:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 107 ) || ( info.src.charCodeAt( pos ) >= 109 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 108 ) state = 67;
		else state = -1;
		match = 23;
		match_pos = pos;
		break;

	case 71:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 98 ) || ( info.src.charCodeAt( pos ) >= 100 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 99 ) state = 69;
		else state = -1;
		match = 23;
		match_pos = pos;
		break;

	case 72:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 111 ) || ( info.src.charCodeAt( pos ) >= 113 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 112 ) state = 70;
		else state = -1;
		match = 23;
		match_pos = pos;
		break;

	case 73:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 109 ) || ( info.src.charCodeAt( pos ) >= 111 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 110 ) state = 71;
		else state = -1;
		match = 23;
		match_pos = pos;
		break;

	case 74:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 108 ) || ( info.src.charCodeAt( pos ) >= 110 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 109 ) state = 72;
		else state = -1;
		match = 23;
		match_pos = pos;
		break;

	case 75:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 100 ) || ( info.src.charCodeAt( pos ) >= 102 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 101 ) state = 74;
		else state = -1;
		match = 23;
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
	new Array( 26/* TOP */, 1 ),
	new Array( 26/* TOP */, 1 ),
	new Array( 24/* TEMPLATE */, 8 ),
	new Array( 27/* ARGLIST */, 3 ),
	new Array( 27/* ARGLIST */, 1 ),
	new Array( 27/* ARGLIST */, 0 ),
	new Array( 30/* TYPE */, 2 ),
	new Array( 30/* TYPE */, 1 ),
	new Array( 25/* LETLIST */, 3 ),
	new Array( 25/* LETLIST */, 0 ),
	new Array( 31/* LET */, 3 ),
	new Array( 28/* STMT */, 1 ),
	new Array( 28/* STMT */, 1 ),
	new Array( 28/* STMT */, 1 ),
	new Array( 28/* STMT */, 1 ),
	new Array( 28/* STMT */, 1 ),
	new Array( 28/* STMT */, 1 ),
	new Array( 33/* EXPR */, 1 ),
	new Array( 33/* EXPR */, 1 ),
	new Array( 33/* EXPR */, 1 ),
	new Array( 33/* EXPR */, 1 ),
	new Array( 33/* EXPR */, 2 ),
	new Array( 35/* LETLISTBLOCK */, 4 ),
	new Array( 32/* JSFUN */, 7 ),
	new Array( 32/* JSFUN */, 10 ),
	new Array( 38/* JS */, 1 ),
	new Array( 38/* JS */, 1 ),
	new Array( 38/* JS */, 3 ),
	new Array( 38/* JS */, 3 ),
	new Array( 38/* JS */, 1 ),
	new Array( 38/* JS */, 1 ),
	new Array( 38/* JS */, 1 ),
	new Array( 38/* JS */, 1 ),
	new Array( 38/* JS */, 1 ),
	new Array( 38/* JS */, 1 ),
	new Array( 38/* JS */, 1 ),
	new Array( 38/* JS */, 1 ),
	new Array( 38/* JS */, 2 ),
	new Array( 38/* JS */, 0 ),
	new Array( 34/* STATE */, 6 ),
	new Array( 29/* VARIABLE */, 1 ),
	new Array( 29/* VARIABLE */, 4 ),
	new Array( 36/* XML */, 4 ),
	new Array( 36/* XML */, 4 ),
	new Array( 36/* XML */, 3 ),
	new Array( 36/* XML */, 1 ),
	new Array( 36/* XML */, 1 ),
	new Array( 45/* XMLLIST */, 2 ),
	new Array( 45/* XMLLIST */, 0 ),
	new Array( 48/* INSERT */, 3 ),
	new Array( 49/* TEXT */, 1 ),
	new Array( 49/* TEXT */, 1 ),
	new Array( 49/* TEXT */, 1 ),
	new Array( 49/* TEXT */, 1 ),
	new Array( 49/* TEXT */, 1 ),
	new Array( 49/* TEXT */, 1 ),
	new Array( 49/* TEXT */, 1 ),
	new Array( 49/* TEXT */, 1 ),
	new Array( 49/* TEXT */, 1 ),
	new Array( 49/* TEXT */, 2 ),
	new Array( 40/* OPENFOREACH */, 4 ),
	new Array( 41/* CLOSEFOREACH */, 3 ),
	new Array( 42/* OPENCALL */, 3 ),
	new Array( 43/* CLOSECALL */, 3 ),
	new Array( 44/* OPENTAG */, 4 ),
	new Array( 46/* CLOSETAG */, 3 ),
	new Array( 47/* SINGLETAG */, 5 ),
	new Array( 51/* TAGNAME */, 1 ),
	new Array( 51/* TAGNAME */, 3 ),
	new Array( 50/* ATTRIBUTES */, 6 ),
	new Array( 50/* ATTRIBUTES */, 4 ),
	new Array( 50/* ATTRIBUTES */, 0 ),
	new Array( 53/* ATTRIBUTE */, 1 ),
	new Array( 53/* ATTRIBUTE */, 3 ),
	new Array( 37/* STRINGKEEPQUOTES */, 3 ),
	new Array( 39/* STRING */, 3 ),
	new Array( 52/* STYLE */, 3 ),
	new Array( 52/* STYLE */, 1 ),
	new Array( 52/* STYLE */, 0 ),
	new Array( 54/* STYLEATTRIBUTE */, 3 )
);

/* Action-Table */
var act_tab = new Array(
	/* State 0 */ new Array( 3/* "template" */,4 , 55/* "$" */,-10 , 23/* "IDENTIFIER" */,-10 ),
	/* State 1 */ new Array( 55/* "$" */,0 ),
	/* State 2 */ new Array( 55/* "$" */,-1 ),
	/* State 3 */ new Array( 23/* "IDENTIFIER" */,7 , 55/* "$" */,-2 ),
	/* State 4 */ new Array( 11/* "(" */,8 ),
	/* State 5 */ new Array( 13/* "," */,9 ),
	/* State 6 */ new Array( 16/* "=" */,10 ),
	/* State 7 */ new Array( 15/* ":" */,11 , 16/* "=" */,-41 , 12/* ")" */,-41 , 13/* "," */,-41 ),
	/* State 8 */ new Array( 23/* "IDENTIFIER" */,7 , 12/* ")" */,-6 , 13/* "," */,-6 ),
	/* State 9 */ new Array( 55/* "$" */,-9 , 23/* "IDENTIFIER" */,-9 , 3/* "template" */,-9 , 4/* "function" */,-9 , 11/* "(" */,-9 , 12/* ")" */,-9 , 5/* "state" */,-9 , 9/* "{" */,-9 , 2/* "TEXTNODE" */,-9 , 21/* "QUOTE" */,-9 , 19/* "<" */,-9 ),
	/* State 10 */ new Array( 4/* "function" */,21 , 3/* "template" */,4 , 11/* "(" */,22 , 12/* ")" */,23 , 23/* "IDENTIFIER" */,24 , 5/* "state" */,26 , 9/* "{" */,27 , 2/* "TEXTNODE" */,32 , 21/* "QUOTE" */,33 , 19/* "<" */,34 ),
	/* State 11 */ new Array( 15/* ":" */,35 ),
	/* State 12 */ new Array( 13/* "," */,36 , 12/* ")" */,37 ),
	/* State 13 */ new Array( 12/* ")" */,-5 , 13/* "," */,-5 ),
	/* State 14 */ new Array( 13/* "," */,-11 ),
	/* State 15 */ new Array( 13/* "," */,-12 , 10/* "}" */,-12 , 17/* "</" */,-12 ),
	/* State 16 */ new Array( 13/* "," */,-13 , 10/* "}" */,-13 , 17/* "</" */,-13 ),
	/* State 17 */ new Array( 11/* "(" */,22 , 12/* ")" */,23 , 23/* "IDENTIFIER" */,24 , 21/* "QUOTE" */,33 , 13/* "," */,-14 , 10/* "}" */,-14 , 17/* "</" */,-14 ),
	/* State 18 */ new Array( 13/* "," */,-15 , 10/* "}" */,-15 , 17/* "</" */,-15 ),
	/* State 19 */ new Array( 13/* "," */,-16 , 10/* "}" */,-16 , 17/* "</" */,-16 ),
	/* State 20 */ new Array( 13/* "," */,-17 , 10/* "}" */,-17 , 17/* "</" */,-17 ),
	/* State 21 */ new Array( 11/* "(" */,39 ),
	/* State 22 */ new Array( 13/* "," */,-18 , 11/* "(" */,-18 , 12/* ")" */,-18 , 23/* "IDENTIFIER" */,-18 , 21/* "QUOTE" */,-18 , 10/* "}" */,-18 , 17/* "</" */,-18 ),
	/* State 23 */ new Array( 13/* "," */,-19 , 11/* "(" */,-19 , 12/* ")" */,-19 , 23/* "IDENTIFIER" */,-19 , 21/* "QUOTE" */,-19 , 10/* "}" */,-19 , 17/* "</" */,-19 ),
	/* State 24 */ new Array( 13/* "," */,-20 , 11/* "(" */,-20 , 12/* ")" */,-20 , 23/* "IDENTIFIER" */,-20 , 21/* "QUOTE" */,-20 , 10/* "}" */,-20 , 17/* "</" */,-20 ),
	/* State 25 */ new Array( 13/* "," */,-21 , 11/* "(" */,-21 , 12/* ")" */,-21 , 23/* "IDENTIFIER" */,-21 , 21/* "QUOTE" */,-21 , 10/* "}" */,-21 , 17/* "</" */,-21 ),
	/* State 26 */ new Array( 11/* "(" */,40 ),
	/* State 27 */ new Array( 3/* "template" */,-10 , 4/* "function" */,-10 , 11/* "(" */,-10 , 12/* ")" */,-10 , 23/* "IDENTIFIER" */,-10 , 5/* "state" */,-10 , 9/* "{" */,-10 , 2/* "TEXTNODE" */,-10 , 21/* "QUOTE" */,-10 , 19/* "<" */,-10 ),
	/* State 28 */ new Array( 3/* "template" */,-10 , 4/* "function" */,-10 , 11/* "(" */,-10 , 12/* ")" */,-10 , 23/* "IDENTIFIER" */,-10 , 5/* "state" */,-10 , 9/* "{" */,-10 , 2/* "TEXTNODE" */,-10 , 21/* "QUOTE" */,-10 , 19/* "<" */,-10 ),
	/* State 29 */ new Array( 3/* "template" */,-10 , 4/* "function" */,-10 , 11/* "(" */,-10 , 12/* ")" */,-10 , 23/* "IDENTIFIER" */,-10 , 5/* "state" */,-10 , 9/* "{" */,-10 , 2/* "TEXTNODE" */,-10 , 21/* "QUOTE" */,-10 , 19/* "<" */,-10 ),
	/* State 30 */ new Array( 17/* "</" */,-49 , 2/* "TEXTNODE" */,-49 , 19/* "<" */,-49 ),
	/* State 31 */ new Array( 13/* "," */,-46 , 10/* "}" */,-46 , 17/* "</" */,-46 , 2/* "TEXTNODE" */,-46 , 19/* "<" */,-46 ),
	/* State 32 */ new Array( 13/* "," */,-47 , 10/* "}" */,-47 , 17/* "</" */,-47 , 2/* "TEXTNODE" */,-47 , 19/* "<" */,-47 ),
	/* State 33 */ new Array( 23/* "IDENTIFIER" */,46 , 13/* "," */,47 , 11/* "(" */,48 , 12/* ")" */,49 , 15/* ":" */,50 , 14/* ";" */,51 , 16/* "=" */,52 , 10/* "}" */,53 , 9/* "{" */,54 ),
	/* State 34 */ new Array( 7/* "f:call" */,56 , 6/* "f:each" */,57 , 23/* "IDENTIFIER" */,58 ),
	/* State 35 */ new Array( 23/* "IDENTIFIER" */,60 ),
	/* State 36 */ new Array( 23/* "IDENTIFIER" */,7 ),
	/* State 37 */ new Array( 9/* "{" */,62 ),
	/* State 38 */ new Array( 11/* "(" */,22 , 12/* ")" */,23 , 23/* "IDENTIFIER" */,24 , 21/* "QUOTE" */,33 , 13/* "," */,-22 , 10/* "}" */,-22 , 17/* "</" */,-22 ),
	/* State 39 */ new Array( 23/* "IDENTIFIER" */,7 , 12/* ")" */,-6 , 13/* "," */,-6 ),
	/* State 40 */ new Array( 21/* "QUOTE" */,65 ),
	/* State 41 */ new Array( 4/* "function" */,21 , 3/* "template" */,4 , 11/* "(" */,22 , 12/* ")" */,23 , 23/* "IDENTIFIER" */,67 , 5/* "state" */,26 , 9/* "{" */,27 , 2/* "TEXTNODE" */,32 , 21/* "QUOTE" */,33 , 19/* "<" */,34 ),
	/* State 42 */ new Array( 4/* "function" */,21 , 3/* "template" */,4 , 11/* "(" */,22 , 12/* ")" */,23 , 23/* "IDENTIFIER" */,67 , 5/* "state" */,26 , 9/* "{" */,27 , 2/* "TEXTNODE" */,32 , 21/* "QUOTE" */,33 , 19/* "<" */,34 ),
	/* State 43 */ new Array( 4/* "function" */,21 , 3/* "template" */,4 , 11/* "(" */,22 , 12/* ")" */,23 , 23/* "IDENTIFIER" */,67 , 5/* "state" */,26 , 9/* "{" */,27 , 2/* "TEXTNODE" */,32 , 21/* "QUOTE" */,33 , 19/* "<" */,34 ),
	/* State 44 */ new Array( 17/* "</" */,72 , 2/* "TEXTNODE" */,32 , 19/* "<" */,34 ),
	/* State 45 */ new Array( 21/* "QUOTE" */,74 , 23/* "IDENTIFIER" */,46 , 13/* "," */,47 , 11/* "(" */,48 , 12/* ")" */,49 , 15/* ":" */,50 , 14/* ";" */,51 , 16/* "=" */,52 , 10/* "}" */,53 , 9/* "{" */,54 ),
	/* State 46 */ new Array( 21/* "QUOTE" */,-51 , 23/* "IDENTIFIER" */,-51 , 13/* "," */,-51 , 11/* "(" */,-51 , 12/* ")" */,-51 , 15/* ":" */,-51 , 14/* ";" */,-51 , 16/* "=" */,-51 , 10/* "}" */,-51 , 9/* "{" */,-51 ),
	/* State 47 */ new Array( 21/* "QUOTE" */,-52 , 23/* "IDENTIFIER" */,-52 , 13/* "," */,-52 , 11/* "(" */,-52 , 12/* ")" */,-52 , 15/* ":" */,-52 , 14/* ";" */,-52 , 16/* "=" */,-52 , 10/* "}" */,-52 , 9/* "{" */,-52 ),
	/* State 48 */ new Array( 21/* "QUOTE" */,-53 , 23/* "IDENTIFIER" */,-53 , 13/* "," */,-53 , 11/* "(" */,-53 , 12/* ")" */,-53 , 15/* ":" */,-53 , 14/* ";" */,-53 , 16/* "=" */,-53 , 10/* "}" */,-53 , 9/* "{" */,-53 ),
	/* State 49 */ new Array( 21/* "QUOTE" */,-54 , 23/* "IDENTIFIER" */,-54 , 13/* "," */,-54 , 11/* "(" */,-54 , 12/* ")" */,-54 , 15/* ":" */,-54 , 14/* ";" */,-54 , 16/* "=" */,-54 , 10/* "}" */,-54 , 9/* "{" */,-54 ),
	/* State 50 */ new Array( 21/* "QUOTE" */,-55 , 23/* "IDENTIFIER" */,-55 , 13/* "," */,-55 , 11/* "(" */,-55 , 12/* ")" */,-55 , 15/* ":" */,-55 , 14/* ";" */,-55 , 16/* "=" */,-55 , 10/* "}" */,-55 , 9/* "{" */,-55 ),
	/* State 51 */ new Array( 21/* "QUOTE" */,-56 , 23/* "IDENTIFIER" */,-56 , 13/* "," */,-56 , 11/* "(" */,-56 , 12/* ")" */,-56 , 15/* ":" */,-56 , 14/* ";" */,-56 , 16/* "=" */,-56 , 10/* "}" */,-56 , 9/* "{" */,-56 ),
	/* State 52 */ new Array( 21/* "QUOTE" */,-57 , 23/* "IDENTIFIER" */,-57 , 13/* "," */,-57 , 11/* "(" */,-57 , 12/* ")" */,-57 , 15/* ":" */,-57 , 14/* ";" */,-57 , 16/* "=" */,-57 , 10/* "}" */,-57 , 9/* "{" */,-57 ),
	/* State 53 */ new Array( 21/* "QUOTE" */,-58 , 23/* "IDENTIFIER" */,-58 , 13/* "," */,-58 , 11/* "(" */,-58 , 12/* ")" */,-58 , 15/* ":" */,-58 , 14/* ";" */,-58 , 16/* "=" */,-58 , 10/* "}" */,-58 , 9/* "{" */,-58 ),
	/* State 54 */ new Array( 21/* "QUOTE" */,-59 , 23/* "IDENTIFIER" */,-59 , 13/* "," */,-59 , 11/* "(" */,-59 , 12/* ")" */,-59 , 15/* ":" */,-59 , 14/* ";" */,-59 , 16/* "=" */,-59 , 10/* "}" */,-59 , 9/* "{" */,-59 ),
	/* State 55 */ new Array( 18/* "/" */,-72 , 20/* ">" */,-72 , 8/* "style" */,-72 , 23/* "IDENTIFIER" */,-72 ),
	/* State 56 */ new Array( 20/* ">" */,76 ),
	/* State 57 */ new Array( 20/* ">" */,-72 , 8/* "style" */,-72 , 23/* "IDENTIFIER" */,-72 ),
	/* State 58 */ new Array( 15/* ":" */,78 , 8/* "style" */,-68 , 23/* "IDENTIFIER" */,-68 , 20/* ">" */,-68 , 18/* "/" */,-68 ),
	/* State 59 */ new Array( 23/* "IDENTIFIER" */,79 , 16/* "=" */,-42 , 12/* ")" */,-42 , 13/* "," */,-42 ),
	/* State 60 */ new Array( 16/* "=" */,-8 , 12/* ")" */,-8 , 13/* "," */,-8 , 23/* "IDENTIFIER" */,-8 , 9/* "{" */,-8 ),
	/* State 61 */ new Array( 12/* ")" */,-4 , 13/* "," */,-4 ),
	/* State 62 */ new Array( 3/* "template" */,-10 , 4/* "function" */,-10 , 11/* "(" */,-10 , 12/* ")" */,-10 , 23/* "IDENTIFIER" */,-10 , 5/* "state" */,-10 , 9/* "{" */,-10 , 2/* "TEXTNODE" */,-10 , 21/* "QUOTE" */,-10 , 19/* "<" */,-10 ),
	/* State 63 */ new Array( 13/* "," */,36 , 12/* ")" */,81 ),
	/* State 64 */ new Array( 13/* "," */,82 ),
	/* State 65 */ new Array( 23/* "IDENTIFIER" */,46 , 13/* "," */,47 , 11/* "(" */,48 , 12/* ")" */,49 , 15/* ":" */,50 , 14/* ";" */,51 , 16/* "=" */,52 , 10/* "}" */,53 , 9/* "{" */,54 ),
	/* State 66 */ new Array( 10/* "}" */,84 ),
	/* State 67 */ new Array( 15/* ":" */,11 , 10/* "}" */,-20 , 11/* "(" */,-20 , 12/* ")" */,-20 , 23/* "IDENTIFIER" */,-20 , 21/* "QUOTE" */,-20 , 17/* "</" */,-20 , 16/* "=" */,-41 ),
	/* State 68 */ new Array( 17/* "</" */,86 ),
	/* State 69 */ new Array( 17/* "</" */,88 ),
	/* State 70 */ new Array( 17/* "</" */,-48 , 2/* "TEXTNODE" */,-48 , 19/* "<" */,-48 ),
	/* State 71 */ new Array( 13/* "," */,-45 , 10/* "}" */,-45 , 17/* "</" */,-45 , 2/* "TEXTNODE" */,-45 , 19/* "<" */,-45 ),
	/* State 72 */ new Array( 23/* "IDENTIFIER" */,58 ),
	/* State 73 */ new Array( 23/* "IDENTIFIER" */,46 , 13/* "," */,47 , 11/* "(" */,48 , 12/* ")" */,49 , 15/* ":" */,50 , 14/* ";" */,51 , 16/* "=" */,52 , 10/* "}" */,53 , 9/* "{" */,54 , 21/* "QUOTE" */,-60 ),
	/* State 74 */ new Array( 13/* "," */,-75 , 11/* "(" */,-75 , 12/* ")" */,-75 , 23/* "IDENTIFIER" */,-75 , 21/* "QUOTE" */,-75 , 10/* "}" */,-75 , 17/* "</" */,-75 , 9/* "{" */,-75 , 16/* "=" */,-75 , 14/* ";" */,-75 , 15/* ":" */,-75 , 19/* "<" */,-75 , 20/* ">" */,-75 , 18/* "/" */,-75 , 22/* "JSSEP" */,-75 ),
	/* State 75 */ new Array( 23/* "IDENTIFIER" */,90 , 8/* "style" */,91 , 18/* "/" */,92 , 20/* ">" */,93 ),
	/* State 76 */ new Array( 23/* "IDENTIFIER" */,-63 , 3/* "template" */,-63 , 4/* "function" */,-63 , 11/* "(" */,-63 , 12/* ")" */,-63 , 5/* "state" */,-63 , 9/* "{" */,-63 , 2/* "TEXTNODE" */,-63 , 21/* "QUOTE" */,-63 , 19/* "<" */,-63 ),
	/* State 77 */ new Array( 23/* "IDENTIFIER" */,90 , 8/* "style" */,91 , 20/* ">" */,94 ),
	/* State 78 */ new Array( 23/* "IDENTIFIER" */,95 ),
	/* State 79 */ new Array( 16/* "=" */,-7 , 12/* ")" */,-7 , 13/* "," */,-7 , 23/* "IDENTIFIER" */,-7 , 9/* "{" */,-7 ),
	/* State 80 */ new Array( 4/* "function" */,21 , 3/* "template" */,4 , 11/* "(" */,22 , 12/* ")" */,23 , 23/* "IDENTIFIER" */,67 , 5/* "state" */,26 , 9/* "{" */,27 , 2/* "TEXTNODE" */,32 , 21/* "QUOTE" */,33 , 19/* "<" */,34 ),
	/* State 81 */ new Array( 9/* "{" */,97 , 15/* ":" */,98 ),
	/* State 82 */ new Array( 11/* "(" */,22 , 12/* ")" */,23 , 23/* "IDENTIFIER" */,24 , 21/* "QUOTE" */,33 ),
	/* State 83 */ new Array( 21/* "QUOTE" */,100 , 23/* "IDENTIFIER" */,46 , 13/* "," */,47 , 11/* "(" */,48 , 12/* ")" */,49 , 15/* ":" */,50 , 14/* ";" */,51 , 16/* "=" */,52 , 10/* "}" */,53 , 9/* "{" */,54 ),
	/* State 84 */ new Array( 13/* "," */,-23 , 10/* "}" */,-23 , 17/* "</" */,-23 ),
	/* State 85 */ new Array( 13/* "," */,-43 , 10/* "}" */,-43 , 17/* "</" */,-43 , 2/* "TEXTNODE" */,-43 , 19/* "<" */,-43 ),
	/* State 86 */ new Array( 6/* "f:each" */,101 ),
	/* State 87 */ new Array( 13/* "," */,-44 , 10/* "}" */,-44 , 17/* "</" */,-44 , 2/* "TEXTNODE" */,-44 , 19/* "<" */,-44 ),
	/* State 88 */ new Array( 7/* "f:call" */,102 ),
	/* State 89 */ new Array( 20/* ">" */,103 ),
	/* State 90 */ new Array( 16/* "=" */,104 ),
	/* State 91 */ new Array( 16/* "=" */,105 ),
	/* State 92 */ new Array( 20/* ">" */,106 ),
	/* State 93 */ new Array( 2/* "TEXTNODE" */,-65 , 19/* "<" */,-65 , 17/* "</" */,-65 ),
	/* State 94 */ new Array( 23/* "IDENTIFIER" */,-61 , 3/* "template" */,-61 , 4/* "function" */,-61 , 11/* "(" */,-61 , 12/* ")" */,-61 , 5/* "state" */,-61 , 9/* "{" */,-61 , 2/* "TEXTNODE" */,-61 , 21/* "QUOTE" */,-61 , 19/* "<" */,-61 ),
	/* State 95 */ new Array( 8/* "style" */,-69 , 23/* "IDENTIFIER" */,-69 , 20/* ">" */,-69 , 18/* "/" */,-69 ),
	/* State 96 */ new Array( 10/* "}" */,107 ),
	/* State 97 */ new Array( 23/* "IDENTIFIER" */,109 , 11/* "(" */,111 , 9/* "{" */,112 , 13/* "," */,113 , 16/* "=" */,114 , 14/* ";" */,115 , 15/* ":" */,116 , 19/* "<" */,117 , 20/* ">" */,118 , 18/* "/" */,119 , 22/* "JSSEP" */,120 , 21/* "QUOTE" */,33 , 10/* "}" */,-39 ),
	/* State 98 */ new Array( 15/* ":" */,121 ),
	/* State 99 */ new Array( 12/* ")" */,122 , 11/* "(" */,22 , 23/* "IDENTIFIER" */,24 , 21/* "QUOTE" */,33 ),
	/* State 100 */ new Array( 13/* "," */,-76 , 18/* "/" */,-76 , 20/* ">" */,-76 , 8/* "style" */,-76 , 23/* "IDENTIFIER" */,-76 ),
	/* State 101 */ new Array( 20/* ">" */,123 ),
	/* State 102 */ new Array( 20/* ">" */,124 ),
	/* State 103 */ new Array( 13/* "," */,-66 , 10/* "}" */,-66 , 17/* "</" */,-66 , 2/* "TEXTNODE" */,-66 , 19/* "<" */,-66 ),
	/* State 104 */ new Array( 21/* "QUOTE" */,127 ),
	/* State 105 */ new Array( 21/* "QUOTE" */,128 ),
	/* State 106 */ new Array( 13/* "," */,-67 , 10/* "}" */,-67 , 17/* "</" */,-67 , 2/* "TEXTNODE" */,-67 , 19/* "<" */,-67 ),
	/* State 107 */ new Array( 55/* "$" */,-3 , 13/* "," */,-3 , 10/* "}" */,-3 , 17/* "</" */,-3 ),
	/* State 108 */ new Array( 10/* "}" */,130 , 23/* "IDENTIFIER" */,109 , 11/* "(" */,111 , 9/* "{" */,112 , 13/* "," */,113 , 16/* "=" */,114 , 14/* ";" */,115 , 15/* ":" */,116 , 19/* "<" */,117 , 20/* ">" */,118 , 18/* "/" */,119 , 22/* "JSSEP" */,120 , 21/* "QUOTE" */,33 ),
	/* State 109 */ new Array( 10/* "}" */,-26 , 23/* "IDENTIFIER" */,-26 , 21/* "QUOTE" */,-26 , 11/* "(" */,-26 , 9/* "{" */,-26 , 13/* "," */,-26 , 16/* "=" */,-26 , 14/* ";" */,-26 , 15/* ":" */,-26 , 19/* "<" */,-26 , 20/* ">" */,-26 , 18/* "/" */,-26 , 22/* "JSSEP" */,-26 , 12/* ")" */,-26 ),
	/* State 110 */ new Array( 10/* "}" */,-27 , 23/* "IDENTIFIER" */,-27 , 21/* "QUOTE" */,-27 , 11/* "(" */,-27 , 9/* "{" */,-27 , 13/* "," */,-27 , 16/* "=" */,-27 , 14/* ";" */,-27 , 15/* ":" */,-27 , 19/* "<" */,-27 , 20/* ">" */,-27 , 18/* "/" */,-27 , 22/* "JSSEP" */,-27 , 12/* ")" */,-27 ),
	/* State 111 */ new Array( 23/* "IDENTIFIER" */,109 , 11/* "(" */,111 , 9/* "{" */,112 , 13/* "," */,113 , 16/* "=" */,114 , 14/* ";" */,115 , 15/* ":" */,116 , 19/* "<" */,117 , 20/* ">" */,118 , 18/* "/" */,119 , 22/* "JSSEP" */,120 , 21/* "QUOTE" */,33 , 12/* ")" */,-39 ),
	/* State 112 */ new Array( 23/* "IDENTIFIER" */,109 , 11/* "(" */,111 , 9/* "{" */,112 , 13/* "," */,113 , 16/* "=" */,114 , 14/* ";" */,115 , 15/* ":" */,116 , 19/* "<" */,117 , 20/* ">" */,118 , 18/* "/" */,119 , 22/* "JSSEP" */,120 , 21/* "QUOTE" */,33 , 10/* "}" */,-39 ),
	/* State 113 */ new Array( 10/* "}" */,-30 , 23/* "IDENTIFIER" */,-30 , 21/* "QUOTE" */,-30 , 11/* "(" */,-30 , 9/* "{" */,-30 , 13/* "," */,-30 , 16/* "=" */,-30 , 14/* ";" */,-30 , 15/* ":" */,-30 , 19/* "<" */,-30 , 20/* ">" */,-30 , 18/* "/" */,-30 , 22/* "JSSEP" */,-30 , 12/* ")" */,-30 ),
	/* State 114 */ new Array( 10/* "}" */,-31 , 23/* "IDENTIFIER" */,-31 , 21/* "QUOTE" */,-31 , 11/* "(" */,-31 , 9/* "{" */,-31 , 13/* "," */,-31 , 16/* "=" */,-31 , 14/* ";" */,-31 , 15/* ":" */,-31 , 19/* "<" */,-31 , 20/* ">" */,-31 , 18/* "/" */,-31 , 22/* "JSSEP" */,-31 , 12/* ")" */,-31 ),
	/* State 115 */ new Array( 10/* "}" */,-32 , 23/* "IDENTIFIER" */,-32 , 21/* "QUOTE" */,-32 , 11/* "(" */,-32 , 9/* "{" */,-32 , 13/* "," */,-32 , 16/* "=" */,-32 , 14/* ";" */,-32 , 15/* ":" */,-32 , 19/* "<" */,-32 , 20/* ">" */,-32 , 18/* "/" */,-32 , 22/* "JSSEP" */,-32 , 12/* ")" */,-32 ),
	/* State 116 */ new Array( 10/* "}" */,-33 , 23/* "IDENTIFIER" */,-33 , 21/* "QUOTE" */,-33 , 11/* "(" */,-33 , 9/* "{" */,-33 , 13/* "," */,-33 , 16/* "=" */,-33 , 14/* ";" */,-33 , 15/* ":" */,-33 , 19/* "<" */,-33 , 20/* ">" */,-33 , 18/* "/" */,-33 , 22/* "JSSEP" */,-33 , 12/* ")" */,-33 ),
	/* State 117 */ new Array( 10/* "}" */,-34 , 23/* "IDENTIFIER" */,-34 , 21/* "QUOTE" */,-34 , 11/* "(" */,-34 , 9/* "{" */,-34 , 13/* "," */,-34 , 16/* "=" */,-34 , 14/* ";" */,-34 , 15/* ":" */,-34 , 19/* "<" */,-34 , 20/* ">" */,-34 , 18/* "/" */,-34 , 22/* "JSSEP" */,-34 , 12/* ")" */,-34 ),
	/* State 118 */ new Array( 10/* "}" */,-35 , 23/* "IDENTIFIER" */,-35 , 21/* "QUOTE" */,-35 , 11/* "(" */,-35 , 9/* "{" */,-35 , 13/* "," */,-35 , 16/* "=" */,-35 , 14/* ";" */,-35 , 15/* ":" */,-35 , 19/* "<" */,-35 , 20/* ">" */,-35 , 18/* "/" */,-35 , 22/* "JSSEP" */,-35 , 12/* ")" */,-35 ),
	/* State 119 */ new Array( 10/* "}" */,-36 , 23/* "IDENTIFIER" */,-36 , 21/* "QUOTE" */,-36 , 11/* "(" */,-36 , 9/* "{" */,-36 , 13/* "," */,-36 , 16/* "=" */,-36 , 14/* ";" */,-36 , 15/* ":" */,-36 , 19/* "<" */,-36 , 20/* ">" */,-36 , 18/* "/" */,-36 , 22/* "JSSEP" */,-36 , 12/* ")" */,-36 ),
	/* State 120 */ new Array( 10/* "}" */,-37 , 23/* "IDENTIFIER" */,-37 , 21/* "QUOTE" */,-37 , 11/* "(" */,-37 , 9/* "{" */,-37 , 13/* "," */,-37 , 16/* "=" */,-37 , 14/* ";" */,-37 , 15/* ":" */,-37 , 19/* "<" */,-37 , 20/* ">" */,-37 , 18/* "/" */,-37 , 22/* "JSSEP" */,-37 , 12/* ")" */,-37 ),
	/* State 121 */ new Array( 23/* "IDENTIFIER" */,60 ),
	/* State 122 */ new Array( 13/* "," */,-40 , 10/* "}" */,-40 , 17/* "</" */,-40 , 12/* ")" */,-19 , 11/* "(" */,-19 , 23/* "IDENTIFIER" */,-19 , 21/* "QUOTE" */,-19 ),
	/* State 123 */ new Array( 13/* "," */,-62 , 10/* "}" */,-62 , 17/* "</" */,-62 , 2/* "TEXTNODE" */,-62 , 19/* "<" */,-62 ),
	/* State 124 */ new Array( 13/* "," */,-64 , 10/* "}" */,-64 , 17/* "</" */,-64 , 2/* "TEXTNODE" */,-64 , 19/* "<" */,-64 ),
	/* State 125 */ new Array( 18/* "/" */,-71 , 20/* ">" */,-71 , 8/* "style" */,-71 , 23/* "IDENTIFIER" */,-71 ),
	/* State 126 */ new Array( 18/* "/" */,-73 , 20/* ">" */,-73 , 8/* "style" */,-73 , 23/* "IDENTIFIER" */,-73 ),
	/* State 127 */ new Array( 9/* "{" */,135 , 23/* "IDENTIFIER" */,46 , 13/* "," */,47 , 11/* "(" */,48 , 12/* ")" */,49 , 15/* ":" */,50 , 14/* ";" */,51 , 16/* "=" */,52 , 10/* "}" */,53 ),
	/* State 128 */ new Array( 23/* "IDENTIFIER" */,138 , 21/* "QUOTE" */,-79 , 14/* ";" */,-79 ),
	/* State 129 */ new Array( 23/* "IDENTIFIER" */,109 , 11/* "(" */,111 , 9/* "{" */,112 , 13/* "," */,113 , 16/* "=" */,114 , 14/* ";" */,115 , 15/* ":" */,116 , 19/* "<" */,117 , 20/* ">" */,118 , 18/* "/" */,119 , 22/* "JSSEP" */,120 , 21/* "QUOTE" */,33 , 10/* "}" */,-38 , 12/* ")" */,-38 ),
	/* State 130 */ new Array( 13/* "," */,-24 , 10/* "}" */,-24 , 17/* "</" */,-24 ),
	/* State 131 */ new Array( 12/* ")" */,139 , 23/* "IDENTIFIER" */,109 , 11/* "(" */,111 , 9/* "{" */,112 , 13/* "," */,113 , 16/* "=" */,114 , 14/* ";" */,115 , 15/* ":" */,116 , 19/* "<" */,117 , 20/* ">" */,118 , 18/* "/" */,119 , 22/* "JSSEP" */,120 , 21/* "QUOTE" */,33 ),
	/* State 132 */ new Array( 10/* "}" */,140 , 23/* "IDENTIFIER" */,109 , 11/* "(" */,111 , 9/* "{" */,112 , 13/* "," */,113 , 16/* "=" */,114 , 14/* ";" */,115 , 15/* ":" */,116 , 19/* "<" */,117 , 20/* ">" */,118 , 18/* "/" */,119 , 22/* "JSSEP" */,120 , 21/* "QUOTE" */,33 ),
	/* State 133 */ new Array( 23/* "IDENTIFIER" */,79 , 9/* "{" */,141 ),
	/* State 134 */ new Array( 21/* "QUOTE" */,142 ),
	/* State 135 */ new Array( 11/* "(" */,22 , 12/* ")" */,23 , 23/* "IDENTIFIER" */,24 , 21/* "QUOTE" */,33 , 13/* "," */,-59 , 15/* ":" */,-59 , 14/* ";" */,-59 , 16/* "=" */,-59 , 10/* "}" */,-59 , 9/* "{" */,-59 ),
	/* State 136 */ new Array( 14/* ";" */,144 , 21/* "QUOTE" */,145 ),
	/* State 137 */ new Array( 21/* "QUOTE" */,-78 , 14/* ";" */,-78 ),
	/* State 138 */ new Array( 15/* ":" */,146 ),
	/* State 139 */ new Array( 10/* "}" */,-28 , 23/* "IDENTIFIER" */,-28 , 21/* "QUOTE" */,-28 , 11/* "(" */,-28 , 9/* "{" */,-28 , 13/* "," */,-28 , 16/* "=" */,-28 , 14/* ";" */,-28 , 15/* ":" */,-28 , 19/* "<" */,-28 , 20/* ">" */,-28 , 18/* "/" */,-28 , 22/* "JSSEP" */,-28 , 12/* ")" */,-28 ),
	/* State 140 */ new Array( 10/* "}" */,-29 , 23/* "IDENTIFIER" */,-29 , 21/* "QUOTE" */,-29 , 11/* "(" */,-29 , 9/* "{" */,-29 , 13/* "," */,-29 , 16/* "=" */,-29 , 14/* ";" */,-29 , 15/* ":" */,-29 , 19/* "<" */,-29 , 20/* ">" */,-29 , 18/* "/" */,-29 , 22/* "JSSEP" */,-29 , 12/* ")" */,-29 ),
	/* State 141 */ new Array( 23/* "IDENTIFIER" */,109 , 11/* "(" */,111 , 9/* "{" */,112 , 13/* "," */,113 , 16/* "=" */,114 , 14/* ";" */,115 , 15/* ":" */,116 , 19/* "<" */,117 , 20/* ">" */,118 , 18/* "/" */,119 , 22/* "JSSEP" */,120 , 21/* "QUOTE" */,33 , 10/* "}" */,-39 ),
	/* State 142 */ new Array( 18/* "/" */,-74 , 20/* ">" */,-74 , 8/* "style" */,-74 , 23/* "IDENTIFIER" */,-74 ),
	/* State 143 */ new Array( 10/* "}" */,148 , 11/* "(" */,22 , 12/* ")" */,23 , 23/* "IDENTIFIER" */,24 , 21/* "QUOTE" */,33 ),
	/* State 144 */ new Array( 23/* "IDENTIFIER" */,138 ),
	/* State 145 */ new Array( 18/* "/" */,-70 , 20/* ">" */,-70 , 8/* "style" */,-70 , 23/* "IDENTIFIER" */,-70 ),
	/* State 146 */ new Array( 23/* "IDENTIFIER" */,46 , 13/* "," */,47 , 11/* "(" */,48 , 12/* ")" */,49 , 15/* ":" */,50 , 14/* ";" */,51 , 16/* "=" */,52 , 10/* "}" */,53 , 9/* "{" */,54 ),
	/* State 147 */ new Array( 10/* "}" */,151 , 23/* "IDENTIFIER" */,109 , 11/* "(" */,111 , 9/* "{" */,112 , 13/* "," */,113 , 16/* "=" */,114 , 14/* ";" */,115 , 15/* ":" */,116 , 19/* "<" */,117 , 20/* ">" */,118 , 18/* "/" */,119 , 22/* "JSSEP" */,120 , 21/* "QUOTE" */,33 ),
	/* State 148 */ new Array( 21/* "QUOTE" */,-50 ),
	/* State 149 */ new Array( 21/* "QUOTE" */,-77 , 14/* ";" */,-77 ),
	/* State 150 */ new Array( 23/* "IDENTIFIER" */,46 , 13/* "," */,47 , 11/* "(" */,48 , 12/* ")" */,49 , 15/* ":" */,50 , 14/* ";" */,51 , 16/* "=" */,52 , 10/* "}" */,53 , 9/* "{" */,54 , 21/* "QUOTE" */,-80 ),
	/* State 151 */ new Array( 13/* "," */,-25 , 10/* "}" */,-25 , 17/* "</" */,-25 )
);

/* Goto-Table */
var goto_tab = new Array(
	/* State 0 */ new Array( 26/* TOP */,1 , 24/* TEMPLATE */,2 , 25/* LETLIST */,3 ),
	/* State 1 */ new Array(  ),
	/* State 2 */ new Array(  ),
	/* State 3 */ new Array( 31/* LET */,5 , 29/* VARIABLE */,6 ),
	/* State 4 */ new Array(  ),
	/* State 5 */ new Array(  ),
	/* State 6 */ new Array(  ),
	/* State 7 */ new Array(  ),
	/* State 8 */ new Array( 27/* ARGLIST */,12 , 29/* VARIABLE */,13 ),
	/* State 9 */ new Array(  ),
	/* State 10 */ new Array( 28/* STMT */,14 , 32/* JSFUN */,15 , 24/* TEMPLATE */,16 , 33/* EXPR */,17 , 34/* STATE */,18 , 35/* LETLISTBLOCK */,19 , 36/* XML */,20 , 37/* STRINGKEEPQUOTES */,25 , 40/* OPENFOREACH */,28 , 42/* OPENCALL */,29 , 44/* OPENTAG */,30 , 47/* SINGLETAG */,31 ),
	/* State 11 */ new Array(  ),
	/* State 12 */ new Array(  ),
	/* State 13 */ new Array(  ),
	/* State 14 */ new Array(  ),
	/* State 15 */ new Array(  ),
	/* State 16 */ new Array(  ),
	/* State 17 */ new Array( 33/* EXPR */,38 , 37/* STRINGKEEPQUOTES */,25 ),
	/* State 18 */ new Array(  ),
	/* State 19 */ new Array(  ),
	/* State 20 */ new Array(  ),
	/* State 21 */ new Array(  ),
	/* State 22 */ new Array(  ),
	/* State 23 */ new Array(  ),
	/* State 24 */ new Array(  ),
	/* State 25 */ new Array(  ),
	/* State 26 */ new Array(  ),
	/* State 27 */ new Array( 25/* LETLIST */,41 ),
	/* State 28 */ new Array( 25/* LETLIST */,42 ),
	/* State 29 */ new Array( 25/* LETLIST */,43 ),
	/* State 30 */ new Array( 45/* XMLLIST */,44 ),
	/* State 31 */ new Array(  ),
	/* State 32 */ new Array(  ),
	/* State 33 */ new Array( 49/* TEXT */,45 ),
	/* State 34 */ new Array( 51/* TAGNAME */,55 ),
	/* State 35 */ new Array( 30/* TYPE */,59 ),
	/* State 36 */ new Array( 29/* VARIABLE */,61 ),
	/* State 37 */ new Array(  ),
	/* State 38 */ new Array( 33/* EXPR */,38 , 37/* STRINGKEEPQUOTES */,25 ),
	/* State 39 */ new Array( 27/* ARGLIST */,63 , 29/* VARIABLE */,13 ),
	/* State 40 */ new Array( 39/* STRING */,64 ),
	/* State 41 */ new Array( 31/* LET */,5 , 28/* STMT */,66 , 32/* JSFUN */,15 , 24/* TEMPLATE */,16 , 33/* EXPR */,17 , 34/* STATE */,18 , 35/* LETLISTBLOCK */,19 , 36/* XML */,20 , 29/* VARIABLE */,6 , 37/* STRINGKEEPQUOTES */,25 , 40/* OPENFOREACH */,28 , 42/* OPENCALL */,29 , 44/* OPENTAG */,30 , 47/* SINGLETAG */,31 ),
	/* State 42 */ new Array( 31/* LET */,5 , 28/* STMT */,68 , 32/* JSFUN */,15 , 24/* TEMPLATE */,16 , 33/* EXPR */,17 , 34/* STATE */,18 , 35/* LETLISTBLOCK */,19 , 36/* XML */,20 , 29/* VARIABLE */,6 , 37/* STRINGKEEPQUOTES */,25 , 40/* OPENFOREACH */,28 , 42/* OPENCALL */,29 , 44/* OPENTAG */,30 , 47/* SINGLETAG */,31 ),
	/* State 43 */ new Array( 31/* LET */,5 , 28/* STMT */,69 , 32/* JSFUN */,15 , 24/* TEMPLATE */,16 , 33/* EXPR */,17 , 34/* STATE */,18 , 35/* LETLISTBLOCK */,19 , 36/* XML */,20 , 29/* VARIABLE */,6 , 37/* STRINGKEEPQUOTES */,25 , 40/* OPENFOREACH */,28 , 42/* OPENCALL */,29 , 44/* OPENTAG */,30 , 47/* SINGLETAG */,31 ),
	/* State 44 */ new Array( 36/* XML */,70 , 46/* CLOSETAG */,71 , 40/* OPENFOREACH */,28 , 42/* OPENCALL */,29 , 44/* OPENTAG */,30 , 47/* SINGLETAG */,31 ),
	/* State 45 */ new Array( 49/* TEXT */,73 ),
	/* State 46 */ new Array(  ),
	/* State 47 */ new Array(  ),
	/* State 48 */ new Array(  ),
	/* State 49 */ new Array(  ),
	/* State 50 */ new Array(  ),
	/* State 51 */ new Array(  ),
	/* State 52 */ new Array(  ),
	/* State 53 */ new Array(  ),
	/* State 54 */ new Array(  ),
	/* State 55 */ new Array( 50/* ATTRIBUTES */,75 ),
	/* State 56 */ new Array(  ),
	/* State 57 */ new Array( 50/* ATTRIBUTES */,77 ),
	/* State 58 */ new Array(  ),
	/* State 59 */ new Array(  ),
	/* State 60 */ new Array(  ),
	/* State 61 */ new Array(  ),
	/* State 62 */ new Array( 25/* LETLIST */,80 ),
	/* State 63 */ new Array(  ),
	/* State 64 */ new Array(  ),
	/* State 65 */ new Array( 49/* TEXT */,83 ),
	/* State 66 */ new Array(  ),
	/* State 67 */ new Array(  ),
	/* State 68 */ new Array( 41/* CLOSEFOREACH */,85 ),
	/* State 69 */ new Array( 43/* CLOSECALL */,87 ),
	/* State 70 */ new Array(  ),
	/* State 71 */ new Array(  ),
	/* State 72 */ new Array( 51/* TAGNAME */,89 ),
	/* State 73 */ new Array( 49/* TEXT */,73 ),
	/* State 74 */ new Array(  ),
	/* State 75 */ new Array(  ),
	/* State 76 */ new Array(  ),
	/* State 77 */ new Array(  ),
	/* State 78 */ new Array(  ),
	/* State 79 */ new Array(  ),
	/* State 80 */ new Array( 31/* LET */,5 , 28/* STMT */,96 , 32/* JSFUN */,15 , 24/* TEMPLATE */,16 , 33/* EXPR */,17 , 34/* STATE */,18 , 35/* LETLISTBLOCK */,19 , 36/* XML */,20 , 29/* VARIABLE */,6 , 37/* STRINGKEEPQUOTES */,25 , 40/* OPENFOREACH */,28 , 42/* OPENCALL */,29 , 44/* OPENTAG */,30 , 47/* SINGLETAG */,31 ),
	/* State 81 */ new Array(  ),
	/* State 82 */ new Array( 33/* EXPR */,99 , 37/* STRINGKEEPQUOTES */,25 ),
	/* State 83 */ new Array( 49/* TEXT */,73 ),
	/* State 84 */ new Array(  ),
	/* State 85 */ new Array(  ),
	/* State 86 */ new Array(  ),
	/* State 87 */ new Array(  ),
	/* State 88 */ new Array(  ),
	/* State 89 */ new Array(  ),
	/* State 90 */ new Array(  ),
	/* State 91 */ new Array(  ),
	/* State 92 */ new Array(  ),
	/* State 93 */ new Array(  ),
	/* State 94 */ new Array(  ),
	/* State 95 */ new Array(  ),
	/* State 96 */ new Array(  ),
	/* State 97 */ new Array( 38/* JS */,108 , 37/* STRINGKEEPQUOTES */,110 ),
	/* State 98 */ new Array(  ),
	/* State 99 */ new Array( 33/* EXPR */,38 , 37/* STRINGKEEPQUOTES */,25 ),
	/* State 100 */ new Array(  ),
	/* State 101 */ new Array(  ),
	/* State 102 */ new Array(  ),
	/* State 103 */ new Array(  ),
	/* State 104 */ new Array( 53/* ATTRIBUTE */,125 , 39/* STRING */,126 ),
	/* State 105 */ new Array(  ),
	/* State 106 */ new Array(  ),
	/* State 107 */ new Array(  ),
	/* State 108 */ new Array( 38/* JS */,129 , 37/* STRINGKEEPQUOTES */,110 ),
	/* State 109 */ new Array(  ),
	/* State 110 */ new Array(  ),
	/* State 111 */ new Array( 38/* JS */,131 , 37/* STRINGKEEPQUOTES */,110 ),
	/* State 112 */ new Array( 38/* JS */,132 , 37/* STRINGKEEPQUOTES */,110 ),
	/* State 113 */ new Array(  ),
	/* State 114 */ new Array(  ),
	/* State 115 */ new Array(  ),
	/* State 116 */ new Array(  ),
	/* State 117 */ new Array(  ),
	/* State 118 */ new Array(  ),
	/* State 119 */ new Array(  ),
	/* State 120 */ new Array(  ),
	/* State 121 */ new Array( 30/* TYPE */,133 ),
	/* State 122 */ new Array(  ),
	/* State 123 */ new Array(  ),
	/* State 124 */ new Array(  ),
	/* State 125 */ new Array(  ),
	/* State 126 */ new Array(  ),
	/* State 127 */ new Array( 49/* TEXT */,83 , 48/* INSERT */,134 ),
	/* State 128 */ new Array( 52/* STYLE */,136 , 54/* STYLEATTRIBUTE */,137 ),
	/* State 129 */ new Array( 38/* JS */,129 , 37/* STRINGKEEPQUOTES */,110 ),
	/* State 130 */ new Array(  ),
	/* State 131 */ new Array( 38/* JS */,129 , 37/* STRINGKEEPQUOTES */,110 ),
	/* State 132 */ new Array( 38/* JS */,129 , 37/* STRINGKEEPQUOTES */,110 ),
	/* State 133 */ new Array(  ),
	/* State 134 */ new Array(  ),
	/* State 135 */ new Array( 33/* EXPR */,143 , 37/* STRINGKEEPQUOTES */,25 ),
	/* State 136 */ new Array(  ),
	/* State 137 */ new Array(  ),
	/* State 138 */ new Array(  ),
	/* State 139 */ new Array(  ),
	/* State 140 */ new Array(  ),
	/* State 141 */ new Array( 38/* JS */,147 , 37/* STRINGKEEPQUOTES */,110 ),
	/* State 142 */ new Array(  ),
	/* State 143 */ new Array( 33/* EXPR */,38 , 37/* STRINGKEEPQUOTES */,25 ),
	/* State 144 */ new Array( 54/* STYLEATTRIBUTE */,149 ),
	/* State 145 */ new Array(  ),
	/* State 146 */ new Array( 49/* TEXT */,150 ),
	/* State 147 */ new Array( 38/* JS */,129 , 37/* STRINGKEEPQUOTES */,110 ),
	/* State 148 */ new Array(  ),
	/* State 149 */ new Array(  ),
	/* State 150 */ new Array( 49/* TEXT */,73 ),
	/* State 151 */ new Array(  )
);



/* Symbol labels */
var labels = new Array(
	"TOP'" /* Non-terminal symbol */,
	"WHITESPACE" /* Terminal symbol */,
	"TEXTNODE" /* Terminal symbol */,
	"template" /* Terminal symbol */,
	"function" /* Terminal symbol */,
	"state" /* Terminal symbol */,
	"f:each" /* Terminal symbol */,
	"f:call" /* Terminal symbol */,
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
	"JSFUN" /* Non-terminal symbol */,
	"EXPR" /* Non-terminal symbol */,
	"STATE" /* Non-terminal symbol */,
	"LETLISTBLOCK" /* Non-terminal symbol */,
	"XML" /* Non-terminal symbol */,
	"STRINGKEEPQUOTES" /* Non-terminal symbol */,
	"JS" /* Non-terminal symbol */,
	"STRING" /* Non-terminal symbol */,
	"OPENFOREACH" /* Non-terminal symbol */,
	"CLOSEFOREACH" /* Non-terminal symbol */,
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
		act = 153;
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
		if( act == 153 )
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
			
			while( act == 153 && la != 55 )
			{
				if( _dbg_withtrace )
					__dbg_print( "\tError recovery\n" +
									"Current lookahead: " + labels[la] + " (" + info.att + ")\n" +
									"Action: " + act + "\n\n" );
				if( la == -1 )
					info.offset++;
					
				while( act == 153 && sstack.length > 0 )
				{
					sstack.pop();
					vstack.pop();
					
					if( sstack.length == 0 )
						break;
						
					act = 153;
					for( var i = 0; i < act_tab[sstack[sstack.length-1]].length; i+=2 )
					{
						if( act_tab[sstack[sstack.length-1]][i] == la )
						{
							act = act_tab[sstack[sstack.length-1]][i+1];
							break;
						}
					}
				}
				
				if( act != 153 )
					break;
				
				for( var i = 0; i < rsstack.length; i++ )
				{
					sstack.push( rsstack[i] );
					vstack.push( rvstack[i] );
				}
				
				la = __lex( info );
			}
			
			if( act == 153 )
			{
				if( _dbg_withtrace )
					__dbg_print( "\tError recovery failed, terminating parse process..." );
				break;
			}


			if( _dbg_withtrace )
				__dbg_print( "\tError recovery succeeded, continuing" );
		}
		
		/*
		if( act == 153 )
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
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 13:
	{
		 rval = {kind: "lineTemplate", template: vstack[ vstack.length - 1 ]} ; 
	}
	break;
	case 14:
	{
		 rval = makeExpr(vstack[ vstack.length - 1 ]); 
	}
	break;
	case 15:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 16:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 17:
	{
		 rval = makeXMLLine(vstack[ vstack.length - 1 ]); 
	}
	break;
	case 18:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 19:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 20:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 21:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 22:
	{
		 rval = vstack[ vstack.length - 2 ] + " " + vstack[ vstack.length - 1 ]; 
	}
	break;
	case 23:
	{
		 rval = makeExpr(vstack[ vstack.length - 2 ], vstack[ vstack.length - 3 ]); 
	}
	break;
	case 24:
	{
		 rval = makeJSFun(vstack[ vstack.length - 5 ], vstack[ vstack.length - 2 ]); 
	}
	break;
	case 25:
	{
		 rval = makeJSFun(vstack[ vstack.length - 8 ], vstack[ vstack.length - 2 ], vstack[ vstack.length - 4 ]); 
	}
	break;
	case 26:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 27:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 28:
	{
		 rval = "(" + vstack[ vstack.length - 2 ] + ")" 
	}
	break;
	case 29:
	{
		 rval = "{" + vstack[ vstack.length - 2 ] + "}"; 
	}
	break;
	case 30:
	{
		rval = vstack[ vstack.length - 1 ];
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
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 36:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 37:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 38:
	{
		 rval = vstack[ vstack.length - 2 ] + " " + vstack[ vstack.length - 1 ]; 
	}
	break;
	case 39:
	{
		rval = vstack[ vstack.length - 0 ];
	}
	break;
	case 40:
	{
		 rval = makeState(vstack[ vstack.length - 4 ], makeExpr(vstack[ vstack.length - 2 ])); 
	}
	break;
	case 41:
	{
		 rval = makeVariable( vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 42:
	{
		 rval = makeVariable( vstack[ vstack.length - 4 ], vstack[ vstack.length - 1 ]); 
	}
	break;
	case 43:
	{
		 rval = makeForEach(vstack[ vstack.length - 4 ], vstack[ vstack.length - 3 ], vstack[ vstack.length - 2 ]); 
	}
	break;
	case 44:
	{
		 rval = makeCall(vstack[ vstack.length - 3 ], vstack[ vstack.length - 2 ]); 
	}
	break;
	case 45:
	{
		 rval = makeNode(vstack[ vstack.length - 3 ], vstack[ vstack.length - 2 ]); 
	}
	break;
	case 46:
	{
		 rval = makeNode(vstack[ vstack.length - 1 ], []); 
	}
	break;
	case 47:
	{
		 rval = makeTextElement(vstack[ vstack.length - 1 ]); 
	}
	break;
	case 48:
	{
		 rval = push(vstack[ vstack.length - 2 ], vstack[ vstack.length - 1 ]); 
	}
	break;
	case 49:
	{
		 rval = []; 
	}
	break;
	case 50:
	{
		 rval = makeInsert(vstack[ vstack.length - 2 ]); 
	}
	break;
	case 51:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 52:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 53:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 54:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 55:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 56:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 57:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 58:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 59:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 60:
	{
		 rval = "" + vstack[ vstack.length - 2 ] + " " + vstack[ vstack.length - 1 ]; 
	}
	break;
	case 61:
	{
		 rval = vstack[ vstack.length - 2 ]; 
	}
	break;
	case 62:
	{
		 rval = undefined; 
	}
	break;
	case 63:
	{
		rval = vstack[ vstack.length - 3 ];
	}
	break;
	case 64:
	{
		 rval = undefined; 
	}
	break;
	case 65:
	{
		 rval = makeOpenTag(vstack[ vstack.length - 3 ], vstack[ vstack.length - 2 ]); 
	}
	break;
	case 66:
	{
		 rval = undefined; 
	}
	break;
	case 67:
	{
		 rval = {openTag: makeOpenTag(vstack[ vstack.length - 4 ], vstack[ vstack.length - 3 ])}; 
	}
	break;
	case 68:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 69:
	{
		 rval = vstack[ vstack.length - 3 ] + vstack[ vstack.length - 2 ] + vstack[ vstack.length - 1 ]; 
	}
	break;
	case 70:
	{
		 vstack[ vstack.length - 6 ][vstack[ vstack.length - 5 ]] = vstack[ vstack.length - 2 ]; rval = vstack[ vstack.length - 6 ];
	}
	break;
	case 71:
	{
		 vstack[ vstack.length - 4 ][vstack[ vstack.length - 3 ]] = vstack[ vstack.length - 1 ]; rval = vstack[ vstack.length - 4 ];
	}
	break;
	case 72:
	{
		 rval = {}; 
	}
	break;
	case 73:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 74:
	{
		 rval = vstack[ vstack.length - 2 ]; 
	}
	break;
	case 75:
	{
		 rval = vstack[ vstack.length - 3 ] + vstack[ vstack.length - 2 ] + vstack[ vstack.length - 1 ]; 
	}
	break;
	case 76:
	{
		 rval = vstack[ vstack.length - 2 ]; 
	}
	break;
	case 77:
	{
		 rval = push(vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ]); 
	}
	break;
	case 78:
	{
		 rval = [vstack[ vstack.length - 1 ]]; 
	}
	break;
	case 79:
	{
		 rval = []; 
	}
	break;
	case 80:
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


