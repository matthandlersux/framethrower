function convertToXML(o) {
	if (!o) {
		return {xml: emptyXPathResult, ids: {}};
	} else if (o.getId) {
		var id = o.getId();
		var xml = document.createElementNS(xmlns["f"], "ob");
		xml.setAttributeNS("", "id", id);
		var ids = {};
		ids[id] = o;
		return {xml: xml, ids: ids};
	} else if (typeof o === "string") {
		var stringNode = document.createElementNS(xmlns["f"], "string");
		stringNode.setAttributeNS("", "value", o);
		return {xml: stringNode, ids: {}};
	} else if (typeof o === "number") {
		var numberNode = document.createElementNS(xmlns["f"], "number");
		numberNode.setAttributeNS("", "value", o);
		return {xml: numberNode, ids: {}};
	} else {
		return {xml: o, ids: {}};
	}
}

function convertFromXML(xml, ids, vars) {
	var name = xml.localName;
	var namespace = xml.namespaceURI;
	if (name === "ob" && namespace === xmlns["f"]) {
		var valueId = xml.getAttributeNS("", "id");
		if (valueId) {
			return ids[valueId];
		}
		var valueVar = xml.getAttributeNS("", "var");
		if (valueVar) {
			return vars[valueVar];
		}
	} else if (name === "string" && namespace === xmlns["f"]) {
		return xml.getAttributeNS("", "value");
	} else if (name === "number" && namespace === xmlns["f"]) {
		return +xml.getAttributeNS("", "value");
	} else {
		return xml;
	}
}

function getTrimmedFirstChild(node) {
	var els = xpath("*[1]", node);
	if (els.length > 0) {
		return els[0];
	} else {
		return false;
	}
}

// This is like convertXMLToPin but instead of returning a pin, returns the object itself
// used for intact's in transaction's
// Note: this function can't extract sets, assocs, etc.
// do we need that functionality?
function getObjectFromParam(paramNode, ids, vars) {
	var value = paramNode.getAttributeNS("", "value-id");
	if (value) {
		return ids[value];
	}
	
	value = paramNode.getAttributeNS("", "value-var");
	if (value) {
		return vars[value];
	}
	
	return convertFromXML(getTrimmedFirstChild(paramNode), ids, vars);
}



function makeSimpleBox(outputInterface, instantiateProcessor, input) {
	var box = makeBox({output: outputInterface}, function (myOut, ambient) {
		return {
			input: instantiateProcessor(myOut.output, ambient)
		};
	}, {input: input});
	return box.outputPins.output;
}




// Note: the following only work for shallow data types, that is sets and assocs that are only "one-deep"
// we'll need to make them work with arbitrarily deep ones later...


// returns an outputPin of type interfaces.unit(basic.js)
// the outputPin will contain an object {xml: XML, ids: {id: object, ...}}
var convertPinToXML = memoize(function (pin) {
	var type = pin.getType();
	var constructor = type.getConstructor();
	var args = type.getArguments();
	
	if (constructor === interfaces.unit) {
		var com = components.lift(interfaces.unit, basic.fun(args[0], basic.js), convertToXML);
		return simpleApply(com, pin);
	} else if (constructor === interfaces.set) {
		return makeSimpleBox(interfaces.unit(basic.js), function (myOut, ambient) {
			var cache = makeObjectHash();
			function update() {
				var sorted = cache.toArray().sort(function (a, b) {
					return (stringifyObject(a) > stringifyObject(b)) ? 1 : -1;
				});
				
				var xml = document.createElementNS(xmlns["f"], "set");
				var ids = {};
				forEach(sorted, function (o) {
					var converted = convertToXML(o);
					xml.appendChild(converted.xml);
					ids = merge(ids, converted.ids);
				});
				myOut.set({xml: xml, ids: ids});
			}
			update();
			return {
				add: function (o) {
					cache.set(o, o);
					update();
				},
				remove: function (o) {
					cache.remove(o);
					update();
				}
			};
		}, pin);
	} else if (constructor === interfaces.assoc) {
		return makeSimpleBox(interfaces.unit(basic.js), function (myOut, ambient) {
			var cache = makeObjectHash();
			function update() {
				var sorted = cache.keysToArray().sort(function (a, b) {
					return (stringifyObject(a) > stringifyObject(b)) ? 1 : -1;
				});
				
				var xml = document.createElementNS(xmlns["f"], "assoc");
				var ids = {};
				forEach(sorted, function (key) {
					var convertedKey = convertToXML(key);
					var convertedValue = convertToXML(cache.get(key));
					
					//console.log("converted key, value", convertedKey, convertedValue);
					
					var pair = document.createElementNS(xmlns["f"], "pair");
					var key = document.createElementNS(xmlns["f"], "key");
					var value = document.createElementNS(xmlns["f"], "value");
					pair.appendChild(key);
					pair.appendChild(value);
					key.appendChild(convertedKey.xml);
					value.appendChild(convertedValue.xml);
					
					xml.appendChild(pair);
					ids = merge(ids, convertedKey.ids, convertedValue.ids);
				});
				//console.dirxml(xml);
				myOut.set({xml: xml, ids: ids});
			}
			update();
			return {
				set: function (k, v) {
					cache.set(k, v);
					update();
				},
				remove: function (k) {
					cache.remove(k);
					update();
				}
			};
		}, pin);
	} else if (constructor === interfaces.list) {
		return makeSimpleBox(interfaces.unit(basic.js), function (myOut, ambient) {
			var cache = [];
			function update() {
				var xml = document.createElementNS(xmlns["f"], "list");
				var ids = {};
				forEach(cache, function (item) {
					var converted = convertToXML(item);
					xml.appendChild(converted.xml);
					ids = merge(ids, converted.ids);
				});
				myOut.set({xml: xml, ids: ids});
			}
			update();
			return {
				insert: function (o, index) {
					cache.splice(index, 0, o);
					update();
				},
				update: function (o, index) {
					cache[index] = o;
					update();
				},
				remove: function (index) {
					cache.splice(index, 1);
					update();
				}
			};
		}, pin);
	}
});


