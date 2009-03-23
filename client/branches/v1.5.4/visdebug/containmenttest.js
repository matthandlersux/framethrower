
var selected = null;

document.onmouseup = function(e){
	selected = null;
};

function makePolygon(centerpoint, points) {
	var O = {};
	var svgPolygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
	svgPolygon.collisionObject = O;
	
	var myPoints = points;
	
	var origX = centerpoint[0];
	var origY = centerpoint[1];
	
	var origPoints = [];
	
	origPoints = points;
	
	O.x = centerpoint[0];
	O.y = centerpoint[1];
	
	
	svgPolygon.onmousedown = function(e){
		selected = e.target;
	};
	
	O.draw = function(){
		var pointString = "";
		for(var i=0; i<this.points.length;i++){
			if(i != 0){
				pointString += ",";
			}
			pointString += (this.points[i][0]) + "," + (this.points[i][1]);
		}
		svgPolygon.setAttribute("points", pointString);
	};
	
	O.update = function(){
		var xdif = this.x - origX;
		var ydif = this.y - origY;
		this.points = [];
		for(var i=0; i<origPoints.length;i++){
			this.points[i] = [];
			this.points[i][0] = origPoints[i][0] + xdif;
			this.points[i][1] = origPoints[i][1] + ydif;
		}
	};

	O.update();
	O.draw();
	
	var svgdiv = document.getElementById("svgelements");
	svgdiv.appendChild(svgPolygon);
	
	return O;
}

function collisionFunc() {
	var params = [];
	var r = 200;
	var centerX = 200;
	var centerY = 200;
	for(var i=0;i<60;i++){
		var angle = -i/60*2*Math.PI;
		params[i] = [centerX + r*Math.cos(angle), centerY + r*Math.sin(angle)];
	}
	
	//polyB = makePolygon([centerX,centerY],params);
	
	//polyB = makePolygon([centerX,centerY],[[10,10],[10,400],[400,400],[400,10]]);
	polyB = makePolygon([centerX,centerY],[[10,10],[10,400],[400,400]]);
	//var polyB = makePolygon([centerX,centerY],[[10,10],[10,400],[400,500]]);
	//var polyB = makePolygon([200,300],[[200,200],[100,450],[300,300]]);
	//polyA = makePolygon([200,200],[[140,140],[140,260],[260,260],[260,140]]);

	//polyB = makePolygon([200,200],[[10,400],[300,400],[350,200], [300,10],[10, 10]]);
	//polyA = makePolygon([170,230],[[100,100],[100,300],[300,300]]);
	polyA = makePolygon([150,75],[[100,100],[200,100],[200,50],[100, 50]]);
	
	var polygons = [polyA, polyB];
	
	
	var inFunc = false;
	
	document.onmousemove = function(e){
		if(inFunc) return;
		inFunc = true;
		if(selected){
			var selectedObj = selected.collisionObject;
			selectedObj.x = e.clientX;
			selectedObj.y = e.clientY;
			selectedObj.update();
			
			for(var i = 0; i<polygons.length; i++){

				if(selectedObj !== polygons[i]){
					var answer = PolygonContainment(polygons[i], selectedObj);
					if(answer.intersect){
						selectedObj.x += answer.transformVect[0];
						selectedObj.y += answer.transformVect[1];
						selectedObj.update();
					}
				}

			}
			
			selectedObj.draw();
		}
		inFunc = false;
	};
	
}