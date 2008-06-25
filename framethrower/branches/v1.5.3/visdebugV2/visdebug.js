/**
 * @author boobideedoobop
 */


var screenObjects = {};

var initUserInput = function() {
	var ui = {};
	ui.drag = false;
	ui.dragOid = null; //id of object currently being dragged
	ui.xm = 0;
	ui.ym = 0;
	ui.rPressed = false;
	ui.zPressed = false;
	ui.basezoom=1;
	ui.zoomfactor=1;
	ui.selectOid = null;
	ui.drawnOid = ui.selectOid;
	
	//setup some display variables
	ui.svgelements = document.getElementById('svgelements');
	ui.svgPoint = ui.svgelements.createSVGPoint();
				
	ui.actual_width = ui.svgelements.width;
	ui.actual_height = ui.svgelements.height;
	
	var vb = ui.svgelements.getAttribute("viewBox");
	if(vb) {
		var vba = vb.split(" "); //comes out with four string array
		ui.curorig_x = Number(vba[0]);
		ui.curorig_y = Number(vba[1]);
		ui.orig_height = Number(vba[3]);
		ui.orig_width = Number(vba[2]);
		ui.midx = ui.curorig_x+(ui.orig_width/2);
		ui.midy = ui.curorig_y+(ui.orig_height/2);
	}
	
	ui.calcCoord = function(x,y,ctmNode) {
		ui.svgPoint.x = x;
		ui.svgPoint.y = y;
		var matrix = ctmNode.getScreenCTM();
		ui.svgPoint = ui.svgPoint.matrixTransform(matrix.inverse());
	
		//undo the effect of viewBox and zoomin/scroll
		return ui.svgPoint;
	};
	
	
	
	
	dojo.query('#svgelements').connect('onmousemove', function(e) {
			ui.xm = e.layerX;
			ui.ym = e.layerY;
	});

	/*
	dojo.connect(document, 'onmousedown', function(e) {
	    if (e.target.localName!=="input") {
			e.preventDefault();
		}
	});
	*/

	dojo.connect(document, 'onmouseup', function(e) {
		ui.drag = false;
	});

	dojo.connect(document, 'onkeydown', function(e) {
		if(e.target.localName!=="input"){
			if(e.keyCode === 82){
				ui.rPressed = true;
			} else if(e.keyCode === 90){
				ui.initx = ui.xm;
				ui.inity = ui.ym;
				ui.zPressed = true;
				ui.basezoom = ui.zoomfactor;
			}
		}
	});
	
	dojo.connect(document, 'onkeyup', function(e) {
		if(e.keyCode === 82){
			ui.rPressed = false;
		} else if(e.keyCode === 90){
			ui.zPressed = false;
		}
	});
	
	dojo.connect(document, 'mousedown', function(e) {
		var targ = e.target;
		if(targ.id){
			ui.drag = true;
			ui.dragOid = targ.id;
			ui.selectOid = targ.id;
			ui.offsetx = targ.cx.baseVal.value;
			ui.offsety = targ.cy.baseVal.value;
			var point = ui.calcCoord(ui.xm,ui.ym,ui.svgelements);
			ui.initx = point.x;
			ui.inity = point.y;
		}
	});
	
	
	return ui;
};



