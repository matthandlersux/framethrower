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
		print('success');
	} catch (e) {
		print(e);
	}
}();