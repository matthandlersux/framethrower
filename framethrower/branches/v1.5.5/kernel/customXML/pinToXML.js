function convertToXML(o) {
	if (o === undefined) {
		return {xml: emptyXPathResult, ids: {}};
	} else if (o.getId && o.getType() !== basic.xml) {
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





var convertPinToXML = memoize(function (pin) {
	function xmlize(pin) {
		if (isPin(pin)) {
			var constructor = pin.getType().getConstructor();
			if (constructor === interfaces.unit) {
				return xmlize(pin.getState());
			} else if (constructor === interfaces.set) {
				function sortfunc(a, b) {
					return (stringifyObject(a) > stringifyObject(b)) ? 1 : -1;
				}
				
				var c = pin.getState();
				var sorted = c.sort(sortfunc);
				
				var xml = document.createElementNS(xmlns["f"], "set");
				var ids = {};
				forEach(sorted, function (o) {
					var converted = xmlize(o);
					xml.appendChild(converted.xml);
					//ids = merge(ids, converted.ids);
					mergeInto(ids, converted.ids);
				});
				return {xml: xml, ids: ids};
			} else if (constructor === interfaces.list) {
				var list = pin.getState();
				var xml = document.createElementNS(xmlns["f"], "list");
				var ids = {};
				forEach(list, function (item) {
					var converted = convertToXML(item);
					xml.appendChild(converted.xml);
					//ids = merge(ids, converted.ids);
					mergeInto(ids, converted.ids);
				});
				return {xml: xml, ids: ids};
			} else if (constructor === interfaces.assoc) {
				var assoc = pin.getState();
				var sorted = keys(assoc).sort();
				
				var xml = document.createElementNS(xmlns["f"], "assoc");
				var ids = {};
				forEach(sorted, function (key) {
					var convertedKey = xmlize(assoc[key].key);
					var convertedValue = xmlize(assoc[key].value);
					
					//console.log("converted key, value", convertedKey, convertedValue);
					
					var pair = document.createElementNS(xmlns["f"], "pair");
					var key = document.createElementNS(xmlns["f"], "key");
					var value = document.createElementNS(xmlns["f"], "value");
					pair.appendChild(key);
					pair.appendChild(value);
					key.appendChild(convertedKey.xml);
					value.appendChild(convertedValue.xml);
					
					xml.appendChild(pair);
					mergeInto(ids, convertedKey.ids, convertedValue.ids);
				});
				//console.dirxml(xml);
				return {xml: xml, ids: ids};
			} else if (constructor === interfaces.tree) {
				var state = pin.getState();
				var roots = state.roots;
				var cache = state.cache;

				function recurseChildren(obj, xmlParent) {
					var childXML = document.createElementNS(xmlns["f"], "child");
					var ids = {};

					xmlParent.appendChild(childXML);
					var valueXML = document.createElementNS(xmlns["f"], "value");
					childXML.appendChild(valueXML);
					var converted = xmlize(obj);
					valueXML.appendChild(converted.xml);

					ids = converted.ids;

					cache.get(obj).children.forEach(function(child){
						var newids = recurseChildren(child, childXML);
						ids = merge(ids, newids);
					});

					return ids;
				}
				
				var xml = document.createElementNS(xmlns["f"], "tree");
				var ids = {};
				roots.forEach(function (item) {
					var newids = recurseChildren(item, xml);
					ids = merge(ids, newids);
				});
				
				return {xml: xml, ids: ids};
			}
		} else {
			return convertToXML(pin);
		}
	}
	
	function isPin(o) {
		return (o && o.getType && o.getType().getConstructor);
	}
	function maybeEC(o, amb) {
		if (isPin(o)) {
			return trivialEndCap(o, amb);
		} else {
			return false;
		}
	}
	
	function trivialEndCap(pin, ambient) {
		var type = pin.getType();
		var constructor = type.getConstructor();
		var args = type.getArguments();
		
		if (constructor === interfaces.unit) {
			return ambient.makeEndCap(function (myOut, amb) {
				var ec;
				return {
					input: {
						set: function (o) {
							if (isPin(o)) {
								if (ec) ec.deactivate();
								ec = trivialEndCap(o, amb);
							}
						}
					}
				};
			}, {input: pin});
		} else if (constructor === interfaces.set) {
			return ambient.makeEndCap(function (myOut, amb) {
				var ecs = makeObjectHash();
				return {
					input: {
						add: function (o) {
							if (isPin(o)) {
								ecs.getOrMake(o, function () {
									trivialEndCap(o, amb);
								});
							}
						},
						remove: function (o) {
							if (isPin(o)) {
								var ec = inputs.get(o);
								if (ec) {
									ec.deactivate();
									ecs.remove(o);
								}
							}
						}
					}
				};
			}, {input: pin});
		} else if (constructor === interfaces.list) {
			return ambient.makeEndCap(function (myOut, amb) {
				var cache = [];
				return {
					input: {
						insert: function (o, index) {
							cache.splice(index, 0, maybeEC(o, amb));
						},
						update: function (o, index) {
							if (cache[index]) {
								cache[index].deactivate();
							}
							cache[index] = maybeEC(o, amb);
						},
						remove: function (index) {
							if (cache[index]) {
								cache[index].deactivate();
							}
							cache.splice(index, 1);
						}
					}
				};
			}, {input: pin});
		} else if (constructor === interfaces.assoc) {
			return ambient.makeEndCap(function (myOut, amb) {
				var cache = makeObjectHash();
				function deactivateECs(key) {
					var ecs = cache.get(key);
					if (ecs) {
						if (kv.key) {
							kv.key.deactivate();
						}
						if (kv.value) {
							kv.value.deactivate();
						}						
					}
				}
				return {
					input: {
						set: function (key, value) {
							deactivateECs(key);
							cache.set(key, {
								key: maybeEC(key, amb),
								value: maybeEC(value, amb)
							});
						},
						remove: function (key) {
							deactivateECs(key);
							cache.remove(key);
						}
					}
				};
			}, {input:pin});
		} else if (constructor === interfaces.tree) {
			return ambient.makeEndCap(function (myOut, amb) {

				var cache = makeObjectHash();
				var roots = makeObjectHash();

				var remove = function (o) {
					var oprev = cache.get(o);
					if(oprev){
						oprev.obj.deactivate();
						if(oprev.parent){
							cache.get(oprev.parent).children.remove(o);
						} else {
							roots.remove(o);
						}
						cache.remove(o);
					}
				};

				return {
					input: {
						addRoot: function (o) {
							if (isPin(o)) {
								var oprev = cache.get(o);
								if(oprev) {
									remove(o);
									roots.set(o, o);
									cache.set(o, {obj:trivialEndCap(o, amb), children:oprev.children, parent:null});
								} else {
									roots.set(o, o);
									cache.set(o, {obj:trivialEndCap(o, amb), children:makeObjectHash(), parent:null});	
								}
							}
						},
						addChild: function (parent, o) {
							if (isPin(o)) {
								var oprev = cache.get(o);
								if(oprev) {
									remove(o);
									cache.get(parent).children.set(o, o);
									cache.set(o, {obj:trivialEndCap(o, amb), children:oprev.children, parent:parent});	
								} else {
									cache.get(parent).children.set(o, o);
									cache.set(o, {obj:trivialEndCap(o, amb), children:makeObjectHash(), parent:parent});
								}
							}
						},
						remove: function (o) {
							if (isPin(o)) {
								remove(o);
							}
						}
					}
				};
			}, {input:pin});
		}
	}
	
	return makeSimpleBox(interfaces.unit(basic.js), function (myOut, ambient) {
		ambient.onPacketClose = function () {
			myOut.set(xmlize(pin));
		};
		
		trivialEndCap(pin, ambient);
		
		function maybePacketClose() {
			if (!ambient.propagatePacketClose) {
				// this should have been called, but due to timing was not, so call it now
				ambient.onPacketClose();
			}
		}
		
		var emptyFunc = function () {};
		var constructor = pin.getType().getConstructor();
		if (constructor === interfaces.unit) {
			return {set: emptyFunc, PACKETCLOSE: maybePacketClose};
		} else if (constructor === interfaces.set) {
			return {add: emptyFunc, remove: emptyFunc, PACKETCLOSE: maybePacketClose};
		} else if (constructor === interfaces.list) {
			return {insert: emptyFunc, update: emptyFunc, remove: emptyFunc, PACKETCLOSE: maybePacketClose};
		} else if (constructor === interfaces.assoc) {
			return {set: emptyFunc, remove: emptyFunc, PACKETCLOSE: maybePacketClose};
		} else if (constructor === interfaces.tree) {
			return {addRoot: emptyFunc, addChild: emptyFunc, remove: emptyFunc, PACKETCLOSE: maybePacketClose};
		}
	}, pin);
});



// Note: the following only work for shallow data types, that is sets and assocs that are only "one-deep"
// we'll need to make them work with arbitrarily deep ones later...

// returns an outputPin of type interfaces.unit(basic.js)
// the outputPin will contain an object {xml: XML, ids: {id: object, ...}}
/*var convertPinToXML = memoize(function (pin) {
	var type = pin.getType();
	var constructor = type.getConstructor();
	var args = type.getArguments();
	
	if (constructor === interfaces.unit) {
		var com = components.lift(interfaces.unit, basic.fun(args[0], basic.js), convertToXML);
		return simpleApply(com, pin);
	} else if (constructor === interfaces.set) {
		return makeSimpleBox(interfaces.unit(basic.js), function (myOut, ambient) {
			var cache = makeObjectHash();
			var needsUpdate = true;
			function update() {
				function sortfunc(a, b) {
					return (stringifyObject(a) > stringifyObject(b)) ? 1 : -1;
				}
				
				var c = cache.toArray();
				
				//c.splice(20, c.length-20);
				
				var sorted = c.sort(sortfunc);
				//var sorted = cache.toArray();
				
				//console.log("set update being called", sorted.length);
				
				var xml = document.createElementNS(xmlns["f"], "set");
				var ids = {};
				forEach(sorted, function (o) {
					var converted = convertToXML(o);
					xml.appendChild(converted.xml);
					//ids = merge(ids, converted.ids);
					forEach(converted.ids, function (o, id) {
						ids[id] = o;
					});
				});
				myOut.set({xml: xml, ids: ids});
				needsUpdate = false;
			}
			//update();
			return {
				add: function (o) {
					cache.set(o, o);
					needsUpdate = true;
					//update();
				},
				remove: function (o) {
					cache.remove(o);
					needsUpdate = true;
					//update();
				},
				PACKETCLOSE: function () {
					//console.log("PACKET CLOSE Called");
					if (needsUpdate) update();
					//console.log("PACKETCLOSE", cache.toArray().length);
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
					//ids = merge(ids, converted.ids);
					forEach(converted.ids, function (o, id) {
						ids[id] = o;
					});
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
	} else if (constructor === interfaces.tree) {
		return makeSimpleBox(interfaces.unit(basic.js), function (myOut, ambient) {
			var cache = makeObjectHash();
			var roots = makeObjectHash();

			function recurseChildren(obj, xmlParent) {
				var childXML = document.createElementNS(xmlns["f"], "child");
				var ids = {};

				xmlParent.appendChild(childXML);
				var valueXML = document.createElementNS(xmlns["f"], "value");
				childXML.appendChild(valueXML);
				var converted = convertToXML(obj);
				valueXML.appendChild(converted.xml);
				
				ids = converted.ids;
				
				cache.get(obj).children.forEach(function(child){
					var newids = recurseChildren(child, childXML);
					ids = merge(ids, newids);
				});
				
				return ids;
			}

			function update() {
				var xml = document.createElementNS(xmlns["f"], "tree");
				var ids = {};
				roots.forEach(function (item) {
					var newids = recurseChildren(item, xml);
					ids = merge(ids, newids);
				});
				myOut.set({xml: xml, ids: ids});
			}
			update();

			var remove = function (o) {
				var oprev = cache.get(o);
				if(oprev){
					if(oprev.parent){
						cache.get(oprev.parent).children.remove(o);
					} else {
						roots.remove(o);
					}
					cache.remove(o);
				}
			};

			return {
				addRoot: function (o) {
					var oprev = cache.get(o);
					if(oprev) {
						remove(o);
						roots.set(o, o);
						cache.set(o, {obj:o, children:oprev.children, parent:null});
					} else {
						roots.set(o, o);
						cache.set(o, {obj:o, children:makeObjectHash(), parent:null});	
					}
					update();
				},
				addChild: function (parent, o) {
					var oprev = cache.get(o);
					if(oprev) {
						remove(o);
						cache.get(parent).children.set(o, o);
						cache.set(o, {obj:o, children:oprev.children, parent:parent});	
					} else {
						cache.get(parent).children.set(o, o);
						cache.set(o, {obj:o, children:makeObjectHash(), parent:parent});
					}
					update();
				},
				remove: function (o) {
					remove(o);
					update();
				}
			};
		}, pin);
	}
});*/


function maybeUnit(o) {
	if (o.getType && o.getType().getConstructor) {
		return o;
	} else {
		return startCaps.unit(o);
	}
}

//sourceXML is only for value-nodeid
function convertXMLToPin(node, ids, vars, sourceXML) {
	var valueId = node.getAttributeNS("", "value-id");
	if (valueId) {
		return maybeUnit(ids[valueId]);
	}
	
	var valueVar = node.getAttributeNS("", "value-var");
	if (valueVar) {
		return maybeUnit(vars[valueVar]);
	}
	
	var valuePredef = node.getAttributeNS("", "value-predef");
	if (valuePredef) {
		return maybeUnit(PREDEF[valuePredef]);
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
		} else if (name === "tree" && namespace === xmlns["f"]) { 
			console.log('need tree specific code in convertXMLToPin');
			return startCaps.unit(convertFromXML(xml, ids, vars));
		} else {
			return startCaps.unit(convertFromXML(xml, ids, vars));
		}
	}
	
	if (!node.firstChild) {
		return startCaps.unit(undefined);
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
