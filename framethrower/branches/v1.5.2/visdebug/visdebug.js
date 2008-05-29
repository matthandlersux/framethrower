/**
 * @author boobideedoobop
 */

function makeCircle(){

}

var string = "sdf";

var makeObjectToXML = function(testFunc){
	function makeXMLObject(object, objectName){
		var objectNode = document.createElementNS("",objectName.toLowerCase());
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
		var objectNode = document.createElementNS("",objectName);
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


function makeXML(){
	var inputcontent = "input object content";
	var inputObject = makeObject(inputcontent);
	
	var simpleCopyFunc = function(func, input){
		return input.getContent();
	}
	
	var funccontent = {withContent:false, content:simpleCopyFunc, otherObj:inputObject};
	var funcObject = makeObject(funccontent);

	//give each object an x and y position
	var i = 1;
	forEach(objectCache, function(object){
		//object.id = 'local.1';
		object.x = 50 + 100*i;
		object.y = 50 + 100*i;
		i++;
	});

	
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
	var objectsRootNode = document.createElementNS("","objects");
	forEach(objectCache, function(object){
		var root = objectToXML(object, "object");
		objectsRootNode.appendChild(root);
	});
	

	var andrewtest = compileXSL(loadXMLNow("andrewtest.xsl"));
	var input = loadXMLNow("andrewinput.xml");
	
	document.firstChild.appendChild(objectsRootNode);
	
	var output = andrewtest(objectsRootNode, {});
	
	//document.firstChild.appendChild(output);	
	
	var svgdiv = document.getElementById('svgdiv');
	//svgdiv.parentNode.replaceChild(output, svgdiv);
	return output;
}
