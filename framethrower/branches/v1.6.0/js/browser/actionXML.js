function intact(object, property, action, key, value) {
	if (DEBUG) {
		if (!object.prop[property]) {
			debug.error("intact failed. Object does not have property `"+property+"`", object);
		}
	}
	
	// params has properties key and value, or just key
	object.prop[property].control[action](key, value);
}

function createObject(type, properties) {
	// properties has all of the "future" properties, reactive properties should start out as empty
	//console.log("createObject called", arguments);
	
	return objects.make(type, properties);
}



function extractVar(o) {
	if (o && o.nodeType === 1 && o.nodeName === "f:var") {
		return {variable: getAttr(o, "name")};
	} else {
		return o;
	}
}
function unextractVar(o, env) {
	if (o && o.variable) {
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
			variables: name ? [name] : [],
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
		var key = extractVar(te.params["key"]);
		var value = extractVar(te.params["value"]);
		return {
			action: action,
			object: object,
			property: property,
			key: key,
			value: value
		};
	} else if (nn === "f:return") {
		return {
			action: "return",
			variable: getAttr(node, "name")
		};
	} else if (nn === "f:servercall") {
		var te = node.custom.thunkEssence;
		var variablesString = getAttr(node, "variables");
		return {
			action: "servercall",
			method: getAttr(node, "method"),
			variables: variablesString ? [variablesString] : [],
			params: map(te.params, extractVar)
		};
	} else {
		debug.error("Unexpected action node with name `"+nn+"`.", node);
	}
}



function performActionsJSLocal(actions, env, ret) {
	if (!env) env = makeDynamicEnv();
	if (!ret) ret = [];
	
	function unextract(o) {
		return unextractVar(o, env.env);
	}
	
	forEach(actions, function (action) {
		if (action.action === "block") {
			var newEnv = makeDynamicEnv(env.env);
			var results = performActionsJSLocal(action.actions, newEnv);
			
			var retNum = 0;
			forEach(results, function (result) {
				env.add(action.variables[retNum], result);
				retNum++;
			});
		} else if (action.action === "create") {
			var res = createObject(action.type, map(action.prop, unextract));
			if (action.variable) {
				env.add(action.variable, res);
			}
		} else if (action.action === "add" || action.action === "remove") {
			intact(unextract(action.object), action.property, action.action, unextract(action.key), unextract(action.value));
		} else if (action.action === "return") {
			ret.push(env.env(action.variable));
		}
	});
	
	return ret;
}



function performActionsJS(actions, callback, env, ret) {
	if (!env) env = makeDynamicEnv();
	if (!ret) ret = [];
	
	if (actions.length === 0) {
		callback(ret);
	} else {
		var todo = [];
		var cs = "neither";

		while (actions.length > 0) {
			var action = actions[0];
			var actionCS = isClientOrServer(action);
			if (actionCS === "neither") {
				// do nothing
			} else if (cs === "neither") {
				cs = actionCS;
			} else if (cs !== actionCS) {
				break;
			}
			todo.push(actions.shift());
			if (actionCS === "both") break;
		}

		if (cs === "client" || LOCAL) {
			performActionsJSLocal(todo, env, ret);
			performActionsJS(actions, callback, env, ret);
		} else if (cs === "server") {
			
			
			
			
			// TODO
			
			
			
			
		} else if (cs === "both") {
			var newEnv = makeDynamicEnv(env.env);
			var action = todo[0];

			function cb(results) {
				var retNum = 0;
				forEach(results, function (result) {
					env.add(action.variables[retNum], result);
					retNum++;
				});
				performActionsJS(actions, callback, env, ret);
			}

			performActionsJS(action.actions, cb, newEnv);
		}
	}
}



