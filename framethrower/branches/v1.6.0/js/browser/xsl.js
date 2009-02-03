
// returns a list of variable names used in some XSL (via <xsl:* select="...$XXX..." /> and <* @*="...{...$XXX...}..." />)
function getVariables(xslNode) {
	var varNames = {};
	function extract(s, node) {
		forEachRegexp(s, /\$[a-zA-Z0-9._-]+/g, function (varName) {
			varName = varName.substr(1);
			// check if varName is defined by a preceding xsl:variable or xsl:param that has that name
			var prec = xpath("../preceding::xsl:*[local-name() = 'variable' or local-name() = 'param'][@name='" + varName + "']", node);
			// if not, add it to the varNames hash
			if (prec.length === 0) {
				varNames[varName] = true;				
			}
		});
	}
	var selectAttributes = xpath("descendant-or-self::xsl:*/@*[local-name() = 'select' or local-name() = 'test'][contains(., '$')]", xslNode);
	forEach(selectAttributes, function (att) {
		extract(att.nodeValue, att);
	});
	
	var curlyAttributes = xpath("descendant-or-self::*/@*[contains(., '{')]", xslNode);
	forEach(curlyAttributes, function (att) {
		forEachRegexp(att.nodeValue, /{[^}]*}/g, function (s) {
			extract(s, att);
		});
	});
	
	return keys(varNames);
}

// returns a list of template names that are called in some XSL (via <xsl:call-template name="XXX" />)
function getCallTemplates(xslNode) {
	var temps = xpath("descendant-or-self::xsl:call-template/@name", xslNode);
	return map(temps, function (att) {
		return att.nodeValue;
	});
}
function fetchCalledTemplates(names, start, templates) {
	if (!templates) templates = [];
	forEach(names, function (name) {
		var template = xpath("ancestor-or-self::*/xsl:template[@name='" + name + "'][1]", start);
		if (template.length === 0) console.error("Unable to find XSL Template with name: "+name, start);
		
		template = template[0];
		if (!contains(templates, template)) {
			templates.push(template);
			fetchCalledTemplates(getCallTemplates(template), template, templates);
		}
	});
	return templates;
}


var desugarXSL = compileXSL(loadXMLNow(ROOTDIR + "js/browser/desugar.xml"));

function makeXSLFromTemplate(templateNode) {
	var baseNode = xpath("*[not(self::f:param | self::f:derive | self::f:template | self::f:action | self::xsl:template | self::f:include)]", templateNode);
	
	var res = createEl("f:result");
	var container = createEl("container"); // this is a hack, Firefox doesn't like using parentless nodes as source documents in XSL transforms
	container.appendChild(res);
	forEach(baseNode, function (node) {
		appendChild(res, cloneNode(node));
	});
	baseNode = res;
	
	
	baseNode = desugarXSL(baseNode);
	
	var ss = createEl("xsl:stylesheet");
	setAttr(ss, "version", "1.0");
	
	var varNames = getVariables(baseNode);
	forEach(varNames, function (varName) {
		var v = createEl("xsl:variable");
		setAttr(v, "name", varName);
		setAttr(v, "select", "(f:pass|*/f:pass)[@name='" + varName + "']/node()");
		
		appendChild(ss, v);		
	});
	
	var baseTemplate = createEl("xsl:template");
	setAttr(baseTemplate, "match", "/");
	appendChild(baseTemplate, baseNode);
	appendChild(ss, baseTemplate);
	
	var fetchedTemplates = fetchCalledTemplates(getCallTemplates(baseNode), templateNode);
	forEach(fetchedTemplates, function (template) {
		template = desugarXSL(template);
		appendChild(ss, template);
	});
	
	return {ss: ss, varNames: varNames};
}



// runXSL :: {paramName: paramValueInXML} -> XML
function runXSL(compiledXSL, params) {
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
	var result = compiledXSL(source);
	//debug.log("result:");
	//debug.xml(result);
	return result;
}





