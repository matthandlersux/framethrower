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
	ui.lPressed = false;
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
			} else if(e.keyCode === 76){
				ui.lPressed = true;
			}
		}
	});

	dojo.connect(document, 'onkeyup', function(e) {
		if(e.keyCode === 82){
			ui.rPressed = false;
		} else if(e.keyCode === 90){
			ui.zPressed = false;
		} else if(e.keyCode === 76){
			ui.lPressed = false;
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

		SO.objId = id;
		SO.links = {};
		SO.tolinks = {};
		SO.objectsvg = {};
		SO.containedObjects = {};
		SO.angle = 0;

		SO.setX = function(inX){
			SO.x = inX;
			SO.targetX = inX;
		};

		SO.setY = function(inY){
			SO.y = inY;
			SO.targetY = inY;
		};

		SO.setR = function(inR){
			SO.r = inR;
			SO.targetR = inR;
		};

		//give object an x and y
		SO.setX(Math.random()*400);
		SO.prevX = SO.x;
		SO.setY(Math.random()*400);
		SO.prevY = SO.y;
		SO.setR(300 + Math.random()*8);
		SO.z = 0;

		SO.removeObject = function(){
			//remove from-links from "to" parameter of links
			for (var key in SO.links) {
				if(SO.links.hasOwnProperty(key)){
					var toindex = SO.links[key].xmlNode.getAttribute('to');
					if(O[toindex].tolinks[key]){
						O[toindex].unregisterToLink(key, SO);
						SO.unregisterFromLink(key, O[toindex]);
						//O[toindex].tolinks[key] = undefined;
						delete O[toindex].tolinks[key];
					}
				}
			}

			var svgdiv = document.getElementById('svgelements');
			//remove from-links and to-links svg
			console.log('removing: ' + id);
			var removeLinks = function(links){
				forEach(links, function(link){
					if(link.svg && link.svg.node && svgdiv === link.svg.node.parentNode){
						svgdiv.removeChild(link.svg.node);
					}
				});
			};
			removeLinks(SO.links);
			removeLinks(SO.tolinks);

			//clear from-links svg
			//SO.links = undefined;
			//delete SO.links; not necessary?

			//remove object svg
			if(svgdiv === SO.objectsvg.parentNode){
				svgdiv.removeChild(SO.objectsvg);
			}
			//clear object svg
			//SO.objectsvg = undefined;
			delete SO.objectsvg;
		};

		SO.setObject = function(obj){
			var xmlresult = objectToXML(obj, obj.getType(), "link");
			SO.xmlNodes = {};
			SO.xmlNodes.obj = xmlresult.obj;

			SO.links = xmlresult.links;

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
			links2svg(SO.links);
			links2svg(SO.tolinks);

			//add link xml objects and svg objects to the "to" parameter of the link
			var links = SO.links;
			for (var key in links) {
				if(links.hasOwnProperty(key)){
					var node = links[key].xmlNode;
					var toindex = node.getAttribute('to');
					if(!O[toindex]){
						O[toindex] = makeScreenObject(toindex);
					}
					O[toindex].registerToLink(key, SO);
					SO.registerFromLink(key, O[toindex]);
				}
			}

			//need to add the svg to the page! then do the z update.
			var svgdiv = document.getElementById('svgelements');			
			if(svgdiv !== SO.objectsvg.parentNode){
				svgdiv.appendChild(SO.objectsvg);
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
			addLinks(SO.links);
			addLinks(SO.tolinks);

			zUpdate();


			SO.updatePosition('init');

		};

		SO.registerToLink = function(key, fromSO) {
			if(!SO.tolinks[key]){
				SO.tolinks[key] = {};
			}
			SO.tolinks[key].xmlNode = fromSO.links[key].xmlNode;
			if(fromSO.links[key].svg){
				SO.tolinks[key].svg = fromSO.links[key].svg;
			}

			if(fromSO.links[key].xmlNode.getAttribute('type').match(/Situation/)){

				SO.containedObjects[fromSO.objId] = fromSO;
				//change to contained objects, so update the targetX and targetY of all contained objects
				var total = 0;
				forEach(SO.containedObjects, function(){
					total++;
				});
				var count = 0;
				forEach(SO.containedObjects, function(CO){
					CO.angle = count/total * 2 * Math.PI;
					CO.updateTargets();
					count++;
				});
			}
		};
		
		SO.unregisterToLink = function(key, fromSO) {
			if(fromSO.links[key].xmlNode.getAttribute('type').match(/Situation/)){

				delete SO.containedObjects[fromSO.objId];
				//change to contained objects, so update the targetX and targetY of all contained objects
				var total = 0;
				forEach(SO.containedObjects, function(){
					total++;
				});
				var count = 0;
				forEach(SO.containedObjects, function(CO){
					CO.angle = count/total * 2 * Math.PI;
					//CO.updateTargets();
					count++;
				});
			}
		};
		

		SO.registerFromLink = function(key, toSO) {
			if(SO.links[key].xmlNode.getAttribute('type').match(/Situation/)){
				SO.containingObject = toSO;
			}
		};
		
		SO.unregisterFromLink = function(key, toSO) {
			if(SO.links[key].xmlNode.getAttribute('type').match(/Situation/)){
				delete SO.containingObject;
			}
		};

		SO.updateTargets = function () {
			//move each targetX and targetY to angle
			if(SO.containingObject){
				SO.targetX = SO.containingObject.x + SO.containingObject.r * 3/4 * Math.cos(SO.angle);				
				SO.targetY = SO.containingObject.y + SO.containingObject.r * 3/4 * Math.sin(SO.angle);
			}
			//console.log('angle: ' + angle);
			//console.log('cos(angle): ' + Math.cos(angle));
		};

		SO.updatePosition = function (direction) {
			//check x,y and r against containing situations
			if(SO.containingObject){
				var toObj = SO.containingObject;
				if(direction === 'init'){
					if(SO.r > toObj.r*3/5){
						SO.setR(toObj.r/4);
						if(SO.r < 40){
							SO.setR(40);
							toObj.setR(SO.r * 5/3 + 1);
							toObj.updatePosition('up');
						}
					}
				} else if(direction === 'up'){
					if(SO.r > toObj.r*3/5){
						toObj.setR(SO.r * 5/3 + 1);
						toObj.updatePosition('up');
					}
				} else{
					if(SO.r > toObj.r*9/10){
						SO.setR(toObj.r*9/10);
						if(SO.r < 40){
							SO.setR(40);
							toObj.setR(SO.r * 5/3 + 1);
							toObj.updatePosition('up');
						}
					}
				}


				var x = SO.x - toObj.x;
				var y = SO.y - toObj.y;
				var r = toObj.r-SO.r;

				if(Math.pow(x,2) + Math.pow(y,2) > Math.pow(r,2)){						
					var atan = Math.atan2(y,x);
					SO.setX(toObj.x + Math.cos(atan) * Math.abs(r));
					SO.setY(toObj.y + Math.sin(atan) * Math.abs(r));
				}
			}


			//check x,y and r against contained objects
			forEach(SO.containedObjects, function(fromObj) {
				fromObj.x += SO.x-SO.prevX;
				fromObj.targetX = fromObj.x;
				fromObj.y += SO.y-SO.prevY;
				fromObj.targetY = fromObj.y;
				if(direction === 'layout'){
					fromObj.updateTargets();
				}
				
				if(direction === 'init' || direction === 'layout'){
					fromObj.updatePosition(direction);
				} else {
					fromObj.updatePosition();							
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

			updateLinkPositions(SO.links);
			updateLinkPositions(SO.tolinks);
		};

		SO.moveOnPath = function(){
			var adjust = function(val, target){
				var answer = {};
				if(val != target){
					answer.change = true;
					if(Math.abs(val - target) < 10){
						answer.val = target;
					} else {
						if(val < target){
							answer.val = val + 10;
						}else{
							answer.val = val - 10;
						}
					}
				} else {
					answer.change = false;
					answer.val = val;
				}
				return answer;
			};

			var change = false;
			var answer;
			answer = adjust(SO.x, SO.targetX);
			SO.x = answer.val;
			change = change || answer.change;
			answer = adjust(SO.y, SO.targetY);
			SO.y = answer.val;
			change = change || answer.change;
			answer = adjust(SO.r, SO.targetR);
			SO.r = answer.val;
			change = change || answer.change;

			if(change){
				SO.updatePosition('layout');
			}
		};

		return SO;

	};


	var zUpdate = function(){
		//first get z-indices for all of the screenObjects
		forEach(O, function(SO){
			forEach(O[SO.objId].links, function(link){
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
				forEach(O[SO.objId].links, function(link){
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
					dragO.setR(1.5*Math.sqrt(Math.pow(point.x-dragO.x,2) + Math.pow(point.y- dragO.y,2)));
				} else {
					dragO.x = point.x - ui.initx + ui.offsetx;
					dragO.targetX = dragO.x;
					dragO.y = point.y - ui.inity + ui.offsety;
					dragO.targetY = dragO.y;
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
			} else if (ui.lPressed){
				forEach(O, function(SO){
					SO.updateTargets();
				});
				ui.lPressed = false;
			}
			forEach(O, function(SO){
				SO.moveOnPath();
			});
			runcheck = false;
		},

		rootSit2Screen: function(){
			//remove all screen objects from the current objectCache
			for (id in objectCache) {
				if(objectCache.hasOwnProperty(id)){
					O[id].removeObject();
				}
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
			};


			recurseTree(rootSit);		

			for (id in objectCache) {
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

