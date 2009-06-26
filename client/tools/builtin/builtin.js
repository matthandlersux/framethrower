//script to output basewords and basewords -> tooltip
//run command:
//java -jar ../util/js.jar builtin.js


//RHINO util functions? put these somewhere else

//create folders if they don't exist
function makeFolder (folderName) {
	var binfolder = java.io.File(folderName);
	if(!binfolder.exists()) {
		binfolder.mkdir();
	}	
}

function writeStringToFile(filename, string) {
	var fw = new java.io.FileWriter(filename);
	var bw = new java.io.BufferedWriter(fw);
	bw.write(string);
	bw.close();
}

function include (bundles, extraFiles) {
	load(ROOTDIR + "source/js/include.js");
	includes.rhinoInclude(bundles, extraFiles);
}

//this will go at the top of each rhino tool
ROOTDIR = "../../";
include(["core"], []);


var baseWords = [];
var toolTips = [];
forEach(base.debug(), function (expr, name) {
	baseWords.push(name);
	toolTips.push(name + " :: " + unparseType(getType(expr)));
});
var baseWordsString = baseWords.join("|");
var toolTipsString = "#\n" + toolTips.join("\n#\n#\n") + "\n#";


makeFolder("../../generated");
makeFolder("../../generated/builtin");

writeStringToFile("../../generated/builtin/basewords.txt", baseWordsString);
writeStringToFile("../../generated/builtin/tooltips.txt", toolTipsString);
print('success');