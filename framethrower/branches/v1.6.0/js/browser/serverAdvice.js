


var desugarLeaveControl = compileXSL(loadXMLNow(ROOTDIR + "js/browser/desugarLeaveControl.xml"));

function getServerAdvice(templateNode, url, env) {
	if (!env) env = base.env;
	
	var scope = {};
	var newEnv = extendEnv(env, scope);
	
	var params = [];
	forEach(xpath("f:param", templateNode), function (paramNode) {
		var name = getAttr(paramNode, "name");
		var type = parseType(getAttr(paramNode, "type"));
		
		var remote = getRemoteType(type);
		scope[name] = {remote: remote, name:name};
		
		if (remote < 2) {
			params.push(name);
		}
	});
	
	var derives = [];
	forEach(xpath("f:derive", templateNode), function (deriveNode) {
		var name = getAttr(deriveNode, "name");
		
		var d = getAttr(deriveNode, "d");
		
		var expr = parseExpr(d, newEnv);
		
		scope[name] = expr;
		
		var remote = getRemote(expr);
		
		if (remote < 2) {
			derives.push({
				name: name,
				value: stringify(expr)
			});
		}
	});
	
	var templates = [];
	forEach(xpath("(f:template|f:action)", templateNode), function (tNode) {
		var name = getAttr(tNode, "name");
		templates.push({
			name: name,
			value: getServerAdvice(tNode, url, newEnv)
		});
	});
	
	
	function returnFromVariable(s) {
		if (s.charAt(0) === "$" && s.indexOf("/") === -1) {
			return s.substring(1);
		}
	}
	function returnFromXSLCopyOf(node) {
		if (node.nodeName === "xsl:copy-of") {
			var s = getAttr(node, "select");
			return returnFromVariable(s);
		}
	}
	function walkNode(node, calls) {
		var nn = node.nodeName;
		if (nn === "xsl:if" || nn === "xsl:choose" || nn === "xsl:for-each" || nn === "xsl:call-template") {
			// just stop
		} else if (nn === "f:each") {
			var block = [];
			forEach(node.childNodes, function (x) {walkNode(x, block);});
			calls.push({
				forEach: {
					on: returnFromVariable(getAttr(node, "select")),
					key: getAttr(node, "key"),
					value: getAttr(node, "value"),
					block: block
				}
			});
		} else if (nn === "f:pattern") {
			var match = [];
			forEach(xpath("f:match", node), function (matchNode) {
				var block = [];
				forEach(matchNode.childNodes, function (x) {walkNode(x, block);});
				match.push({
					match: returnFromVariable(getAttr(matchNode, "test")),
					as: getAttr(matchNode, "as"),
					block: block
				});
			});
			forEach(xpath("f:otherwise", node), function (otherwiseNode) {
				var block = [];
				forEach(otherwiseNode.childNodes, function (x) {walkNode(x, block);});
				match.push({
					block: block
				});
			});
			
			calls.push({
				pattern: match
			});
		} else if (nn === "f:thunk" || nn === "f:thunkadvice") {
			var te = getThunkEssence(node, url, {});
			
			var template;
			if (te.url) {
				template = "url:" + te.url;
			} else {
				template = returnFromXSLCopyOf(te.template);
			}
			
			var params = map(te.params, returnFromXSLCopyOf); // TODO: right now this only sends variables, should also send numbers, strings, etc.
			var formattedParams = [];
			forEach(params, function(param, paramName) {
				formattedParams.push({
					name: paramName,
					value: param
				});
			});
			
			calls.push({
				thunk: {
					template: template,
					params: formattedParams
				}
			});
		} else {
			// recurse
			forEach(node.childNodes, function (x) {walkNode(x, calls);});
		}
	}
	var calls = [];
	
	var desugaredTemplate = desugarLeaveControl(templateNode);
	
	forEach(xpath("*[not(self::f:param | self::f:derive | self::f:template | self::f:action | self::xsl:template | self::f:include)]", desugaredTemplate), function (node) {
		walkNode(node, calls);
	});
	
	return {
		params: params,
		derives: derives,
		templates: templates,
		calls: calls
	};
}


var serverAdvice = {};

function serverAdviceFromUrl(url) {
	if (!serverAdvice["url:" + url]) {
		documents.withDoc(url, function (doc) {
			var template = getServerAdvice(doc, url);
//			serverAdvice["url:" + url] = template;
			session.registerTemplate(url, template);

		});
	}
}


/*

Walk through the XML tree. If you get to a xsl:if, xsl:choose, xsl:for-each, just stop.
If you get to a f:each, f:pattern, put the appropriate block.
If you get to a f:thunk, put a call





TODO:
design server advice annotation syntax (for hand advising to avoid tricky xsl stuff, in infon.xml for example)
design a cleanup thing?
	get rid of templates never called
	don't use params in thunks that aren't declared earlier (and are remote)


documents.withDoc("testing/uiTest/pane/objectsIn.xml", function (d) {console.log(getServerAdvice(d));})

serverAdviceFromUrl("testing/uiTest/pane/objectsIn.xml");


documents.preload("testing/uiTest/main/main.xml");

*/