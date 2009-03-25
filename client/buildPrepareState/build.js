var prepareStateXMLUrl = "xml/prepareState.xml";

function initialize() {
	var combined = {};
	
	// get objects
	var classes = {};
	forEach(objects.classDefs, function (c, name) {
		if (objects.inherits(name, "Object")) {
			classes[name] = c;
		}
	});
	combined["classes"] = classes;
	
	// get rootObjects
	var rObs = {};
	forEach(rootObjects, function (o, name) {
		if (name.substr(0, 7) === "shared.") {
			rObs[name] = unparseType(getType(o));
		}
	});
	combined["rootObjects"] = rObs;
	
	// get prepareState
	renderJSONFromAction(prepareStateXMLUrl, function (prepareStateJSON) {
		
		combined["prepareState"] = prepareStateJSON;
		
		//console.log(combined);
		
		var textarea = document.getElementById("mainTextArea");
		textarea.value = JSON.stringify(combined);
		textarea.select();
	});
}