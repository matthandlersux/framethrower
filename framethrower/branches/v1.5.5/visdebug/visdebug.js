/**
* @author boobideedoobop
*/


var screenObjects = {};

//creates userInput object which keeps track of userinput information
//needs access to O to get x and y info for objects
var initUserInput = function(svgelementsName, O, layoutFunc, mouseMoveFunc) {
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
	ui.svgelements = document.getElementById(svgelementsName);
	ui.svgPoint = ui.svgelements.createSVGPoint();

	ui.actual_width = ui.svgelements.width;
	ui.actual_height = ui.svgelements.height;

	var vb = ui.svgelements.getAttribute("viewBox");
	if (vb) {
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


	var hashSvgElements = dojo.query('#' + svgelementsName);

	hashSvgElements.connect('onmousemove', function(e) {
		ui.xm = e.layerX;
		ui.ym = e.layerY;
		ui.px = e.pageX;
		ui.py = e.pageY;
		mouseMoveFunc();
	});

	/*
	dojo.connect(document, 'onmousedown', function(e) {
		if (e.target.localName!=="input") {
			e.preventDefault();
		}
	});
	*/

	hashSvgElements.connect('onmouseup', function(e) {
		ui.drag = false;
	});

	hashSvgElements.connect('mousedown', function(e) {
		var targ = e.target;
		if (targ.id) {
			ui.drag = true;
			ui.dragOid = targ.id;
			ui.selectOid = targ.id;
			var SO = O[targ.id];
			if(SO){
				ui.offsetx = SO.x;
				ui.offsety = SO.y;
			}

			var point = ui.calcCoord(ui.px,ui.py,ui.svgelements);
			ui.initx = point.x;
			ui.inity = point.y;
		}
	});

	dojo.connect(document, 'onkeydown', function(e) {
		if (e.target.localName!=="input") {
			if (e.keyCode === 82) {
				ui.rPressed = true;
			} else if (e.keyCode === 90) {
				ui.initx = ui.xm;
				ui.inity = ui.ym;
				ui.zPressed = true;
				ui.basezoom = ui.zoomfactor;
			}
		}
	});

	dojo.connect(document, 'onkeyup', function(e) {
		if (e.keyCode === 82) {
			ui.rPressed = false;
		} else if (e.keyCode === 90) {
			ui.zPressed = false;
		} else if (e.keyCode === 76) {
			//user pressed l, do layout
			layoutFunc();
		}
	});



	return ui;
};


//creates visDebug object. This is used as follows:
//run "init"
//run "run" every few milliseconds
//run "submitenter" to execute a command

var visDebug = function() {
	var O = {}; //objects being displayed on screen
	var object2svg = compileXSL(loadXMLNow("object2svg.xsl"));
	var object2html = compileXSL(loadXMLNow("object2html.xsl"));
	var object2shape = compileXSL(loadXMLNow("object2shape.xsl"));
	var objectCache = {};
	var rootObj = {};
	var runcheck = false;
	var isNewChange = false;
	var initContext = null;
	var containWords = [];
	var containedWords = [];
	var noLinkWords = [];
	var typeShapeXML = {};

	var ui;



	//function to help the xml format of the object cache resolve pointers to other objects in the object cache
	function testTopLevelObject(obj) {
		if (obj.getId) {
			if (obj === objectCache[obj.getId()]) {
				return obj.getId();
			}
		}
		return false;
	}

	//function to convert object cache to xml format
	var objectToXML = makeObjectToXML(testTopLevelObject);

	//helper function for moveOnPat
	var adjust = function(val, target) {
		var answer = {};
		if (val != target) {
			answer.change = true;
			if (Math.abs(val - target) < 10) {
				answer.val = target;
			} else {
				if (val < target) {
					answer.val = val + 10;
				}else {
					answer.val = val - 10;
				}
			}
		} else {
			answer.change = false;
			answer.val = val;
		}
		return answer;
	};

	var makeScreenObject = function(id) {
		var SO = {};

		SO.objId = id;
		SO.links = {};
		SO.tolinks = {};
		SO.objectsvg = {};
		SO.containedObjects = {};

		SO.setX = function(inX) {
			SO.x = inX;
			SO.targetX = inX;
		};

		SO.setY = function(inY) {
			SO.y = inY;
			SO.targetY = inY;
		};

		SO.setR = function(inR) {
			SO.r = inR;
			SO.targetR = inR;
		};

		//give object an x and y
		SO.setX(Math.random()*400);
		SO.prevX = SO.x;
		SO.setY(Math.random()*400);
		SO.prevY = SO.y;
		SO.setR(10);
		SO.z = 0;

		SO.removeObject = function() {
			//remove from-links from "to" parameter of links
			for (var key in SO.links) {
				if (SO.links.hasOwnProperty(key)) {
					var toindex = SO.links[key].xmlNode.getAttribute('to');
					if (O[toindex].tolinks[key]) {
						O[toindex].unregisterToLink(key, SO);
						SO.unregisterFromLink(key, O[toindex]);
						//O[toindex].tolinks[key] = undefined;
						delete O[toindex].tolinks[key];
					}
				}
			}

			var svgdiv = ui.svgelements;
			//remove from-links and to-links svg
			var removeLinks = function(links) {
				forEach(links, function(link) {
					if (link.svg && link.svg.node && svgdiv === link.svg.node.parentNode) {
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
			if (svgdiv === SO.objectsvg.parentNode) {
				svgdiv.removeChild(SO.objectsvg);
			}
			//clear object svg
			//SO.objectsvg = undefined;
			delete SO.objectsvg;
		};

		SO.preparePolygon = function() {
			if(SO.shape){
				SO.polygon = {};
				SO.polygon.x = SO.x;
				SO.polygon.y = SO.y;
				if(SO.shape == "rectangle"){
					SO.polygon.points = [[SO.x-SO.r,SO.y-SO.r],[SO.x-SO.r,SO.y+SO.r],[SO.x+SO.r,SO.y+SO.r],[SO.x+SO.r,SO.y-SO.r]];
				} else if (SO.shape == "circle") {
					SO.polygon.points = [];
					for(var i=0;i<40;i++){
						var angle = -i/40*2*Math.PI;
						SO.polygon.points[i] = [SO.x + SO.r*Math.cos(angle), SO.y + SO.r*Math.sin(angle)];
					}
				} else if (SO.shape == "uptriangle"){
					SO.polygon.points = [[SO.x,SO.y-SO.r],[SO.x-SO.r, SO.y+SO.r/2],[SO.x+SO.r, SO.y+SO.r/2]];
				} else if (SO.shape == "downtriangle"){
					SO.polygon.points = [[SO.x,SO.y+SO.r],[SO.x+SO.r, SO.y-SO.r/2],[SO.x-SO.r, SO.y-SO.r/2]];
				}
			}
		};


		SO.setObject = function(obj) {
			var xmlresult = objectToXML(obj, obj.getType(), "link");
			SO.xmlNodes = {};
			SO.xmlNodes.obj = xmlresult.obj;

			//get shape for the objects

			var shape = object2shape(SO.xmlNodes.obj, {typeShapes:typeShapeXML});
			if (shape) {
				SO.shape = shape.getAttribute("shape");
				SO.cssclass = shape.getAttribute("cssclass");
			}

			//create svg for the objects			
			var svgresult = object2svg(SO.xmlNodes.obj, {fromx:'0',fromy:'0',r:'20',objid:id,shape:SO.shape,cssclass:SO.cssclass});
			if (svgresult) {
				SO.objectsvg = svgresult;
			}
			
			
			//filter out links we don't care about
			var filteredLinks = {};
			SO.links = {};
			for (key in xmlresult.links){
				var node = xmlresult.links[key].xmlNode;
				var matched1 = false;
				var matched2 = false;
				forEach(noLinkWords, function(word) {
					var re = new RegExp(word);
					if (node.getAttribute('type').match(re)) {
						matched1 = true;
						matched2 = true;
					}
				});
				forEach(containedWords, function(word) {
					var re = new RegExp(word);
					if (node.getAttribute('type').match(re)) {
						matched1 = false;
					}
				});
				forEach(containWords, function(word) {
					var re = new RegExp(word);
					if (node.getAttribute('type').match(re)) {
						matched1 = false;
					}
				});
				if(!matched1){
					filteredLinks[key] = xmlresult.links[key];
				}
				if(!matched2){
					SO.links[key] = xmlresult.links[key];
				}
			}
			
			//add link xml objects and svg objects to the "to" parameter of the link
			var links = filteredLinks;
			for (var key in links) {
				if (links.hasOwnProperty(key)) {
					var link = links[key];
					var toindex = link.xmlNode.getAttribute('to');
					if (!O[toindex]) {
						O[toindex] = makeScreenObject(toindex);
					}
					O[toindex].registerToLink(key, link, SO);
					SO.registerFromLink(key, O[toindex]);
				}
			}

			
			//create svg for the links if they don't already exist
			var links2svg = function(links) {
				forEach(links, function(link) {
					var node = link.xmlNode;
					var matched = false;
					forEach(noLinkWords, function(word) {
						var re = new RegExp(word);
						if (node.getAttribute('type').match(re)) {
							matched = true;
						}
					});
					if (!matched) {
						if (!link.svg) {
							svgresult = object2svg(node, {fromx:'0',fromy:'0',midx1:'0',midy1:'0',midx2:'0',midy2:'0',tox:'0',toy:'0',shape:SO.shape,cssclass:SO.cssclass});
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



			//need to add the svg to the page! then do the z update.
			var svgdiv = ui.svgelements;			
			if (svgdiv !== SO.objectsvg.parentNode) {
				svgdiv.appendChild(SO.objectsvg);
			}

			var addLinks = function(links) {
				forEach(links, function(link) {
					if (link.svg && link.svg.node && svgdiv !== link.svg.node.parentNode) {
						var toindex = link.xmlNode.getAttribute('to');
						//only add links with both objects on screen
						if (O[toindex]) {
							svgdiv.appendChild(link.svg.node);
						}
					}
				});
			};
			addLinks(SO.links);
			addLinks(SO.tolinks);

			SO.updatePosition('init');

		};

		SO.registerToLink = function(key, link, fromSO) {
			SO.tolinks[key] = link;

			forEach(containedWords, function(word) {
				var re = new RegExp(word);
				if (link.xmlNode.getAttribute('type').match(re)) {
					SO.containedObjects[fromSO.objId] = fromSO;
				}	
			});
			forEach(containWords, function(word) {
				var re = new RegExp(word);
				if (SO.tolinks[key].xmlNode.getAttribute('type').match(re)) {
					SO.containingObject = fromSO;
				}
			});
		};
		
		SO.unregisterToLink = function(key, fromSO) {
			if (SO.containedObjects[fromSO.objId]) {
				delete SO.containedObjects[fromSO.objId];
			}
		};
		

		SO.registerFromLink = function(key, toSO) {
			forEach(containWords, function(word) {
				var re = new RegExp(word);
				if (toSO.tolinks[key].xmlNode.getAttribute('type').match(re)) {
					SO.containedObjects[toSO.objId] = toSO;
				}	
			});			
			forEach(containedWords, function(word) {
				var re = new RegExp(word);
				if (SO.links[key].xmlNode.getAttribute('type').match(re)) {
					SO.containingObject = toSO;
				}
			});
		};
		
		SO.unregisterFromLink = function(key, toSO) {
			if (SO.containingObject) {
				delete SO.containingObject;
			}
		};

		//helper function for updatePosition
		var updateLinkPositions = function(links) {
			forEach(links, function(link) {
				if (link.svg) {
					var fromindex = link.xmlNode.getAttribute('from');
					var toindex = link.xmlNode.getAttribute('to');
					if (O[toindex]) {
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

		SO.updatePosition = function (direction) {
			//don't update if we haven't gotten xmlNodes for this object yet
			if (!SO.xmlNodes) {
				return;
			}
			
			//check x,y and r against containing situations
			if (SO.containingObject) {
				//check r against containing situations
				var toObj = SO.containingObject;
				if (direction === 'init') {
					if (SO.r > toObj.r*3/5) {
						SO.setR(toObj.r/4);
						if (SO.r < 10) {
							SO.setR(10);
							toObj.setR(SO.r * 4 + 1);
							toObj.updatePosition('up');
						}
					}
				} else if (direction === 'up') {
					if (SO.r > toObj.r*3/5) {
						toObj.setR(SO.r * 5/3 + 1);
						toObj.updatePosition('up');
					}
				} else {
					if (SO.r > toObj.r*9/10) {
						SO.setR(toObj.r*9/10);
						if (SO.r < 10) {
							SO.setR(10);
							toObj.setR(SO.r * 3 + 1);
							toObj.updatePosition('up');
						}
					}
				}

				//check x and y against containing situations
				//do collision detection here!
				toObj.preparePolygon();
				SO.preparePolygon();
				var containsResult = PolygonContainment(toObj.polygon, SO.polygon);
				if(containsResult.intersect){
					SO.setX(SO.x + containsResult.transformVect[0]);
					SO.setY(SO.y + containsResult.transformVect[1]);
				}
			}


			//check x,y and r against contained objects
			forEach(SO.containedObjects, function(fromObj) {
				fromObj.x += SO.x-SO.prevX;
				fromObj.targetX = fromObj.x;
				fromObj.y += SO.y-SO.prevY;
				fromObj.targetY = fromObj.y;
				if (direction === 'init' || direction === 'layout') {
					fromObj.updatePosition(direction);
				} else {
					fromObj.updatePosition();							
				}
				
			});

			SO.prevX = SO.x;
			SO.prevY = SO.y;
						
			var svgresult = object2svg(SO.xmlNodes.obj, {fromx:SO.x,fromy:SO.y,r:SO.r,objid:id,shape:SO.shape,cssclass:SO.cssclass});

			if (svgresult) {
				var parentNode = SO.objectsvg.parentNode;
				parentNode.replaceChild(svgresult,SO.objectsvg);

				SO.objectsvg = svgresult;
			}

			updateLinkPositions(SO.links);
			updateLinkPositions(SO.tolinks);
		};

		SO.moveOnPath = function() {
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

			if (change) {
				SO.updatePosition('layout');
			}
		};

		return SO;

	};

	var zUpdate = function() {
		//first get z-indices for all of the screenObjects
		forEach(O, function(SO) {
			forEach(SO.containedObjects, function(contO){
				if (SO.z <= contO.z) {
					SO.z = contO.z+1;
					SO.insertBeforeId = contO.objId;
				}
			});

		});

		//now check all of the objects for z-index consistency, keep iterating until no z-index changes
		var change = true;
		while(change) {
			change = false;
			forEach(O, function(SO) {
				forEach(SO.containedObjects, function(contO){
					if (SO.z <= contO.z) {
						SO.z = contO.z+1;
						change = true;
					}
				});
			});
		}

		var svgdiv = ui.svgelements;



		//get the current ordering from the svg
		var svgObjects = svgdiv.childNodes;
		var orderhash = {};
		var i = 0;
		forEach(svgObjects, function(svgObject) {
			if (svgObject.firstChild) {
				orderhash[svgObject.firstChild.id] = i;
				i++;
			}else {
				orderhash[svgObject.id] = i;
				i++;
			}
		});
		
		
		//check each object for consistency with whats on screen, fix it if there is a problem
		forEach(O, function(SO) {
			if (SO.insertBeforeId) {
				if (orderhash[SO.insertBeforeId] < orderhash[SO.objId]) {
					//these objects are out of order, insert current object before insertBefore
					var insertBefore = O[SO.insertBeforeId].objectsvg;
					svgdiv.removeChild(SO.objectsvg);
					svgdiv.insertBefore(SO.objectsvg,insertBefore);
					orderhash[SO.insertBeforeId] = orderhash[SO.objId]+1;
				}
			}
			//make sure any links to an object come after it
			forEach(SO.links, function(link) {
				if (link.svg && orderhash[link.svg.node.firstChild.id] < orderhash[SO.objId]) {
					//these objects are out of order, insert link object after current object
					svgdiv.removeChild(link.svg.node);
					insertAfter(svgdiv, link.svg.node, SO.objectsvg);
					orderhash[link.svg.node.firstChild.id] = orderhash[SO.objId]+1;
				}
			});
			forEach(SO.tolinks, function(link) {
				if (link.svg && orderhash[link.svg.node.firstChild.id] < orderhash[SO.objId]) {
					//these objects are out of order, insert link object after current object
					svgdiv.removeChild(link.svg.node);
					insertAfter(svgdiv, link.svg.node, SO.objectsvg);
					orderhash[link.svg.node.firstChild.id] = orderhash[SO.objId] + 1;
				}
			});			
		});

	};


	var xmlUpdate = function(id) {
		//make a screenObject for each primitive object stemming from the root situation
		if (!O[id]) {
			O[id] = makeScreenObject(id);
		}
		O[id].setObject(objectCache[id]);
	};

	var submitenter = function(myfield,e) {
		var keycode;
		if (window.event) {
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

			eval(command,initContext);
			isNewChange = true;
			rootObj2Screen(rootObj);				

			return false;
		} else {
			return true;
		}
	};
	
	var circleLayout = function() {
		//layout all of the objects in circles within each containingObject
		
		//make a circle for objects with no containingObject
		var totalUncontained = 0;
		forEach(O, function(SO) {
			if(!SO.containingObject){
				totalUncontained++;
			}
		});
		
		var i = 0;
		forEach(O, function(SO) {
			if(!SO.containingObject){
				var angle = i/totalUncontained*2*Math.PI;
				SO.targetX = 500 + 300*Math.cos(angle);
				SO.targetY = 350 + 250*Math.sin(angle);
				i++;
			}
		});
		
		//make a circle for the contained objects in each object
		forEach(O, function(SO) {
			var total = 0;
			forEach(SO.containedObjects, function(contO) {
				total++;
			});
			var j = 0;
			forEach(SO.containedObjects, function(contO){
				var angle = j/total*2*Math.PI;
				contO.targetX = SO.x + SO.r * 3/4 * Math.cos(angle);				
				contO.targetY = SO.y + SO.r * 3/4 * Math.sin(angle);
				j++;
			});
		});
	};

	var treeLayout = function() {
		
		//do depth first search from each start cap to build tree
		
		var depth = function(SO, leftlim, level){
			var xave = 0;
			var totalchildren = 0;
			var myleftlim = leftlim;
			var myrightlim = myleftlim;
			forEach(SO.containedObjects, function(contO){
				forEach(contO.links, function(link){
					if(link.xmlNode.getAttribute('type').match(/Informs/)){
						var newSO = O[link.xmlNode.getAttribute('to')];
						var answer = depth(newSO.containingObject, myleftlim, level+1);
						myleftlim = answer.rightlim+100;
						myrightlim = answer.rightlim;
						xave += answer.rootX;
						totalchildren++;
					}
				});
			});

			if (totalchildren == 0) {
				SO.setX(myleftlim);
			} else {
				SO.setX(xave/totalchildren);
			}
			SO.setY(level*100);
			return {rootX: SO.x, rightlim:myrightlim};
		};
	
		var leftlim = 0;
		forEach(O, function(SO){
			if (SO.xmlNodes.obj.getAttribute('type') == "startCap") {
				var answer = depth(SO, leftlim, 1);
				leftlim = answer.rightlim;
			}
		});
	
		forEach(O, function(SO){
			SO.updatePosition();
		});
				
	};
	
	var betterLayout = function() {
		//layout into 3 columns for now
		var curCol = 0;
		var curRow = 0;
		var height = ui.svgelements.viewBox.baseVal.height;
		var width = ui.svgelements.viewBox.baseVal.width;

		forEach(O, function(SO) {
			if(!SO.containingObject){
				curCol++;
				if(curCol > 4){
					curCol = 0;
					curRow++;
				}
			}
		});

		var point = ui.calcCoord(0,0,ui.svgelements);
		var left = point.x + 80;
		var top = point.y + 80;
/*
		var order = function(SO){
			forEach(SO.containedObjects, function(contO){
				forEach(SO.links, function(link){
					var re = new RegExp();
					if(link.getAttribute('type').match())
				}){
					
				
				
				order(contO);
			});
		}
		*/
		
		
		forEach(O, function(SO){
			if(!SO.containingObject){
				
			}
		});

		var totalRows = curRow;
		curCol = 0;
		curRow = 0;
		forEach(O, function(SO) {
			if(!SO.containingObject){
				SO.targetX = (left + (width-2*left) * curCol/4);
				SO.targetY = (top + (height-2*top) * curRow/totalRows);
				curCol++;
				if(curCol > 4){
					curCol = 0;
					curRow++;
				}
			}
		});
		
	};
	
	
	var run = function() {
		if (runcheck) {
			//alert('runcheck problem');
			return;
		}
		runcheck = true;
		var dragO = O[ui.dragOid];
		if (ui.drag && dragO) {
			var point = ui.calcCoord(ui.px,ui.py,ui.svgelements);
			if (ui.rPressed) {
				//resizing an object
				dragO.setR(1.5*Math.sqrt(Math.pow(point.x - (dragO.x),2) + Math.pow(point.y - (dragO.y),2)));
			} else {
				//dragging an object
				dragO.x = point.x - ui.initx + ui.offsetx;
				
				dragO.targetX = dragO.x;
				dragO.y = point.y - ui.inity + ui.offsety;
				dragO.targetY = dragO.y;
			}
			dragO.updatePosition();
		}
		if ((ui.drawnOid !== ui.selectOid || isNewChange) && ui.selectOid && O[ui.selectOid] && O[ui.selectOid].xmlNodes) {
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
		} else if (ui.zPressed) {
			//zooming
			ui.zoomfactor = ui.basezoom+(ui.xm-ui.initx)/200;
			if (ui.zoomfactor <= 0.1) {
				ui.zoomfactor = 0.1;
			}
			var width = ui.orig_width*ui.zoomfactor;
			var height = ui.orig_height*ui.zoomfactor;

			ui.curorig_x = ui.midx - (width/2);
			ui.curorig_y = ui.midy - (height/2);
			ui.svgelements.setAttribute("viewBox",0+" "+0+" "+width+" "+height);
		}
		/*
		forEach(O, function(SO) {
			SO.moveOnPath();
		});
		*/
		runcheck = false;
	};
	
	var rootObj2Screen = function(rootObj, recurseFuncName) {
		//remove all screen objects from the current objectCache
		for (id in objectCache) {
			if (objectCache.hasOwnProperty(id)) {
				O[id].removeObject();
			}
		}

		//populate the objectCache by traversing the situation tree structure
		objectCache = {};

		var recurseTree = function(obj) {
			objectCache[obj.getId()] = obj;
			if (obj[recurseFuncName]) {
				forEach(obj[recurseFuncName](), function(childObj) {
					recurseTree(childObj);
				});
			}
		};

		recurseTree(rootObj);		

		for (id in objectCache) {
			if (objectCache.hasOwnProperty(id)) {
				xmlUpdate(id);
			}
		}
		zUpdate();
	};


	var objArray2Screen = function(objArray) {
		//remove all screen objects from the current objectCache
		for (id in objectCache) {
			if (objectCache.hasOwnProperty(id)) {
				O[id].removeObject();
			}
		}

		//populate the objectCache by traversing the object array
		objectCache = {};

		var count=0;
		forEach(objArray, function(obj) {
			objectCache[obj.getId()] = obj;
		});

		for (id in objectCache) {
			if (objectCache.hasOwnProperty(id)) {
				xmlUpdate(id);
			}
		}
		zUpdate();
	};


	var init = function(params) {
		//create userinput object to track user input
		ui = initUserInput(params.svgDiv, O, treeLayout, run);
		if (params.containWords) {
			containWords = params.containWords;
		}
		if (params.containedWords) {
			containedWords = params.containedWords;
		}
		if (params.noLinkWords) {
			noLinkWords = params.noLinkWords;
		}
		//create some objects to populate the object cache

		if (params.typeShapesFile) {
			typeShapeXML = loadXMLNow(params.typeShapesFile);
		}

		//G is an object that we can use to make objects created in testFunc available to the interactive debugger
		//we execute our test commands to set up an environment
		//then we can execute further commands interactively using submitenter
		var G = {};
		rootObj = params.testFunc(G);

		initContext = function() {};

		if (params.initStyle === "recursive") {
			rootObj2Screen(rootObj, params.recurseFuncName);
		}else {
			objArray2Screen(rootObj);
		}
	};
	

	//specify the public functions
	return {
		submitenter:submitenter,
		run:run,
		init:init
	};
};