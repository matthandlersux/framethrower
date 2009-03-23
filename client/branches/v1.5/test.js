

function ok(bool, msg) {
	is(bool, true, msg);
}

function is(a, b, msg) {
	function typeOf(value) {
	    var s = typeof value;
	    if (s === 'object') {
	        if (value) {
	            if (value instanceof Array) {
	                s = 'array';
	            }
	        } else {
	            s = 'null';
	        }
	    }
	    return s;
	}
	function forEach(o, f) {
		if (typeOf(o.length) === "number") { // array-like
			for (var i = 0, len = o.length; i < len; i++) {
				f(o[i], i);
			}
		} else if (typeOf(o) === "object") {
			for (var i in o) if (o.hasOwnProperty(i)) {
				f(o[i], i);
			}
		} else {
			throw "forEach: type error";
		}
	}
	
	function compare(a, b) { // returns true if a and b are the same
		if (typeOf(a) === typeOf(b)) {
			if (typeOf(a) === "object") {
				if (a.nodeType !== undefined && b.nodeType !== undefined) {
					// compare as DOM Nodes
					if (!compare(a.nodeType, b.nodeType)) return false;
					if (!compare(a.nodeName, b.nodeName)) return false;
					if (!compare(a.namespaceURI, b.namespaceURI)) return false;
					if (!compare(a.localName, b.localName)) return false;
					if (a.nodeType === 9) {
						return compare(a.firstChild, b.firstChild);
					} else if (a.nodeType === 1) {
						// compare attributes
						for (var i=0; i < a.attributes.length; i++) {
							var att = a.attributes[i];
							var name = att.nodeName;
							var ns = att.namespaceURI;
							if (!compare(a.getAttributeNS(ns, name), b.getAttributeNS(ns, name))) return false;
						}
						for (var i=0; i < b.attributes.length; i++) {
							var att = b.attributes[i];
							var name = att.nodeName;
							var ns = att.namespaceURI;
							if (!compare(a.getAttributeNS(ns, name), b.getAttributeNS(ns, name))) return false;
						}
						
						// compare children
						if (a.childNodes.length !== b.childNodes.length) return false;
						for (var i = 0; i < a.childNodes.length; i++) {
							if (!compare(a.childNodes[i], b.childNodes[i])) {
								return false;
							}
						}
					} else {
						if (!compare(a.nodeValue, b.nodeValue)) return false;
					}
				} else {
					for (var i in a) if (a.hasOwnProperty(i)) {
						if (!compare(a[i], b[i])) {
							return false;
						}
					}
					for (var i in b) if (b.hasOwnProperty(i)) {
						if (!compare(a[i], b[i])) {
							return false;
						}
					}
				}
				return true;
			} else if (typeOf(a) === "array") {
				if (a.length !== b.length) {
					return false;
				} else {
					for (var i=0; i < a.length; i++) {
						if (!compare(a[i], b[i])) {
							return false;
						}
					}
					return true;
				}
			} else {
				return a === b;
			}
		} else {
			return false;
		}
	}
	if (compare(a, b)) {
		logTest("PASSED", msg, a, b);
	} else {
		logTest("FAILED", msg, a, b);
	}
}

function logTest(pf, msg, a, b) {
	function stringify(o) {
		if (typeOf(o) === "object" && o.nodeType !== undefined) {
			var serializer = new XMLSerializer();
			var xml = serializer.serializeToString(o);
			return xml;
		} else {
			return JSON.stringify(o);
		}
	}
	
	
	console.log(pf, msg, a, b);
	var table = document.getElementById("testTable");
	var tr = document.createElement("tr");

	function createTD(str) {
		var td = document.createElement("td");
		td.appendChild(document.createTextNode(str));
		return td;
	}
	function createPassFail(str) {
		var pf = document.createElement("span");
		if (str === "PASSED") {
			pf.setAttribute("class", "passed");
		} else {
			pf.setAttribute("class", "failed");
		}
		pf.appendChild(document.createTextNode(str));
		var td = document.createElement("td");
		td.appendChild(pf);
		return td;
	}

	tr.appendChild(createPassFail(pf));
	tr.appendChild(createTD(msg));
	var shortA = stringify(a);
	if (shortA.length>90) {
		shortA = shortA.substring(0,90) + "...";
	}
	var shortB = stringify(b);
	if (shortB.length>90) {
		shortB = shortB.substring(0,90) + "...";
	}
	
	tr.appendChild(createTD(shortA));
	tr.appendChild(createTD(shortB));

	table.appendChild(tr);	
}