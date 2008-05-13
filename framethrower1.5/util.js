// http://javascript.crockford.com/remedial.html
function typeOf(value){
    var s = typeof value;
    if (s === 'object') {
        if (value) {
            if (value instanceof Array) {
                s = 'array';
            }
        }
        else {
            s = 'null';
        }
    }
    return s;
}

// Arrays/Objects

<<<<<<< .mine
function arrayLike(o) {
	if (typeOf(o.length) === "number") {
		return true;
	} else {
		return false;
	}
}
function objectLike(o) {
	if (typeOf(o) === "object") {
		return true;
	} else {
		return false;
	}
}

function forEach(o, f) {
	if (arrayLike(o)) {
		for (var i = 0, len = o.length; i < len; i++) {
			f(o[i], i);
		}
	} else if (objectLike(o)) {
		for (var i in o) if (o.hasOwnProperty(i)) {
			f(o[i], i);
		}
	}
=======
function forEach(o, f){
    if (typeOf(o.length) === "number") { // array-like
        for (var i = 0, len = o.length; i < len; i++) {
            f(o[i], i);
        }
    }
    else 
        if (typeOf(o) === "object") {
            for (var i in o) 
                if (o.hasOwnProperty(i)) {
                    f(o[i], i);
                }
        }
        else {
            throw "forEach: type error";
        }
>>>>>>> .r10
}

function any(o, f) {
	if (arrayLike(o)) {
		for (var i = 0, len = o.length; i < len; i++) {
			if (f(o[i], i)) {
				return true;
			}
		}
	} else if (typeOf(o) === "object") {
		for (var i in o) if (o.hasOwnProperty(i)) {
			if (f(o[i], i)) {
				return true;
			}
		}
	}
	return false;
}
function all(o, f) {
	return !any(o, function (v, k) {
		return !f(v, k);
	});
}
function isEmpty(o) {
	return any(o, function () {
		return true;
	});
}

// DOM/XML Nodes

var xmlns = {
    f: "http://www.filmsfolded.com/xsl/ui",
    xsl: "http://www.w3.org/1999/XSL/Transform",
    html: "http://www.w3.org/1999/xhtml",
    svg: "http://www.w3.org/2000/svg"
};

function xpath(expression, parentElement){
    function nsResolver(prefix){
        return xmlns[prefix] || null;
    }
    var results = [];
    var parentDocument = parentElement.ownerDocument || parentElement;
    
    //if (firefox2) parentDocument=document;
    
    var query = parentDocument.evaluate(expression, parentElement, nsResolver, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    for (var i = 0, length = query.snapshotLength; i < length; i++) {
        results.push(query.snapshotItem(i));
    }
    return results;
}


// useful for testing...
function loadXMLNow(url){
    var req = new XMLHttpRequest();
    req.open("GET", url, false);
    req.send(null);
    return req.responseXML.firstChild;
}

// useful for testing... load xml into a bunch of objects, return root object
function loadXMLtoProcessesNow(url, childType, siblingType){
    var req = new XMLHttpRequest();
    req.open("GET", url, false);
    req.send(null);
    
    var root = req.responseXML.firstChild;
    if (root) {
        return xmlToProcesses(root, childType, siblingType);
    }
    else {
        return null;
    }
}

function xmlToProcesses(currentElement, childType, siblingType){
	var currentElementProcess;
	if (currentElement.nodeValue) {
		currentElementProcess = makeProcess(currentElement.nodeValue);
	}
	else {
		currentElementProcess = makeProcess(currentElement.nodeName);
	}
    var firstChild = currentElement.firstChild;
    if (firstChild) {
        var firstChildProcess = xmlToProcesses(currentElement.firstChild, childType, siblingType);
        makeLink(currentElementProcess, childType, firstChildProcess);
    }
    var nextSibling = currentElement.nextSibling;
    if (nextSibling) {
        var nextSiblingProcess = xmlToProcesses(currentElement.nextSibling, childType, siblingType);
        makeLink(currentElementProcess, siblingType, nextSiblingProcess);
    }
    return currentElementProcess;
}

// Node -> (Node, {Node | String | Number} -> Node)
function compileXSL(xsl){
    if (xsl.nodeType === 9) 
        xsl = xsl.firstChild;
    
    // this is required for xpath's within the xsl (that use namespaces) to work correctly
    function addxmlns(xml){
        forEach(xmlns, function(uri, prefix){
            xml.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:" + prefix, uri);
        });
    }
    addxmlns(xsl);
    
    var p = new XSLTProcessor();
    
    // Compile
    try {
        p.importStylesheet(xsl);
    } 
    catch (e) {
        console.log("Compilation Error", xsl, e);
    }
    
    return function(source, params){
        // Set parameters
        forEach(params, function(value, param){
            p.setParameter(null, param, value);
        });
        
        // Execute
        try {
            var result = p.transformToDocument(source);
        } 
        catch (e) {
            console.log("Execution Error", xsl, source, params, e);
        }
        
        // Clear parameters
        forEach(params, function(value, param){
            p.removeParameter(null, param);
        });
        
        return result.firstChild;
    };
}



