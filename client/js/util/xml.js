var xmlns = {
    f: "http://www.worldmerge.com/2008/xsl",
    xsl: "http://www.w3.org/1999/XSL/Transform",
    html: "http://www.w3.org/1999/xhtml",
    svg: "http://www.w3.org/2000/svg",
	exsl: "http://exslt.org/common",
	date: "http://exslt.org/dates-and-times"
};

/* Put these in your root xml element

xmlns:f="http://www.worldmerge.com/2008/xsl"
xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
xmlns:html="http://www.w3.org/1999/xhtml"
xmlns:svg="http://www.w3.org/2000/svg"

*/

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

var emptyXPathResult = document.evaluate("*[1=0]", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);


// useful for testing...
function loadXMLNow(url) {
	try {
		var req = new XMLHttpRequest();
		req.open("GET", url, false);
		req.send(null);
	} catch (e) {
		debug.log("loadXMLNow failed: " + url);
	}

    return req.responseXML.firstChild;
}


// function createDocument() {
// 	return document.implementation.createDocument("", "", null);
// }



function compileXSL(xsl) {
	if (xsl.nodeType === 9) xsl = xsl.firstChild;
	
	// this is required for xpath's within the xsl (that use namespaces) to work correctly
    function addxmlns(xml){
        forEach(xmlns, function(uri, prefix){
            xml.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:" + prefix, uri);
        });
    }
    addxmlns(xsl);
    
    // Compile
	var p = new XSLTProcessor();
    try {
        p.importStylesheet(xsl);
    } 
    catch (e) {
        debug.log("Compilation Error", xsl, e);
		debug.xml(xsl);
    }
	
    return function (source) {
        // Execute
        try {
            var result = p.transformToFragment(source, document);
			if (DEBUG) {
				var logs = xpath(".//f:consolelog", result.firstChild);
				forEach(logs, function (log) {
					debug.log("debug output from xsl: ");
					debug.xml(log);
				});
			}
        } 
        catch (e) {
            debug.log("Execution Error", xsl, source, e);
        }

        return result.firstChild;
    };
}









/*
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
    
	//for Safari, change each xsl:param to xsl:variable to extract the parameters from the source document
	var paramNodes = xpath("xsl:param", xsl);
	var templateNodes = xpath("xsl:template", xsl);
	var templateNode = templateNodes[0];
	
	forEach(paramNodes, function(paramNode) {
		var variableNode = document.createElementNS(xmlns.xsl, "variable");
		variableNode.setAttribute("name", paramNode.getAttribute("name"));
		variableNode.setAttribute("select", paramNode.getAttribute("name") + "/" + "*");
		templateNode.insertBefore(variableNode, templateNode.firstChild);
		paramNode.parentNode.removeChild(paramNode);
	});
	
	//xsl.firstChild.appendChild();
	//xsl.firstChild.insertBefore(newnode, xsl.firstChild.firstChild);

    var p = new XSLTProcessor();
    
    // Compile
    try {
        p.importStylesheet(xsl);
    } 
    catch (e) {
        console.log("Compilation Error", xsl, e);
    }
    
    return function(source, params){
		if (!params) params = {};
		
		// For Safari, add parameters to source document
		// Leave source alone if there are no params
		if (!isEmpty(params)) {
			source = document.createElementNS("", "parameters");
		}

		forEach(params, function(value, param){
			if (value !== emptyXPathResult) {
				var argNode = document.createElementNS("", param);
				if(typeOf(value) == 'string'){
					value = document.createTextNode(value);
					document.adoptNode(value);
					var stringNode = document.createElementNS("", "string");
					stringNode.appendChild(value);
					value = stringNode;
				}
			
				document.adoptNode(value);
			
				argNode.appendChild(value);
				source.appendChild(argNode);
			}
        });
	

        // Execute
        try {
			//XSLTProcessor doesn't do well with a node with no parent
			//so create a meaningless parent node and add source as a child
			if(!source.parentNode){
				var parent = document.createElementNS("","parent");
				parent.appendChild(source);
			}
            //var result = p.transformToFragment(source, document);
			var result = p.transformToDocument(source);
			if(DEBUG){
				var logs = xpath(".//f:consolelog", result.firstChild);
				forEach(logs, function (log) {
					console.log("debug output from xsl: ");
					if(console.dirxml){
						console.dirxml(log);
					} else {
						console.log(log.firstChild);
					}
				});
			}
        } 
        catch (e) {
            console.log("Execution Error", xsl, source, params, e, p);
        }
        


        return result.firstChild;
    };
}*/


//useful DOM function
function insertAfter(parent, newnode, insertafter) {
	if(insertAfter.nextSibling){
		parent.insertBefore(newnode, insertAfter.nextSibling);
	}else{
		parent.appendChild(newnode);
	}
}







function parseXML(s) {
	var firstTag = s.indexOf(">");
	if (s.charAt(firstTag - 1) === "/") {
		firstTag = firstTag - 1;
	}
	var nsString = "";
	forEach(xmlns, function (ns, prefix) {
		nsString += ' xmlns:' + prefix + '="' + ns + '"';
	});
	s = s.substring(0, firstTag) + nsString + s.substring(firstTag);
	var parser = new DOMParser();
	var ret = parser.parseFromString(s, "text/xml").firstChild;
	document.adoptNode(ret);
	return ret;
}

function serializeXML(xml) {
	var s = new XMLSerializer();
	return s.serializeToString(xml);
}
function unserializeXML(s) {
	var parser = new DOMParser();
	var ret = parser.parseFromString(s, "text/xml").firstChild;
	document.adoptNode(ret);
	return ret;
}












function createEl(nodeName) {
	var n = nodeName.split(":");
	if (n.length > 1) {
		return document.createElementNS(xmlns[n[0]], nodeName);
	} else {
		return document.createElement(nodeName);
	}
}

function createTextNode(s) {
	return document.createTextNode(s);
}


function getAttr(node, attName) {
	var n = attName.split(":");
	if (n.length > 1) {
		return node.getAttributeNS(xmlns[n[0]], attName);
	} else {
		return node.getAttribute(attName);
	}
}
function setAttr(node, attName, attValue) {
	var n = attName.split(":");
	if (n.length > 1) {
		node.setAttributeNS(xmlns[n[0]], attName, attValue);
	} else {
		node.setAttribute(attName, attValue);
	}
	return node;
}

function appendChild(node, childNode) {
	node.appendChild(childNode);
}
function cloneNode(node) {
	var clone = node.cloneNode(true);
	document.adoptNode(clone);
	return clone;
}

function isXML(o) {
	return !!o.nodeType;
}