function tagActionsClientOrServer(actions, env, ret) {
	// Mutates actions
	
	if (!env) env = makeDynamicEnv();
	if (!ret) ret = [];
	
	forEach(actions, function (action) {
		if (action.action === "block") {
			var newEnv = makeDynamicEnv(env.env);
			var results = tagActionsClientOrServer(action.actions, newEnv);
			
			var retNum = 0;
			forEach(results, function (result) {
				env.add(action.variables[retNum], result);
				retNum++;
			});
		} else if (action.action === "create") {
			// decide based on type
			var type = action.type;
			if (objects.inherits(type, "Object")) {
				action.server = true;
			}			
			if (action.variable) {
				env.add(action.variable, action.server ? true : false);
			}
		} else if (action.action === "add" || action.action === "remove") {
			// decide based on type of object
			var o = action.object;
			if (o.variable) {
				action.server = env.env(o.variable);
			} else {
				var type = getType(o).value;
				if (objects.inherits(type, "Object")) {
					action.server = true;
				}
			}
		} else if (action.action === "return") {
			ret.push(env.env(action.variable));
		}
	});
	
	return ret;
}



function isClientOrServer(action) {
	// if (action.action === "servercall") {
	// 		return "server";
	// 	} else 
	if (action.action === "return") {
		return "neither";
	} else if (action.action === "block") {
		var ret = "neither";
		forEach(action.actions, function (action) {
			var cs = isClientOrServer(action);
			if (ret === "neither") {
				ret = cs;
			} else if ((ret === "client" && cs === "server") || (ret === "server" && cs === "client")) {
				ret = "both";
			}
		});
		return ret;
	} else {
		if (action.server) return "server";
		else return "client";
	}
}




function triggerAction(thunkEssence) {
	// make "thunk island"
	var island = createEl("island");
	var thunk = createEl("f:thunk");
	appendChild(island, thunk);
	
	function onXMLUpdate() {
		var remaining = xpath("descendant-or-self::f:thunk", island);
		if (remaining.length === 0) {
			
			//console.dirxml(island);
			
			//performActions(island.firstChild, emptyEnv);
			
			//performActionsJSLocal(actionXMLToJS(island.firstChild));
			
			var actions = actionXMLToJS(island.firstChild);
			tagActionsClientOrServer(actions);
			
			//console.dir(actions);
			
			performActionsJS(actions, function (res) {
				console.log("got result back", res);
			});
						
			unloadXML(island);
			
			//console.profile();
		}
	}
	
	thunk.custom = {thunkEssence: thunkEssence, onXMLUpdate: onXMLUpdate};
		
	evalThunk(thunk);
}




function clientJSONToServerJSON(actions) {
	function convert(o) {
		if (o === undefined) {
			return undefined;
		} else if (o.variable) {
			return o.variable;
		} else {
			return stringify(o);
		}
	}

	return map(actions, function (action) {
		if (action.action === "block") {
			return {
				action: "block",
				variables: action.variables,
				actions: clientJSONToServerJSON(action.actions)
			};
		} else if (action.action === "create") {
			return {
				action: "create",
				type: action.type,
				variable: action.variable,
				prop: map(action.prop, convert)
			};
		} else if (action.action === "add" || action.action === "remove") {
			return {
				action: action.action,
				object: convert(action.object),
				property: action.property,
				key: convert(action.key),
				value: convert(action.value)
			};
		} else if (action.action === "return") {
			return {
				action: "return",
				variable: action.variable
			};
		}
	});
}

function renderJSONFromAction(url) {
	var thunkEssence = {
		url: url,
		params: {}
	};
	var island = createEl("island");
	var thunk = createEl("f:thunk");
	appendChild(island, thunk);
	
	function onXMLUpdate() {
		var remaining = xpath("descendant-or-self::f:thunk", island);
		if (remaining.length === 0) {
			var json = actionXMLToJS(island.firstChild);
			
			json = clientJSONToServerJSON(json);
			
			console.log(json);
			console.log(JSON.stringify(json));
		}
	}

	thunk.custom = {thunkEssence: thunkEssence, onXMLUpdate: onXMLUpdate};
		
	evalThunk(thunk);
}
