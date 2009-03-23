/**
 * @author boobideedoobop
 */

var xm;
var ym;

document.onmousemove = function(e) {
	if (window.event) e=window.event;
	xm = (e.x || e.clientX);
	ym = (e.y || e.clientY);
}

var visDebug = function(){
	var O = {}; //objects being displayed on screen
	var drag = false; //true if something is currently being dragged
	var dragO = null; //object currently being dragged
	
	//function to help the xml format of the object cache resolve pointers to other objects in the object cache
	function testTopLevelObject(obj){
		if (obj.getId) {
			for (var id in objectCache) {
				if (obj === objectCache[id]) {
					return id;
				}
			}
		}
		return false;
	}
			
	function makeObjectToXML(testFunc){
		//array to keep track of pointers to other objects in the object cache
		var links = {};
		
		//makes object into an xml object with root node name objectName
		//will check for "top level" objects in the object cache, and will
		//create links in the links object as a side effect
		function makeXMLObject(obj, objectName){
			
			if(typeof objectName === 'number'){
				objectName = 'n' + objectName;
			}
			
			var objectNode = document.createElementNS("", objectName.toLowerCase());
			if (obj !== null) {
				if (typeof obj !== 'object' && typeof obj !== 'function') {
					var contentTextNode = document.createTextNode(obj);
					objectNode.appendChild(contentTextNode);
				}
				else 
					if (typeof obj === 'function') {
						var contentTextNode = document.createTextNode('function');
						objectNode.appendChild(contentTextNode);
					}
					else 
						if (typeof obj === 'object' && (answer = testFunc(obj))) {
							var contentTextNode = document.createTextNode(answer);
							objectNode.appendChild(contentTextNode);
							if (!links[objectName]) 
								links[objectName] = [];
							links[objectName].push(answer);
						}
						else {
							for (name in obj) {
								if (typeof obj[name] === 'function' && name.slice(0, 3) === "get") {
									var childNode = makeXMLObject(obj[name](), name.slice(3));
									objectNode.appendChild(childNode);
								}
								else {
									if(obj.constructor === Array){
										var childNode = makeXMLObject(obj[name], 'n' + name);
									} else {
										var childNode = makeXMLObject(obj[name], name);										
									}
									objectNode.appendChild(childNode);
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
				if (typeof obj[name] === 'function') {
					if (name.slice(0, 3) === "get") {
						var childNode = makeXMLObject(obj[name](), name.slice(3));
						objectNode.appendChild(childNode);
					}
				}
				else 
					if (obj[name] !== null) {
						var childNode = makeXMLObject(obj[name], name);
						objectNode.appendChild(childNode);
					}
			}
			
			//go through links object, and make xml object for each link
			var returnObject = {obj:objectNode, links:{}};
			
			var from = testFunc(obj);
			for (key in links) {
				var keylinks = links[key];
				forEach(keylinks, function(link){
					var linkElement = document.createElementNS("", linkName);
					linkElement.setAttribute("type", key);
					linkElement.setAttribute("from", from);
					linkElement.setAttribute("to", link);
					returnObject['links'][from + "," + key + "," + link] = linkElement;
				});
			}
			return returnObject;
		}
	}
	
	//function to convert object cache to xml format
	var objectToXML = makeObjectToXML(testTopLevelObject);
	
	
	function updatePosition(){
		var svgelement = this.objectsvg;
		var htmlelement = this.objecthtml;
		
		var svgresult = object2svg(this.xmlNodes.obj, {fromx:this.x,fromy:this.y});
		if (svgresult) {
			var parentNode = this.objectsvg.parentNode;
			parentNode.replaceChild(svgresult,this.objectsvg);
			
			svgresult.onmousedown = this.objectsvg.onmousedown;
			svgresult.obj = this.objectsvg.obj;
			this.objectsvg = svgresult;
		}
		
		htmlelement.style.left = this.x-15 + "px";
		htmlelement.style.top = this.y+5 + "px";		
		
		for (var key in this.linkssvg) {
			var fromindex = this.xmlNodes.links[key].getAttribute('from');
			var toindex = this.xmlNodes.links[key].getAttribute('to');
			var fromx = O[fromindex].x;
			var fromy = O[fromindex].y;
			var tox = O[toindex].x;
			var toy = O[toindex].y;
			
			var midx1 = (tox - fromx) * 3 / 8 + fromx * 1;
			var midy1 = (toy - fromy) * 1 / 8 + fromy * 1;
			var midx2 = (tox - fromx) * 1 / 2 + fromx * 1;
			var midy2 = (toy - fromy) * 1 / 2 + fromy * 1;
			
			var svgresult = object2svg(this.xmlNodes.links[key], {fromx:fromx,fromy:fromy,midx1:midx1,midy1:midy1,midx2:midx2,midy2:midy2,tox:tox,toy:toy});
			if (svgresult) {
				var parentNode = this.linkssvg[key].node.parentNode;
				parentNode.replaceChild(svgresult,this.linkssvg[key].node);
				this.linkssvg[key].node = svgresult;
			}
		}
	}
	
	function mousedown(){
		drag = true;
		dragO = this.obj;
		selectO = this.obj;
	}
	
	function mouseup(){
		drag = false;
		dragO = null;
	}
	
	var object2svg = compileXSL(loadXMLNow("object2svg.xsl"));
	var object2html = compileXSL(loadXMLNow("object2html.xsl"));
	document.onmouseup = mouseup;
	var selectO = {};
	var drawnO = selectO;
	var objectCache = {};

	return {
		run: function(){
			if (drag){
				dragO.x = xm;
				dragO.y = ym;
				dragO.updatePosition();
			}
			if (drawnO !== selectO){
				drawnO = selectO;
				var infoDiv = document.getElementById("info");
				var htmlresult = object2html(selectO.xmlNodes.obj, {params:'all'});
				if (infoDiv.firstChild) {
					infoDiv.replaceChild(htmlresult, infoDiv.firstChild);
				}
				else {
					infoDiv.appendChild(htmlresult);
				}
			}
			
			/*
			//do some global behaviour if we are currently dragging
			if (m.drag) m.X = xm - m.ox, m.Y = ym - m.oy;
			//do some global movements all the time like rotation
			m.ks += m.rS;
			//run the run method of each sub object
			for (var i in m.O) m.O[i].run();
			*/
		},
				
		objectCache2Screen: function(){
			var newids = [];
			for (var id in objectCache) {
				if (!O[id]){
					newids.push(id);
				}
			}
			
			forEach(newids, function(id){
				O[id] = {};
				var obj = objectCache[id];
				O[id].xmlNodes = objectToXML(obj, "object", "link");
			});
			
			//convert object xml format to svg and html	

			
			var svgoutput = {};
			var htmloutput = {};
			
			forEach(newids, function(id){
				var nodes = O[id].xmlNodes;
				O[id].linkssvg = {};
				O[id].linkshtml = {};
				//create svg and html for the objects
				
				var svgresult = object2svg(nodes['obj'], {fromx:'0',fromy:'0'});
				if (svgresult) {
					O[id].objectsvg = svgresult;
				}
				
				var htmlresult = object2html(nodes['obj'], {params:'id'});
				if (htmlresult) {
					O[id].objecthtml = htmlresult;
				}
				//create svg and html for the links

				for(key in nodes['links']){
					var node = nodes['links'][key];
					
					var svgresult = object2svg(node, {fromx:'0',fromy:'0',midx1:'0',midy1:'0',midx2:'0',midy2:'0',tox:'0',toy:'0'});
					if (svgresult) {
						O[id].linkssvg[key] = {};
						O[id].linkssvg[key].node = svgresult;
					}
					
					var htmlresult = object2html(node, {params:'id'});
					if (htmlresult) {
						O[id].linkshtml[key] = htmlresult;
					}
				}
			});
			
			//add link xml objects and svg objects to the "to" parameter of the link
			forEach(newids, function(id){
				var nodes = O[id].xmlNodes;
				for(key in nodes['links']){
					var node = nodes['links'][key];
					var toindex = node.getAttribute('to');
					O[toindex].xmlNodes['links'][key] = node;
					O[toindex].linkssvg[key] = O[id].linkssvg[key];
				}
			});
			
			
			//add svg and html to page
			
			var svgdiv = document.getElementById('svgelements');
			var htmldiv = document.getElementById('htmlelements');
			
			var sepdiv = document.getElementById('sepdiv');
			
			forEach(newids, function(id){
				var obj = O[id];
				svgdiv.appendChild(obj.objectsvg);
				forEach(obj.linkssvg, function(svgnode){
					svgdiv.insertBefore(svgnode.node,sepdiv);
				});
			});
			forEach(newids, function(id){
				var obj = O[id];
				htmldiv.appendChild(obj.objecthtml);
				forEach(obj.linkshtml, function(htmlnode){
					htmldiv.appendChild(htmlnode);
				});
			});
			

			//give each svgobject a mouseup function and pointer back to the parent object
			forEach(newids, function(id){
				var obj = O[id];
				obj.updatePosition = updatePosition;
				obj.objectsvg.onmousedown = mousedown;
				obj.objectsvg.obj = obj;
			});
			
			//give each object an x and y position
			var i = 1;
			forEach(newids, function(id){
				O[id].x = 50 + 100 * i;
				O[id].y = 50 + 100 * i;
				O[id].x = Math.random()*400;
				O[id].y = Math.random()*400;
				i++;
			});

			forEach(newids, function(id){
				O[id].updatePosition();
			});
		},

		init: function(){
			//create some objects to populate the object cache
			
			var oc = function(obj){
				objectCache[obj.getId()] = obj;
			}
			
			var rootId = 'rootId';
			
			var s = makeSituation(null, rootId);
			
			var GF = s.makeSituation();
			GF.setContent({name:'Goldfinger', type:'movie'})
			
			s.setContent({name:'world'});
			
			var SC = s.makeIndividual();
			SC.setContent({name:'Sean Connery',type:'person'})

			var JB = GF.makeIndividual();
			JB.setContent({name:'James Bond',type:'person'})

			JB.setCorrespondsOut(SC);
			SC.setCorrespondsIn(JB);


			//put all of the objects in the object cache
			oc(s);
			oc(GF);
			oc(SC);
			oc(JB);
		}

	}
}();
