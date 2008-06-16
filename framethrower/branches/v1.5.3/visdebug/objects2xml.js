
		
function makeObjectToXML(testFunc){
	//array to keep track of pointers to other objects in the object cache
	var links = {};
	
	//makes object into an xml object with root node name objectName
	//will check for "top level" objects in the object cache, and will
	//create links in the links object as a side effect
	function makeXMLObject(obj, objectName, path){
		if(!path){
			path = '';
		}
		if(typeof objectName === 'number'){
			objectName = 'n' + objectName;
		}
		
		var objectNode = document.createElementNS("", objectName.toLowerCase());
		var contentTextNode;
		if (obj !== null) {
			if (typeof obj !== 'object' && typeof obj !== 'function') {
				contentTextNode = document.createTextNode(obj);
				objectNode.appendChild(contentTextNode);
			}
			else 
				if (typeof obj === 'function') {
					contentTextNode = document.createTextNode('function');
					objectNode.appendChild(contentTextNode);
				}
				else 
					if (typeof obj === 'object' && (answer = testFunc(obj))) {
						contentTextNode = document.createTextNode(answer);
						objectNode.appendChild(contentTextNode);
						path = path + '/' + objectName;
						if (!links[path]) {
							links[path] = [];
						}
						links[path].push(answer);
					}
					else {
						for (name in obj) {
							if(obj.hasOwnProperty(name)){
								var childNode;
								if (typeof obj[name] === 'function' && name.slice(0, 3) === "get") {
									childNode = makeXMLObject(obj[name](), name.slice(3), path);
									objectNode.appendChild(childNode);
								}
								else {
									if(obj.constructor === Array){
										childNode = makeXMLObject(obj[name], 'n' + name, path + '/' + objectName);
									} else {
										childNode = makeXMLObject(obj[name], name, path + '/' + objectName);										
									}
									objectNode.appendChild(childNode);
								}
							}
						}
					}
		}
		return objectNode;
	}
	
	return function makeXMLObjectTop(obj, objectName, linkName){
		links = {};
		var objectNode = document.createElementNS("", objectName);
		for (name in obj) {
			if(obj.hasOwnProperty(name)){
				var childNode;
				if (typeof obj[name] === 'function') {
					if (name.slice(0, 3) === "get") {
						childNode = makeXMLObject(obj[name](), name.slice(3));
						objectNode.appendChild(childNode);
					}
				}
				else if (obj[name] !== null) {
						childNode = makeXMLObject(obj[name], name);
						objectNode.appendChild(childNode);
				}
			}
		}
		
		//go through links object, and make xml object for each link
		var returnObject = {obj:objectNode, links:{}};
		
		var from = testFunc(obj);
		for (key in links) {
			if(links.hasOwnProperty(key)){
				var keylinks = links[key];
				forEach(keylinks, function(link){
					var linkElement = document.createElementNS("", linkName);
					linkElement.setAttribute("type", key);
					linkElement.setAttribute("from", from);
					linkElement.setAttribute("to", link);
					returnObject.links[from + "," + key + "," + link] = linkElement;
				});
			}
		}
		return returnObject;
	};
}

