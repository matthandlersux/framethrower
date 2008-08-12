/*

Query
	content : Object -> Unit XML
	involves: Object -> Set Object
	childObjects: Situation -> Set Object
	arc(role): Infon -> Unit Object
	
	<f:param name="focus" />
	<f:derived name="focusContent">
		<select what="content" from="focus" />
	</f:derived>


filter(component :: Unit a -> Unit Boolean)

equals(Unit)

*/


// Object -> Unit Object
function start(from) {
	return startCaps.unit(from);
}

// (Unit a => Unit Boolean) -> (Set a => Set a)
/*function filter(c) {
	return components.set.bind(function (o) {
		return simpleCompose(start(o), c);
	});
}*/

var passthru = memoize(function (o) {
	return makeSimpleComponent(interfaces.unit, interfaces.set, function (myOut) {
		return {
			set: function (b) {
				if (b) {
					myOut.add(o);
				} else {
					myOut.remove(o);
				}
			}
		};
	});
});


var equal = makeGenericComponent({in1: interfaces.unit, in2: interfaces.unit}, {output: interfaces.unit}, function (myOut, ambient) {
	var in1, in2;
	function check() {
		if (in1 !== undefined && in2 !== undefined && in1 === in2) {
			myOut.output.set(true);
		} else {
			myOut.output.set(false);
		}
	}
	return {
		in1: {
			set: function (o) {
				in1 = o;
				check();
			}
		},
		in2: {
			set: function (o) {
				in2 = o;
				check();
			}
		}
	};
});


// context is an object whose keys are param names and values are output pins
// focus is an optional variable
// derive puts together a chain of components and returns an output pin for the derived variable
function derive(xml, context, focus) {
	var next;
	var name = xml.nodeName;
	
	//console.log("hooking up", name);
	
	if (name === "derive") {
		focus = context[xml.getAttributeNS("", "from")];
		next = xml.firstChild;
	} else if (name === "start") {
		focus = context[xml.getAttributeNS("", "from")];
	} else if (name === "js") {
		focus = jsvalue(xml.getAttributeNS("", "value"));
	} else if (name === "get") {
		var com = queryComponent(xml.getAttributeNS("", "what"), xml.getAttributeNS("", "role"));
		focus = simpleApply(com, focus);
	} else if (name === "filter") {
		var com = components.set.bind(function (o) {
			var out = derive(xml.firstChild, context, startCaps.unit(o));
			return simpleApply(passthru(o), out);
		});
		focus = simpleApply(com, focus);
	} else if (name === "equal") {
		return equal.makeApply({in1: focus, in2: derive(xml.firstChild, context)}).output;
	}
	
	if (!next) next = xml.nextSibling;
	
	if (next) {
		return derive(next, context, focus);
	} else {
		return focus;
	}
}

var jsvalue = memoize(function (val) {
	return startCaps.unit(eval(val));
});






function applyCustom(xml, context) {
	var derivedNodes = xpath("f:derived", xml);
	forEach(derivedNodes, function (n) {
		var name = n.getAttributeNS("", "name");
		context[name] = derive(n, context);
	});
	
	
}






function select(what, role) {
	return function (o) {
		if (what === "content") {
			return o.queryContent;
		} else if (what === "involves") {
			return o.queryInvolves;
		} else if (what === "childObjects") {
			return o.queryChildObjects;
		} else if (what === "arc") {
			return startCaps.unit(o.getArc(role));
		}
	};
}

var queryComponent = memoize(function (what, role) {
	if (what === "content") {
		return simpleCompose(
			components.unit.map(function (o) {
				return o.queryContent;
			}),
			components.collapse.unitUnit);
	} else if (what === "involves") {
		return simpleCompose(
			components.unit.map(function (o) {
				return o.queryInvolves;
			}),
			components.collapse.unitSet);
	} else if (what === "childObjects") {
		return simpleCompose(
			components.unit.map(function (o) {
				return o.queryChildObjects;
			}),
			components.collapse.unitSet);
	} else if (what === "arc") {
		return simpleCompose(
			components.unit.map(function (o) {
				return startCaps.unit(o.getArc(role));
			}),
			components.collapse.unitUnit);
	} else if (what === "relation") {
		return simpleCompose(
			components.unit.map(function (o) {
				return startCaps.unit(o.getRelation());
			}),
			components.collapse.unitUnit);
	}
});


var customCom = (function () {
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
	
	return {
		xsl: function (xsl) {
			var compiled = compileXSL(xsl);

			return components.unit.map(function (params) {
				console.log("xsl getting called with", params);
				return compiled(blankXML, params);
			});
		},
		compileCustom: function (xml) {
			
		}
	};
})();