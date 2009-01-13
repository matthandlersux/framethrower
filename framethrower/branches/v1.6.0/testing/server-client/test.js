function initialize() {
	
	console.log("ok");
	
	
	xhr("http://www.eversplosion.com/resources/servertest.php?blah", "var=a String", function (txt) {
		console.log("server response: ", txt);
	});
	
}