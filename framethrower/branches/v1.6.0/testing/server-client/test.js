var cell;

function initialize() {
	
	// console.log("ok");
	// 
	// 
	// xhr("http://www.eversplosion.com/resources/servertest.php?blah", "var=a String", function (txt) {
	// 	console.log("server response: ", txt);
	// });
	
	var test = makeRemoteObject("testSet", parseType("Set Number"));
	cell = session.query(test);
}