/*
An XMLTemplate looks like:
	{
		params: [{name: String, type: Type, tunnel: Boolean}],
		fun: Fun

		url: String,
		runXSL: {paramName: paramValueInXML} -> {xml: XML, ids: {}}
		derive: {paramName: Expr}
	}
*/


var xmlTemplateToXSL = compileXSL(loadXMLNow(ROOTDIR+"js/browser/xml/xmlTemplateToXSL.xml"));

function makeXMLTemplate(xml, url) {
	
	var xmlparams = xpath("f:param", xml);
	var params = [];
	var derivePrefix = [];
	forEach(xmlparams, function (param) {
		var name = getAttr(param, "name");
		var type = parseType(getAttr(param, "type"));
		var tunnel = (getAttr(param, "tunnel") === "yes");
		params.push({name: name, type: type, tunnel: tunnel});
		derivePrefix.push(name+" -> ");
	});
	derivePrefix = derivePrefix.join("");
	
	var xmlderive = xpath("f:derive", xml);
	var derive = {};
	forEach(xmlderive, function (dNode) {
		var name = getAttr(dNode, "name");
		var d = getAttr(dNode, "d");
		derive[name] = parseExpr(derivePrefix + d);
	});
	
	
	var xsl = xmlTemplateToXSL(xml);
	var compiled = compileXSL(xsl);
	
	// runXSL :: {paramName: paramValueInXML} -> XML
	function runXSL(params) {
		// make source document
		var source = createEl("f:source");
		
		forEach(params, function (xml, name) {
			var node = createEl("f:pass");
			node.setAttributeNS("", "name", name);
			if (xml) {
				node.appendChild(xml);
			}
			source.appendChild(node);
		});
				
		//debug.log("source:");
		//debug.xml(source);
		//debug.log("xsl:");
		//debug.xml(xsl);
		
		var result = compiled(source);
		
		//debug.log("result:");
		//debug.xml(result);
		
		return result;
	}
	
	
	var funType = parseType("Unit JS");
	forEachReverse(params, function (param) {
		funType = makeTypeLambda(param.type, funType);
	});
	
	var fun = {
		kind: "fun",
		type: funType,
		fun: curry(function () {
			var cell = makeCell();
			
			// put all params in a hash
			var p = {};
			forEach(arguments, function (arg, i) {
				p[params[i].name] = arg;
			});
			
			// get all derived params (as apply Expr's)
			forEach(derive, function (d, paramName) {
				forEach(params, function (param) {
					d = makeApply(d, p[param.name]);
				});
				p[paramName] = d;
			});
			
			var state = false;
			function update() {
				if (state) {
					cell.removeLine(state);
				}
				
				var pxml = {};
				var ids = {};
				forEach(p, function (paramExpr, paramName) {
					var convert = exprToXML(paramExpr);
					pxml[paramName] = convert.xml;
					mergeInto(convert.ids, ids);
				});
				
				var resultXML = runXSL(pxml);
				
				state = {xml: resultXML, ids: ids};

				cell.addLine(state);
				
				delete dirtyThunks[stringify(cell)];
			}
			
			
			function makeDirty() {
				dirtyThunks[stringify(cell)] = update;
				return makeDirty;
			}
			cell.addOnRemove(function () {
				delete dirtyThunks[stringify(cell)]; // remove itself from dirtyThunks
			});
			
			
			forEach(p, function (expr, name) {
				var result = evaluate(expr);
				p[name] = result;
				
				// if the result is a startCap (dynamic), inject makeDirty function
				var t = getType(result);
				if (t.kind === "typeApply") {
					var removeFunc = result.injectFunc(makeDirty);
					cell.addOnRemove(removeFunc);
				}
			});
			
			update();
			
			return cell;
		}, params.length)
	};
	
	return {
		params: params,
		fun: fun,
		
		// debug
		derive: derive,
		xsl: xsl,
		runXSL: runXSL
	};
}



// ============================================================================
// Controlling Screen Refreshes
// ============================================================================

var dirtyThunks = {}; // a hash of XMLTemplate application update functions

function refreshScreen() {
	forEach(dirtyThunks, function (f) {
		f();
	});
	// run it again here... TODO?
}


// ============================================================================
// 
// ============================================================================

