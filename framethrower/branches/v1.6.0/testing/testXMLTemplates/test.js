var x;
var c;
var xsl;

function testDesugar(url) {
	documents.withDoc(url, function (xt) {
		console.log("Testing desugaring on: "+url, desugarXSL(xt));
	});	
}

//testDesugar("testing/testXMLTemplates/desugarTester.xml");
//testDesugar("testing/testXMLTemplates/xmlTemplate.xml");


var cell = makeControlledCell("Map Number String");

cell.control.add(7, "hello");
cell.control.add(6, "goodbye");

var cell2 = makeControlledCell("Unit Number");
cell2.control.add(22);

//var cell3 = makeControlledCell("Set Number");
//cell3.control.add(15);

var test = makeRemoteObject("testSet", parseType("Set Number"));
var cell3 = session.query(test);

/*
function init() {
	var thunks = xpath("//f:thunk", document.body);
	
	var t = thunks[0];
	console.log(t);
	//console.log(getThunkEssence(t));
	
	evalThunk(t, {baseUrl: "", ids: {testCell: cell}, tunnelEnv: emptyEnv});
	
}
*/

function initialize() {
	
	bootstrap(document.body, {testCell: cell, testCell2: cell2, testCell3: cell3});
	
	/*var thunkNodes = xpath("//f:thunk", document.body);
	
	forEach(thunkNodes, function (thunkNode) {
		tagThunkEssence(thunkNode, "", {testCell: cell});

		thunkNode.custom.persist="test persistence";

		evalThunk(thunkNode);
	});*/
	
	// console.log("thunk essence", te);
	// console.log("compare", compareThunkEssences(te, te));
	
	/*makeTemplateFunFromUrl("testing/testXMLTemplates/xmlTemplate.xml", function (fun) {
		var e = makeApply(makeApply(fun.fun, 6), 222);
		
		evaluateAndInject(e, function (xmlids) {
			thunkNode.parentNode.replaceChild(xmlids.xml, thunkNode);
			thunkNode = xmlids.xml;
		});
		
	});*/
	
}


function test1() {
	cell.control.remove(6);
	refreshScreen();
}
function test2() {
	cell.control.add(2,"new");
	refreshScreen();
}