

var nullObject = {
	kind: "null",
	type: parseType("Null"),
	name: "null"
};


// ============================================================================
// NOTE: the following functions are the interface through which the system interprets literals.
// But also make sure to modify browser/desugar.xml write-select if adding new literals.
// ============================================================================

// String -> Literal
function parseLiteral(s) {
	if (/^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$/.test(s)) {
		// matches a number
		// using http://www.regular-expressions.info/floatingpoint.html
		// might want to find the regular expression that javascript uses...
		return +s;
	} else if (/^".*"$/.test(s)) {
		// matches a string
		var sub = s.substring(1, s.length - 1);
		return sub.replace(/\\(["\\])/g, "$1");
	} else if (/^</.test(s)) { // might want to make this check that the xml is well-formed?
		return unserializeXML(s);
	} else if (s === "true") {
		return true;
	} else if (s === "false") {
		return false;
	} else if (s === "null") {
		return nullObject;
	} else {
		return undefined;
	}
}

// Literal -> String
function unparseLiteral(expr) {
	var t = typeOf(expr);
	if (t === "string") {
		return '"' + expr.replace(/(["\\])/g, "\\$1") + '"';
	} else if (t === "boolean" || t === "number") {
		return expr.toString();
	} else if (expr.nodeType) {
		return serializeXML(expr);
	} else {
		return undefined;
	}
}

// Literal -> XML
function xmlizeLiteral(expr) {
	var t = typeOf(expr);
	if (t === "number") {
		return {xml: setAttr(setAttr(createEl("f:literal"), "type", "Number"), "value", expr), ids: {}};
	} else if (t === "string") {
		return {xml: setAttr(setAttr(createEl("f:literal"), "type", "String"), "value", expr), ids: {}};
	} else if (t === "boolean") {
		return {xml: setAttr(setAttr(createEl("f:literal"), "type", "Bool"), "value", expr), ids: {}};
	} else if (expr === nullObject) {
		return {xml: setAttr(setAttr(createEl("f:literal"), "type", "Null"), "value", "null"), ids: {}};
	} else if (isXML(expr)) {
		var xml = setAttr(createEl("f:literal"), "type", "XML");
		appendChild(xml, cloneNode(expr));
		return {xml: xml, ids: {}};
	} /*else if (expr.kind === "properties") {
		var xml = setAttr(createEl("f:literal"), "type", "Properties");
		var ids = {};
		function append(parentNode, child) {
			appendChild(parentNode, child.xml);
			mergeInto(child.ids, ids);
		}
		
		var objectXML = setAttr(createEl("f:object"), "type", expr.value.type);
		append(objectXML, exprToXML(expr.value.object));
		appendChild(xml, objectXML);
		
		forEach(expr.value.prop, function (p, propName) {
			var propXML = setAttr(createEl("f:prop"), "name", propName);
			append(propXML, exprToXML(p));
			appendChild(xml, propXML);
		});
		
		return {xml: xml, ids: ids};		
	}*/ else {
		return undefined;
	}
}

// XML -> Literal
function unxmlizeLiteral(xml, ids) {
	var type = getAttr(xml, "type");
	if (type === "Number") {
		return +getAttr(xml, "value");			
	} else if (type === "String") {
		return getAttr(xml, "value");			
	} else if (type === "Bool") {
		return getAttr(xml, "value") === "true";			
	} else if (type === "Null") {
		return nullObject;
	} else if (type === "XML") {
		return cloneNode(xpath("*", xml)[0]); // TODO: perhaps don't need cloneNode here
	} /*else if (type === "Properties") {
		var ret = {
			kind: "properties",
			type: parseType("Properties"),
			value: {
				prop: {}
			}
		};
		var objectXML = xpath("f:object", xml)[0];
		ret.value.type = getAttr(objectXML, "type");
		ret.value.object = xmlToExpr(objectXML.firstChild, ids);
		var propXMLs = xpath("f:prop", xml);
		forEach(propXMLs, function (propXML) {
			ret.value.prop[getAttr(propXML, "name")] = xmlToExpr(propXML.firstChild, ids);
		});
		return ret;
	}*/
}



