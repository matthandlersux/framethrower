
preparse(mainTemplate);

var testCell = makeControlledCell("Set Number");

testCell.control.add(5);
testCell.control.add(2);
testCell.control.add(88);


base.add("testCell", testCell);


var compiledTemplate = makeClosure(mainTemplate.template, base.env);


function initialize() {
	var node = xmlToDOM(compiledTemplate.xml, compiledTemplate.env);
	
	document.body.appendChild(node.node);
}


