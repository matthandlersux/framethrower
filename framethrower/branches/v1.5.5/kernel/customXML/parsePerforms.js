
// takes in a qtDoc (qtDocs.get(<f:transaction>)) and params (hash of outputPins)
// returns an object {xml: <...>, ids: {}}
function evaluateTransaction(qtDoc, params) {
	// hack... make an end cap to evaluate the transaction, then remove the end cap right away
	var transaction;
	var storeResultProc = {
		set: function (val) {
			transaction = val;
		}
	};
	
	var EC = makeSimpleEndCap(makeAmbient(), storeResultProc, qtDoc(params));
	EC.deactivate();
	
	return transaction;
}





function processPerforms(ambient, node, ids, vars, relurl, url, params) {
	if (!url) {
		url = getUrlFromXML(node, relurl);
	}
	
	var functionCom = qtDocs.get(url);
	
	if (!params) {
		var paramNodes = xpath("f:with-param", node);
		params = {};
		forEach(paramNodes, function (paramNode) {
			params[paramNode.getAttributeNS("", "name")] = convertXMLToPin(paramNode, ids, vars);
		});
	}

	
	var transaction = evaluateTransaction(functionCom, params);
	

	
	console.dirxml(transaction.xml);
	
	//execute transaction
	var executeTransaction = function (transaction) {
		var newvars = {};
		var returnVars = {};
		var ids = transaction.ids;

		forEach(transaction.xml.childNodes, function(actionNode){
			var actionName = actionNode.localName;
			var type = actionNode.getAttributeNS("", "type");
			if (actionName == 'make') {
				var result = typeNames[type].make();
				var resultName = actionNode.getAttributeNS("", "name");
				if(resultName) {
					newvars[resultName] = result;
				}
			} else if (actionName == 'intact') {
				var prefix = actionNode.getAttributeNS("", "with-var");
				if (prefix) {
					prefix = newvars[prefix];
				} else {
					prefix = actionNode.getAttributeNS("", "with-id");
					if (prefix) {
						prefix = ids[prefix];
					}
				}
				var prop = actionNode.getAttributeNS("", "prop");
				var action = actionNode.getAttributeNS("", "action");

				var params = [];
				//with-param nodes (put in xpath here?)
				//change code to accept params like this: <f:string value="kernel.individual" />
				forEach (actionNode.childNodes, function(paramNode){
					params.push(getObjectFromParam(paramNode, ids, newvars));
				});
				prefix.control[prop][action].apply(null, params);
			} else if (actionName == 'perform') {
				var newvarprefix = actionNode.getAttributeNS("", "prefix");
				var result = processPerforms(ambient, actionNode, transaction.ids, newvars, url);
				forEach(result.returnVars, function(addvar, key){
					if(newvarprefix){
						newvars[newvarprefix + "." + key] = addvar;
					}
				});
			} else if (actionName == 'return') {
				//store variable names to return
				returnVars[actionNode.getAttributeNS("", "as")] = actionNode.getAttributeNS("", "value");
			}
		});
		//take only the returnVars from the newvars
		forEach(returnVars, function(value, name){
			returnVars[name] = newvars[value];
		});
		return {success:true, returnVars:returnVars}; //add more nuanced return values
	};
	
	return executeTransaction(transaction);
}



function processAllPerforms(ambient, node, ids, vars, relurl) {
	var performs = xpath(".//f:perform", node);
	forEach(performs, function (perform) {
		var answer = processPerforms(ambient, perform, ids, vars, relurl);
	});
}