var cell;

function oldinitialize() {
	
	// console.log("ok");
	// 
	// 
	// xhr("http://www.eversplosion.com/resources/servertest.php?blah", "var=a String", function (txt) {
	// 	console.log("server response: ", txt);
	// });
	//var test = makeRemoteObject("returnUnitSet (returnUnit 22)", parseType("Set Number"));
	//var test = makeRemoteObject('returnUnit "hello world"', parseType("Unit String"));

	session.flush();

	// var test = makeRemoteObject("Cons:left server.3", parseType("Future Object"));
	// cell = session.query(test);


	// var createAction1 = {action:"create", type:"Object", variable:"block.obj1", prop:{}};
	// var createAction2 = {action:"create", type:"Object", variable:"block.obj2", prop:{}};
	// var createAction3 = {action:"create", type:"Cons", variable:"block.cons1", prop:{left:"block.obj1", right:"block.obj2"}};
	// var returnAction1 = {action:"return", variable:"block.cons1"};
	// 
	// var innerActions = [createAction1, createAction2, createAction3, returnAction1];
	// 
	// var blockAction = {action:"block", variables:["client.ret1"], actions: innerActions};
	// var returnAction = {action:"return", variable:"client.ret1"};
	// 
	// session.addActions([blockAction, returnAction]);
	// 
	// var test = makeRemoteObject("Cons:left server.3", parseType("Future Object"));
	// cell = session.query(test);

	// var addUpLeftAction = {action:"remove", object:"server.1", property:"upRight", key:"server.3"};
	// session.addActions([addUpLeftAction]);
	
	// var test2 = makeRemoteObject("Object:upRight server.1", parseType("Set Cons"));
	// cell = session.query(test2);
	
}



function myTest() {
	// BROWSER: this is just to test from local files, will be removed
	netscape.security.PrivilegeManager.enablePrivilege("UniversalBrowserRead");
	
	var url = "http://localhost:8000/newSession?dsfnosdofids";
	
	var req = new XMLHttpRequest();
	req.open("POST", url, true);
	req.onreadystatechange = function () {
		if (req.readyState == 4) {
		 	console.dir(req);
		}
	};
	req.send(null);
}



function initialize() {
	//nothing in this test now
}