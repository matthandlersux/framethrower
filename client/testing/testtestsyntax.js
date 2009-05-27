function initialize(){
	var output = testFile("../../shared/testing/testsyntax.xml");
	output = output.replace(/\n/g, "<br />");
	output = output.replace(/Error([^<]*)<br \/>/g, "<div style=\"color:red\"><b>Error$1</b></div>");
	document.getElementById("insert").innerHTML = output;
	//testFile("../../shared/testing/currenttest.xml");
}