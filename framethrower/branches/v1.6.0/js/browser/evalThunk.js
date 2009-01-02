// OUTDATED








/*
scopeVars is an object with these properties:
	baseUrl: the url of the containing thunk
	ids: a hash of ids (String's) to Expr's from the containing thunks params and derived params
	tunnelEnv: an Env containing the tunneled scope
*/

/*function evalThunk(thunkNode, scopeVars) {
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
}*/



function evalThunk(thunkNode, baseUrl, ids) {
	var thunkEssence = getThunkEssence(thunkNode, baseUrl, ids);
	
	if (thunkEssence.url) {
		xmlTemplates.withTemplate(thunkEssence.url, function (xt) {
			var e = xt.fun;
			forEach(xt.params, function (p) {
				e = makeApply(e, thunkEssence.params[p.name]);
			});
			
			evaluateAndInject(e, function (xmlids) {
				// TODO replace with replaceXML function
				thunkNode.parentNode.replaceChild(xmlids.xml, thunkNode);
				thunkNode = xmlids.xml;
			});
		});
	} else {
		// TODO
	}
}