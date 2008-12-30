/*
scopeVars is an object with these properties:
	baseUrl: the url of the containing thunk
	ids: a hash of ids (String's) to Expr's from the containing thunks params and derived params
	tunnelEnv: an Env containing the tunneled scope
*/

function evalThunk(thunkNode, scopeVars) {
	var thunkEssence = getThunkEssence(thunkNode, scopeVars.baseUrl, scopeVars.ids);
	
	var tunnelExt; // extend tunnelEnv, TODO
	
	xmlTemplates.withTemplate(thunkEssence.url, function (xt) {
		var e = xt.fun;
		forEach(xt.params, function (p) {
			// TODO lookup in tunnel if necessary
			e = makeApply(e, thunkEssence.params[p.name]);
		});
		
		evaluateAndInject(e, function (xmlids) {
			// TODO replace with replaceXML function
			thunkNode.parentNode.replaceChild(xmlids.xml, thunkNode);
			thunkNode = xmlids.xml;
		});
	});
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

function getThunkEssence(thunkNode, baseUrl, ids) {
	var xtUrl = urlToAbs(baseUrl, getAttr(thunkNode, "template")); // TODO handle non template attribute url (that is, to pass in xml templates)
	
	var withParams = {};
	var tunnel = {};
	var withParamNodes = xpath("f:with-param", thunkNode);
	forEach(withParamNodes, function (node) {
		var name = getAttr(node, "name");
		withParams[name] = getWithParam(node, ids);
		if (getAttr(node, "tunnel") === "yes") {
			tunnel[name] = true;
		}
	});
	
	return {url: xtUrl, params: withParams, tunnel: tunnel};
}










// ============================================================================
// URL Manipulation
// ============================================================================

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