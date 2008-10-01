function domEndCap(ambient, input, node, relurl, thunkEssence) {
	var ec = ambient.makeEndCap(function (myOut, amb) {
		return {
			input: {
				set: function (o) {
					if (o.xml && o.ids) {
						
						//console.log("doing DOM update", relurl, node);
						delete node.endCap;
						node = replaceXML(node, o.xml, amb, o.ids, relurl);
						
						// if (ec === undefined) {
						// 	console.log("ENDCAP UNDEFINED");
						// }
						node.endCap = ec;
						node.thunkEssence = thunkEssence;
						
					}
				}
			}
		};
	}, {input: input});
	node.endCap = ec;
	return ec;
}

function getThunkEssence(node, ids, relurl) {
	var url = getUrlFromXML(node, relurl);

	var paramNodes = xpath("f:with-param", node);
	var params = {};

	forEach(paramNodes, function (paramNode) {
		params[paramNode.getAttributeNS("", "name")] = convertXMLToPin(paramNode, ids, {});
	});
	
	return {url: url, params: params};
}
function compareThunkEssences(e1, e2) {
	if (e1.url !== e2.url) {
		return false;
	}
	if (any(e1.params, function (param, name) {
		return e2.params[name] !== param;
	})) {
		return false;
	}
	if (any(e2.params, function (param, name) {
		return e1.params[name] !== param;
	})) {
		return false;
	}
	return true;
}

function processThunk(ambient, node, ids, relurl, thunk) {
	//console.log("processing thunk");
	//console.dirxml(node);
	//console.dir(ids);
	
	if (!thunk) thunk = node;
	
	var essence = getThunkEssence(thunk, ids, relurl);
	
	var functionCom = qtDocs.get(essence.url);
	
	// will be a makeApply once makeCustomCom returns a component.. (this probably won't ever happen..)
	var out = functionCom(essence.params);
	
	//out = simpleApply(delayComponent, out);
	
	return domEndCap(ambient, out, node, essence.url, essence);
}

// this is just to get the engine started
function processAllThunks(ambient, node, ids, relurl) {
	var thunks = xpath(".//f:thunk", node);
	forEach(thunks, function (thunk) {
		processThunk(ambient, thunk, ids, relurl);
	});
}



/*
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
*/