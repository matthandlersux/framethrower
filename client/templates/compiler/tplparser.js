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
		typeString += " -> XMLP";

		return {
			kind: "templateCode",
			params: params,
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

	function makeOpenTag(name, attributes, textNode) {
		return {
			name: name,
			attributes: attributes,
			textNode: textNode
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
			var first = text.substr(0, index-1);
			var insert = text.substr(index+1, rindex-index-1);
			text = text.substr(rindex+1);
			output.push(makeTextElement(first));
			output.push(makeInsert(insert));
			index = text.indexOf('{');
		}
		return output;
	}

	function makeNode(openTag, xmlp) {
		var attributes = openTag.attributes;
		var style = attributes.style;
		attributes.style = undefined;
		var attributeList = [];
		for (name in attributes) {
			if(attributes[name] !== undefined) {
				var att = {};
				att[name] = attributes[name];
				attributeList.push(att);
			}
		}
		
		//prepend textNode to xmlp
		if(openTag.textNode !== undefined) {
			xmlp.unshift(openTag.textNode);
		}
		
		//deal with inserts in textNodes
		for(var i=0; i<xmlp.length; i++) {
			var textNodeList = checkForInsert(xmlp[i]);
			if(textNodeList !== undefined) {
				xmlp.splice(i, 1);
				for (var j=textNodeList.length-1; j>=0; j--) {
					xmlp.splice(i, 0, textNodeList[j]);
				}
			}
		}
		
		return {
			kind: "element",
			nodeName: openTag.name,
			attributes: attributeList,
			style: style,
			children: xmlp
		};
	}

	function makeAttribute (name, value) {
		var a = {};
		a[name] = value;
		return a;
	}

	function makeTextElement (text) {
		return {
			kind: "textElement",
			nodeValue: text,
		};
	}

	function makeInsert (expr) {
		return {
			kind: "insert",
			expr: expr
		};
	}

	function push (list, item) {
		list.push(item);
		return list;
	}
	
	function pushOrConcat (list, itemOrList) {
		if (arrayLike(itemOrList)) {
			forEach(itemOrList, function(item) {
				if (item !== undefined) {
					list.push(item);
				}
			});
		} else {
			list.push(item);
		}
		return list;
	}	

	function flatten (itemOrList) {
		if(arrayLike(itemOrList)) {
			return itemOrList[0];
		} else {
			return itemOrList;
		}
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
			return 53;

		do
		{

switch( state )
{
	case 0:
		if( ( info.src.charCodeAt( pos ) >= 9 && info.src.charCodeAt( pos ) <= 10 ) || info.src.charCodeAt( pos ) == 13 || info.src.charCodeAt( pos ) == 32 ) state = 1;
		else if( info.src.charCodeAt( pos ) == 34 ) state = 2;
		else if( info.src.charCodeAt( pos ) == 40 ) state = 3;
		else if( info.src.charCodeAt( pos ) == 41 ) state = 4;
		else if( ( info.src.charCodeAt( pos ) >= 42 && info.src.charCodeAt( pos ) <= 43 ) || info.src.charCodeAt( pos ) == 45 ) state = 5;
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
		else if( info.src.charCodeAt( pos ) == 46 ) state = 24;
		else if( info.src.charCodeAt( pos ) == 102 ) state = 25;
		else if( info.src.charCodeAt( pos ) == 115 ) state = 44;
		else if( info.src.charCodeAt( pos ) == 116 ) state = 51;
		else state = -1;
		break;

	case 1:
		state = -1;
		match = 1;
		match_pos = pos;
		break;

	case 2:
		state = -1;
		match = 20;
		match_pos = pos;
		break;

	case 3:
		state = -1;
		match = 10;
		match_pos = pos;
		break;

	case 4:
		state = -1;
		match = 11;
		match_pos = pos;
		break;

	case 5:
		state = -1;
		match = 21;
		match_pos = pos;
		break;

	case 6:
		state = -1;
		match = 12;
		match_pos = pos;
		break;

	case 7:
		if( info.src.charCodeAt( pos ) == 47 ) state = 23;
		else state = -1;
		match = 17;
		match_pos = pos;
		break;

	case 8:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else state = -1;
		match = 22;
		match_pos = pos;
		break;

	case 9:
		state = -1;
		match = 14;
		match_pos = pos;
		break;

	case 10:
		state = -1;
		match = 13;
		match_pos = pos;
		break;

	case 11:
		if( info.src.charCodeAt( pos ) == 47 ) state = 16;
		else state = -1;
		match = 18;
		match_pos = pos;
		break;

	case 12:
		state = -1;
		match = 15;
		match_pos = pos;
		break;

	case 13:
		state = -1;
		match = 19;
		match_pos = pos;
		break;

	case 14:
		state = -1;
		match = 8;
		match_pos = pos;
		break;

	case 15:
		state = -1;
		match = 9;
		match_pos = pos;
		break;

	case 16:
		state = -1;
		match = 16;
		match_pos = pos;
		break;

	case 17:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else state = -1;
		match = 4;
		match_pos = pos;
		break;

	case 18:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else state = -1;
		match = 7;
		match_pos = pos;
		break;

	case 19:
		state = -1;
		match = 6;
		match_pos = pos;
		break;

	case 20:
		state = -1;
		match = 5;
		match_pos = pos;
		break;

	case 21:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else state = -1;
		match = 3;
		match_pos = pos;
		break;

	case 22:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else state = -1;
		match = 2;
		match_pos = pos;
		break;

	case 23:
		if( info.src.charCodeAt( pos ) == 10 ) state = 1;
		else if( ( info.src.charCodeAt( pos ) >= 0 && info.src.charCodeAt( pos ) <= 9 ) || ( info.src.charCodeAt( pos ) >= 11 && info.src.charCodeAt( pos ) <= 254 ) ) state = 23;
		else state = -1;
		break;

	case 24:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else state = -1;
		match = 21;
		match_pos = pos;
		break;

	case 25:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 116 ) || ( info.src.charCodeAt( pos ) >= 118 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 58 ) state = 26;
		else if( info.src.charCodeAt( pos ) == 117 ) state = 49;
		else state = -1;
		match = 22;
		match_pos = pos;
		break;

	case 26:
		if( info.src.charCodeAt( pos ) == 99 ) state = 28;
		else if( info.src.charCodeAt( pos ) == 101 ) state = 37;
		else state = -1;
		break;

	case 27:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 100 ) || ( info.src.charCodeAt( pos ) >= 102 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 101 ) state = 17;
		else state = -1;
		match = 22;
		match_pos = pos;
		break;

	case 28:
		if( info.src.charCodeAt( pos ) == 97 ) state = 30;
		else state = -1;
		break;

	case 29:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 100 ) || ( info.src.charCodeAt( pos ) >= 102 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 101 ) state = 18;
		else state = -1;
		match = 22;
		match_pos = pos;
		break;

	case 30:
		if( info.src.charCodeAt( pos ) == 108 ) state = 34;
		else state = -1;
		break;

	case 31:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 109 ) || ( info.src.charCodeAt( pos ) >= 111 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 110 ) state = 21;
		else state = -1;
		match = 22;
		match_pos = pos;
		break;

	case 32:
		if( info.src.charCodeAt( pos ) == 99 ) state = 35;
		else state = -1;
		break;

	case 33:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 100 ) || ( info.src.charCodeAt( pos ) >= 102 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 101 ) state = 22;
		else state = -1;
		match = 22;
		match_pos = pos;
		break;

	case 34:
		if( info.src.charCodeAt( pos ) == 108 ) state = 19;
		else state = -1;
		break;

	case 35:
		if( info.src.charCodeAt( pos ) == 104 ) state = 20;
		else state = -1;
		break;

	case 36:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 115 ) || ( info.src.charCodeAt( pos ) >= 117 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 116 ) state = 27;
		else state = -1;
		match = 22;
		match_pos = pos;
		break;

	case 37:
		if( info.src.charCodeAt( pos ) == 97 ) state = 32;
		else state = -1;
		break;

	case 38:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 107 ) || ( info.src.charCodeAt( pos ) >= 109 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 108 ) state = 29;
		else state = -1;
		match = 22;
		match_pos = pos;
		break;

	case 39:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 110 ) || ( info.src.charCodeAt( pos ) >= 112 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 111 ) state = 31;
		else state = -1;
		match = 22;
		match_pos = pos;
		break;

	case 40:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 115 ) || ( info.src.charCodeAt( pos ) >= 117 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 116 ) state = 33;
		else state = -1;
		match = 22;
		match_pos = pos;
		break;

	case 41:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 98 && info.src.charCodeAt( pos ) <= 120 ) || info.src.charCodeAt( pos ) == 122 ) state = 8;
		else if( info.src.charCodeAt( pos ) == 97 ) state = 36;
		else if( info.src.charCodeAt( pos ) == 121 ) state = 38;
		else state = -1;
		match = 22;
		match_pos = pos;
		break;

	case 42:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 104 ) || ( info.src.charCodeAt( pos ) >= 106 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 105 ) state = 39;
		else state = -1;
		match = 22;
		match_pos = pos;
		break;

	case 43:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 98 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 97 ) state = 40;
		else state = -1;
		match = 22;
		match_pos = pos;
		break;

	case 44:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 115 ) || ( info.src.charCodeAt( pos ) >= 117 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 116 ) state = 41;
		else state = -1;
		match = 22;
		match_pos = pos;
		break;

	case 45:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 115 ) || ( info.src.charCodeAt( pos ) >= 117 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 116 ) state = 42;
		else state = -1;
		match = 22;
		match_pos = pos;
		break;

	case 46:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 107 ) || ( info.src.charCodeAt( pos ) >= 109 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 108 ) state = 43;
		else state = -1;
		match = 22;
		match_pos = pos;
		break;

	case 47:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 98 ) || ( info.src.charCodeAt( pos ) >= 100 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 99 ) state = 45;
		else state = -1;
		match = 22;
		match_pos = pos;
		break;

	case 48:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 111 ) || ( info.src.charCodeAt( pos ) >= 113 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 112 ) state = 46;
		else state = -1;
		match = 22;
		match_pos = pos;
		break;

	case 49:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 109 ) || ( info.src.charCodeAt( pos ) >= 111 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 110 ) state = 47;
		else state = -1;
		match = 22;
		match_pos = pos;
		break;

	case 50:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 108 ) || ( info.src.charCodeAt( pos ) >= 110 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 109 ) state = 48;
		else state = -1;
		match = 22;
		match_pos = pos;
		break;

	case 51:
		if( info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 100 ) || ( info.src.charCodeAt( pos ) >= 102 && info.src.charCodeAt( pos ) <= 122 ) ) state = 8;
		else if( info.src.charCodeAt( pos ) == 101 ) state = 50;
		else state = -1;
		match = 22;
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
	new Array( 25/* TOP */, 1 ),
	new Array( 25/* TOP */, 1 ),
	new Array( 23/* TEMPLATE */, 8 ),
	new Array( 26/* ARGLIST */, 3 ),
	new Array( 26/* ARGLIST */, 1 ),
	new Array( 26/* ARGLIST */, 0 ),
	new Array( 29/* TYPE */, 2 ),
	new Array( 29/* TYPE */, 1 ),
	new Array( 24/* LETLIST */, 3 ),
	new Array( 24/* LETLIST */, 0 ),
	new Array( 30/* LET */, 3 ),
	new Array( 27/* STMT */, 1 ),
	new Array( 27/* STMT */, 1 ),
	new Array( 27/* STMT */, 1 ),
	new Array( 27/* STMT */, 1 ),
	new Array( 27/* STMT */, 1 ),
	new Array( 27/* STMT */, 1 ),
	new Array( 32/* EXPR */, 1 ),
	new Array( 32/* EXPR */, 1 ),
	new Array( 32/* EXPR */, 1 ),
	new Array( 32/* EXPR */, 1 ),
	new Array( 32/* EXPR */, 2 ),
	new Array( 34/* LETLISTBLOCK */, 4 ),
	new Array( 31/* JSFUN */, 7 ),
	new Array( 31/* JSFUN */, 10 ),
	new Array( 37/* JS */, 1 ),
	new Array( 37/* JS */, 1 ),
	new Array( 37/* JS */, 3 ),
	new Array( 37/* JS */, 3 ),
	new Array( 37/* JS */, 1 ),
	new Array( 37/* JS */, 1 ),
	new Array( 37/* JS */, 1 ),
	new Array( 37/* JS */, 1 ),
	new Array( 37/* JS */, 2 ),
	new Array( 37/* JS */, 0 ),
	new Array( 33/* STATE */, 6 ),
	new Array( 28/* VARIABLE */, 1 ),
	new Array( 28/* VARIABLE */, 4 ),
	new Array( 35/* XML */, 4 ),
	new Array( 35/* XML */, 4 ),
	new Array( 35/* XML */, 3 ),
	new Array( 35/* XML */, 1 ),
	new Array( 35/* XML */, 1 ),
	new Array( 43/* XMLLIST */, 2 ),
	new Array( 43/* XMLLIST */, 0 ),
	new Array( 47/* INSERT */, 3 ),
	new Array( 46/* TEXT */, 1 ),
	new Array( 46/* TEXT */, 1 ),
	new Array( 46/* TEXT */, 1 ),
	new Array( 46/* TEXT */, 1 ),
	new Array( 46/* TEXT */, 1 ),
	new Array( 46/* TEXT */, 1 ),
	new Array( 46/* TEXT */, 1 ),
	new Array( 46/* TEXT */, 1 ),
	new Array( 46/* TEXT */, 1 ),
	new Array( 46/* TEXT */, 1 ),
	new Array( 46/* TEXT */, 2 ),
	new Array( 38/* OPENFOREACH */, 4 ),
	new Array( 39/* CLOSEFOREACH */, 3 ),
	new Array( 40/* OPENCALL */, 3 ),
	new Array( 41/* CLOSECALL */, 3 ),
	new Array( 42/* OPENTAG */, 4 ),
	new Array( 44/* CLOSETAG */, 3 ),
	new Array( 45/* SINGLETAG */, 5 ),
	new Array( 49/* TAGNAME */, 1 ),
	new Array( 49/* TAGNAME */, 3 ),
	new Array( 48/* ATTRIBUTES */, 6 ),
	new Array( 48/* ATTRIBUTES */, 4 ),
	new Array( 48/* ATTRIBUTES */, 0 ),
	new Array( 51/* ATTRIBUTE */, 1 ),
	new Array( 51/* ATTRIBUTE */, 3 ),
	new Array( 36/* STRING */, 3 ),
	new Array( 50/* STYLE */, 3 ),
	new Array( 50/* STYLE */, 1 ),
	new Array( 50/* STYLE */, 0 ),
	new Array( 52/* STYLEATTRIBUTE */, 3 )
);

