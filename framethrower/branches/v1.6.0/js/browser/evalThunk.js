function bootstrap(node, ids) {
	if (!ids) ids = {};
	processThunks(node, {baseUrl: "", ids: ids});
	refreshScreen();
}

function evalThunk(thunkNode) {
	var thunkEssence = thunkNode.custom.thunkEssence;
	
	function perform(xt) {		
		var e = xt;
		forEach(xt.params, function (p) {
			var thunksParam = thunkEssence.params[p.name];
			
			if (!thunksParam) {
				debug.error("No f:with-param for `"+p.name+"` in thunk", thunkNode);
			}
			
			// typecheck
			if (p.type && !compareTypes(p.type, getType(thunksParam)) && !(thunksParam.nodeName === "f:var")) {
				debug.log("Type check failed for param `"+p.name+"`. Expected type: `"+unparseType(p.type)+"` but got: `"+unparseType(getType(thunksParam))+"`.", thunkNode);
			}
			e = makeApply(e, thunksParam);
		});
		
		
		var custom = thunkNode.custom;

		var todo = [];
		var ecell = evaluate(e);
		
		var doneResponse = function() {
			//this depends on update in xsl.js being called before this function, which relies on a cell performing its done response functions in the order they were injected
			//TODO: make this less of a hack
			if (thunkNode.custom && thunkNode.custom.isAction && thunkNode.custom.onXMLUpdate) {
				thunkNode.custom.onXMLUpdate();
			}
		};

		var removeFunc = ecell.injectFunc(doneResponse, function (xmlids) {
			thunkNode = replaceXML(thunkNode, xmlids.xml, {baseUrl: xt.url, ids: xmlids.ids}, true);

			thunkNode.custom = custom;

			var top = xpath("ancestor-or-self::f:result[last()]", thunkNode)[0]; // TODO: might want to revisit this

			if (top.custom && top.custom.onXMLUpdate && !top.custom.isAction) {
				top.custom.onXMLUpdate();
			}
		});
		removeFunc = removeFunc.func;

		setTimeout(session.flush, 0);
		
		if (thunkNode.custom === null) {
			// thunk has been unloaded, so remove updater
			removeFunc();
		} else {
			custom.removeFunc = removeFunc;
		}
	}
	
	if (thunkEssence.url) {
		//send serverAdviceRequest
		session.serverAdviceRequest(thunkEssence.url, thunkEssence.params);
		
		xmlTemplates.withTemplate(thunkEssence.url, perform);
	} else if (thunkEssence.template) {
		perform(thunkEssence.template);
	} else {
		debug.error("Thunk has no url or template specified.", thunkNode);
	}
}


function tagThunkEssence(node, baseUrl, ids) {
	var thunkEssence = getThunkEssence(node, baseUrl, ids);
	if (!node.custom) node.custom = {};
	node.custom.thunkEssence = thunkEssence;
}

function getThunkEssence(thunkNode, baseUrl, ids) {
	var thunkEssence = {};
	
	var withTemplate = xpath("f:with-template | f:with-action", thunkNode);
	if (withTemplate.length > 0) {
		withTemplate = withTemplate[0];
		var url = getAttr(withTemplate, "url");
		if (url) {
			thunkEssence.url = urlToAbs(baseUrl, url);
		} else {
			thunkEssence.template = getWithParam(withTemplate, ids);
		}
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

function copyThunkEssence(te) {
	return {
		url: te.url,
		template: te.template,
		params: map(te.params, function (x) {return x;})
	};
}




function getWithParam(node, ids) {
	var child = xpath("*[1]", node);
	if (child.length === 0) {
		debug.error("f:with-param node should have a child.", node);
	} else {
		return xmlToExpr(child[0], ids);
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


