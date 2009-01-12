function intact(object, property, action, params) {
	// params has properties key and value, or just key
	console.log("intact called", arguments);
	
	object.prop[property].control[action](params.key, params.value);
}

function createObject(type, properties) {
	// properties has all of the "future" properties, reactive properties should start out as empty
	//console.log("createObject called", arguments);
	
	return makeObject(type, properties);
	
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
	
	console.log("perform actions children", children);
	
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











function triggerAction(thunkEssence) {
	// make "thunk island"
	var island = createEl("island");
	var thunk = createEl("f:thunk");
	appendChild(island, thunk);
	
	function onXMLUpdate() {
		var remaining = xpath(".//f:thunk", island);
		if (remaining.length === 0) {
			console.log("about to perform some actions", island);
			performActions(island.firstChild, emptyEnv);
		}
	}
	
	thunk.custom = {thunkEssence: thunkEssence, onXMLUpdate: onXMLUpdate};
		
	evalThunk(thunk);
}