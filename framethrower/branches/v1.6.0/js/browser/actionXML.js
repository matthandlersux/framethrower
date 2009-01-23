function intact(object, property, action, params) {
	if (DEBUG) {
		if (!object.prop[property]) {
			debug.error("intact failed. Object does not have property `"+property+"`", object);
		}
	}
	
	// params has properties key and value, or just key
	object.prop[property].control[action](params.key, params.value);
}

function createObject(type, properties) {
	// properties has all of the "future" properties, reactive properties should start out as empty
	//console.log("createObject called", arguments);
	
	return objects.make(type, properties);
	
	// needs to return the created object
	// return "This should be the created object";
}


function performActions(node, env, callback) {
	if (!callback) callback = function () {};
	
	var children = [];
	var ret = [];
	
	function addChildren(node) {
		forEach(node.childNodes, function (child) {
			var nn = child.nodeName;
			if (nn === "f:result") {
				addChildren(child);
			} else if (nn === "f:return") {
				ret.push(getAttr(child, "name"));
			} else {
				children.push(child);
			}
		});
	}
	addChildren(node);
	
	var i = -1;
	function process(env) {
		i++;
		if (children[i]) {
			performAction(children[i], env, process);
		} else {
			callback(map(ret, env));
		}
	}
	process(env);
}



function performAction(node, env, callback) {
	// performs an action node, callbacks with the new env
	
	var nn = node.nodeName;
	if (nn === "f:let") {
		// TODO: add support for multiple returns via commas in name
		var name = getAttr(node, "name");
		performActions(node, env, function (ret) {
			if (name) {
				callback(envAdd(env, name, ret[0]));
			} else {
				callback(env);
			}
		});
	} else if (nn === "f:create") {
		var te = node.custom.thunkEssence;
		var name = getAttr(node, "name");
		var type = getAttr(node, "type");
		var properties = map(te.params, function (param) {
			return getVar(param, env);
		});
		var newOb = createObject(type, properties);
		callback(envAdd(env, name, newOb));
	} else if (nn === "f:intact") {
		var te = node.custom.thunkEssence;
		var object = getVar(te.params["object"], env);
		var property = getAttr(node, "property");
		var action = getAttr(node, "action");
		var params = map(te.params, function (param) {
			return getVar(param, env);
		});
		intact(object, property, action, params);
		callback(env);
	} else {
		debug.error("Unexpected action node", node);
	}
}

function getVar(o, env) {
	if (o.nodeType === 1 && o.nodeName === "f:var") {
		return env(getAttr(o, "name"));
	} else {
		return o;
	}
}





function extractVar(o) {
	if (o.nodeType === 1 && o.nodeName === "f:var") {
		return {variable: getAttr(o, "name")};
	} else {
		return o;
	}
}
function unextractVar(o, env) {
	if (o.variable) {
		return env(o.variable);
	} else {
		return o;
	}
}
function actionXMLToJS(node) {
	var nn = node.nodeName;
	if (nn === "f:result") {
		var children = xpath("*[not(self::f:result)] | f:result/*", node);
		return map(children, actionXMLToJS);
	} else if (nn === "f:let") {
		var children = xpath("*[not(self::f:result)] | f:result/*", node);
		// TODO: add support for multiple returns via commas in name
		var name = getAttr(node, "name");
		return {
			action: "block",
			variables: [name],
			actions: map(children, actionXMLToJS)
		};
	} else if (nn === "f:create") {
		var te = node.custom.thunkEssence;
		var name = getAttr(node, "name");
		var type = getAttr(node, "type");
		var properties = map(te.params, function (param) {
			return extractVar(param);
		});
		return {
			action: "create",
			variable: name,
			type: type,
			prop: properties
		};
	} else if (nn === "f:intact") {
		var te = node.custom.thunkEssence;
		var object = extractVar(te.params["object"]);
		var property = getAttr(node, "property");
		var action = getAttr(node, "action");
		var params = map(te.params, function (param) {
			return extractVar(param);
		});
		return {
			action: action,
			object: object,
			property: property,
			params: params
		};
	} else if (nn === "f:return") {
		return {
			action: "return",
			variable: getAttr(node, "name")
		};
	} else {
		debug.error("Unexpected action node with name `"+nn+"`.", node);
	}
}



function performActionsJSLocal(actions, env) {
	if (!env) env = makeDynamicEnv();
	var ret = [];
	
	function unextract(o) {
		return unextractVar(o, env.env);
	}
	
	forEach(actions, function (actionjs) {
		var action = actionjs.action;
		if (action === "block") {
			var newEnv = makeDynamicEnv(env.env);
			var results = performActionsJSLocal(actionjs.actions, newEnv);
			
			var retNum = 0;
			forEach(results, function (result) {
				env.add(actionjs.variables[retNum], result);
				retNum++;
			});
		} else if (action === "create") {
			var res = createObject(actionjs.type, map(actionjs.prop, unextract));
			if (actionjs.variable) {
				env.add(actionjs.variable, res);
			}
		} else if (action === "add" || action === "remove") {
			intact(unextract(actionjs.object), actionjs.property, actionjs.action, map(actionjs.params, unextract));
		} else if (action === "return") {
			ret.push(env.env(actionjs.variable));
		}
	});
	
	return ret;
}









function triggerAction(thunkEssence) {
	// make "thunk island"
	var island = createEl("island");
	var thunk = createEl("f:thunk");
	appendChild(island, thunk);
	
	function onXMLUpdate() {
		var remaining = xpath(".//f:thunk", island);
		if (remaining.length === 0) {
			
			//console.dirxml(island);
			console.log(actionXMLToJS(island.firstChild));
			
			//performActions(island.firstChild, emptyEnv);
			
			performActionsJSLocal(actionXMLToJS(island.firstChild));
			
			unloadXML(island);
			
			//console.profile();
		}
	}
	
	thunk.custom = {thunkEssence: thunkEssence, onXMLUpdate: onXMLUpdate};
		
	evalThunk(thunk);
}