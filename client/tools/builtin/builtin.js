//script to output basewords and basewords -> tooltip
//run command:
//java -jar ../util/js.jar builtin.js


//this will go at the top of each rhino tool
ROOTDIR = "../../";
function include (bundles, extraFiles) {
	if (load !== undefined) {
		load(ROOTDIR + "tools/util/java.js");
		load(ROOTDIR + "source/js/include.js");
		includes.rhinoInclude(bundles, extraFiles);
	}
}
include(["core"], []);


var baseWords = [];
var toolTips = [];
forEach(base.debug(), function (expr, name) {
	baseWords.push(name);
	toolTips.push(name + " :: " + unparseType(getType(expr)));
});
var baseWordsString = "\\b" + baseWords.join("\\b|\\b") + "\\b";
var toolTipsString = "#\n" + toolTips.join("\n#\n#\n") + "\n#";


makeFolder("../../generated");
makeFolder("../../generated/builtin");

writeStringToFile("../../generated/builtin/basewords.txt", baseWordsString);
writeStringToFile("../../generated/builtin/tooltips.txt", toolTipsString);
print('success');