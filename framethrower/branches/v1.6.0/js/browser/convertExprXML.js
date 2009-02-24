function exprToXML(expr, type) {
	var lit = xmlizeLiteral(expr);
	if (lit !== undefined) {
		return lit;
	} else {
		if (!type) type = getType(expr); // the type passed in is just an optimization
		
		if (isReactive(expr.type) && !expr.params) {
			// Note: the !expr.params is for excluding parameter-less templates which otherwise look like StartCap's (not Fun's)
			
			if (expr.kind === "remoteObject") {
				//TODO: can this be removed?
				expr = evaluate(expr);
				setTimeout(session.flush,0);
			}
			
			var constructor = getTypeConstructor(type);
			
			expr.makeSorted();
			var state = expr.getState();
			
			var ids = {};
			var xml;
			function append(parentNode, child) {
				appendChild(parentNode, child.xml);
				mergeInto(child.ids, ids);
			}
			
			if (constructor === "Unit" || constructor === "Future") {
				xml = createEl("f:unit");
				var name = stringify(expr);
				setAttr(xml, "name", name);
				ids[name] = expr;
				
				var entryType = type.right;
				forEach(state, function (entry) {
					append(xml, exprToXML(entry, entryType));
				});
				
				
				// if (state.length === 0) {
				// 	xml = document.createDocumentFragment();
				// } else {
				// 	return exprToXML(state[0], type.right);
				// }
			} else if (constructor === "Set") {
				xml = createEl("f:set");
				var name = stringify(expr);
				setAttr(xml, "name", name);
				ids[name] = expr;
				
				var entryType = type.right;
				forEach(state, function (entry) {
					append(xml, exprToXML(entry, entryType));
				});
			} else if (constructor === "Map") {
				xml = createEl("f:map");
				var name = stringify(expr);
				setAttr(xml, "name", name);
				ids[name] = expr;
				
				var keyType = type.left.right;
				var valueType = type.right;
				forEach(state, function (entry) {
					var entryXML = createEl("f:entry");
					var key = createEl("f:key");
					var value = createEl("f:value");
					append(key, exprToXML(entry.key, keyType));
					append(value, exprToXML(entry.val, valueType));
					
					appendChild(entryXML, key);
					appendChild(entryXML, value);
					appendChild(xml, entryXML);
				});
			}
			
			return {xml: xml, ids: ids};
		} else {
			var s = stringify(expr);
			var ids = {};
			ids[s] = expr;
			return {xml: setAttr(createEl("f:o"), "name", s), ids: ids};
		}
	}
}


function xmlToExpr(xml, ids) {
	var nn = xml.nodeName;
	
	if (nn === "f:literal") {
		return unxmlizeLiteral(xml, ids);
	} else if (nn === "f:o" || nn === "f:set" || nn === "f:map") {
		var id = getAttr(xml, "name");
		return ids[id];
	} else if (nn === "f:set") {
		// TODO
	} else if (nn === "f:map") {
		// TODO
	} else if (nn === "f:unit") {
		debug.error("Not supposed to hit a f:unit..."); // TODO remove this
	} else {
		return cloneNode(xml); // TODO: perhaps don't need cloneNode here
	}
}