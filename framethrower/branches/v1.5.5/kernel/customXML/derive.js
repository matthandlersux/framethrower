

var typeZero = memoize(function (type) {
	return makeSimpleStartCap(type, {});
});


var applyGet = memoize(function (input, what) {
	var t = input.getType();
	
	var intf = t.getConstructor();
	var intfargs = t.getArguments();
	
	
	var inType = intfargs[0];
	if (!inType.getProp) {
		console.warn("inType doesn't have a prop", inType.getName(), input);
	}
	var outType = inType.getProp(what);

	function getf(x) {
		if (x && x.get[what]) {
			return x.get[what].apply(null, []);
		} else {
			return typeZero(outType);
		}
	}
	
	var com = components.lift(intf, basic.fun(inType, outType), getf);
	var intermediate = simpleApply(com, input);
	
	if (outType.getConstructor) {
		var colcom = components.collapse(intf, outType.getConstructor(), outType.getArguments());
		return simpleApply(colcom, intermediate);
	} else {
		return intermediate;
	}
});


function getFromContext(context, s) {
	var firstLetter = s.charAt(0);
	if (firstLetter === '"' || firstLetter === "'") {
		return startCaps.unit(s.substring(1, s.length - 1));
	} else {
		return context[s];
	}
}

// context is an object whose keys are param names and values are output pins
// focus is an optional variable
// derive puts together a chain of components and returns an output pin for the derived variable
function derive(xml, context, focus) {
	var next;
	var name = xml.localName;
	
	//if (name) console.log("hooking up", name, xml, focus);
	
	if (!name) {
		
	} else if (name === "derived") {
		focus = context[xml.getAttributeNS("", "from")];
		next = xml.firstChild;
	} else if (name === "start") {
		focus = context[xml.getAttributeNS("", "from")];
	} else if (name === "get") {
		focus = applyGet(focus, xml.getAttributeNS("", "what"));
	} else if (name === "filter") {
		// need to test still..
		var com = components.filterC(focus.getType().getConstructor(), focus.getType().getArguments()[0], function (o) {
			return derive(xml.firstChild, context, startCaps.unit(o));
		});
		focus = simpleApply(com, focus);
	} else if (name === "filtertype") {
		var com = components.set.filterType(focus.getType().getArguments()[0], typeNames[xml.getAttributeNS("", "type")]);
		focus = simpleApply(com, focus);
	} else if (name === "getkey") {
		var com = components.assoc.getKey(focus.getType().getArguments()[0], focus.getType().getArguments()[1]);
		var key = getFromContext(context, xml.getAttributeNS("", "key"));
		focus = com.makeApply({input: focus, key: key}).output;
	} else {
		console.error("Unknown xml element in derive: " + name);
	}
	// missing: equals
	
	
	if (!next) next = xml.nextSibling;
	
	if (next) {
		return derive(next, context, focus);
	} else {
		//console.log("derive done", focus.getOutputInterface().getName());
		return focus;
	}
}
