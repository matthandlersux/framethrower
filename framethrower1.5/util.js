// http://javascript.crockford.com/remedial.html
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

// Arrays/Objects

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

// DOM/XML Nodes

var xmlns = {
	f: "http://www.filmsfolded.com/xsl/ui",
	xsl: "http://www.w3.org/1999/XSL/Transform",
	html: "http://www.w3.org/1999/xhtml",
	svg: "http://www.w3.org/2000/svg"
};

function xpath(expression, parentElement) {
	function nsResolver(prefix) {
		return xmlns[prefix] || null;
	}
	var results = [];
	var parentDocument = parentElement.ownerDocument || parentElement;
	
	//if (firefox2) parentDocument=document;
	
	var query = parentDocument.evaluate(expression, parentElement,
		nsResolver, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
	for (var i = 0, length = query.snapshotLength; i < length; i++) {
		results.push(query.snapshotItem(i));
	}
	return results;
}


// useful for testing...
function loadXMLNow(url) {
	var req = new XMLHttpRequest();
	req.open("GET", url, false);
	req.send(null);
	return req.responseXML.firstChild;
}




// Node -> (Node, {Node | String | Number} -> Node)
function compileXSL(xsl) {
	if (xsl.nodeType === 9) xsl = xsl.firstChild;
	
	// this is required for xpath's within the xsl (that use namespaces) to work correctly
	function addxmlns(xml) {
		forEach(xmlns, function (uri, prefix) {
			xml.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:" + prefix, uri);
		});
	}
	addxmlns(xsl);
	
	var p = new XSLTProcessor();
	
	// Compile
	try {
		p.importStylesheet(xsl);
	} catch (e) {
		console.log("Compilation Error", xsl, e);
	}
	
	return function(source, params) {
		// Set parameters
		forEach(params, function(value, param) {
			p.setParameter(null, param, value);
		});
		
		// Execute
		try {
			var result = p.transformToDocument(source);
		} catch (e) {
			console.log("Execution Error", xsl, source, params, e);
		}
		
		// Clear parameters
		forEach(params, function(value, param) {
			p.removeParameter(null, param);
		});
		
		return result.firstChild;
	};
}



