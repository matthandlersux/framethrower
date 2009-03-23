function runTests() {
	var oldNode = loadXMLNow("xml/oldnode.xml");
	var newNode = loadXMLNow("xml/newnode.xml");
	
	var load = compileXSL(loadXMLNow("load.xsl"));
	
	var oldNode = load(oldNode, {prefix:"(workspace)", id:"old"});
	var newNode = load(newNode, {prefix:"(workspace)", id:"old"});
	
	is(oldNode, oldNode, "loadXMLNow test");
	
	replaceXML(oldNode,newNode);
	is(oldNode,newNode, "Replace Test Simple");	
	
	pathCache["andrew"] = "test";
	
	forEach(pathCache, function(value, param) {
		console.log("Value: " + value + "Param: " + param);
	});
	

	oldNode = loadXMLNow("xml/getReleaseList.xml");
	newNode = loadXMLNow("xml/mediumnewnode.xml");

	oldNode = load(oldNode, {prefix:"(workspace)", id:"old"});
	newNode = load(newNode, {prefix:"(workspace)", id:"old"});	
	var oldNodeParent = oldNode.parentNode;
	var newNodeClone = newNode.cloneNode(true);
	
	replaceXML(oldNode,newNode);
	
	is(oldNodeParent.firstChild,newNodeClone, "Replace Test Medium");


	oldNode = loadXMLNow("xml/getReleaseList.xml");
	newNode = loadXMLNow("xml/getReleaseList2.xml");

	oldNode = load(oldNode, {prefix:"(workspace)", id:"old"});
	newNode = load(newNode, {prefix:"(workspace)", id:"old"});	
	var oldNodeParent = oldNode.parentNode;
	var newNodeClone = newNode.cloneNode(true);
	
	replaceXML(oldNode,newNode);
	
	is(oldNodeParent.firstChild,newNodeClone, "Replace Test Complex");
	
	//addXML(node);
//	deleteXML(node);
	
}