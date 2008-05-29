/**
 * @author boobideedoobop
 */

function makeCircle(){

}


var objectToXML = function(){
	function makeXMLObject(id){
		var object = document.createElement("object");
		object.id = id;
		return object;
	}
	
	function makeXMLContent(content){
		var content = document.createElement("content");
		var contentTextNode = document.createTextNode(content);
		content.appendChild(contentTextNode);
		return content;
	}
	
	function makeXMLInput(inputId){
		var input = document.createElement("input");
		input.id = inputId;
		return input;
	}
	
	function makeXMLFunc(funcId){
		var func = document.createElement("func");
		func.id = funcId;
		return func;
	}
	
	return function(object){
		var id = object.getId();
		var root = makeXMLObject(id);
		
		var func = object.getFunc();
		if(func){
			var funcId = func.getId();	
			var funcIdXML = makeXMLFunc(funcId);
			root.appendChild(funcIdXML);	
		}
	
		var input = object.getInput();
		if(input){
			var inputId = input.getId();	
			var inputIdXML = makeXMLInput(inputId);
			root.appendChild(inputIdXML);
		}
		
		var content = object.getContent();
		var contentXML = makeXMLContent(content);
		root.appendChild(contentXML);
		
		return root;
	}
}();


function draw(){
	var inputcontent = "input object content";
	var inputObject = makeObject(inputcontent, null, null);
	
	var simpleCopyFunc = function(func, input){
		return input.getContent();
	}
	
	var funccontent = {withContent:false, content:simpleCopyFunc};
	var funcObject = makeObject(funccontent, null, null);


	var resultObject = funcObject.runOnInput(inputObject);
	
	console.log("resultObjectContent: " + resultObject.getContent());
		
	forEach(objectCache, function(object){
		var root = objectToXML(object);
		document.firstChild.appendChild(root);
	});
	
	
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
