//RUN COMMAND:
//java -jar ../util/js.jar -opt -1 minifier.js

var ROOTDIR = "../../";

function include (bundles, extraFiles) {
	try {
		load(ROOTDIR + "source/js/include.js");
		includes.rhinoInclude(bundles, extraFiles);
	} catch (e) {}
}
include(["core"], []);



var concatted = "";
var fileList = includes.getFileList(["core", "browser"], ["../../generated/templates/" + arguments[0] + ".js"]);
forEach(fileList, function(fileName) {
	concatted += read(fileName) + "\n";
});

// args.push(">../../generated/minified/alljs.js");

// var opt = {args:args, output:""};
// 
// runCommand("cat", opt);

makeDirectory("../../generated/minified");
write("../../generated/minified/alljs.js", concatted);

//run YUI minifier (this will be done by bundle script)
// java -jar yuicompressor-2.4.2.jar -o ../../generated/minified/alljs-min.js ../../generated/minified/alljs.js
console.log("success");