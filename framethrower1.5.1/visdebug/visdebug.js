/**
 * @author boobideedoobop
 */

function makeCircle(){

}


function draw(){
/*
	//document.firstChild.innerHTML += "<b>hello!</b>";
	bodyElement = document.getElementById('body');
	svgElement = document.getElementById('svgelement');
	bodyElement.innerHTML += svgElement.id;
	var svgChildren = svgElement.childNodes;
	forEach(svgChildren, function(child){
		bodyElement.innerHTML += '<br /> ' + child.nodeName;
	});
*/
	var andrewtest = compileXSL(loadXMLNow("andrewtest.xsl"));
	var input = loadXMLNow("andrewinput.xml");
	
	var output = andrewtest(input, {});
	
	var svgdiv = document.getElementById('svgdiv');
	svgdiv.parentNode.replaceChild(output, svgdiv);
	
}
