function appendCopy(parent, child) {
	var c = child.cloneNode(true);
	parent.ownerDocument.adoptNode(c);
	parent.appendChild(c);
	return c;
}

var blankXML = createDocument();
blankXML.appendChild(blankXML.createElementNS("", "nothing"));



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
		var c = appendCopy(ss, n);
		
		if (!n.hasAttribute("name") && !n.hasAttribute("match")) {
			c.setAttributeNS("", "match", "*");
		}
	});
	
	return ss;
}



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



function serializeObject(o) {
	function make(name) {
		return document.createElementNS(xmlns["f"], name);
	}
	function createXML(name) {
		var xml = make(name);
		xml.setAttributeNS("", "id", o.getId());
		// content
		var content = o.getContent();
		if (content) {
			var contentxml = make("content");
			if (typeof(content) === "string") {
				contentxml.appendChild(document.createTextNode(content));
			} else {
				appendCopy(contentxml, content);
			}
			xml.appendChild(contentxml);
		}
		// corresponds
		var correspondsIn = o.getCorrespondsIn();
		forEach(o.getCorrespondsIn(), function (correspond) {
			var correspondxml = make("correspond");
			correspondxml.setAttributeNS("", "with", correspond.getId());
			xml.appendChild(correspondxml);
		});
		return xml;
	}
	
	var type = o.getType();
	
	var xml = createXML(type);
	
	if (type === "situation") {
		forEach(o.getObjects(), function (child) {
			xml.appendChild(serializeObject(child));
		});
	} else if (type === "ghost") {
	
	} else if (type === "individual") {
		
	} else if (type === "role") {
		
	} else if (type === "relation") {
		
	} else if (type === "infon") {
		xml.setAttributeNS("", "relation", o.getRelation().getId());
		//var arcsxml = make("arcs");
		var arcs = o.getArcs();
		forEach(arcs, function (arc) {
			var arcxml = make("arc");
			arcxml.setAttributeNS("", "role", arc.role.getId());
			arcxml.setAttributeNS("", "arg", arc.arg.getId());
			//arcsxml.appendChild(arcxml);
			xml.appendChild(arcxml);
		});
		//xml.appendChild(arcsxml);
	} else if (type === "function") {
		var x = o.getXML();
		forEach(x.childNodes, function (child) {
			appendCopy(xml, child);
		});
	} else if (type === "apply") {
		xml.setAttributeNS("", "function", o.getFunction().getId());
		//var paramsxml = make("params");
		var params = o.getParams();
		forEach(params, function (param, name) {
			var paramxml = make("param");
			paramxml.setAttributeNS("", "name", name);
			paramxml.setAttributeNS("", "select", param.getId());
			//paramsxml.appendChild(paramxml);
			xml.appendChild(paramxml);
		});
		//xml.appendChild(paramsxml);
	} else {
		throw "Unknown type: " + type;
	}
	
	return xml;
}


// returns the imported Object, or false if the Object was not able to be created (missing references on an infon, for example)
function importAs(prefix, xml, situation) {	
	function pre(id) {
		return "" + prefix + id;
	}
	function ready(id) {
		return objectCache.get(pre(id));
	}
	function addCC(o) {
		// TODO content
		// TODO corresponds
		return o;
	}
	
	function importNodes(nodes, sit) {
		// we loop this until all nodes have been imported or deadlock
		var progress = true;
		var completed = false;
		while (progress && !completed) {
			progress = false;
			completed = true;
			forEach(nodes, function (node) {
				var did = importAs(prefix, node, sit);
				completed = completed && did;
				progress = progress || did;
			});
		}
		if (!completed) {
			throw {error: "Deadlock. Imported XML has cycle.", xml: xml};
		}
	}
	
	var id = pre(xml.getAttributeNS("", "id"));
	var type = xml.nodeName;
	
	var o = objectCache.get(id);
	
	if (o) {
		return o;
	}
	
	if (type === "situation") {
		o = situation.makeSituation(id);
		
		// we import situations first so that correspondences in have somewhere to point to
		
		var situationNodes = xpath("f:situation", xml);
		var otherNodes = xpath("*[not(self::f:situation)]", xml);
		
		importNodes(situationNodes, o);
		importNodes(otherNodes, o);
		
		addCC(o);
		
		return o;
	} else if (type === "ghost") {
		return addCC(situation.makeGhost(id));
	} else if (type === "individual") {
		return addCC(situation.makeIndividual(id));
	} else if (type === "role") {
		return addCC(situation.makeRole(id));
	} else if (type === "relation") {
		return addCC(situation.makeRelation(id));
	} else if (type === "infon") {
		var relation = ready(xml.getAttributeNS("", "relation"));
		if (relation) {
			var isReady = true;
			var arcs = [];
			var xmlarcs = xpath("f:arc", xml);
			forEach(xmlarcs, function (xmlarc) {
				var role = ready(xmlarc.getAttributeNS("", "role"));
				var arg = ready(xmlarc.getAttributeNS("", "arg"));
				isReady = isReady && role && arg;
				arcs.push({role: role, arg: arg});
			});
			if (isReady) {
				console.log("importing infon", arcs);
				return addCC(relation.makeInfon(id, arcs));
			}
		}
		return false;
	} else if (type === "function") {
		// TODO
		return true;
	} else if (type === "apply") {
		// TODO
		return true;
	} else {
		throw "Unknown type: " + type;
	}
}