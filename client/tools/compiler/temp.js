//this is a file for doing custom shell stuff

ROOTDIR = "../../";
function include (bundles, extraFiles) {
	try {
		load(ROOTDIR + "source/js/include.js");
		includes.rhinoInclude(bundles, extraFiles);
	} catch (e) {}
}
include(["core"], []);


var file = "../../source/templates/root.css";
var str = read(file);

var folder = "../../source/templates";

var childDirectories = listDirectories(folder);

forEach(childDirectories, function(child) {
	var cssFile = "../../source/templates/" + child + "/css/" + child + ".css";
	write(cssFile, str);
});