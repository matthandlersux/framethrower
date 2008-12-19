function exprToXML(expr) {
	var t = typeOf(expr);
	if (t === "number") {
		return {xml: setAttr(createEl("number", "f"), "value", expr), ids: {}};
	} else if (t === "string") {
		return {xml: setAttr(createEl("string", "f"), "value", expr), ids: {}};
	} else if (t === "boolean") {
		return {xml: setAttr(createEl("bool", "f"), "value", expr), ids: {}};
	} else {
		if (expr.kind === "startCap") {
			var type = getType(expr);
			var a = expr.getState();
			
			// TODO
		} else {
			var s = stringify(expr);
			var ids = {};
			ids[s] = expr;
			return {xml: setAttr(createEl("o", "f"), "name", s), ids: ids};
		}
	}
}


function xmlToExpr(xml, ids) {
	// TODO
}