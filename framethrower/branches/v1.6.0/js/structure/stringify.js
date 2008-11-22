/*function stringify(o) {
	var s = o.stringify;
	if (s) {
		if (typeOf(s) === "string") {
			return s;
		} / *else if (typeOf(s) === "function") {
			return s();
		}* /
	}
	
	var t = getType(o);
	if (t === types.Bool || t === types.Number) {
		return o.toString();
	} else if (t === types.String) {
		return '"' + o.replace(/"/g, '\\"') + '"';
	}
}*/