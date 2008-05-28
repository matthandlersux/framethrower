function runTests() {
	var p = makeProcess();
	var q = makeProcess();
	var r = makeProcess();

	/*var l = makeLink(p,q,r);
	var l2 = makeLink(p,q,r);
	is(l,l,"Same Link equality test");
	is(l,l2,"Link with same from, type, to equality test");
	
	var childType = makeProcess("childType");
	var siblingType = makeProcess("siblingType");
	var rootProcess = loadXMLtoProcessesNow("xml/oldnode.xml", childType, siblingType);

	var hash = rootProcess.getHash();
	var content = rootProcess.getContent();
	is(content,"xml","loadXMLtoProcessesTest1");

	var query = genString(rootProcess,childType,null);
	var oneLinkSet = hash[query].links;
	var childLink;
	forEach(oneLinkSet, function(alink){
		childLink = alink;
	});
	var to = childLink.getTo();
	var tocontent = to.getContent();

	var x = 4;*/
	
	var query = genLinkQuery(p, q, r);
	is(stringify(query), "links,local.1,local.2,local.3", "Stringify Test 1");
	query = genLinkQuery(p, null, null);
	is(stringify(query), "links,local.1,,", "Stringify Test 2");
	
}