function compileTemplate(templateNode, url) {
	var params = xpath("f:param", templateNode);
	params = map(params, function (param) {
		var name = getAttr(param, "name");
		var type = parseType(getAttr(param, "type"));
		return {name: name, type: type};
	});
	
	var derives = xpath("f:derive", templateNode);
	derives = map(derives, function (derive) {
		var name = getAttr(derive, "name");
		var d = getAttr(derive, "d");
		return {name: name, parsed: parse(d)};
	});
	
	var templates = xpath("(f:template|f:action)", templateNode);
	templates = map(templates, function (template) {
		var name = getAttr(template, "name");
		return {name: name, compiled: compileTemplate(template, url)};
	});
	
	var xsl = makeXSLFromTemplate(templateNode);
	var compiledXSL = compileXSL(xsl.ss);
	var varNames = xsl.varNames;
	
	
	var funType = unitJS;
	forEachReverse(params, function (param) {
		//funType = makeTypeLambda(param.type, funType);
		funType = makeTypeLambda(makeFreshTypeVar(), funType);
		// this is a cheat, so make sure to type check somewhere else! (I do this in evalThunk)
		// I need to do this to deal with f:var's being passed around as parameters (in lieu of real objects) in f:action's
	});
	
	return function (env) {
		var myFun = curry(function () {
			var scope = {};
			var newEnv = extendEnv(env, scope);

			// build the new scope
			// fill in params
			forEach(arguments, function (arg, i) {
				scope[params[i].name] = arg;
			});
			// parse derives using newEnv and add the resulting expressions to the scope
			forEach(derives, function (derive) {
				scope[derive.name] = parseExpression(derive.parsed, newEnv);
				// typecheck
				try {
					getType(scope[derive.name]);
				} catch (e) {
					debug.log("Type check failed on derive `"+derive.name+"`: "+unparse(derive.parsed));
					debug.error(e);
				}
			});
			// finally, add the f:template's to the scope, using newEnv as their env
			forEach(templates, function (template) {
				scope[template.name] = template.compiled(newEnv);
			});
		
		
		
			var cell = makeCell();
			cell.type = unitJS;

			// put all dependent bindings (that is, the varNames that the xsl depends on) from the newEnv in a hash
			var p = {};
			forEach(varNames, function (varName, i) {
				p[varName] = newEnv(varName);
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

				var resultXML = runXSL(compiledXSL, pxml);
				
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
			
			
			function listenToCell(c) {
				// TODO: at some point we need to do a total audit on whether things get removed correctly w.r.t. cells and injected functions
				
				// returns a function to stop listening to the cell
				c = evaluate(c);
				var childRemovers = [];
				
				var removeFunc = c.injectFunc(function (x) {
					makeDirty();
					if (x && x.key !== undefined && x.val !== undefined) {
						// we have a Map entry
						var entryNums = [];
						
						if (isReactive(getType(x.key)) && !x.key.params) {
							var keyRemover = listenToCell(x.key);
							entryNums.push(childRemovers.length);
							childRemovers.push(keyRemover);
						}
						if (isReactive(getType(x.val)) && !x.val.params) {
							var valRemover = listenToCell(x.val);
							entryNums.push(childRemovers.length);
							childRemovers.push(valRemover);
						}
						return function () {
							makeDirty();
							forEach(entryNums, function (entryNum) {
								childRemovers[entryNum]();
								childRemovers[entryNum] = null;
							});
						};
					} else {
						var entryNum;
						if (isReactive(getType(x)) && !x.params) {
							entryNum = childRemovers.length;
							childRemovers.push(listenToCell(x));
						}
						return function () {
							makeDirty();
							if (entryNum) {
								childRemovers[entryNum]();
								childRemovers[entryNum] = null;
							}
						};
					}
				});
				return function () {
					forEach(childRemovers, function (childRemover) {
						if (childRemover) childRemover();
					});
					removeFunc();
				};
			}


			forEach(p, function (expr, name) {
				var result = evaluate(expr);
				p[name] = result;

				// if the result is a startCap (dynamic), inject makeDirty function
				var t = getType(result);
				if (isReactive(t) && !expr.params) {

					var removeFunc = listenToCell(result);
					cell.addOnRemove(removeFunc);
					
				}
			});

			update();

			return cell;
		}, params.length);
		
		if (params.length === 0) {
			// in this case, myFun isn't a fun at all, but a cell
			myFun.params = params;
			myFun.url = url;
			return myFun;
		} else {
			return {
				kind: "fun",
				type: funType,
				fun: myFun,
				params: params,
				url: url,
				remote: 2
			};			
		}
	};
	
}


function makeTemplateFunFromUrl(url, callback) {
	documents.withDoc(url, function (doc) {
		var name = getAttr(doc, "name");
		var scope = {};
		var newEnv = extendEnv(base.env, scope);
		var fun = compileTemplate(doc, url)(newEnv);
		scope[name] = fun;
		callback(fun);
	});
}

var xmlTemplates = (function () {
	var urls = {};
	
	return {
		withTemplate: function (url, callback) {
			if (urls[url]) {
				callback(urls[url]);
			} else {
				//makeTemplateFunFromUrl(url, callback);
				documents.withDoc(url, function (doc) {
					if (!urls[url]) {
						var name = getAttr(doc, "name");
						var scope = {};
						var newEnv = extendEnv(base.env, scope);
						var fun = compileTemplate(doc, url)(newEnv);
						scope[name] = fun;
					
						urls[url] = fun;
					}
					callback(urls[url]);
				});
			}
		},
		preload: function (url) {
			
		},
		debug: function () {
			return urls;
		}
	};
})();



// ============================================================================
// Controlling Screen Refreshes
// ============================================================================

var dirtyThunks = {}; // a hash of XMLTemplate application update functions

function refreshScreen() {
	var hadUpdate = false;
	forEach(dirtyThunks, function (f) {
		f();
		hadUpdate = true;
	});
	// run it again here to account for <f:on event="load"> actions triggering
	if (hadUpdate) {
		refreshScreen();
	}
}











