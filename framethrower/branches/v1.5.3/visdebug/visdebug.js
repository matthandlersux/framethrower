/**
 * @author boobideedoobop
 */


var visDebug = function(){
	var O = {}; //objects being displayed on screen
	var drag = false; //true if something is currently being dragged
	var dragO = null; //object currently being dragged
	var object2svg = compileXSL(loadXMLNow("object2svg.xsl"));
	var object2html = compileXSL(loadXMLNow("object2html.xsl"));
	var selectO = {};
	var drawnO = selectO;
	var objectCache = {};
	var rootSit = {};
	var runcheck = false;
	var isNewChange = false;
	var initContext = null;
	var rPressed = false;
	var xm;
	var ym;
	var offsetx;
	var offsety;

	document.onmousemove = function(e) {
		if (window.event) {
			e=window.event;
		}
		xm = (e.x || e.clientX);
		ym = (e.y || e.clientY);
	};

	document.onmousedown = function(e) {
	    if (e.target.localName!=="input") {
			e.preventDefault();
		}
	};

	document.onmouseup = function(e) {
		drag = false;
		dragO = null;
	};
	
	document.onkeydown = function(e) {
		if(e.keyCode === 82){
			rPressed = true;
		}
	}
	
	document.onkeyup = function(e) {
		if(e.keyCode === 82){
			rPressed = false;
		}
	}
	
	//function to help the xml format of the object cache resolve pointers to other objects in the object cache
	function testTopLevelObject(obj){
		if (obj.getId) {
			if (obj === objectCache[obj.getId()]) {
				return obj.getId();
			}
		}
		return false;
	}
	
	//function to convert object cache to xml format
	var objectToXML = makeObjectToXML(testTopLevelObject);
	
	
	function updatePosition(direction){
		var svgelement = this.objectsvg;
		var htmlelement = this.objecthtml;
		
		
		//check x,y and r against containing situations and contained situations...
		var key;
		for (key in this.xmlNodes.links) {
			if(this.xmlNodes.links.hasOwnProperty(key)){
				if(this.xmlNodes.links[key].getAttribute('type').match(/Situation/)){
					if (O[this.xmlNodes.links[key].getAttribute('from')] === this) {
					
						var toObj = O[this.xmlNodes.links[key].getAttribute('to')];
					
						if(direction === 'init'){
							if(this.r > toObj.r*3/5){
								this.r = toObj.r/4;
								if(this.r < 40){
									this.r = 40;
									toObj.r = this.r * 5/3 + 1;
									toObj.updatePosition('up');
								}
							}
						} else if(direction === 'up'){
							if(this.r > toObj.r*3/5){
								toObj.r = this.r * 5/3 + 1;
								toObj.updatePosition('up');
							}
						} else{
							
							if(this.r > toObj.r*9/10){
								this.r = toObj.r*9/10;
								if(this.r < 40){
									this.r = 40;
									toObj.r = this.r * 5/3 + 1;
									toObj.updatePosition('up');
								}
							}
							
						}

						var x = this.x - toObj.x;
						var y = this.y - toObj.y;
						var r = toObj.r-this.r;

						if(Math.pow(x,2) + Math.pow(y,2) > Math.pow(r,2)){						
							var atan = Math.atan2(y,x);
							this.x = toObj.x + Math.cos(atan) * Math.abs(r);
							this.y = toObj.y + Math.sin(atan) * Math.abs(r);
						}
					}
				}
			}
		}
		
		for (key in this.xmlNodes.links) {
			if(this.xmlNodes.links.hasOwnProperty(key)){
				if(this.xmlNodes.links[key].getAttribute('type').match(/Situation/)){
					if (O[this.xmlNodes.links[key].getAttribute('to')] === this) {
						var fromObj = O[this.xmlNodes.links[key].getAttribute('from')];
						fromObj.x += this.x-this.prevX;
						fromObj.y += this.y-this.prevY;
						if(direction === 'init'){
							fromObj.updatePosition(direction);
						} else {
							fromObj.updatePosition();							
						}
					}
				}
			}
		}
		
		this.prevX = this.x;
		this.prevY = this.y;
		
		var svgresult = object2svg(this.xmlNodes.obj, {fromx:this.x,fromy:this.y,r:this.r});
		if (svgresult) {
			var parentNode = this.objectsvg.parentNode;
			parentNode.replaceChild(svgresult,this.objectsvg);
			
			svgresult.onmousedown = this.objectsvg.onmousedown;
			svgresult.obj = this.objectsvg.obj;
			this.objectsvg = svgresult;
		}
		
		
		htmlelement.style.left = this.x-15 + "px";
		htmlelement.style.top = this.y+5 + "px";		
		
		for (key in this.linkssvg) {
			if(this.linkssvg.hasOwnProperty(key)){
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
			
				svgresult = object2svg(this.xmlNodes.links[key], {fromx:fromx,fromy:fromy,midx1:midx1,midy1:midy1,midx2:midx2,midy2:midy2,tox:tox,toy:toy});
				if (svgresult) {
					parentNode = this.linkssvg[key].node.parentNode;
					parentNode.replaceChild(svgresult,this.linkssvg[key].node);
					this.linkssvg[key].node = svgresult;
				}
			}
		}
	}
	
	function mousedown(e){
		drag = true;
		dragO = this.obj;
		selectO = this.obj;
		offsetx = xm - dragO.x;
		offsety = dragO.y - ym;
	}
	
	return {
		submitenter: function(myfield,e){
			var keycode;
			if (window.event){
				keycode = window.event.keyCode;
			} else if (e) {
				keycode = e.which;
			}
			else return true;

			if (keycode == 13) {
				console.log(myfield.value);
				var command = myfield.value;
				myfield.value = "";
				/*
				var regexp = /(\w*\.)?make(\w*)\(.*\)/;
				
				var subcommand = command.match(regexp);

				if(subcommand){
					if(subcommand[0]){
						subcommand = subcommand[0];
					}
					subcommand = 'temp = ' + subcommand + ';';
					var temp = eval(subcommand,initContext);
					command = command.replace(regexp,'temp');
					objectCache[temp.getId()] = temp;
				}
				*/
				eval(command,initContext);
				isNewChange = true;
				this.rootSit2Screen();
				
				return false;
			} else {
				return true;
			}
		},
		
		run: function(){
			if(runcheck){
				//alert('runcheck problem');
				return;
			}
			runcheck = true;
			if (drag){
				if(rPressed){
					dragO.r = 1.5*Math.sqrt(Math.pow(xm-dragO.x,2) + Math.pow(ym- dragO.y,2));
				}else{
					dragO.x = xm - offsetx;
					dragO.y = ym + offsety;
				}
				dragO.updatePosition();
			}
			if (drawnO !== selectO || (isNewChange && selectO && selectO.xmlNodes)){
				drawnO = selectO;
				drawnO.isNewChange = false;
				var infoDiv = document.getElementById("info");
				var htmlresult = object2html(selectO.xmlNodes.obj, {params:'all'});
				if (infoDiv.firstChild) {
					infoDiv.replaceChild(htmlresult, infoDiv.firstChild);
				}
				else {
					infoDiv.appendChild(htmlresult);
				}
			}
			runcheck = false;
			
			/*
			//do some global behaviour if we are currently dragging
			if (m.drag) m.X = xm - m.ox, m.Y = ym - m.oy;
			//do some global movements all the time like rotation
			m.ks += m.rS;
			//run the run method of each sub object
			for (var i in m.O) m.O[i].run();
			*/
		},
				
		rootSit2Screen: function(){
			//clear out the current svg and html
			var svgdiv = document.getElementById('svgelements');
			var htmldiv = document.getElementById('htmlelements');
			
			var sepdiv = document.getElementById('sepdiv');
			
			var current = sepdiv;

			var next;
			while(current){
				next = current.nextSibling;
				svgdiv.removeChild(current);
				current = next;
			}
			svgdiv.appendChild(sepdiv);
			while(htmldiv.firstChild){
				htmldiv.removeChild(htmldiv.firstChild);
			}
			
			
			//populate the objectCache by traversing the situation tree structure
			objectCache = {};
			
			var recurseTree = function(obj){
				objectCache[obj.getId()] = obj;
				if(obj.getObjects){
					forEach(obj.getObjects(), function(childObj){
						recurseTree(childObj);
					});
				}
			}
			
			recurseTree(rootSit);			
			
			var newids = [];
			for (var id in objectCache) {
				if(objectCache.hasOwnProperty(id)){
					//if (!O[id]){
						newids.push(id);
					//}
				}
			}
				
			forEach(newids, function(id){
				if(!O[id]){
					O[id] = {};
				}
				var obj = objectCache[id];
				O[id].xmlNodes = objectToXML(obj, obj.getType(), "link");
			});
									
			
			//convert object xml format to svg and html	

			
			var svgoutput = {};
			var htmloutput = {};
			
			forEach(newids, function(id){
				var nodes = O[id].xmlNodes;
				
				O[id].linkssvg = {};
				O[id].linkshtml = {};
				//create svg and html for the objects
				
				var svgresult = object2svg(nodes.obj, {fromx:'0',fromy:'0',r:'20'});
								
				if (svgresult) {
					O[id].objectsvg = svgresult;
				}
				
				var htmlresult = object2html(nodes.obj, {params:'id'});
				if (htmlresult) {
					O[id].objecthtml = htmlresult;
				}				
				
				//create svg and html for the links

				for (key in nodes.links) {
					if(nodes.links.hasOwnProperty(key)){
						var node = nodes.links[key];
						if(!node.getAttribute('type').match(/Situation/) && !node.getAttribute('type').match(/Objects/)){
							svgresult = object2svg(node, {fromx:'0',fromy:'0',midx1:'0',midy1:'0',midx2:'0',midy2:'0',tox:'0',toy:'0'});
							if (svgresult) {
								O[id].linkssvg[key] = {};
								O[id].linkssvg[key].node = svgresult;
							}
					
							htmlresult = object2html(node, {params:'id'});
							if (htmlresult) {
								O[id].linkshtml[key] = htmlresult;
							}
						}
					}
				}
			});
			
			//add link xml objects and svg objects to the "to" parameter of the link
			forEach(newids, function(id){
				var nodes = O[id].xmlNodes;
				for (key in nodes.links) {
					if(nodes.links.hasOwnProperty(key)){
						var node = nodes.links[key];
						var toindex = node.getAttribute('to');
						O[toindex].xmlNodes.links[key] = node;
						if(O[id].linkssvg[key]){
							O[toindex].linkssvg[key] = O[id].linkssvg[key];
						}
					}
				}
			});
			
			
			
			//calculate a z-index for objects and links
			//start each z index at 0
			forEach(newids, function(id){
				O[id].z = 0;
			});
			
			//first get z-indices for all of the new ids
			forEach(newids, function(id){
				for (var key in O[id].xmlNodes.links) {
					if(O[id].xmlNodes.links.hasOwnProperty(key)){
						if(O[id].xmlNodes.links[key].getAttribute('type').match(/Situation/)){
							if (O[id].xmlNodes.links[key].getAttribute('to') === id) {
								var fromObj = O[O[id].xmlNodes.links[key].getAttribute('from')];
								if(O[id].z <= fromObj.z){
									O[id].z = fromObj.z+1;
									O[id].insertBeforeId = O[id].xmlNodes.links[key].getAttribute('from');
								}
							}
						}
					}
				}
				
			});
			
			//now check all of the objects for z-index consistency, keep iterating until no z-index changes
			var change = true;
			while(change){
				change = false;
				for (id in O) {
					if(O.hasOwnProperty(id)){
						for (var key in O[id].xmlNodes.links) {
							if(O[id].xmlNodes.links.hasOwnProperty(key)){
								if(O[id].xmlNodes.links[key].getAttribute('type').match(/Situation/)){
									if (O[id].xmlNodes.links[key].getAttribute('to') === id) {
										var fromObj = O[O[id].xmlNodes.links[key].getAttribute('from')];
										if(O[id].z <= fromObj.z){
											O[id].z = fromObj.z+1;
											change = true;
										}
									}
								}
							}
						}
					}
				}
			}
			
			
			//add svg and html to page
			forEach(newids, function(id){
				var obj = O[id];
				if(O[id].insertBeforeId){
					var insertBefore = O[O[id].insertBeforeId].objectsvg;				
					if(insertBefore.parentNode === svgdiv){
						svgdiv.insertBefore(obj.objectsvg,insertBefore);
					} else {
						svgdiv.appendChild(obj.objectsvg);
					}
				} else {
					svgdiv.appendChild(obj.objectsvg);
				}
				forEach(obj.linkssvg, function(svgnode){
					//svgdiv.insertBefore(svgnode.node,sepdiv);
					svgdiv.appendChild(svgnode.node);
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
				if(!O[id].x){
					O[id].x = Math.random()*400;
					O[id].prevX = O[id].x;
					O[id].y = Math.random()*400;
					O[id].prevY = O[id].y;
					O[id].r = 300 + Math.random()*8;
					i++;
				}
			});

			forEach(newids, function(id){
				O[id].updatePosition('init');
			});
		},

		init: function(testFunc){
			//create some objects to populate the object cache
						
			var rootId = 'rootId';
			var s = makeSituation(null, rootId);
			rootSit = s;
		
			var myF = function(x){alert(x)};
			
			var G = {};
			testFunc(s,G);
			//JB.queryContent(myF, 'queryparam2');
			
			initContext = function(){};
			
			this.rootSit2Screen();
		}
	};
}();
