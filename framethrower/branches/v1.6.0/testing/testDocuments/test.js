var x;
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



function onload() {
	var thunks = xpath("//f:thunk", document.body);
	
	var t = thunks[0];
	console.log(t);
	console.log(getThunkEssence(t));
	
	replaceThunk(t, "", {}, emptyEnv);
	
}
document.addEventListener("load", onload, false);







var type = parseType("Assoc Number (Set String)");
var cell = makeCellAssocInput();
cell.type = type;

var othercells = [];
othercells[0] = makeCell();
othercells[1] = makeCell();
othercells[2] = makeCell();

othercells[0].addLine("andrew");
othercells[1].addLine("matt");
othercells[2].addLine("toby");
othercells[2].addLine("andrew");

cell.addLine(0, othercells[0]);
cell.addLine(1, othercells[1]);
cell.addLine(2, othercells[2]);


