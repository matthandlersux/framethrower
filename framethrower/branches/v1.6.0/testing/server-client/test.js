var cell;

function initialize() {
	
	// console.log("ok");
	// 
	// 
	// xhr("http://www.eversplosion.com/resources/servertest.php?blah", "var=a String", function (txt) {
	// 	console.log("server response: ", txt);
	// });
	
	//var test = makeRemoteObject("returnUnitSet (returnUnit 22)", parseType("Set Number"));
	var test = makeRemoteObject("returnUnit 1111", parseType("Unit Number"));
	//var test = makeRemoteObject('returnUnit "hello world"', parseType("Unit String"));
	cell = session.query(test);
}



function myTest() {
	// BROWSER: this is just to test from local files, will be removed
	netscape.security.PrivilegeManager.enablePrivilege("UniversalBrowserRead");
	
	var url = "http://24.218.127.46:8000/newSession?dsfnosdofids";
	
	var req = new XMLHttpRequest();
	req.open("POST", url, true);
	req.onreadystatechange = function () {
		if (req.readyState == 4) {
		 	console.dir(req);
		}
	};
	req.send(null);
}