/* Action-Table */
var act_tab = new Array(
	/* State 0 */ new Array( 2/* "template" */,4 , 53/* "$" */,-10 , 22/* "IDENTIFIER" */,-10 ),
	/* State 1 */ new Array( 53/* "$" */,0 ),
	/* State 2 */ new Array( 53/* "$" */,-1 ),
	/* State 3 */ new Array( 22/* "IDENTIFIER" */,7 , 53/* "$" */,-2 ),
	/* State 4 */ new Array( 10/* "(" */,8 ),
	/* State 5 */ new Array( 12/* "," */,9 ),
	/* State 6 */ new Array( 15/* "=" */,10 ),
	/* State 7 */ new Array( 14/* ":" */,11 , 15/* "=" */,-37 , 11/* ")" */,-37 , 12/* "," */,-37 ),
	/* State 8 */ new Array( 22/* "IDENTIFIER" */,7 , 11/* ")" */,-6 , 12/* "," */,-6 ),
	/* State 9 */ new Array( 53/* "$" */,-9 , 22/* "IDENTIFIER" */,-9 , 2/* "template" */,-9 , 3/* "function" */,-9 , 10/* "(" */,-9 , 11/* ")" */,-9 , 4/* "state" */,-9 , 8/* "{" */,-9 , 20/* "QUOTE" */,-9 , 18/* "<" */,-9 , 12/* "," */,-9 , 14/* ":" */,-9 , 13/* ";" */,-9 , 15/* "=" */,-9 , 9/* "}" */,-9 ),
	/* State 10 */ new Array( 3/* "function" */,21 , 2/* "template" */,4 , 10/* "(" */,22 , 11/* ")" */,23 , 22/* "IDENTIFIER" */,24 , 4/* "state" */,26 , 8/* "{" */,27 , 20/* "QUOTE" */,33 , 18/* "<" */,34 , 12/* "," */,35 , 14/* ":" */,36 , 13/* ";" */,37 , 15/* "=" */,38 , 9/* "}" */,39 ),
	/* State 11 */ new Array( 14/* ":" */,40 ),
	/* State 12 */ new Array( 12/* "," */,41 , 11/* ")" */,42 ),
	/* State 13 */ new Array( 11/* ")" */,-5 , 12/* "," */,-5 ),
	/* State 14 */ new Array( 12/* "," */,-11 ),
	/* State 15 */ new Array( 12/* "," */,-12 , 9/* "}" */,-12 , 16/* "</" */,-12 ),
	/* State 16 */ new Array( 12/* "," */,-13 , 9/* "}" */,-13 , 16/* "</" */,-13 ),
	/* State 17 */ new Array( 10/* "(" */,44 , 11/* ")" */,45 , 22/* "IDENTIFIER" */,46 , 20/* "QUOTE" */,47 , 12/* "," */,-14 , 9/* "}" */,-14 , 16/* "</" */,-14 ),
	/* State 18 */ new Array( 12/* "," */,-15 , 9/* "}" */,-15 , 16/* "</" */,-15 ),
	/* State 19 */ new Array( 12/* "," */,-16 , 9/* "}" */,-16 , 16/* "</" */,-16 ),
	/* State 20 */ new Array( 12/* "," */,-17 , 9/* "}" */,-17 , 16/* "</" */,-17 ),
	/* State 21 */ new Array( 10/* "(" */,48 ),
	/* State 22 */ new Array( 12/* "," */,-18 , 10/* "(" */,-18 , 11/* ")" */,-18 , 22/* "IDENTIFIER" */,-18 , 20/* "QUOTE" */,-18 , 9/* "}" */,-18 , 16/* "</" */,-18 , 14/* ":" */,-50 , 13/* ";" */,-50 , 15/* "=" */,-50 , 8/* "{" */,-50 ),
	/* State 23 */ new Array( 12/* "," */,-19 , 10/* "(" */,-19 , 11/* ")" */,-19 , 22/* "IDENTIFIER" */,-19 , 20/* "QUOTE" */,-19 , 9/* "}" */,-19 , 16/* "</" */,-19 , 14/* ":" */,-51 , 13/* ";" */,-51 , 15/* "=" */,-51 , 8/* "{" */,-51 ),
	/* State 24 */ new Array( 12/* "," */,-20 , 10/* "(" */,-20 , 11/* ")" */,-20 , 22/* "IDENTIFIER" */,-20 , 20/* "QUOTE" */,-20 , 14/* ":" */,-47 , 13/* ";" */,-47 , 15/* "=" */,-47 , 9/* "}" */,-47 , 8/* "{" */,-47 ),
	/* State 25 */ new Array( 12/* "," */,-21 , 10/* "(" */,-21 , 11/* ")" */,-21 , 22/* "IDENTIFIER" */,-21 , 20/* "QUOTE" */,-21 , 9/* "}" */,-21 , 16/* "</" */,-21 ),
	/* State 26 */ new Array( 10/* "(" */,49 ),
	/* State 27 */ new Array( 12/* "," */,-10 , 22/* "IDENTIFIER" */,-10 , 20/* "QUOTE" */,-10 , 10/* "(" */,-10 , 11/* ")" */,-10 , 14/* ":" */,-10 , 13/* ";" */,-10 , 15/* "=" */,-10 , 9/* "}" */,-10 , 8/* "{" */,-10 , 16/* "</" */,-56 , 2/* "template" */,-10 , 3/* "function" */,-10 , 4/* "state" */,-10 , 18/* "<" */,-10 ),
	/* State 28 */ new Array( 2/* "template" */,-10 , 3/* "function" */,-10 , 10/* "(" */,-10 , 11/* ")" */,-10 , 22/* "IDENTIFIER" */,-10 , 4/* "state" */,-10 , 8/* "{" */,-10 , 20/* "QUOTE" */,-10 , 18/* "<" */,-10 , 12/* "," */,-10 , 14/* ":" */,-10 , 13/* ";" */,-10 , 15/* "=" */,-10 , 9/* "}" */,-10 ),
	/* State 29 */ new Array( 2/* "template" */,-10 , 3/* "function" */,-10 , 10/* "(" */,-10 , 11/* ")" */,-10 , 22/* "IDENTIFIER" */,-10 , 4/* "state" */,-10 , 8/* "{" */,-10 , 20/* "QUOTE" */,-10 , 18/* "<" */,-10 , 12/* "," */,-10 , 14/* ":" */,-10 , 13/* ";" */,-10 , 15/* "=" */,-10 , 9/* "}" */,-10 ),
	/* State 30 */ new Array( 16/* "</" */,-45 , 18/* "<" */,-45 , 22/* "IDENTIFIER" */,-45 , 20/* "QUOTE" */,-45 , 12/* "," */,-45 , 10/* "(" */,-45 , 11/* ")" */,-45 , 14/* ":" */,-45 , 13/* ";" */,-45 , 15/* "=" */,-45 , 9/* "}" */,-45 , 8/* "{" */,-45 ),
	/* State 31 */ new Array( 12/* "," */,-42 , 9/* "}" */,-42 , 16/* "</" */,-42 , 18/* "<" */,-42 , 22/* "IDENTIFIER" */,-42 , 20/* "QUOTE" */,-42 , 10/* "(" */,-42 , 11/* ")" */,-42 , 14/* ":" */,-42 , 13/* ";" */,-42 , 15/* "=" */,-42 , 8/* "{" */,-42 ),
	/* State 32 */ new Array( 22/* "IDENTIFIER" */,55 , 20/* "QUOTE" */,56 , 12/* "," */,35 , 10/* "(" */,57 , 11/* ")" */,58 , 14/* ":" */,36 , 13/* ";" */,37 , 15/* "=" */,38 , 9/* "}" */,39 , 8/* "{" */,59 , 16/* "</" */,-43 , 18/* "<" */,-43 ),
	/* State 33 */ new Array( 22/* "IDENTIFIER" */,55 , 20/* "QUOTE" */,56 , 12/* "," */,35 , 10/* "(" */,57 , 11/* ")" */,58 , 14/* ":" */,36 , 13/* ";" */,37 , 15/* "=" */,38 , 9/* "}" */,39 , 8/* "{" */,59 , 16/* "</" */,-48 ),
	/* State 34 */ new Array( 6/* "f:call" */,62 , 5/* "f:each" */,63 , 22/* "IDENTIFIER" */,64 ),
	/* State 35 */ new Array( 12/* "," */,-49 , 22/* "IDENTIFIER" */,-49 , 20/* "QUOTE" */,-49 , 10/* "(" */,-49 , 11/* ")" */,-49 , 14/* ":" */,-49 , 13/* ";" */,-49 , 15/* "=" */,-49 , 9/* "}" */,-49 , 8/* "{" */,-49 , 16/* "</" */,-49 , 18/* "<" */,-49 ),
	/* State 36 */ new Array( 12/* "," */,-52 , 22/* "IDENTIFIER" */,-52 , 20/* "QUOTE" */,-52 , 10/* "(" */,-52 , 11/* ")" */,-52 , 14/* ":" */,-52 , 13/* ";" */,-52 , 15/* "=" */,-52 , 9/* "}" */,-52 , 8/* "{" */,-52 , 16/* "</" */,-52 , 18/* "<" */,-52 ),
	/* State 37 */ new Array( 12/* "," */,-53 , 22/* "IDENTIFIER" */,-53 , 20/* "QUOTE" */,-53 , 10/* "(" */,-53 , 11/* ")" */,-53 , 14/* ":" */,-53 , 13/* ";" */,-53 , 15/* "=" */,-53 , 9/* "}" */,-53 , 8/* "{" */,-53 , 16/* "</" */,-53 , 18/* "<" */,-53 ),
	/* State 38 */ new Array( 12/* "," */,-54 , 22/* "IDENTIFIER" */,-54 , 20/* "QUOTE" */,-54 , 10/* "(" */,-54 , 11/* ")" */,-54 , 14/* ":" */,-54 , 13/* ";" */,-54 , 15/* "=" */,-54 , 9/* "}" */,-54 , 8/* "{" */,-54 , 16/* "</" */,-54 , 18/* "<" */,-54 ),
	/* State 39 */ new Array( 12/* "," */,-55 , 22/* "IDENTIFIER" */,-55 , 20/* "QUOTE" */,-55 , 10/* "(" */,-55 , 11/* ")" */,-55 , 14/* ":" */,-55 , 13/* ";" */,-55 , 15/* "=" */,-55 , 9/* "}" */,-55 , 8/* "{" */,-55 , 16/* "</" */,-55 , 18/* "<" */,-55 ),
	/* State 40 */ new Array( 22/* "IDENTIFIER" */,66 ),
	/* State 41 */ new Array( 22/* "IDENTIFIER" */,7 ),
	/* State 42 */ new Array( 8/* "{" */,68 ),
	/* State 43 */ new Array( 10/* "(" */,44 , 11/* ")" */,45 , 22/* "IDENTIFIER" */,46 , 20/* "QUOTE" */,47 , 12/* "," */,-22 , 9/* "}" */,-22 , 16/* "</" */,-22 ),
	/* State 44 */ new Array( 12/* "," */,-18 , 10/* "(" */,-18 , 11/* ")" */,-18 , 22/* "IDENTIFIER" */,-18 , 20/* "QUOTE" */,-18 , 9/* "}" */,-18 , 16/* "</" */,-18 ),
	/* State 45 */ new Array( 12/* "," */,-19 , 10/* "(" */,-19 , 11/* ")" */,-19 , 22/* "IDENTIFIER" */,-19 , 20/* "QUOTE" */,-19 , 9/* "}" */,-19 , 16/* "</" */,-19 ),
	/* State 46 */ new Array( 12/* "," */,-20 , 10/* "(" */,-20 , 11/* ")" */,-20 , 22/* "IDENTIFIER" */,-20 , 20/* "QUOTE" */,-20 , 9/* "}" */,-20 , 16/* "</" */,-20 ),
	/* State 47 */ new Array( 22/* "IDENTIFIER" */,55 , 20/* "QUOTE" */,56 , 12/* "," */,35 , 10/* "(" */,57 , 11/* ")" */,58 , 14/* ":" */,36 , 13/* ";" */,37 , 15/* "=" */,38 , 9/* "}" */,39 , 8/* "{" */,59 ),
	/* State 48 */ new Array( 22/* "IDENTIFIER" */,7 , 11/* ")" */,-6 , 12/* "," */,-6 ),
	/* State 49 */ new Array( 20/* "QUOTE" */,47 ),
	/* State 50 */ new Array( 3/* "function" */,21 , 2/* "template" */,4 , 10/* "(" */,22 , 11/* ")" */,23 , 22/* "IDENTIFIER" */,72 , 4/* "state" */,26 , 8/* "{" */,27 , 20/* "QUOTE" */,33 , 18/* "<" */,34 , 12/* "," */,35 , 14/* ":" */,36 , 13/* ";" */,37 , 15/* "=" */,38 , 9/* "}" */,39 ),
	/* State 51 */ new Array( 3/* "function" */,21 , 2/* "template" */,4 , 10/* "(" */,22 , 11/* ")" */,23 , 22/* "IDENTIFIER" */,72 , 4/* "state" */,26 , 8/* "{" */,27 , 20/* "QUOTE" */,33 , 18/* "<" */,34 , 12/* "," */,35 , 14/* ":" */,36 , 13/* ";" */,37 , 15/* "=" */,38 , 9/* "}" */,39 ),
	/* State 52 */ new Array( 3/* "function" */,21 , 2/* "template" */,4 , 10/* "(" */,22 , 11/* ")" */,23 , 22/* "IDENTIFIER" */,72 , 4/* "state" */,26 , 8/* "{" */,27 , 20/* "QUOTE" */,33 , 18/* "<" */,34 , 12/* "," */,35 , 14/* ":" */,36 , 13/* ";" */,37 , 15/* "=" */,38 , 9/* "}" */,39 ),
	/* State 53 */ new Array( 16/* "</" */,77 , 18/* "<" */,34 , 22/* "IDENTIFIER" */,55 , 20/* "QUOTE" */,56 , 12/* "," */,35 , 10/* "(" */,57 , 11/* ")" */,58 , 14/* ":" */,36 , 13/* ";" */,37 , 15/* "=" */,38 , 9/* "}" */,39 , 8/* "{" */,59 ),
	/* State 54 */ new Array( 22/* "IDENTIFIER" */,55 , 20/* "QUOTE" */,56 , 12/* "," */,35 , 10/* "(" */,57 , 11/* ")" */,58 , 14/* ":" */,36 , 13/* ";" */,37 , 15/* "=" */,38 , 9/* "}" */,39 , 8/* "{" */,59 , 16/* "</" */,-57 , 18/* "<" */,-57 ),
	/* State 55 */ new Array( 12/* "," */,-47 , 22/* "IDENTIFIER" */,-47 , 20/* "QUOTE" */,-47 , 10/* "(" */,-47 , 11/* ")" */,-47 , 14/* ":" */,-47 , 13/* ";" */,-47 , 15/* "=" */,-47 , 9/* "}" */,-47 , 8/* "{" */,-47 , 16/* "</" */,-47 , 18/* "<" */,-47 ),
	/* State 56 */ new Array( 12/* "," */,-48 , 22/* "IDENTIFIER" */,-48 , 20/* "QUOTE" */,-48 , 10/* "(" */,-48 , 11/* ")" */,-48 , 14/* ":" */,-48 , 13/* ";" */,-48 , 15/* "=" */,-48 , 9/* "}" */,-48 , 8/* "{" */,-48 , 16/* "</" */,-48 , 18/* "<" */,-48 ),
	/* State 57 */ new Array( 12/* "," */,-50 , 22/* "IDENTIFIER" */,-50 , 20/* "QUOTE" */,-50 , 10/* "(" */,-50 , 11/* ")" */,-50 , 14/* ":" */,-50 , 13/* ";" */,-50 , 15/* "=" */,-50 , 9/* "}" */,-50 , 8/* "{" */,-50 , 16/* "</" */,-50 , 18/* "<" */,-50 ),
	/* State 58 */ new Array( 12/* "," */,-51 , 22/* "IDENTIFIER" */,-51 , 20/* "QUOTE" */,-51 , 10/* "(" */,-51 , 11/* ")" */,-51 , 14/* ":" */,-51 , 13/* ";" */,-51 , 15/* "=" */,-51 , 9/* "}" */,-51 , 8/* "{" */,-51 , 16/* "</" */,-51 , 18/* "<" */,-51 ),
	/* State 59 */ new Array( 12/* "," */,-56 , 22/* "IDENTIFIER" */,-56 , 20/* "QUOTE" */,-56 , 10/* "(" */,-56 , 11/* ")" */,-56 , 14/* ":" */,-56 , 13/* ";" */,-56 , 15/* "=" */,-56 , 9/* "}" */,-56 , 8/* "{" */,-56 , 16/* "</" */,-56 , 18/* "<" */,-56 ),
	/* State 60 */ new Array( 20/* "QUOTE" */,78 , 22/* "IDENTIFIER" */,55 , 12/* "," */,35 , 10/* "(" */,57 , 11/* ")" */,58 , 14/* ":" */,36 , 13/* ";" */,37 , 15/* "=" */,38 , 9/* "}" */,39 , 8/* "{" */,59 ),
	/* State 61 */ new Array( 17/* "/" */,-69 , 19/* ">" */,-69 , 7/* "style" */,-69 , 22/* "IDENTIFIER" */,-69 ),
	/* State 62 */ new Array( 19/* ">" */,80 ),
	/* State 63 */ new Array( 19/* ">" */,-69 , 7/* "style" */,-69 , 22/* "IDENTIFIER" */,-69 ),
	/* State 64 */ new Array( 14/* ":" */,82 , 7/* "style" */,-65 , 22/* "IDENTIFIER" */,-65 , 19/* ">" */,-65 , 17/* "/" */,-65 ),
	/* State 65 */ new Array( 22/* "IDENTIFIER" */,83 , 15/* "=" */,-38 , 11/* ")" */,-38 , 12/* "," */,-38 ),
	/* State 66 */ new Array( 15/* "=" */,-8 , 11/* ")" */,-8 , 12/* "," */,-8 , 22/* "IDENTIFIER" */,-8 , 8/* "{" */,-8 ),
	/* State 67 */ new Array( 11/* ")" */,-4 , 12/* "," */,-4 ),
	/* State 68 */ new Array( 2/* "template" */,-10 , 3/* "function" */,-10 , 10/* "(" */,-10 , 11/* ")" */,-10 , 22/* "IDENTIFIER" */,-10 , 4/* "state" */,-10 , 8/* "{" */,-10 , 20/* "QUOTE" */,-10 , 18/* "<" */,-10 , 12/* "," */,-10 , 14/* ":" */,-10 , 13/* ";" */,-10 , 15/* "=" */,-10 , 9/* "}" */,-10 ),
	/* State 69 */ new Array( 12/* "," */,41 , 11/* ")" */,85 ),
	/* State 70 */ new Array( 12/* "," */,86 ),
	/* State 71 */ new Array( 9/* "}" */,87 ),
	/* State 72 */ new Array( 14/* ":" */,11 , 9/* "}" */,-20 , 10/* "(" */,-20 , 11/* ")" */,-20 , 22/* "IDENTIFIER" */,-20 , 20/* "QUOTE" */,-20 , 16/* "</" */,-20 , 15/* "=" */,-37 , 12/* "," */,-47 , 13/* ";" */,-47 , 8/* "{" */,-47 ),
	/* State 73 */ new Array( 16/* "</" */,89 ),
	/* State 74 */ new Array( 16/* "</" */,91 ),
	/* State 75 */ new Array( 16/* "</" */,-44 , 18/* "<" */,-44 , 22/* "IDENTIFIER" */,-44 , 20/* "QUOTE" */,-44 , 12/* "," */,-44 , 10/* "(" */,-44 , 11/* ")" */,-44 , 14/* ":" */,-44 , 13/* ";" */,-44 , 15/* "=" */,-44 , 9/* "}" */,-44 , 8/* "{" */,-44 ),
	/* State 76 */ new Array( 12/* "," */,-41 , 9/* "}" */,-41 , 16/* "</" */,-41 , 18/* "<" */,-41 , 22/* "IDENTIFIER" */,-41 , 20/* "QUOTE" */,-41 , 10/* "(" */,-41 , 11/* ")" */,-41 , 14/* ":" */,-41 , 13/* ";" */,-41 , 15/* "=" */,-41 , 8/* "{" */,-41 ),
	/* State 77 */ new Array( 22/* "IDENTIFIER" */,64 ),
	/* State 78 */ new Array( 12/* "," */,-48 , 10/* "(" */,-48 , 11/* ")" */,-48 , 22/* "IDENTIFIER" */,-48 , 20/* "QUOTE" */,-48 , 9/* "}" */,-48 , 16/* "</" */,-72 , 8/* "{" */,-48 , 15/* "=" */,-48 , 13/* ";" */,-48 , 21/* "JSSEP" */,-72 , 17/* "/" */,-72 , 19/* ">" */,-72 , 7/* "style" */,-72 , 14/* ":" */,-48 ),
	/* State 79 */ new Array( 22/* "IDENTIFIER" */,93 , 7/* "style" */,94 , 17/* "/" */,95 , 19/* ">" */,96 ),
	/* State 80 */ new Array( 22/* "IDENTIFIER" */,-60 , 2/* "template" */,-60 , 3/* "function" */,-60 , 10/* "(" */,-60 , 11/* ")" */,-60 , 4/* "state" */,-60 , 8/* "{" */,-60 , 20/* "QUOTE" */,-60 , 18/* "<" */,-60 , 12/* "," */,-60 , 14/* ":" */,-60 , 13/* ";" */,-60 , 15/* "=" */,-60 , 9/* "}" */,-60 ),
	/* State 81 */ new Array( 22/* "IDENTIFIER" */,93 , 7/* "style" */,94 , 19/* ">" */,97 ),
	/* State 82 */ new Array( 22/* "IDENTIFIER" */,98 ),
	/* State 83 */ new Array( 15/* "=" */,-7 , 11/* ")" */,-7 , 12/* "," */,-7 , 22/* "IDENTIFIER" */,-7 , 8/* "{" */,-7 ),
	/* State 84 */ new Array( 3/* "function" */,21 , 2/* "template" */,4 , 10/* "(" */,22 , 11/* ")" */,23 , 22/* "IDENTIFIER" */,72 , 4/* "state" */,26 , 8/* "{" */,27 , 20/* "QUOTE" */,33 , 18/* "<" */,34 , 12/* "," */,35 , 14/* ":" */,36 , 13/* ";" */,37 , 15/* "=" */,38 , 9/* "}" */,39 ),
	/* State 85 */ new Array( 8/* "{" */,100 , 14/* ":" */,101 ),
	/* State 86 */ new Array( 10/* "(" */,44 , 11/* ")" */,45 , 22/* "IDENTIFIER" */,46 , 20/* "QUOTE" */,47 ),
	/* State 87 */ new Array( 12/* "," */,-23 , 9/* "}" */,-23 , 16/* "</" */,-23 ),
	/* State 88 */ new Array( 12/* "," */,-39 , 9/* "}" */,-39 , 16/* "</" */,-39 , 18/* "<" */,-39 , 22/* "IDENTIFIER" */,-39 , 20/* "QUOTE" */,-39 , 10/* "(" */,-39 , 11/* ")" */,-39 , 14/* ":" */,-39 , 13/* ";" */,-39 , 15/* "=" */,-39 , 8/* "{" */,-39 ),
	/* State 89 */ new Array( 5/* "f:each" */,103 ),
	/* State 90 */ new Array( 12/* "," */,-40 , 9/* "}" */,-40 , 16/* "</" */,-40 , 18/* "<" */,-40 , 22/* "IDENTIFIER" */,-40 , 20/* "QUOTE" */,-40 , 10/* "(" */,-40 , 11/* ")" */,-40 , 14/* ":" */,-40 , 13/* ";" */,-40 , 15/* "=" */,-40 , 8/* "{" */,-40 ),
	/* State 91 */ new Array( 6/* "f:call" */,104 ),
	/* State 92 */ new Array( 19/* ">" */,105 ),
	/* State 93 */ new Array( 15/* "=" */,106 ),
	/* State 94 */ new Array( 15/* "=" */,107 ),
	/* State 95 */ new Array( 19/* ">" */,108 ),
	/* State 96 */ new Array( 18/* "<" */,-62 , 22/* "IDENTIFIER" */,-62 , 20/* "QUOTE" */,-62 , 12/* "," */,-62 , 10/* "(" */,-62 , 11/* ")" */,-62 , 14/* ":" */,-62 , 13/* ";" */,-62 , 15/* "=" */,-62 , 9/* "}" */,-62 , 8/* "{" */,-62 , 16/* "</" */,-62 ),
	/* State 97 */ new Array( 22/* "IDENTIFIER" */,-58 , 2/* "template" */,-58 , 3/* "function" */,-58 , 10/* "(" */,-58 , 11/* ")" */,-58 , 4/* "state" */,-58 , 8/* "{" */,-58 , 20/* "QUOTE" */,-58 , 18/* "<" */,-58 , 12/* "," */,-58 , 14/* ":" */,-58 , 13/* ";" */,-58 , 15/* "=" */,-58 , 9/* "}" */,-58 ),
	/* State 98 */ new Array( 7/* "style" */,-66 , 22/* "IDENTIFIER" */,-66 , 19/* ">" */,-66 , 17/* "/" */,-66 ),
	/* State 99 */ new Array( 9/* "}" */,109 ),
	/* State 100 */ new Array( 22/* "IDENTIFIER" */,111 , 10/* "(" */,113 , 8/* "{" */,114 , 12/* "," */,115 , 15/* "=" */,116 , 13/* ";" */,117 , 21/* "JSSEP" */,118 , 20/* "QUOTE" */,47 , 9/* "}" */,-35 ),
	/* State 101 */ new Array( 14/* ":" */,119 ),
	/* State 102 */ new Array( 11/* ")" */,120 , 10/* "(" */,44 , 22/* "IDENTIFIER" */,46 , 20/* "QUOTE" */,47 ),
	/* State 103 */ new Array( 19/* ">" */,121 ),
	/* State 104 */ new Array( 19/* ">" */,122 ),
	/* State 105 */ new Array( 12/* "," */,-63 , 9/* "}" */,-63 , 16/* "</" */,-63 , 18/* "<" */,-63 , 22/* "IDENTIFIER" */,-63 , 20/* "QUOTE" */,-63 , 10/* "(" */,-63 , 11/* ")" */,-63 , 14/* ":" */,-63 , 13/* ";" */,-63 , 15/* "=" */,-63 , 8/* "{" */,-63 ),
	/* State 106 */ new Array( 20/* "QUOTE" */,125 ),
	/* State 107 */ new Array( 20/* "QUOTE" */,126 ),
	/* State 108 */ new Array( 12/* "," */,-64 , 9/* "}" */,-64 , 16/* "</" */,-64 , 18/* "<" */,-64 , 22/* "IDENTIFIER" */,-64 , 20/* "QUOTE" */,-64 , 10/* "(" */,-64 , 11/* ")" */,-64 , 14/* ":" */,-64 , 13/* ";" */,-64 , 15/* "=" */,-64 , 8/* "{" */,-64 ),
	/* State 109 */ new Array( 53/* "$" */,-3 , 12/* "," */,-3 , 9/* "}" */,-3 , 16/* "</" */,-3 ),
	/* State 110 */ new Array( 9/* "}" */,128 , 22/* "IDENTIFIER" */,111 , 10/* "(" */,113 , 8/* "{" */,114 , 12/* "," */,115 , 15/* "=" */,116 , 13/* ";" */,117 , 21/* "JSSEP" */,118 , 20/* "QUOTE" */,47 ),
	/* State 111 */ new Array( 9/* "}" */,-26 , 22/* "IDENTIFIER" */,-26 , 20/* "QUOTE" */,-26 , 10/* "(" */,-26 , 8/* "{" */,-26 , 12/* "," */,-26 , 15/* "=" */,-26 , 13/* ";" */,-26 , 21/* "JSSEP" */,-26 , 11/* ")" */,-26 ),
	/* State 112 */ new Array( 9/* "}" */,-27 , 22/* "IDENTIFIER" */,-27 , 20/* "QUOTE" */,-27 , 10/* "(" */,-27 , 8/* "{" */,-27 , 12/* "," */,-27 , 15/* "=" */,-27 , 13/* ";" */,-27 , 21/* "JSSEP" */,-27 , 11/* ")" */,-27 ),
	/* State 113 */ new Array( 22/* "IDENTIFIER" */,111 , 10/* "(" */,113 , 8/* "{" */,114 , 12/* "," */,115 , 15/* "=" */,116 , 13/* ";" */,117 , 21/* "JSSEP" */,118 , 20/* "QUOTE" */,47 , 11/* ")" */,-35 ),
	/* State 114 */ new Array( 22/* "IDENTIFIER" */,111 , 10/* "(" */,113 , 8/* "{" */,114 , 12/* "," */,115 , 15/* "=" */,116 , 13/* ";" */,117 , 21/* "JSSEP" */,118 , 20/* "QUOTE" */,47 , 9/* "}" */,-35 ),
	/* State 115 */ new Array( 9/* "}" */,-30 , 22/* "IDENTIFIER" */,-30 , 20/* "QUOTE" */,-30 , 10/* "(" */,-30 , 8/* "{" */,-30 , 12/* "," */,-30 , 15/* "=" */,-30 , 13/* ";" */,-30 , 21/* "JSSEP" */,-30 , 11/* ")" */,-30 ),
	/* State 116 */ new Array( 9/* "}" */,-31 , 22/* "IDENTIFIER" */,-31 , 20/* "QUOTE" */,-31 , 10/* "(" */,-31 , 8/* "{" */,-31 , 12/* "," */,-31 , 15/* "=" */,-31 , 13/* ";" */,-31 , 21/* "JSSEP" */,-31 , 11/* ")" */,-31 ),
	/* State 117 */ new Array( 9/* "}" */,-32 , 22/* "IDENTIFIER" */,-32 , 20/* "QUOTE" */,-32 , 10/* "(" */,-32 , 8/* "{" */,-32 , 12/* "," */,-32 , 15/* "=" */,-32 , 13/* ";" */,-32 , 21/* "JSSEP" */,-32 , 11/* ")" */,-32 ),
	/* State 118 */ new Array( 9/* "}" */,-33 , 22/* "IDENTIFIER" */,-33 , 20/* "QUOTE" */,-33 , 10/* "(" */,-33 , 8/* "{" */,-33 , 12/* "," */,-33 , 15/* "=" */,-33 , 13/* ";" */,-33 , 21/* "JSSEP" */,-33 , 11/* ")" */,-33 ),
	/* State 119 */ new Array( 22/* "IDENTIFIER" */,66 ),
	/* State 120 */ new Array( 12/* "," */,-36 , 9/* "}" */,-36 , 16/* "</" */,-36 , 11/* ")" */,-19 , 10/* "(" */,-19 , 22/* "IDENTIFIER" */,-19 , 20/* "QUOTE" */,-19 ),
	/* State 121 */ new Array( 12/* "," */,-59 , 9/* "}" */,-59 , 16/* "</" */,-59 , 18/* "<" */,-59 , 22/* "IDENTIFIER" */,-59 , 20/* "QUOTE" */,-59 , 10/* "(" */,-59 , 11/* ")" */,-59 , 14/* ":" */,-59 , 13/* ";" */,-59 , 15/* "=" */,-59 , 8/* "{" */,-59 ),
	/* State 122 */ new Array( 12/* "," */,-61 , 9/* "}" */,-61 , 16/* "</" */,-61 , 18/* "<" */,-61 , 22/* "IDENTIFIER" */,-61 , 20/* "QUOTE" */,-61 , 10/* "(" */,-61 , 11/* ")" */,-61 , 14/* ":" */,-61 , 13/* ";" */,-61 , 15/* "=" */,-61 , 8/* "{" */,-61 ),
	/* State 123 */ new Array( 17/* "/" */,-68 , 19/* ">" */,-68 , 7/* "style" */,-68 , 22/* "IDENTIFIER" */,-68 ),
	/* State 124 */ new Array( 17/* "/" */,-70 , 19/* ">" */,-70 , 7/* "style" */,-70 , 22/* "IDENTIFIER" */,-70 ),
	/* State 125 */ new Array( 8/* "{" */,133 , 22/* "IDENTIFIER" */,55 , 20/* "QUOTE" */,56 , 12/* "," */,35 , 10/* "(" */,57 , 11/* ")" */,58 , 14/* ":" */,36 , 13/* ";" */,37 , 15/* "=" */,38 , 9/* "}" */,39 ),
	/* State 126 */ new Array( 22/* "IDENTIFIER" */,136 , 20/* "QUOTE" */,-75 , 13/* ";" */,-75 ),
	/* State 127 */ new Array( 22/* "IDENTIFIER" */,111 , 10/* "(" */,113 , 8/* "{" */,114 , 12/* "," */,115 , 15/* "=" */,116 , 13/* ";" */,117 , 21/* "JSSEP" */,118 , 20/* "QUOTE" */,47 , 9/* "}" */,-34 , 11/* ")" */,-34 ),
	/* State 128 */ new Array( 12/* "," */,-24 , 9/* "}" */,-24 , 16/* "</" */,-24 ),
	/* State 129 */ new Array( 11/* ")" */,137 , 22/* "IDENTIFIER" */,111 , 10/* "(" */,113 , 8/* "{" */,114 , 12/* "," */,115 , 15/* "=" */,116 , 13/* ";" */,117 , 21/* "JSSEP" */,118 , 20/* "QUOTE" */,47 ),
	/* State 130 */ new Array( 9/* "}" */,138 , 22/* "IDENTIFIER" */,111 , 10/* "(" */,113 , 8/* "{" */,114 , 12/* "," */,115 , 15/* "=" */,116 , 13/* ";" */,117 , 21/* "JSSEP" */,118 , 20/* "QUOTE" */,47 ),
	/* State 131 */ new Array( 22/* "IDENTIFIER" */,83 , 8/* "{" */,139 ),
	/* State 132 */ new Array( 20/* "QUOTE" */,140 ),
	/* State 133 */ new Array( 10/* "(" */,44 , 11/* ")" */,45 , 22/* "IDENTIFIER" */,46 , 20/* "QUOTE" */,47 , 12/* "," */,-56 , 14/* ":" */,-56 , 13/* ";" */,-56 , 15/* "=" */,-56 , 9/* "}" */,-56 , 8/* "{" */,-56 ),
	/* State 134 */ new Array( 13/* ";" */,142 , 20/* "QUOTE" */,143 ),
	/* State 135 */ new Array( 20/* "QUOTE" */,-74 , 13/* ";" */,-74 ),
	/* State 136 */ new Array( 14/* ":" */,144 ),
	/* State 137 */ new Array( 9/* "}" */,-28 , 22/* "IDENTIFIER" */,-28 , 20/* "QUOTE" */,-28 , 10/* "(" */,-28 , 8/* "{" */,-28 , 12/* "," */,-28 , 15/* "=" */,-28 , 13/* ";" */,-28 , 21/* "JSSEP" */,-28 , 11/* ")" */,-28 ),
	/* State 138 */ new Array( 9/* "}" */,-29 , 22/* "IDENTIFIER" */,-29 , 20/* "QUOTE" */,-29 , 10/* "(" */,-29 , 8/* "{" */,-29 , 12/* "," */,-29 , 15/* "=" */,-29 , 13/* ";" */,-29 , 21/* "JSSEP" */,-29 , 11/* ")" */,-29 ),
	/* State 139 */ new Array( 22/* "IDENTIFIER" */,111 , 10/* "(" */,113 , 8/* "{" */,114 , 12/* "," */,115 , 15/* "=" */,116 , 13/* ";" */,117 , 21/* "JSSEP" */,118 , 20/* "QUOTE" */,47 , 9/* "}" */,-35 ),
	/* State 140 */ new Array( 17/* "/" */,-71 , 19/* ">" */,-71 , 7/* "style" */,-71 , 22/* "IDENTIFIER" */,-71 ),
	/* State 141 */ new Array( 9/* "}" */,146 , 10/* "(" */,44 , 11/* ")" */,45 , 22/* "IDENTIFIER" */,46 , 20/* "QUOTE" */,47 ),
	/* State 142 */ new Array( 22/* "IDENTIFIER" */,136 ),
	/* State 143 */ new Array( 17/* "/" */,-67 , 19/* ">" */,-67 , 7/* "style" */,-67 , 22/* "IDENTIFIER" */,-67 ),
	/* State 144 */ new Array( 22/* "IDENTIFIER" */,55 , 20/* "QUOTE" */,56 , 12/* "," */,35 , 10/* "(" */,57 , 11/* ")" */,58 , 14/* ":" */,36 , 13/* ";" */,37 , 15/* "=" */,38 , 9/* "}" */,39 , 8/* "{" */,59 ),
	/* State 145 */ new Array( 9/* "}" */,149 , 22/* "IDENTIFIER" */,111 , 10/* "(" */,113 , 8/* "{" */,114 , 12/* "," */,115 , 15/* "=" */,116 , 13/* ";" */,117 , 21/* "JSSEP" */,118 , 20/* "QUOTE" */,47 ),
	/* State 146 */ new Array( 20/* "QUOTE" */,-46 ),
	/* State 147 */ new Array( 20/* "QUOTE" */,-73 , 13/* ";" */,-73 ),
	/* State 148 */ new Array( 22/* "IDENTIFIER" */,55 , 20/* "QUOTE" */,56 , 12/* "," */,35 , 10/* "(" */,57 , 11/* ")" */,58 , 14/* ":" */,36 , 13/* ";" */,37 , 15/* "=" */,38 , 9/* "}" */,39 , 8/* "{" */,59 ),
	/* State 149 */ new Array( 12/* "," */,-25 , 9/* "}" */,-25 , 16/* "</" */,-25 )
);

