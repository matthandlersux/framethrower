function calcDotProduct(v1, v2){
	if (v1.length == v2.length) {
		var total = 0;
		for(var i=0; i<v1.length; i++){
			total += v1[i]*v2[i];
		}
		return total;
	} else {
		return "error";
	}
}

// Calculate the projection of a polygon on an axis
// and returns it as a [min, max] interval
function ProjectPolygon(axis, polygon){
	var dotProduct = calcDotProduct(axis, polygon.points[0]);
	var min = dotProduct;
	var max = dotProduct;
	for(var i=0; i<polygon.points.length; i++){
		dotProduct = calcDotProduct(polygon.points[i], axis);
		if(dotProduct < min){
			min = dotProduct;
		} else if (dotProduct > max) {
			max = dotProduct;
		}
	}
	return {min:min, max:max};
}

// Calculate the distance between [minA, maxA] and [minB, maxB]
// The distance will be negative if the intervals overlap
function IntervalDistance(minA, maxA, minB, maxB) {
	if (minA < minB) {
        return minB - maxA;
    } else {
        return minA - maxB;
    }
}

function normalize(vector) {
	var mag = Math.sqrt(Math.pow(vector[0],2) + Math.pow(vector[1],2));
	vector[0] = vector[0]/mag;
	vector[1] = vector[1]/mag;
}

// Check if polygon A is going to colliding with polygon B.

function PolygonCollision (polygonA, polygonB) {
    var result = {};
    result.Intersect = true;

    var pointCountA = polygonA.points.length;
    var pointCountB = polygonB.points.length;
    var minIntervalDistance = 65555;
    var translationAxis = {};
    var edge = {};

    // Loop through all the edges of both polygons


	function checkEdge(edge){

        // ===== 1. Find if the polygons are currently intersecting =====


        // Find the axis perpendicular to the current edge
        var axis = [-edge[1], edge[0]];
        normalize(axis);

        // Find the projection of the polygon on the current axis

        var polyProjA = ProjectPolygon(axis, polygonA);
        var polyProjB = ProjectPolygon(axis, polygonB);

        // Check if the polygon projections are currentlty intersecting

		var intervalDistance = IntervalDistance(polyProjA.min, polyProjA.max, polyProjB.min, polyProjB.max);
		
        // If the polygons are not intersecting, exit the loop
        if (intervalDistance > 0) {
            return false;
		}


        // Check if the current interval distance is the minimum one. If so store
        // the interval distance and the current distance.
        // This will be used to calculate the minimum translation vector

        intervalDistance = Math.abs(intervalDistance);
        if (intervalDistance < minIntervalDistance) {
            minIntervalDistance = intervalDistance;
            translationAxis = axis;

			var d = [polygonA.x - polygonB.x, polygonA.y - polygonB.y];

            if (calcDotProduct(d, translationAxis) < 0){
                translationAxis[0] = -translationAxis[0];
				translationAxis[1] = -translationAxis[1];
			}
        }
		return true;
	}

	function checkAllEdges(){
		var edge;
	    for (var pointIndex = 0; pointIndex < pointCountA-1; pointIndex++) {
			edge = [polygonA.points[pointIndex+1][0] - polygonA.points[pointIndex][0], polygonA.points[pointIndex+1][1] - polygonA.points[pointIndex][1]];
			if(!checkEdge(edge)) return false;
	    }
		edge = [polygonA.points[0][0] - polygonA.points[pointCountA-1][0], polygonA.points[0][1] - polygonA.points[pointCountA-1][1]];
		if(!checkEdge(edge)) return false;

	    for (var pointIndex = 0; pointIndex < pointCountB-1; pointIndex++) {
			edge = [polygonB.points[pointIndex+1][0] - polygonB.points[pointIndex][0], polygonB.points[pointIndex+1][1] - polygonB.points[pointIndex][1]];
			if(!checkEdge(edge)) return false;
	    }
		edge = [polygonB.points[0][0] - polygonB.points[pointCountB-1][0], polygonB.points[0][1] - polygonB.points[pointCountB-1][1]];
		if(!checkEdge(edge)) return false;
		return true;
	}

	result.Intersect = checkAllEdges();
	
	
    // The minimum translation vector

    // can be used to push the polygons appart.

    if (result.Intersect)
        result.MinimumTranslationVector = 
               [translationAxis[0] * minIntervalDistance, translationAxis[1] * minIntervalDistance];
    
    return result;
}

var selected = null;

document.onmouseup = function(e){
	selected = null;
};

document.onmousemove = function(e){
	if(selected){
		selected.center[0] = e.clientX;
		selected.center[1] = e.clientY;
		selected.update();
	}
};

function makePolygon(centerpoint, points) {
	var O = {};
	var svgPolygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
	svgPolygon.collisionObject = O;
	
	var myPoints = points;
	var pointString = "";

	
	var origX = centerpoint[0];
	var origY = centerpoint[1];
	
	var origPoints = [];
	
	origPoints = points;
	
	svgPolygon.center = centerpoint;
	
	svgPolygon.setAttribute("points", pointString);
	
	svgPolygon.onmousedown = function(e){
		selected = e.target;
	};
	
	svgPolygon.update = function(){
		var xdif = svgPolygon.center[0] - origX;
		var ydif = svgPolygon.center[1] - origY;
		pointString = "";
		O.points = [];
		O.x = svgPolygon.center[0];
		O.y = svgPolygon.center[1];
		for(var i=0; i<origPoints.length;i++){
			if(i != 0){
				pointString += ",";
			}
			pointString += (origPoints[i][0] + xdif) + "," + (origPoints[i][1] + ydif);
			O.points[i] = [];
			O.points[i][0] = origPoints[i][0] + xdif;
			O.points[i][1] = origPoints[i][1] + ydif;
		}
		svgPolygon.setAttribute("points", pointString);
	};

	svgPolygon.update();
	
	var svgdiv = document.getElementById("svgelements");
	svgdiv.appendChild(svgPolygon);
	
	return O;
}
/*
<g>
<polygon id="local.3" class="startCap" points="671.052,582.122 738.718,475.412 806.385,582.122"/>
<text x="738.718" y="543.079">startCap</text>
</g>
*/

function collisionFunc() {
	console.log("hey!");
	var polyA = makePolygon([200,100],[[50,50],[200,150],[300,50]]);
	//var polyB = makePolygon([200,300],[[200,200],[100,450],[300,300]]);
	
	var params = [];
	var r = 200;
	var centerX = 200;
	var centerY = 200;
	for(var i=0;i<30;i++){
		var angle = i/30*2*Math.PI;
		params[i] = [centerX + r*Math.cos(angle), centerY + r*Math.sin(angle)];
	}
	
	var polyB = makePolygon([centerX,centerY],params);
	
	var polygons = [polyA, polyB];
	
	var answer = PolygonCollision(polyA, polyB);
	
	var currentFunc = document.onmousemove;
	var collisions = 0;
	
	document.onmousemove = function(e){
		currentFunc(e);
		if(selected){
			var selectedObj = selected.collisionObject;
			for(var i = 0; i<polygons.length; i++){
				if(selectedObj !== polygons[i]){
					answer = PolygonCollision(selectedObj, polygons[i]);
					if(answer.Intersect){
						selected.center[0] += answer.MinimumTranslationVector[0];
						selected.center[1] += answer.MinimumTranslationVector[1];
						selected.update();
					}
				}
			}
		}
	};
	
}