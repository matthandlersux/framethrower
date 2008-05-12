function runTests() {
	var p = makeProcess();
	var q = makeProcess();
	var r = makeProcess();

	var l = makeLink(p,q,r);
	var l2 = makeLink(p,q,r);
	is(l,l,"Same Link equality test");
	is(l,l2,"Link with same from, type, to equality test");
	
	var t = new TestObject();
	var x = "andrew";
}