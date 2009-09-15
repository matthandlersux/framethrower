//script to output basewords and basewords -> tooltip
//run command:
//java -jar ../util/js.jar builtin.js

var generateFiles = function () {

	ROOTDIR = "../../";
	function include (bundles, extraFiles) {
		try {
			load(ROOTDIR + "tools/util/java.js");
			load(ROOTDIR + "source/js/include.js");
			includes.rhinoInclude(bundles, extraFiles);
		} catch (e) {}
	}
	include(["core"], []);


	var baseWords = [];
	var toolTips = [];
	var baseObjects = base.debug();

	forEach(baseObjects, function (expr, name) {
		baseWords.push(name);
		toolTips.push(name + " :: " + unparseType(getType(expr)));
	});
	var baseWordsString = "\\b" + baseWords.join("\\b|\\b") + "\\b";
	var toolTipsString = "#\n" + toolTips.join("\n#\n#\n") + "\n#";

	try {
		makeFolder(ROOTDIR + "generated");
		makeFolder(ROOTDIR + "generated/builtin");
		writeStringToFile(ROOTDIR + "generated/builtin/basewords.txt", baseWordsString);
		writeStringToFile(ROOTDIR + "generated/builtin/tooltips.txt", toolTipsString);
	} catch (e) {
	
	}


	//generate bootJSON file to be used by server

	var rootObjects = {};
	var rootExprs = {};
	forEach(baseObjects, function (object, name) {
		if (object.kind === "object") {
			rootObjects[name] = unparseType(object.type);
		} else if (object.kind === "fun") {
			//ignore primFuncs (they are shared already)
		} else if (object.kind === "exprLambda" || object.kind === "exprApply") {
			rootExprs[name] = stringify(object);
		} else {
			// ignore things like null, ord, list
		}
	});

	//build bootJSON object
	var bootJSON = {};

	//TODO: should we add classesToMake to the 'base' object?
	bootJSON.classes = classesToMake; //classesToMake defined in builtin/classes.js

	bootJSON.rootObjects = rootObjects;
	bootJSON.exprLib = rootExprs;
	bootJSON.prepareState = []; //TODO: figure out prepareState


	var bootJSONString = JSON.stringify(bootJSON);

	try {
		writeStringToFile(ROOTDIR + "../server/lib/bootJSON", bootJSONString);
		print('success');
	} catch (e) {
		print(e);
		// console.log("Running from browser, so not writing bootJSON: ", bootJSON);
	}
}();