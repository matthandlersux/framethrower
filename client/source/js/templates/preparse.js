function preparse(template) {
	//TODO: move this functionality into semantics.js
	if (!template) return;
	
	var kind = template.kind;
	if (kind === "lineTemplate") {
		template.type = parseType(template.type);
	} else if (kind === "lineExpr") {
		template.expr = parse(template.expr);
		if(template.type !== undefined) {
			template.type = parseType(template.type);
		}
	} else if (kind === "lineJavascript") {
		template.type = parseType(template.type);
	} else if (kind === "lineState") {
		//template.type = parseType(template.type);
	} else if (kind === "lineAction") {
		template.type = parseType(template.type);
	} else if (kind === "actionCreate") {
		template.type = parseType(template.type);
	} else if (kind === "actionUpdate") {
		template.target = parse(template.target);
		template.key = template.key ? parse(template.key) : undefined;
		template.value = template.value ? parse(template.value) : undefined;
	} else if (kind === "case") {
		template.test = parse(template.test);
	} else if (kind === "for-each") {
		template.select= parse(template.select);
	} else if (kind === "trigger") {
		template.trigger = parse(template.trigger);
	} else if (kind === "when") {
		template.test = parse(template.test);
	} else if (kind === "insert") {
		template.expr = parse(template.expr);
	}
	
	if (arrayLike(template) || objectLike(template)) {
		forEach(template, preparse);
	}
}