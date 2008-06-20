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
	return !any(o, function () {
		return true;
	});
}

function values(o) {
	var ret = [];
	forEach(o, function (v, k) {
		ret.push(v);
	});
	return ret;
}
function keys(o) {
	var ret = [];
	forEach(o, function (v, k) {
		ret.push(k);
	});
	return ret;
}

// used for merging objects
function merge() {
	var ret = {};
	forEach(arguments, function (arg) {
		forEach(arg, function (v, k) {
			ret[k] = v;
		});
	});
	return ret;
}

// useful for testing...
function loadXMLNow(url){
    var req = new XMLHttpRequest();
    req.open("GET", url, false);
    req.send(null);
    return req.responseXML.firstChild;
}

// DOM/XML Nodes

var xmlns = {
    f: "http://www.filmsfolded.com/xsl/ui",
    xsl: "http://www.w3.org/1999/XSL/Transform",
    html: "http://www.w3.org/1999/xhtml",
    svg: "http://www.w3.org/2000/svg"
};


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
			//XSLTProcessor doesn't do well with a node with no parent
			//so create a meaningless parent node and add source as a child
			if(!source.parentNode){
				var parent = document.createElementNS("","parent");
				parent.appendChild(source);
			}
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


Object.prototype.method = function(name, func) {
	this.prototype[name] = func;
	return this;
};

Function.prototype.method = function(name, func) {
	this.prototype[name] = func;
	return this;
};

//from Crockford's Javascript: The Good Parts, page 54
Object.method('superior', function(name) {
	var that = this;
	var method = that[name];
	return function () {
		return method.apply(that, arguments);
	};
});

