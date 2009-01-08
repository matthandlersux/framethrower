

function evalThunk(thunkNode, baseUrl, ids) {
	var thunkEssence = getThunkEssence(thunkNode, baseUrl, ids);
	
	function perform(xt) {
		var e = xt;
		forEach(xt.params, function (p) {
			// TODO: typecheck here
			e = makeApply(e, thunkEssence.params[p.name]);
		});
		
		var custom = {thunkEssence: thunkEssence};
		
		var removeFunc = evaluateAndInject(e, function (xmlids) {
			thunkNode = replaceXML(thunkNode, xmlids.xml, {baseUrl: xt.url, ids: xmlids.ids}, true);

			// Old way (before replaceXML)
			/*var thunks = xpath(".//f:thunk", xmlids.xml);
			forEach(thunks, function (thunk) {
				evalThunk(thunk, xt.url, xmlids.ids);
			});
			
			thunkNode.parentNode.replaceChild(xmlids.xml, thunkNode);
			thunkNode = xmlids.xml;
			*/
			
			thunkNode.custom = custom;
			setAttr(thunkNode, "f:was-thunk", "yes");
		});
		custom.removeFunc = removeFunc;
	}
	
	if (thunkEssence.url) {
		xmlTemplates.withTemplate(thunkEssence.url, perform);
	} else {
		perform(thunkEssence.template);
	}
}


function getThunkEssence(thunkNode, baseUrl, ids) {
	var thunkEssence = {};
	
	var withTemplate = xpath("f:with-template | f:with-action", thunkNode);
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

function compareThunkEssences(te1, te2) {
	// check if url or template is the same
	if (te1.url !== te2.url || (te1.template && stringify(te1.template) !== stringify(te2.template))) return false;
	
	// check parameters
	return (
		all(te1.params, function (param, name) {
			return stringify(param) === stringify(te2.params[name]);
		}) &&
		all(te2.params, function (param, name) {
			return stringify(param) === stringify(te1.params[name]);
		})
	);
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


