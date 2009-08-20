//RUN COMMAND:
//java -jar ../util/js.jar -opt -1 minifier.js

var ROOTDIR = "../../";

load("../../source/js/util/util.js");
load("../../source/js/include.js");

var concatted = "";
var fileList = includes.getFileList(["core", "browser"], ["../../generated/templates/" + arguments[0] + ".js"]);
forEach(fileList, function(fileName) {
	concatted += readFile(fileName) + "\n";
});

// args.push(">../../generated/minified/alljs.js");

// var opt = {args:args, output:""};
// 
// runCommand("cat", opt);

//write output
var fw = new java.io.FileWriter("../../generated/minified/alljs.js");
var bw = new java.io.BufferedWriter(fw);

bw.write(concatted);
bw.close();
fw.close();

//run YUI minifier
runCommand("java", "-jar", "yuicompressor-2.4.2.jar", "-o", "../../generated/minified/alljs-min.js", "../../generated/minified/alljs.js");