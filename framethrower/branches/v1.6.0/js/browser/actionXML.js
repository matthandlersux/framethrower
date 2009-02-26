function intact(object, property, action, key, value) {
	if (DEBUG) {
		if (!object.prop[property]) {
			debug.error("intact failed. Object does not have property `"+property+"`", object);
		}
	}
	
	// params has properties key and value, or just key
	objects.actOnProp(property, object, action, key, value);
	//object.prop[property].control[action](key, value);
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
			block: {
				variables: name ? [name] : [],
				actions: map(children, actionXMLToJS)
			}
		};
	} else if (nn === "f:create") {
		var te = node.custom.thunkEssence;
		var name = getAttr(node, "name");
		var type = getAttr(node, "type");
		var properties = map(te.params, function (param) {
			return extractVar(param);
		});
		return {
			create: {
				variable: name,
				type: type,
				prop: properties
			}
		};
	} else if (nn === "f:intact") {
		var te = node.custom.thunkEssence;
		var object = extractVar(te.params["object"]);
		var property = getAttr(node, "property");
		var action = getAttr(node, "action");
		var key = extractVar(te.params["key"]);
		var value = extractVar(te.params["value"]);
		return {
			change: {
				kind: action,
				object: object,
				property: property,
				key: key,
				value: value
			}
		};
	} else if (nn === "f:return") {
		return {
			'return': getAttr(node, "name")
		};
	} else if (nn === "f:servercall") {
		//TODO: add this to the protocol
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
		if (action.block) {
			var block = action.block;
			var newEnv = makeDynamicEnv(env.env);
			var results = performActionsJSLocal(block.actions, newEnv);
			
			var retNum = 0;
			forEach(results, function (result) {
				env.add(block.variables[retNum], result);
				retNum++;
			});
			if (retNum !== block.variables.length) {
				console.warn("Block doesn't have the right amount of variables", block);
			}
		} else if (action.create) {
			var create = action.create;
			var res = createObject(create.type, map(create.prop, unextract));
			if (create.variable) {
				env.add(create.variable, res);
			}
		} else if (action.change) {
			var change = action.change;
			intact(unextract(change.object), change.property, change.kind, unextract(change.key), unextract(change.value));
		} else if (action.return) {
			ret.push(env.env(action.return));
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
			
			var json = clientJSONToServerJSON(todo);
			//console.log("Sending actions to server", json);
			
			session.addActions(json, function (created, returned) {
				//console.log("Got response from actions", created, returned);
				//console.dir(created);
				
				forEach(created, function (serverNameAndType, varName) {
					env.add(varName, makeRemoteObject(serverNameAndType[0], parseType(JSON.parse(serverNameAndType[1]))));
				});
				
				
				// TODO: ret
				if (returned.length > 0) {
					debug.error("We haven't implemented returned yet! (line 179 actionXML.js)");
				}
				
				performActionsJS(actions, callback, env, ret);
			});
			
			
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
			console.log("HERE");
			performActionsJS(action.actions, cb, newEnv);
		}
	}
}



function tagActionsClientOrServer(actions, env, ret) {
	// Mutates actions
	// tags actions with .server=true if they create or change an object that inherits from Object
	
	if (!env) env = makeDynamicEnv();
	if (!ret) ret = [];
	
	forEach(actions, function (action) {
		if (action.block) {
			var newEnv = makeDynamicEnv(env.env);
			var results = tagActionsClientOrServer(action.block.actions, newEnv);
			
			var retNum = 0;
			forEach(results, function (result) {
				env.add(action.block.variables[retNum], result);
				retNum++;
			});
		} else if (action.create) {
			// decide based on type
			var type = action.create.type;
			if (objects.inherits(type, "Object")) {
				action.server = true;
			}			
			if (action.create.variable) {
				env.add(action.create.variable, action.server ? true : false);
			}
		} else if (action.change) {
			// decide based on type of object
			var o = action.change.object;
			if (o.variable) {
				action.server = env.env(o.variable);
			} else {
				var type = getType(o).value;
				if (objects.inherits(type, "Object")) {
					action.server = true;
				}
			}
		} else if (action.return) {
			ret.push(env.env(action.return));
		}
	});
	
	return ret;
}



function isClientOrServer(action) {
	// if (action.action === "servercall") {
	// 		return "server";
	// 	} else 
	
	if (action.return) {
		return "neither";
	} else if (action.block) {
		var ret = "neither";
		forEach(action.block.actions, function (action) {
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
	
	var done = false;
	
	function onXMLUpdate() {
		var remaining = xpath("descendant-or-self::f:thunk", island);
		if (remaining.length === 0 && !done) {

			//console.dirxml(island);

			var actions = actionXMLToJS(island.firstChild);
			unloadXML(island);
			done = true;

			tagActionsClientOrServer(actions);

			//console.dir(actions);

			performActionsJS(actions, function (res) {
				console.log("got result back", res);
				refreshScreen(); // TODO: this is probably not an optimal place for a refreshScreen
			});



			//console.profile();
			

		}
	}
	
	thunk.custom = {thunkEssence: thunkEssence, onXMLUpdate: onXMLUpdate, isAction: true};
		
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
		if (action.block) {
			return {
				block: {
					variables: action.block.variables,
					actions: clientJSONToServerJSON(action.block.actions)
				}
			};
		} else if (action.create) {
			return {
				create: {
					type: action.create.type,
					variable: action.create.variable,
					prop: map(action.create.prop, convert)
				}
			};
		} else if (action.change) {
			var change = action.change;
			return {
				change: {
					kind: change.kind,
					object: convert(change.object),
					property: change.property,
					key: convert(change.key),
					value: convert(change.value)
				}
			};
		} else if (action.return) {
			return action;
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
