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
	var retVal = [];
	retVal[0] = vector[0]/mag;
	retVal[1] = vector[1]/mag;
	return retVal;
}

// Check if polygon A is going to colliding with polygon B.
// Polygon B is assumed to be just a single edge. "Inside" the edge is the downward normal (if the first point is considered left and second point considered right)
function PolygonCollision (polygonA, polygonB) {
	var MinimumTranslationVector;
	var minIntervalDistance;

	function checkEdge(edge){
        // ===== 1. Find if the polygons are currently intersecting =====
        // Find the axis perpendicular to the current edge
        var axis = normalize([-edge[1], edge[0]]);

        // Find the projection of the polygon on the current axis
        var polyProjA = ProjectPolygon(axis, polygonA);
        var polyProjB = ProjectPolygon(axis, polygonB);

        // Check if polygonA is "outside" the polygonB edge
		var intervalDistance = polyProjB.min - polyProjA.max;

        // If the polygons are not intersecting, exit the loop
        if (intervalDistance > -0.001) {
            return false;
		}

        // calculate the minimum translation vector
        intervalDistance = Math.abs(intervalDistance);
		minIntervalDistance = intervalDistance;
        MinimumTranslationVector = [-axis[0] * intervalDistance, -axis[1] * intervalDistance];

		return true;
	}

	//check the edge specified by polygonB for collision with polygonA
	var edge = [polygonB.points[1][0] - polygonB.points[0][0], polygonB.points[1][1] - polygonB.points[0][1]];

	if (checkEdge(edge)){
		return {Intersect:true, MinimumTranslationVector:MinimumTranslationVector, minIntervalDistance:minIntervalDistance};
	} else {
		return {Intersect:false};
	}
}

updatePoints = function(polygon, centerChange){
	var xdif = centerChange[0];
	var ydif = centerChange[1];

	polygon.x = xdif;
	polygon.y = ydif;
	for(var i=0; i<polygon.points.length;i++){
		polygon.points[i][0] += xdif;
		polygon.points[i][1] += ydif;
	}
};

function PolygonContainment(polygonAin, polygonBin){
	var polygonA = clone(polygonAin);
	var polygonB = clone(polygonBin);
	
	//var polygonB = polygonBin;
	var finalVect = [0,0];
	
	function collideEdge(index1, index2, minIntervalDistance, prevVect){
		var edgePoly = {};
		edgePoly.points = [polygonA.points[index1],polygonA.points[index2]];
		var result = PolygonCollision(polygonB, edgePoly);
		if(result.Intersect){
			//do dotProduct with prevVect
			var dotProduct;
			if(prevVect) {
				dotProduct = calcDotProduct(result.MinimumTranslationVector, prevVect);
			} else {
				dotProduct = result.minIntervalDistance;
			}
			if (dotProduct > minIntervalDistance) {
				minIntervalDistance = dotProduct;
				var transformVector = result.MinimumTranslationVector;
				return {Intersect:true, transformVector:transformVector, minIntervalDistance:minIntervalDistance};
			}
		}
		return {Intersect:false};
	}

	function collideAndMoveRecursive(prevVect, depth){
		if(!depth) depth = 0;
		if(depth > 4) return; //prevent runaway recursion
		
		var finalResult = {Intersect:false, minIntervalDistance:-65555};

		var transformVector;

		for(var i=0; i<polygonA.points.length-1;i++){
			var CE = collideEdge(i, i+1, finalResult.minIntervalDistance, prevVect);
			if(CE.Intersect) finalResult = CE;
		}
		var CE = collideEdge(polygonA.points.length-1,0, finalResult.minIntervalDistance, prevVect);
		if(CE.Intersect) finalResult = CE;
		
		if(!finalResult.Intersect){
			return false;
		} else {
			var firstVect;
			if(prevVect){
				var x1 = prevVect[0];
				var y1 = prevVect[1];
				var normV1 = normalize(prevVect);
				var pnx1 = normV1[1];
				var pny1 = -normV1[0];

				var x2 = finalResult.transformVector[0];
				var y2 = finalResult.transformVector[1];
				var normV2 = normalize(finalResult.transformVector);
				var nx2 = normV2[0];
				var ny2 = normV2[1];

				var dotProduct1 = calcDotProduct([pnx1,pny1],[nx2,ny2]);
				var c = Math.sqrt(x2*x2 + y2*y2)/dotProduct1;
				firstVect = [pnx1*c,pny1*c];
			} else {
				firstVect = finalResult.transformVector;
			}
			
			finalVect[0] += firstVect[0];
			finalVect[1] += firstVect[1];
			
			updatePoints(polygonB, firstVect);
			//polygonB.draw();
			//setTimeout(function(){collideAndMoveRecursive(finalResult.transformVector);}, 4000);
			collideAndMoveRecursive(finalResult.transformVector, depth+1);
			return true;
		}		
	}
	
	var intersect = collideAndMoveRecursive();
	return {intersect:intersect , transformVect:finalVect};
}