/* Goto-Table */
var goto_tab = new Array(
	/* State 0 */ new Array( 25/* TOP */,1 , 23/* TEMPLATE */,2 , 24/* LETLIST */,3 ),
	/* State 1 */ new Array(  ),
	/* State 2 */ new Array(  ),
	/* State 3 */ new Array( 30/* LET */,5 , 28/* VARIABLE */,6 ),
	/* State 4 */ new Array(  ),
	/* State 5 */ new Array(  ),
	/* State 6 */ new Array(  ),
	/* State 7 */ new Array(  ),
	/* State 8 */ new Array( 26/* ARGLIST */,12 , 28/* VARIABLE */,13 ),
	/* State 9 */ new Array(  ),
	/* State 10 */ new Array( 27/* STMT */,14 , 31/* JSFUN */,15 , 23/* TEMPLATE */,16 , 32/* EXPR */,17 , 33/* STATE */,18 , 34/* LETLISTBLOCK */,19 , 35/* XML */,20 , 36/* STRING */,25 , 38/* OPENFOREACH */,28 , 40/* OPENCALL */,29 , 42/* OPENTAG */,30 , 45/* SINGLETAG */,31 , 46/* TEXT */,32 ),
	/* State 11 */ new Array(  ),
	/* State 12 */ new Array(  ),
	/* State 13 */ new Array(  ),
	/* State 14 */ new Array(  ),
	/* State 15 */ new Array(  ),
	/* State 16 */ new Array(  ),
	/* State 17 */ new Array( 32/* EXPR */,43 , 36/* STRING */,25 ),
	/* State 18 */ new Array(  ),
	/* State 19 */ new Array(  ),
	/* State 20 */ new Array(  ),
	/* State 21 */ new Array(  ),
	/* State 22 */ new Array(  ),
	/* State 23 */ new Array(  ),
	/* State 24 */ new Array(  ),
	/* State 25 */ new Array(  ),
	/* State 26 */ new Array(  ),
	/* State 27 */ new Array( 24/* LETLIST */,50 ),
	/* State 28 */ new Array( 24/* LETLIST */,51 ),
	/* State 29 */ new Array( 24/* LETLIST */,52 ),
	/* State 30 */ new Array( 43/* XMLLIST */,53 ),
	/* State 31 */ new Array(  ),
	/* State 32 */ new Array( 46/* TEXT */,54 ),
	/* State 33 */ new Array( 46/* TEXT */,60 ),
	/* State 34 */ new Array( 49/* TAGNAME */,61 ),
	/* State 35 */ new Array(  ),
	/* State 36 */ new Array(  ),
	/* State 37 */ new Array(  ),
	/* State 38 */ new Array(  ),
	/* State 39 */ new Array(  ),
	/* State 40 */ new Array( 29/* TYPE */,65 ),
	/* State 41 */ new Array( 28/* VARIABLE */,67 ),
	/* State 42 */ new Array(  ),
	/* State 43 */ new Array( 32/* EXPR */,43 , 36/* STRING */,25 ),
	/* State 44 */ new Array(  ),
	/* State 45 */ new Array(  ),
	/* State 46 */ new Array(  ),
	/* State 47 */ new Array( 46/* TEXT */,60 ),
	/* State 48 */ new Array( 26/* ARGLIST */,69 , 28/* VARIABLE */,13 ),
	/* State 49 */ new Array( 36/* STRING */,70 ),
	/* State 50 */ new Array( 30/* LET */,5 , 27/* STMT */,71 , 31/* JSFUN */,15 , 23/* TEMPLATE */,16 , 32/* EXPR */,17 , 33/* STATE */,18 , 34/* LETLISTBLOCK */,19 , 35/* XML */,20 , 28/* VARIABLE */,6 , 36/* STRING */,25 , 38/* OPENFOREACH */,28 , 40/* OPENCALL */,29 , 42/* OPENTAG */,30 , 45/* SINGLETAG */,31 , 46/* TEXT */,32 ),
	/* State 51 */ new Array( 30/* LET */,5 , 27/* STMT */,73 , 31/* JSFUN */,15 , 23/* TEMPLATE */,16 , 32/* EXPR */,17 , 33/* STATE */,18 , 34/* LETLISTBLOCK */,19 , 35/* XML */,20 , 28/* VARIABLE */,6 , 36/* STRING */,25 , 38/* OPENFOREACH */,28 , 40/* OPENCALL */,29 , 42/* OPENTAG */,30 , 45/* SINGLETAG */,31 , 46/* TEXT */,32 ),
	/* State 52 */ new Array( 30/* LET */,5 , 27/* STMT */,74 , 31/* JSFUN */,15 , 23/* TEMPLATE */,16 , 32/* EXPR */,17 , 33/* STATE */,18 , 34/* LETLISTBLOCK */,19 , 35/* XML */,20 , 28/* VARIABLE */,6 , 36/* STRING */,25 , 38/* OPENFOREACH */,28 , 40/* OPENCALL */,29 , 42/* OPENTAG */,30 , 45/* SINGLETAG */,31 , 46/* TEXT */,32 ),
	/* State 53 */ new Array( 35/* XML */,75 , 44/* CLOSETAG */,76 , 38/* OPENFOREACH */,28 , 40/* OPENCALL */,29 , 42/* OPENTAG */,30 , 45/* SINGLETAG */,31 , 46/* TEXT */,32 ),
	/* State 54 */ new Array( 46/* TEXT */,54 ),
	/* State 55 */ new Array(  ),
	/* State 56 */ new Array(  ),
	/* State 57 */ new Array(  ),
	/* State 58 */ new Array(  ),
	/* State 59 */ new Array(  ),
	/* State 60 */ new Array( 46/* TEXT */,54 ),
	/* State 61 */ new Array( 48/* ATTRIBUTES */,79 ),
	/* State 62 */ new Array(  ),
	/* State 63 */ new Array( 48/* ATTRIBUTES */,81 ),
	/* State 64 */ new Array(  ),
	/* State 65 */ new Array(  ),
	/* State 66 */ new Array(  ),
	/* State 67 */ new Array(  ),
	/* State 68 */ new Array( 24/* LETLIST */,84 ),
	/* State 69 */ new Array(  ),
	/* State 70 */ new Array(  ),
	/* State 71 */ new Array(  ),
	/* State 72 */ new Array(  ),
	/* State 73 */ new Array( 39/* CLOSEFOREACH */,88 ),
	/* State 74 */ new Array( 41/* CLOSECALL */,90 ),
	/* State 75 */ new Array(  ),
	/* State 76 */ new Array(  ),
	/* State 77 */ new Array( 49/* TAGNAME */,92 ),
	/* State 78 */ new Array(  ),
	/* State 79 */ new Array(  ),
	/* State 80 */ new Array(  ),
	/* State 81 */ new Array(  ),
	/* State 82 */ new Array(  ),
	/* State 83 */ new Array(  ),
	/* State 84 */ new Array( 30/* LET */,5 , 27/* STMT */,99 , 31/* JSFUN */,15 , 23/* TEMPLATE */,16 , 32/* EXPR */,17 , 33/* STATE */,18 , 34/* LETLISTBLOCK */,19 , 35/* XML */,20 , 28/* VARIABLE */,6 , 36/* STRING */,25 , 38/* OPENFOREACH */,28 , 40/* OPENCALL */,29 , 42/* OPENTAG */,30 , 45/* SINGLETAG */,31 , 46/* TEXT */,32 ),
	/* State 85 */ new Array(  ),
	/* State 86 */ new Array( 32/* EXPR */,102 , 36/* STRING */,25 ),
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
	/* State 97 */ new Array(  ),
	/* State 98 */ new Array(  ),
	/* State 99 */ new Array(  ),
	/* State 100 */ new Array( 37/* JS */,110 , 36/* STRING */,112 ),
	/* State 101 */ new Array(  ),
	/* State 102 */ new Array( 32/* EXPR */,43 , 36/* STRING */,25 ),
	/* State 103 */ new Array(  ),
	/* State 104 */ new Array(  ),
	/* State 105 */ new Array(  ),
	/* State 106 */ new Array( 51/* ATTRIBUTE */,123 , 36/* STRING */,124 ),
	/* State 107 */ new Array(  ),
	/* State 108 */ new Array(  ),
	/* State 109 */ new Array(  ),
	/* State 110 */ new Array( 37/* JS */,127 , 36/* STRING */,112 ),
	/* State 111 */ new Array(  ),
	/* State 112 */ new Array(  ),
	/* State 113 */ new Array( 37/* JS */,129 , 36/* STRING */,112 ),
	/* State 114 */ new Array( 37/* JS */,130 , 36/* STRING */,112 ),
	/* State 115 */ new Array(  ),
	/* State 116 */ new Array(  ),
	/* State 117 */ new Array(  ),
	/* State 118 */ new Array(  ),
	/* State 119 */ new Array( 29/* TYPE */,131 ),
	/* State 120 */ new Array(  ),
	/* State 121 */ new Array(  ),
	/* State 122 */ new Array(  ),
	/* State 123 */ new Array(  ),
	/* State 124 */ new Array(  ),
	/* State 125 */ new Array( 46/* TEXT */,60 , 47/* INSERT */,132 ),
	/* State 126 */ new Array( 50/* STYLE */,134 , 52/* STYLEATTRIBUTE */,135 ),
	/* State 127 */ new Array( 37/* JS */,127 , 36/* STRING */,112 ),
	/* State 128 */ new Array(  ),
	/* State 129 */ new Array( 37/* JS */,127 , 36/* STRING */,112 ),
	/* State 130 */ new Array( 37/* JS */,127 , 36/* STRING */,112 ),
	/* State 131 */ new Array(  ),
	/* State 132 */ new Array(  ),
	/* State 133 */ new Array( 32/* EXPR */,141 , 36/* STRING */,25 ),
	/* State 134 */ new Array(  ),
	/* State 135 */ new Array(  ),
	/* State 136 */ new Array(  ),
	/* State 137 */ new Array(  ),
	/* State 138 */ new Array(  ),
	/* State 139 */ new Array( 37/* JS */,145 , 36/* STRING */,112 ),
	/* State 140 */ new Array(  ),
	/* State 141 */ new Array( 32/* EXPR */,43 , 36/* STRING */,25 ),
	/* State 142 */ new Array( 52/* STYLEATTRIBUTE */,147 ),
	/* State 143 */ new Array(  ),
	/* State 144 */ new Array( 46/* TEXT */,148 ),
	/* State 145 */ new Array( 37/* JS */,127 , 36/* STRING */,112 ),
	/* State 146 */ new Array(  ),
	/* State 147 */ new Array(  ),
	/* State 148 */ new Array( 46/* TEXT */,54 ),
	/* State 149 */ new Array(  )
);



