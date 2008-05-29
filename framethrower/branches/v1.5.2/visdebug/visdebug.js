/**
 * @author boobideedoobop
 */

function makeCircle(){

}


var makeObjectToXML = function(testFunc){
	function makeXMLObject(object, objectName){
		var objectNode = document.createElement(objectName);
		if (object !== null) {
			if (typeof object !== 'object' && typeof object !== 'function') {
				var contentTextNode = document.createTextNode(object);
				objectNode.appendChild(contentTextNode);
			}
			else if (typeof object === 'function') {
				var contentTextNode = document.createTextNode('function');
				objectNode.appendChild(contentTextNode);
			}
			else if (typeof object === 'object' && (answer = testFunc(object))) {
					var contentTextNode = document.createTextNode(answer);
					objectNode.appendChild(contentTextNode);
			} else {
				for (name in object) {
					if (typeof object[name] === 'function' && name.slice(0, 3) === "get") {
						var childNode = makeXMLObject(object[name](), name.slice(3));
						objectNode.appendChild(childNode);
					}
					else {
						var childNode = makeXMLObject(object[name], name);
						objectNode.appendChild(childNode);
					}
				}
			}
		}
		return objectNode;
	}
	
	return function makeXMLObjectTop(object, objectName){
		var objectNode = document.createElement(objectName);
		for (name in object) {
			if (typeof object[name] === 'function') {
				if (name.slice(0, 3) === "get") {
					var childNode = makeXMLObject(object[name](), name.slice(3));
					objectNode.appendChild(childNode);
				}
			} else if (object[name] !== null) {
				var childNode = makeXMLObject(object[name], name);
				objectNode.appendChild(childNode);
			}
		}
		return objectNode;
	}
	
};


function draw(){
	var inputcontent = "input object content";
	var inputObject = makeObject(inputcontent);
	
	var simpleCopyFunc = function(func, input){
		return input.getContent();
	}
	
	var funccontent = {withContent:false, content:simpleCopyFunc, otherObj:inputObject};
	var funcObject = makeObject(funccontent);

	//var resultObject = funcObject.runOnInput(inputObject);
	
	//console.log("resultObjectContent: " + resultObject.getContent());
	
	function testTopLevelObject(object){
		if (object.getId) {
			for(id in objectCache){
				if (object === objectCache[id]) {
					return id;
				}
			}
		}
		return false;
	}
	
	var objectToXML = makeObjectToXML(testTopLevelObject);
			
	forEach(objectCache, function(object){
		var root = objectToXML(object, "object");
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
