

nullObject = {
	kind: "null",
	type: parseType("Null"),
	name: "Null"
};


// ============================================================================
// NOTE: the following functions are the interface through which the system interprets literals.
// But also make sure to modify browser/desugar.xml write-select if adding new literals.
// ============================================================================

// TODO: add stuff to parseLiteral and unparseLiteral to deal with XML

// String -> Literal
function parseLiteral(s) {
	if (/^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$/.test(s)) {
		// matches a number
		// using http://www.regular-expressions.info/floatingpoint.html
		// might want to find the regular expression that javascript uses...
		return +s;
	} else if (/^".*"$/.test(s)) {
		// matches a string
		var sub = s.substring(1, s.length - 2);
		return sub.replace(/\\(["\\])/g, "$1");
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
	} else {
		return undefined;
	}
}

// XML -> Literal
function unxmlizeLiteral(xml) {
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
	}
}