/* Symbol labels */
var labels = new Array(
	"TOP'" /* Non-terminal symbol */,
	"WHITESPACE" /* Terminal symbol */,
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
	"STRING" /* Non-terminal symbol */,
	"JS" /* Non-terminal symbol */,
	"OPENFOREACH" /* Non-terminal symbol */,
	"CLOSEFOREACH" /* Non-terminal symbol */,
	"OPENCALL" /* Non-terminal symbol */,
	"CLOSECALL" /* Non-terminal symbol */,
	"OPENTAG" /* Non-terminal symbol */,
	"XMLLIST" /* Non-terminal symbol */,
	"CLOSETAG" /* Non-terminal symbol */,
	"SINGLETAG" /* Non-terminal symbol */,
	"TEXT" /* Non-terminal symbol */,
	"INSERT" /* Non-terminal symbol */,
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
		act = 151;
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
		if( act == 151 )
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
			
			while( act == 151 && la != 53 )
			{
				if( _dbg_withtrace )
					__dbg_print( "\tError recovery\n" +
									"Current lookahead: " + labels[la] + " (" + info.att + ")\n" +
									"Action: " + act + "\n\n" );
				if( la == -1 )
					info.offset++;
					
				while( act == 151 && sstack.length > 0 )
				{
					sstack.pop();
					vstack.pop();
					
					if( sstack.length == 0 )
						break;
						
					act = 151;
					for( var i = 0; i < act_tab[sstack[sstack.length-1]].length; i+=2 )
					{
						if( act_tab[sstack[sstack.length-1]][i] == la )
						{
							act = act_tab[sstack[sstack.length-1]][i+1];
							break;
						}
					}
				}
				
				if( act != 151 )
					break;
				
				for( var i = 0; i < rsstack.length; i++ )
				{
					sstack.push( rsstack[i] );
					vstack.push( rvstack[i] );
				}
				
				la = __lex( info );
			}
			
			if( act == 151 )
			{
				if( _dbg_withtrace )
					__dbg_print( "\tError recovery failed, terminating parse process..." );
				break;
			}


			if( _dbg_withtrace )
				__dbg_print( "\tError recovery succeeded, continuing" );
		}
		
		/*
		if( act == 151 )
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
		 rval = flatten(vstack[ vstack.length - 1 ]); 
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
		 rval = vstack[ vstack.length - 2 ] + " " + vstack[ vstack.length - 1 ]; 
	}
	break;
	case 35:
	{
		rval = vstack[ vstack.length - 0 ];
	}
	break;
	case 36:
	{
		 rval = makeState(vstack[ vstack.length - 4 ], makeExpr(vstack[ vstack.length - 2 ])); 
	}
	break;
	case 37:
	{
		 rval = makeVariable( vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 38:
	{
		 rval = makeVariable( vstack[ vstack.length - 4 ], vstack[ vstack.length - 1 ]); 
	}
	break;
	case 39:
	{
		 rval = [makeForEach(vstack[ vstack.length - 4 ], vstack[ vstack.length - 3 ], vstack[ vstack.length - 2 ]), vstack[ vstack.length - 1 ]]; 
	}
	break;
	case 40:
	{
		 rval = [makeCall(vstack[ vstack.length - 3 ], vstack[ vstack.length - 2 ]), vstack[ vstack.length - 1 ]]; 
	}
	break;
	case 41:
	{
		 rval = [makeNode(vstack[ vstack.length - 3 ], vstack[ vstack.length - 2 ]), vstack[ vstack.length - 1 ]]; 
	}
	break;
	case 42:
	{
		 rval = [makeNode(vstack[ vstack.length - 1 ]['openTag'], []), vstack[ vstack.length - 1 ]['textNode']]; 
	}
	break;
	case 43:
	{
		 rval = [makeTextElement(vstack[ vstack.length - 1 ])]; 
	}
	break;
	case 44:
	{
		 rval = pushOrConcat(vstack[ vstack.length - 2 ], vstack[ vstack.length - 1 ]); 
	}
	break;
	case 45:
	{
		 rval = []; 
	}
	break;
	case 46:
	{
		 rval = makeInsert(vstack[ vstack.length - 2 ]); 
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
		 rval = "" + vstack[ vstack.length - 2 ] + " " + vstack[ vstack.length - 1 ]; 
	}
	break;
	case 58:
	{
		 rval = vstack[ vstack.length - 2 ]; 
	}
	break;
	case 59:
	{
		 rval = undefined; 
	}
	break;
	case 60:
	{
		rval = vstack[ vstack.length - 3 ];
	}
	break;
	case 61:
	{
		 rval = undefined; 
	}
	break;
	case 62:
	{
		 rval = makeOpenTag(vstack[ vstack.length - 3 ], vstack[ vstack.length - 2 ]); 
	}
	break;
	case 63:
	{
		 rval = undefined; 
	}
	break;
	case 64:
	{
		 rval = {openTag: makeOpenTag(vstack[ vstack.length - 4 ], vstack[ vstack.length - 3 ])}; 
	}
	break;
	case 65:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 66:
	{
		 rval = vstack[ vstack.length - 3 ] + vstack[ vstack.length - 2 ] + vstack[ vstack.length - 1 ]; 
	}
	break;
	case 67:
	{
		 vstack[ vstack.length - 6 ][vstack[ vstack.length - 5 ]] = vstack[ vstack.length - 2 ]; rval = vstack[ vstack.length - 6 ];
	}
	break;
	case 68:
	{
		 vstack[ vstack.length - 4 ][vstack[ vstack.length - 3 ]] = vstack[ vstack.length - 1 ]; rval = vstack[ vstack.length - 4 ];
	}
	break;
	case 69:
	{
		 rval = {}; 
	}
	break;
	case 70:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 71:
	{
		 rval = vstack[ vstack.length - 2 ]; 
	}
	break;
	case 72:
	{
		 rval = vstack[ vstack.length - 2 ]; 
	}
	break;
	case 73:
	{
		 rval = push(vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ]); 
	}
	break;
	case 74:
	{
		 rval = [vstack[ vstack.length - 1 ]]; 
	}
	break;
	case 75:
	{
		 rval = []; 
	}
	break;
	case 76:
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


