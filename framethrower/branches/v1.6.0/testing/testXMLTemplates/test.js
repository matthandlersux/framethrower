var x;
var c;
var xsl;

documents.withDoc("testing/testXMLTemplates/xmlTemplate.xml", function (xt) {
	x = xt;
	xsl = makeXSLFromTemplate(x);
	debug.xml(xsl);
});


/*var cell = makeControlledCell("Map Number String");

cell.control.add(7, "hello");
cell.control.add(6, "goodbye");



function init() {
	var thunks = xpath("//f:thunk", document.body);
	
	var t = thunks[0];
	console.log(t);
	//console.log(getThunkEssence(t));
	
	evalThunk(t, {baseUrl: "", ids: {testCell: cell}, tunnelEnv: emptyEnv});
	
}
*/

function init() {
	
}