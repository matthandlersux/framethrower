/*var x;
var c;

xmlTemplates.withTemplate("testing/testDocuments/xmlTemplate.xml", function (xt) {
	x = xt;
	
	x.runXSL({
		p1: parseXML("<blah />"),
		p2: parseXML("<f:number value='6' />"),
		d1: parseXML("<asdf />")
	});
	
	c = x.fun.fun(4)(6);
});
*/

var cell = makeControlledCell("Map Number String");

cell.control.add(7, "hello");
cell.control.add(6, "goodbye");



function init() {
	var thunks = xpath("//f:thunk", document.body);
	
	var t = thunks[0];
	console.log(t);
	//console.log(getThunkEssence(t));
	
	evalThunk(t, {baseUrl: "", ids: {testCell: cell}, tunnelEnv: emptyEnv});
	
}


