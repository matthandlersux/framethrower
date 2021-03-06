//script to run typeAnalyzer
//run command:
//java -jar ../util/js.jar -opt -1 runTypeAnalyzer.js


//this will go at the top of each rhino tool
ROOTDIR = "../../";
function include (bundles, extraFiles) {
  try {
    load(ROOTDIR + "tools/util/java.js");
    load(ROOTDIR + "source/js/include.js");
    includes.rhinoInclude(bundles, extraFiles);
  } catch (e) {}
}
include(["core"], [ROOTDIR + "tools/typeAnalyzer/typeAnalyzer.js"]);

var runTypeAnalyzer = function (mainTemplate) {
  var result = typeAnalyze(mainTemplate);
  if (result.success) {
    console.log('success');
  }
}