function maybeUnit(o) {
	if (o.getType && o.getType().getConstructor) {
		return o;
	} else {
		return startCaps.unit(o);
	}
}

function convertXMLToPin(node, ids, vars) {
	var valueId = node.getAttributeNS("", "value-id");
	if (valueId) {
		return maybeUnit(ids[valueId]);
	}
	
	var valueVar = node.getAttributeNS("", "value-var");
	if (valueVar) {
		return maybeUnit(vars[valueVar]);
	}
	
	var xml = getTrimmedFirstChild(node);
	
	if (xml) {
		var name = xml.localName;
		var namespace = xml.namespaceURI;
		if (name === "set" && namespace === xmlns["f"]) {
			return startCaps.set(map(xpath("*", xml), function (xml) {
				return convertFromXML(xml, ids, vars);
			}));
		} else if (name === "list" && namespace === xmlns["f"]) {
			return startCaps.list(map(xpath("*", xml), function (xml) {
				return convertFromXML(xml, ids, vars);
			}));
		} else if (name === "assoc" && namespace === xmlns["f"]) {
			pairs = map(xpath("f:pair", xml), function (pair) {
				return {key: convertFromXML(xpath("f:key/*", pair)[0], ids, vars), value: convertFromXML(xpath("f:value/*", pair)[0], ids, vars)};
			});
			return startCaps.assoc(pairs);
		} else {
			return startCaps.unit(convertFromXML(xml, ids, vars));
		}
	}
	
	if (!node.firstChild) {
		return startCaps.unit(false);
	}
	
	// should probably get rid of this one... if all else fails make it a string
	
	console.warn("Got too far in convertXMLToPin", node);
	
	var s = node.firstChild.nodeValue;
	s = s.replace(/^\s+|\s+$/g, '');
	return startCaps.unit(s);
	
}



// this function is used only to convert params from xml to js for transactions written in js
function convertJSFromXML(xml) {
	var name = xml.localName;
	var namespace = xml.namespaceURI;
	if (name === "ob" && namespace === xmlns["f"]) {
		var valueId = xml.getAttributeNS("", "id");
		if (valueId) {
			return valueId;
		}
		var valueVar = xml.getAttributeNS("", "var");
		if (valueVar) {
			//this shouldn't happen
			return valueVar;
		}
	} else if (name === "string" && namespace === xmlns["f"]) {
		return xml.getAttributeNS("", "value");
	} else if (name === "number" && namespace === xmlns["f"]) {
		return +xml.getAttributeNS("", "value");
	} else {
		return xml;
	}
}


// this function is used only to convert params from xml to js for transactions written in js
function convertXMLToJS(xml) {
	var valueId = xml.getAttributeNS("", "id");
	if (valueId) {
		return valueId;
	}
	
	if (xml) {
		var name = xml.localName;
		var namespace = xml.namespaceURI;
		console.log("name: " + name);
		if (name === "set" && namespace === xmlns["f"]) {
			var ret = {};
			forEach(xml.childNodes, function(node){
				var id = convertJSFromXML(node);
				ret[id] = id;
			});
			return ret;
		} else if (name === "assoc" && namespace === xmlns["f"]) {
			var ret = {};
			forEach(xml.childNodes, function(pair){ //forEach pair
				ret[convertJSFromXML(xpath("f:key/*", pair)[0])] = convertJSFromXML(xpath("f:value/*", pair)[0]);
			});
			return ret;
		} else if (name === "list" && namespace === xmlns["f"]) {
			var ret = [];
			forEach(xml.childNodes, function(node){
				ret.push(convertJSFromXML(node));
			});
			return ret;
		} else {
			return convertJSFromXML(xml);
		}
	}
	
	if (!node.firstChild) {
		return false;
	}
	
	// should probably get rid of this one... if all else fails make it a string
	
	console.warn("Got too far in convertXMLToPin", node);
	
	var s = node.firstChild.nodeValue;
	s = s.replace(/^\s+|\s+$/g, '');
	return s;
}