var visDebug = function(){
	var O = {}; //objects being displayed on screen
	var L = {}; //links (being displayed if both ends are on screen)
	var object2svg = compileXSL(loadXMLNow("object2svg.xsl"));
	var object2html = compileXSL(loadXMLNow("object2html.xsl"));
	var objectCache = {};
	var rootSit = {};
	var runcheck = false;
	var isNewChange = false;
	var initContext = null;

	var ui;
	

	
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
	
	
	
	var makeScreenObject = function(id){
		var SO = {};
		if(!L[id]){
			L[id] = {};
			L[id].tolinks = {};			
		}
		
		SO.objId = id;
		
		//give object an x and y
		SO.x = Math.random()*400;
		SO.prevX = SO.x;
		SO.y = Math.random()*400;
		SO.prevY = SO.y;
		SO.r = 300 + Math.random()*8;
		SO.z = 0;

		
		SO.removeObject = function(){
			//remove from-links from "to" parameter of links
			for (var key in L[id].links) {
				if(L[id].links.hasOwnProperty(key)){
					var toindex = L[id].links[key].xmlNode.getAttribute('to');
					if(L[toindex].tolinks[key]){
						L[toindex].tolinks[key] = undefined;						
					}
				}
			}
			
			var svgdiv = document.getElementById('svgelements');
			//remove from-links and to-links svg
			var removeLinks = function(links){
				forEach(links, function(link){
					if(link.svg && link.svg.node && svgdiv === link.svg.node.parentNode){
						svgdiv.removeChild(link.svg.node);
					}
				});
			};
			removeLinks(L[id].links);
			removeLinks(L[id].tolinks);
			
			//clear from-links svg
			L[id].links = undefined;
			
			//remove object svg
			if(svgdiv === SO.objectsvg.parentNode){
				svgdiv.removeChild(SO.objectsvg);
			}
			//clear object svg
			SO.objectsvg = undefined;
		};
		
		SO.setObject = function(obj){
			if(L[id].links){
				SO.removeObject();
			}
			
			var xmlresult = objectToXML(obj, obj.getType(), "link");
			SO.xmlNodes = {};
			SO.xmlNodes.obj = xmlresult.obj;

			L[id].links = xmlresult.links;
			
			//create svg for the objects			
			var svgresult = object2svg(SO.xmlNodes.obj, {fromx:'0',fromy:'0',r:'20',objid:id});
							
			if (svgresult) {
				SO.objectsvg = svgresult;
			}
			
			//create svg for the links if they don't already exist
			var links2svg = function(links){
				forEach(links, function(link) {
					var node = link.xmlNode;
					if(!node.getAttribute('type').match(/Situation/) && !node.getAttribute('type').match(/Objects/)){
						if(!link.svg){
							svgresult = object2svg(node, {fromx:'0',fromy:'0',midx1:'0',midy1:'0',midx2:'0',midy2:'0',tox:'0',toy:'0'});
							if (svgresult) {
								link.svg = {};
								link.svg.node = svgresult;
							}
						}
					}
				});
			};
			links2svg(L[id].links);
			links2svg(L[id].tolinks);
			
			//add link xml objects and svg objects to the "to" parameter of the link
			var links = L[id].links;
			for (var key in links) {
				if(links.hasOwnProperty(key)){
					var node = links[key].xmlNode;
					var toindex = node.getAttribute('to');
					if(!L[toindex]){
						L[toindex] = {};
						L[toindex].tolinks = {};
					}
					if(!L[toindex].tolinks[key]){
						L[toindex].tolinks[key] = {};
					}
					L[toindex].tolinks[key].xmlNode = node;
					if(L[id].links[key].svg){
						L[toindex].tolinks[key].svg = L[id].links[key].svg;
					}
				}
			}
			
			//need to add the svg to the page! then do the z update.
			var svgdiv = document.getElementById('svgelements');			
			if(svgdiv !== O[id].objectsvg.parentNode){
				svgdiv.appendChild(O[id].objectsvg);
			}
			
			var addLinks = function(links){
				forEach(links, function(link){
					if(link.svg && link.svg.node && svgdiv !== link.svg.node.parentNode){
						var toindex = link.xmlNode.getAttribute('to');
						//only add links with both objects on screen
						if(O[toindex]){
							svgdiv.appendChild(link.svg.node);
						}
					}
				});
			};
			addLinks(L[id].links);
			addLinks(L[id].tolinks);
			
			zUpdate();
			

			O[id].updatePosition('init');
			
		};
		
		SO.updatePosition = function (direction){
			var svgelement = SO.objectsvg;
			//check x,y and r against containing situations and contained situations...
			var key;
			for (key in L[id].links) {
				if(L[id].links.hasOwnProperty(key)){
					if(L[id].links[key].xmlNode.getAttribute('type').match(/Situation/)){
						if (O[L[id].links[key].xmlNode.getAttribute('from')] === SO) {

							var toObj = O[L[id].links[key].xmlNode.getAttribute('to')];

							if(direction === 'init'){
								if(SO.r > toObj.r*3/5){
									SO.r = toObj.r/4;
									if(SO.r < 40){
										SO.r = 40;
										toObj.r = SO.r * 5/3 + 1;
										toObj.updatePosition('up');
									}
								}
							} else if(direction === 'up'){
								if(SO.r > toObj.r*3/5){
									toObj.r = SO.r * 5/3 + 1;
									toObj.updatePosition('up');
								}
							} else{

								if(SO.r > toObj.r*9/10){
									SO.r = toObj.r*9/10;
									if(SO.r < 40){
										SO.r = 40;
										toObj.r = SO.r * 5/3 + 1;
										toObj.updatePosition('up');
									}
								}

							}

							var x = SO.x - toObj.x;
							var y = SO.y - toObj.y;
							var r = toObj.r-SO.r;

							if(Math.pow(x,2) + Math.pow(y,2) > Math.pow(r,2)){						
								var atan = Math.atan2(y,x);
								SO.x = toObj.x + Math.cos(atan) * Math.abs(r);
								SO.y = toObj.y + Math.sin(atan) * Math.abs(r);
							}
						}
					}
				}
			}

			forEach(L[id].tolinks, function(link) {
				if(link.xmlNode.getAttribute('type').match(/Situation/)){
					if (O[link.xmlNode.getAttribute('to')] === SO) {
						var fromObj = O[link.xmlNode.getAttribute('from')];
						fromObj.x += SO.x-SO.prevX;
						fromObj.y += SO.y-SO.prevY;
						if(direction === 'init'){
							fromObj.updatePosition(direction);
						} else {
							fromObj.updatePosition();							
						}
					}
				}
			});

			SO.prevX = SO.x;
			SO.prevY = SO.y;

			var svgresult = object2svg(SO.xmlNodes.obj, {fromx:SO.x,fromy:SO.y,r:SO.r,objid:id});

			if (svgresult) {
				var parentNode = SO.objectsvg.parentNode;
				parentNode.replaceChild(svgresult,SO.objectsvg);

				SO.objectsvg = svgresult;
			}

			var updateLinkPositions = function(links){
				forEach(links, function(link){
					if(link.svg){
						var fromindex = link.xmlNode.getAttribute('from');
						var toindex = link.xmlNode.getAttribute('to');
						if(O[toindex]){
							var fromx = O[fromindex].x;
							var fromy = O[fromindex].y;
							var tox = O[toindex].x;
							var toy = O[toindex].y;

							var midx1 = (tox - fromx) * 3 / 8 + fromx * 1;
							var midy1 = (toy - fromy) * 1 / 8 + fromy * 1;
							var midx2 = (tox - fromx) * 1 / 2 + fromx * 1;
							var midy2 = (toy - fromy) * 1 / 2 + fromy * 1;

							svgresult = object2svg(link.xmlNode, {fromx:fromx,fromy:fromy,midx1:midx1,midy1:midy1,midx2:midx2,midy2:midy2,tox:tox,toy:toy});
							if (svgresult) {						
								parentNode = link.svg.node.parentNode;
								parentNode.replaceChild(svgresult,link.svg.node);
								link.svg.node = svgresult;
							}
						}
					}
				});
			};
			
			updateLinkPositions(L[id].links);
			updateLinkPositions(L[id].tolinks);
		};

		return SO;

	};
	

	var zUpdate = function(){
		//first get z-indices for all of the screenObjects
		forEach(O, function(SO){
			forEach(L[SO.objId].links, function(link){
				if(link.xmlNode.getAttribute('type').match(/Situation/)){
					if (link.xmlNode.getAttribute('to') === SO.objId) {
						var fromObj = O[link.xmlNode.getAttribute('from')];
						if(SO.z <= fromObj.z){
							SO.z = fromObj.z+1;
							SO.insertBeforeId = link.xmlNode.getAttribute('from');
						}
					}
				}
			});
			
		});
		
		//now check all of the objects for z-index consistency, keep iterating until no z-index changes
		var change = true;
		while(change){
			change = false;
			forEach(O, function(SO){
				forEach(L[SO.objId].links, function(link){
					if(link.xmlNode.getAttribute('type').match(/Situation/)){
						if (link.xmlNode.getAttribute('to') === SO.objId) {
							var fromObj = O[link.xmlNode.getAttribute('from')];
							if(SO.z <= fromObj.z){
								SO.z = fromObj.z+1;
								change = true;
							}
						}
					}
				});
			});
		}
		
		var svgdiv = document.getElementById('svgelements');

		//get the current ordering from the svg
		var svgObjects = svgdiv.childNodes;
		var order = [];
		var orderhash = {};
		var i = 0;
		forEach(svgObjects, function(svgObject){
			if(svgObject.firstChild){
				order[i] = svgObject.firstChild.id;
				orderhash[svgObject.firstChild.id] = i;
			}
		});
		
		//check each object for consistency with whats on screen, fix it if there is a problem
		forEach(O, function(SO){
			if(SO.insertBeforeId){
				if(orderhash[SO.insertBeforeId] < order[SO.objId]){
					//these objects are out of order, insert current object before insertBefore
					var insertBefore = O[SO.insertBeforeId].objectsvg;
					svgdiv.remove(SO.objectsvg);
					svgdiv.insertBefore(SO.objectsvg,insertBefore);
				}
			}
		});
		
	};
	
	var xmlUpdate = function(id){
			//make a screenObject for each primitive object stemming from the root situation
			if(!O[id]){
				O[id] = makeScreenObject(id);
			}
			O[id].setObject(objectCache[id]);
	};
	
	
	
	
	return {
		submitenter: function(myfield,e){
			var keycode;
			if (window.event){
				keycode = window.event.keyCode;
			} else if (e) {
				keycode = e.which;
			} else {
				return true;
			}
			
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
			var dragO = O[ui.dragOid];
			if (ui.drag && dragO){
				var point = ui.calcCoord(ui.xm,ui.ym,ui.svgelements);
				if(ui.rPressed){
					dragO.r = 1.5*Math.sqrt(Math.pow(point.x-dragO.x,2) + Math.pow(point.y- dragO.y,2));
				} else {
					dragO.x = point.x - ui.initx + ui.offsetx;
					dragO.y = point.y - ui.inity + ui.offsety;
				}
				dragO.updatePosition();
			}
			if (ui.drawnOid !== ui.selectOid || (isNewChange && ui.selectOid && O[ui.selectOid].xmlNodes)){
				ui.drawnOid = ui.selectOid;
				isNewChange = false;
				var infoDiv = document.getElementById("info");
				var selectO = O[ui.selectOid];
				var htmlresult = object2html(selectO.xmlNodes.obj, {params:'all'});
				if (infoDiv.firstChild) {
					infoDiv.replaceChild(htmlresult, infoDiv.firstChild);
				}
				else {
					infoDiv.appendChild(htmlresult);
				}
			} else if (ui.zPressed){
				ui.zoomfactor = ui.basezoom+(ui.xm-ui.initx)/200;
				if(ui.zoomfactor <= 0.1){
					ui.zoomfactor = 0.1;
				}
				var width = ui.orig_width*ui.zoomfactor;
				var height = ui.orig_height*ui.zoomfactor;
				
				ui.curorig_x = ui.midx - (width/2);
				ui.curorig_y = ui.midy - (height/2);
				ui.svgelements.setAttribute("viewBox",ui.curorig_x+" "+ui.curorig_y+" "+width+" "+height);
			}
									
			runcheck = false;
		},
				
		rootSit2Screen: function(){

			
			//populate the objectCache by traversing the situation tree structure
			objectCache = {};
			
			var recurseTree = function(obj){
				objectCache[obj.getId()] = obj;
				if(obj.getObjects){
					forEach(obj.getObjects(), function(childObj){
						recurseTree(childObj);
					});
				}
			};
			
			
			recurseTree(rootSit);		
			
			for (var id in objectCache) {
				if(objectCache.hasOwnProperty(id)){
					xmlUpdate(id);
				}
			}


		},

		init: function(testFunc){
			
			ui = initUserInput();
			
			//create some objects to populate the object cache
						
			var rootId = 'rootId';
			var s = makeSituation(null, rootId);
			rootSit = s;
		
			var myF = function(x){alert(x);};
			
			var G = {};
			testFunc(s,G);
			//JB.queryContent(myF, 'queryparam2');
			
			initContext = function(){};
			
			this.rootSit2Screen();
		}
	};
}();

