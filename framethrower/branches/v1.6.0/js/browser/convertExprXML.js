function exprToXML(expr, type) {
	var t = typeOf(expr);
	if (t === "number") {
		return {xml: setAttr(createEl("f:number"), "value", expr), ids: {}};
	} else if (t === "string") {
		return {xml: setAttr(createEl("f:string"), "value", expr), ids: {}};
	} else if (t === "boolean") {
		return {xml: setAttr(createEl("f:bool"), "value", expr), ids: {}};
	} else {
		if (expr.kind === "startCap") {
			
			if (!type) type = getType(expr);
			var constructor = getTypeConstructor(type);
			var state = expr.getState();
			
			var ids = {};
			var xml;
			function append(parentNode, child) {
				parentNode.appendChild(child.xml); // BROWSER
				mergeInto(child.ids, ids);
			}
			
			if (constructor === "Unit") {
				if (state.length === 0) {
					return null;
				} else {
					return exprToXML(state[0], type.right);
				}
			} else if (constructor === "Set") {
				xml = createEl("f:set");
				var entryType = type.right;
				forEach(state, function (entry) {
					append(xml, exprToXML(entry, entryType));
				});
			} else if (constructor === "Assoc") {
				xml = createEl("f:assoc");
				var keyType = type.left.right;
				var valueType = type.right;
				forEach(state, function (entry) {
					var entryXML = createEl("f:entry");
					var key = createEl("f:key");
					var value = createEl("f:value");
					append(key, exprToXML(entry.key, keyType));
					append(value, exprToXML(entry.value, valueType));
					
					entryXML.appendChild(key);
					entryXML.appendChild(value);
					xml.appendChild(entryXML); // BROWSER
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
	var name = xml.localName;
	var ns = xml.namespaceURI;
	
	if (ns === xmlns["f"]) {
		if (name === "number") {
			return +getAttr(xml, "value");
		} else if (name === "string") {
			return getAttr(xml, "value");
		} else if (name === "bool") {
			return getAttr(xml, "value") === "true";
		} else if (name === "o") {
			var id = getAttr(xml, "name");
			return ids[id];
		} else if (name === "set") {
			// TODO
		} else if (name === "assoc") { // TODO: we really need to change assoc to map
			// TODO
		}
	} else {
		return xml;
	}
}