
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
	var selectAttributes = xpath(".//xsl:*/@select[contains(., '$')]", xslNode);
	forEach(selectAttributes, function (att) {
		extract(att.nodeValue, att);
	});
	
	var curlyAttributes = xpath(".//*/@*[contains(., '{')]", xslNode);
	forEach(curlyAttributes, function (att) {
		forEachRegexp(att.nodeValue, /{[^}]*}/g, function (s) {
			extract(s, att);
		});
	});
	
	return keys(varNames);
}

// returns a list of template names that are called in some XSL (via <xsl:call-template name="XXX" />)
function getCallTemplates(xslNode) {
	var temps = xpath(".//xsl:call-template/@name", xslNode);
	return map(temps, function (att) {
		return att.nodeValue;
	});
}


function forEachRegexp(s, regexp, f) {
	var result;
	while ((result = regexp.exec(s)) != null) {
		f(result[0]);
	}
}




function makeXSLFromTemplate(templateNode) {
	var baseNode = xpath("*[not(self::f:param | self::f:derive | self::f:template | self::f:action | self::xsl:template)]", templateNode);
	
	baseNode = cloneNode(baseNode[0]); // TODO: if baseNode has more than one element, put them all in a f:result or something
	desugarXSL(baseNode);
	
	// TODO replace this with something that can recurse
	var calledTemplates = getCallTemplates(baseNode);
	calledTemplates = map(calledTemplates, function (name) {
		var xslTemplate = xpath("ancestor-or-self::*/xsl:template[@name='" + name + "'][1]", templateNode);
		// TODO: throw error if doesn't exist
		var clone = cloneNode(xslTemplate[0]);
		desugarXSL(clone);
		return clone;
	});
	
	var varNames = getVariables(baseNode);
	
	var ss = createEl("xsl:stylesheet");
	setAttr(ss, "version", "1.0");
	
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
	
	forEach(calledTemplates, function (xslTemplate) {
		appendChild(ss, xslTemplate);
	});
	
	return {ss: ss, varNames: varNames};
}

function desugarXSL(xslNode) {
	// replace <f:with-param ... select="XXX" /> with <f:with-param ...><xsl:copy-of select="XXX" /></f:with-param>
	var selects = xpath(".//*[self::f:with-param or self::f:with-template][@select]", xslNode);
	forEach(selects, function (select) {
		var copyOf = createEl("xsl:copy-of");
		setAttr(copyOf, "select", getAttr(select, "select"));
		appendChild(select, copyOf);
	});
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





function compileTemplate(templateNode) {
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
	
	var templates = xpath("f:template|f:action", templateNode);
	templates = map(templates, function (template) {
		var name = getAttr(template, "name");
		return {name: name, compiled: compileTemplate(template)};
	});
	
	var xsl = makeXSLFromTemplate(templateNode);
	var compiledXSL = compileXSL(xsl.ss);
	var varNames = xsl.varNames;
	
	var funType = parseType("Unit JS");
	forEachReverse(params, function (param) {
		funType = makeTypeLambda(param.type, funType);
	});
	
	return function (env) {
		return {
			fun: {
				kind: "fun",
				type: funType,
				fun: curry(function () {
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
					});
					// finally, add the f:template's to the scope, using newEnv as their env
					forEach(templates, function (template) {
						scope[template.name] = template.compiled(newEnv);
					});
				
				
				
					var cell = makeCell();

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
			},
			params: params
		};
	};
	
}


function makeTemplateFunFromUrl(url, callback) {
	documents.withDoc(url, function (doc) {
		var name = getAttr(doc, "name");
		var scope = {};
		var newEnv = extendEnv(baseEnv, scope);
		var fun = compileTemplate(doc)(newEnv);
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
				makeTemplateFunFromUrl(url, callback);
			}
		},
		preload: function (url) {
			
		}
	};
})();



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











function getThunkEssence(thunkNode, baseUrl, ids) {
	var thunkEssence = {};
	
	var withTemplate = xpath("f:with-template", thunkNode);
	withTemplate = withTemplate[0];
	var url = getAttr(withTemplate, "url");
	if (url) {
		thunkEssence.url = urlToAbs(baseUrl, url);
	} else {
		thunkEssence.template = getWithParam(withTemplate, ids);
	}
		
	var withParams = xpath("f:with-param", thunkNode);
	var params = {};
	forEach(withParams, function (withParam) {
		var name = getAttr(withParam, "name");
		params[name] = getWithParam(withParam, ids);
	});
	thunkEssence.params = params;
	
	return thunkEssence;
}




function getWithParam(node, ids) {
	if (getAttr(node, "number")) {
		return +(getAttr(node, "number"));
	} else if (getAttr(node, "bool")) {
		return !!(getAttr(node, "bool"));
	} else if (getAttr(node, "string")) {
		return getAttr(node, "string");
	} else {
		var child = xpath("*[1]", node);
		if (child.length === 0) {
			console.error("f:with-param is undefined.", node);
		} else {
			return xmlToExpr(child[0], ids);
		}
	}
}

function urlToAbs(baseUrl, url) {
	function urlStripLast(url) {
		return url.replace(/(\/|^)[^\/]*$/, "$1");
	}
	function urlStripHash(url) {
		return url.replace(/#.*/, "");
	}
	function urlReduce(url) {
		var index = url.indexOf("/../");
		if (index === -1) {
			return url;
		} else {
			return urlReduce(urlStripLast(url.substr(0, index)) + url.substr(index + 4));
		}
	}
	
	if (url.charAt(0) === "/") {
		return url.substr(1);
	} else if (url.charAt(0) === "#") {
		urlStripHash(baseUrl) + url;
	} else if (url === "." || !url) {
		return baseUrl;
	} else {
		return urlReduce(urlStripLast(baseUrl) + url);
	}
}


