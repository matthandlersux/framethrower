

/*
integrate typeNames
makeCustomCom into component
*/

function sizeNode(node) {
	node.style.position = "absolute";
	function setAttr(name) {
		var att = node.getAttributeNS("", name);
		if (att) {
			node.style[name] = att + "px";
		}
	}
	var attrs = ["width", "height", "left", "top"];
	forEach(attrs, function (name) {
		setAttr(name);
	});
}


function domEndCap(ambient, input, node, relurl) {
	var ec = ambient.makeEndCap(function (myOut, amb) {
		return {
			input: {
				set: function (o) {
					if (o.xml && o.ids) {
						//console.log("re/printing DOM XML");
						//console.dirxml(o.xml);
						//console.dir(o.ids);
						
						// This whole thing needs to be optimized, specifically it should use a more nuanced replace xml function so as not to reevaluate thunks
						
						amb.deactivate();
						
						var c = o.xml.cloneNode(true);
						node.ownerDocument.adoptNode(c);
						
						/*if (!node.parentNode) {
							console.log("NO PARENT NODE");
							console.dirxml(node);
						}*/

						// find sizings
						var sizings = xpath("descendant-or-self::html:div[@left]", c);
						forEach(sizings, function (sizing) {
							sizeNode(sizing);
						});
						
						// find bindings
						var bindings = xpath(".//f:binding", c);
						forEach(bindings, function (binding) {
							var parent = binding.parentNode;
							parent.bindingURL = getUrlFromXML(binding, relurl);
							
							var params = {};
							var paramNodes = xpath("f:with-param", binding);
							forEach(paramNodes, function (paramNode) {
								params[paramNode.getAttributeNS("", "name")] = convertXMLToPin(paramNode, o.ids, {}, c);
							});
							parent.bindingParams = params;
						});
						var buttons = xpath(".//f:button", c);
						forEach(buttons, function (button) {
							button.parentNode.bindingButtonName = button.getAttributeNS("", "name");
						});

						// find thunks
						var thunks = xpath(".//f:thunk", c);

						forEach(thunks, function (thunk) {
							processThunk(amb, thunk, o.ids, relurl);
						});
						
						node.parentNode.replaceChild(c, node);
						node = c;
					}
				}
			}
		};
	}, {input: input});
	return ec;
}

function processThunk(ambient, node, ids, relurl) {
	//console.log("processing thunk");
	//console.dirxml(node);
	//console.dir(ids);
	
	var url = getUrlFromXML(node, relurl);
	
	var functionCom = qtDocs.get(url);
	
	var paramNodes = xpath("f:with-param", node);
	var params = {};

	forEach(paramNodes, function (paramNode) {
		params[paramNode.getAttributeNS("", "name")] = convertXMLToPin(paramNode, ids, {});
	});
	
	// will be a makeApply once makeCustomCom returns a component.. (this probably won't ever happen..)
	var out = functionCom(params);
	
	//out = simpleApply(delayComponent, out);
	
	return domEndCap(ambient, out, node, url);
}

// this is just to get the engine started
function processAllThunks(ambient, node, ids, relurl) {
	var thunks = xpath(".//f:thunk", node);
	forEach(thunks, function (thunk) {
		processThunk(ambient, thunk, ids, relurl);
	});
}




var delayComponent = makeSimpleComponent(interfaces.unit(basic.js), interfaces.unit(basic.js), function (myOut, ambient) {
	var cache;
	var timer;
	function pulse() {
		myOut.set(cache);
		timer = false;
	}
	return {
		set: function (o) {
			cache = o;
			if (!timer) {
				timer = setTimeout(pulse, 0);
			}
		}
	};
});