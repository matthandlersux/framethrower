//var prepareStateXMLUrl = "xml/init/prepareStateIntel.xml";
var prepareStateXMLUrl = "xml/init/prepareStateWallE.xml";

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
	
	// exprLib
	var eLib = {};
	forEach(exprLib, function (e, name) {
		var exp = parseExpr(name);
		//if (getRemote(exp) !== 2) {
			eLib[name] = stringify(exp);			
		//}
	});
	combined["exprLib"] = eLib;
	
	// get prepareState
	renderJSONFromAction(prepareStateXMLUrl, function (prepareStateJSON) {
		
		combined["prepareState"] = prepareStateJSON;
		
		//console.log(combined);
		
		var textarea = document.getElementById("mainTextArea");
		textarea.value = JSON.stringify(combined);
		textarea.select();
	});
}


function writeToFile(filePath) {
	if (window.netscape){
		try {
			netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
		} catch (err){}
	}
	
	var file = Components.classes["@mozilla.org/file/local;1"].
	                     createInstance(Components.interfaces.nsILocalFile);
						
	file.initWithPath(filePath);
	
	var data = document.getElementById("mainTextArea").value;
	
	
	
	// file is nsIFile, data is a string
	var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"].
	                         createInstance(Components.interfaces.nsIFileOutputStream);

	// use 0x02 | 0x10 to open file for appending.
	foStream.init(file, 0x02 | 0x08 | 0x20, 0666, 0); 
	// write, create, truncate
	// In a c file operation, we have no need to set file mode with or operation,
	// directly using "r" or "w" usually.
	foStream.write(data, data.length);
	foStream.close();
	
	alert("Wrote successfully");
}