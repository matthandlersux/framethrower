function exprToXML(expr, type) {
	var t = typeOf(expr);
	if (t === "number") {
		return {xml: setAttr(createEl("f:number"), "value", expr), ids: {}};
	} else if (t === "string") {
		return {xml: setAttr(createEl("f:string"), "value", expr), ids: {}};
	} else if (t === "boolean") {
		return {xml: setAttr(createEl("f:bool"), "value", expr), ids: {}};
	} else {
		if (expr.kind === "startCap" && !expr.params) {
			// Note: the !expr.params is for excluding parameter-less templates which otherwise look like StartCap's (not Fun's)
			
			if (!type) type = getType(expr);
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
					append(value, exprToXML(entry.value, valueType));
					
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
	
	if (nn === "f:number") {
		return +getAttr(xml, "value");
	} else if (nn === "f:string") {
		return getAttr(xml, "value");
	} else if (nn === "f:bool") {
		return getAttr(xml, "value") === "true";
	} else if (nn === "f:o") {
		var id = getAttr(xml, "name");
		return ids[id];
	} else if (nn === "f:set") {
		// TODO
	} else if (nn === "f:map") {
		// TODO
	} else {
		return xml;
	}
}