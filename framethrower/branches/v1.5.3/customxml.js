function parseXMLFunc(xml) {
	var paramNodes = xpath("f:param", xml);
	var derivedNodes = xpath("f:derived", xml);
	
}

function extractXSLFromCustomXML(xml) {
	var xslDoc = createDocument();
	var ss = xslDoc.createElementNS(xmlns["xsl"], "stylesheet");
	ss.setAttributeNS("", "version", "1.0");
	
	var paramNodes = xpath("f:param | f:derived", xml);
	forEach(paramNodes, function (n) {
		var p = xslDoc.createElementNS(xmlns["xsl"], "param");
		p.setAttributeNS("", "name", n.getAttributeNS("", "name"));
		ss.appendChild(p);
	});
	
	var xslNodes = xpath("xsl:*", xml);
	forEach(xslNodes, function (n) {
		var c = n.cloneNode(true);
		xslDoc.adoptNode(c);
		
		if (!n.hasAttribute("name") && !n.hasAttribute("match")) {
			c.setAttributeNS("", "match", "*");
		}
		
		ss.appendChild(c);
	});
	
	return ss;
}

var blankXML = createDocument();
blankXML.appendChild(blankXML.createElementNS("", "nothing"));

function compileCustom(xml) {
	var xsl = extractXSLFromCustomXML(xml);
	var compiled = compileXSL(xsl);
	return function (params) {
		return compiled(blankXML, params);
	};
}

function getDerivements(xml, params, id, callback) {
	// calls callback with params and derived parameters (passed in as an object)
	// when all derived parameters are in, and then whenever a derived parameter changes
	var derivedNodes = xpath("f:derived", xml);
	var derive = {};
	forEach(derivedNodes, function (n) {
		var name = n.getAttributeNS("", "name");
		derive[name] = {completed: false, value: null};
	});
	
	//console.log("collected derived", derive);
	
	var callParams = {};
	forEach(params, function (p, name) {
		callParams[name] = p.getId();
	});
	function checkDone() {
		var done = true;
		forEach(derive, function (d, name) {
			done = done && d.completed;
			callParams[name] = d.value;
		});
		if (done) {
			//console.log("derivements all done");
			//console.dir(callParams);
			callback(callParams);
		}
	}
	
	forEach(derivedNodes, function (n) {
		var name = n.getAttributeNS("", "name");
		var query = n.getAttributeNS("", "query");
		var of = params[n.getAttributeNS("", "of")];
		function cb(val) {
			derive[name].value = val;
			derive[name].completed = true;
			checkDone();
		}
		if (query === "content") {
			of.queryContent(cb, id);
		} // TODO rest of the queries
	});
}


function makeFunc(xml) {
	var f = {};
	
	
	
	var applies = makeOhash(stringifyParams);
	
	f.makeApply = function (params) {
		return applies.getOrMake(params, function () {
			var apply = {};
			
			
		});
	};
	
	return f;
}

function stringifyParams(params) {
	var strings = [];
	forEach(params, function (val, p) {
		strings.push("((" + p + ")(" + stringifyObject(val) + "))");
	});
	strings.sort();
	return strings.join("");
}