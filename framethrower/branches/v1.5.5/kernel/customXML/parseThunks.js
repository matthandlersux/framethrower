

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

						node.parentNode.replaceChild(c, node);
						node = c;
						
						// find sizings
						var sizings = xpath(".//html:div[@left]", node);
						forEach(sizings, function (sizing) {
							sizeNode(sizing);
						});
						
						// find bindings
						var bindings = xpath(".//f:binding", node);
						forEach(bindings, function (binding) {
							var parent = binding.parentNode;
							parent.bindingURL = getUrlFromXML(binding, relurl);
							
							var params = {};
							var paramNodes = xpath("f:with-param", binding);
							forEach(paramNodes, function (paramNode) {
								params[paramNode.getAttributeNS("", "name")] = convertXMLToPin(paramNode, o.ids, {});
							});
							parent.bindingParams = params;
						});
						var buttons = xpath(".//f:button", node);
						forEach(buttons, function (button) {
							button.parentNode.bindingButtonName = button.getAttributeNS("", "name");
						});

						// find thunks
						var thunks = xpath(".//f:thunk", node);

						forEach(thunks, function (thunk) {
							processThunk(amb, thunk, o.ids, relurl);
						});
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
	
	return domEndCap(ambient, out, node, url);
}

// this is just to get the engine started
function processAllThunks(ambient, node, ids, relurl) {
	var thunks = xpath(".//f:thunk", node);
	forEach(thunks, function (thunk) {
		processThunk(ambient, thunk, ids, relurl);
	});
}


