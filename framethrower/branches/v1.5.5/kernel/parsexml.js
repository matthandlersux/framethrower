


var applyGet = memoize(function (input, what) {
	var t = input.getType();
	
	var intf = t.getConstructor();
	var intfargs = t.getArguments();
	
	
	var inType = intfargs[0];
	var outType = inType.getProp(what);

	function getf(x) {
		if (x && x.get[what]) {
			return x.get[what].apply(null, []);
		}
	}
	
	var com = components.lift(intf, basic.fun(inType, outType), getf);
	var intermediate = simpleApply(com, input);
	
	if (outType.getConstructor) {
		var colcom = components.collapse(intf, outType.getConstructor(), outType.getArguments()[0]);
		return simpleApply(colcom, intermediate);
	} else {
		return intermediate;
	}
});


// context is an object whose keys are param names and values are output pins
// focus is an optional variable
// derive puts together a chain of components and returns an output pin for the derived variable
function derive(xml, context, focus) {
	var next;
	var name = xml.localName;
	
	//console.log("hooking up", name);
	
	if (name === "derived") {
		focus = context[xml.getAttributeNS("", "from")];
		next = xml.firstChild;
	} else if (name === "start") {
		focus = context[xml.getAttributeNS("", "from")];
	} else if (name === "get") {
		focus = applyGet(focus, xml.getAttributeNS("", "what"));
	} else if (name === "filter") {
		var com = components.filterC(focus.getType().getConstructor(), focus.getType().getArguments()[0], function (o) {
			return derive(xml.firstChild, context, startCaps.unit(o));
		});
		focus = simpleApply(com, focus);
	}
	
	if (!next) next = xml.nextSibling;
	
	if (next) {
		return derive(next, context, focus);
	} else {
		return focus;
	}
}
