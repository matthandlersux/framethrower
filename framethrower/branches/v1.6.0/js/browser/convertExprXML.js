function exprToXML(expr, type) {
	var lit = xmlizeLiteral(expr);
	if (lit !== undefined) {
		return lit;
	} else {
		if (!type) type = getType(expr);
		
		if (isReactive(expr.type) && !expr.params) {
			// Note: the !expr.params is for excluding parameter-less templates which otherwise look like StartCap's (not Fun's)
			
			if (expr.kind === "remoteObject") {
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
				if (state.length === 0) {
					xml = document.createDocumentFragment();
				} else {
					return exprToXML(state[0], type.right);
				}
			} else if (constructor === "Set") {
				xml = createEl("f:set");
				var entryType = type.right;
				forEach(state, function (entry) {
					append(xml, exprToXML(entry, entryType));
				});
			} else if (constructor === "Map") {
				xml = createEl("f:map");
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
		return unxmlizeLiteral(xml);
	} else if (nn === "f:o") {
		var id = getAttr(xml, "name");
		return ids[id];
	} else if (nn === "f:set") {
		// TODO
	} else if (nn === "f:map") {
		// TODO
	} else {
		return cloneNode(xml); // TODO: perhaps don't need cloneNode here
	}
}