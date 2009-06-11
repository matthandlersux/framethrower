template(shape1::SV.shape, shape2::SV.shape) {
	dstringGlobal = state(Unit String),
	
	left1 = SV.shape:left shape1,
	top1 = SV.shape:top shape1,
	width1 = SV.shape:width shape1,
	height1 = SV.shape:height shape1,
	
	left2 = SV.shape:left shape2,
	top2 = SV.shape:top shape2,
	width2 = SV.shape:width shape2,
	height2 = SV.shape:height shape2,
	
	buildPath = function (left1, top1, width1, height1, left2, top2, width2, height2)::Unit String {
		function addHalf(base, width) {
			return base + width/2;
		}
		
		var f = mapUnitJS(function (left1, top1, width1, height1, left2, top2, width2, height2) {
			var fromx = addHalf(left1, width1);
			var fromy = addHalf(top1, height1);
			var tox = addHalf(left2, width2);
			var toy = addHalf(top2, height2);
			
			var Q1 = (tox - fromx) * 3/8 + fromx;
			var Q2 = (toy - fromy)/8 + fromy;
			var Q3 = tox/2 + fromx/2;
			var Q4 = toy/2 + fromy/2;
			
			var ret = "M" + fromx + "," + fromy + " Q" + Q1 + "," + Q2 + " " + Q3 + "," + Q4 + " T" + tox + "," + toy;
			
			//console.log("should work here..", ret);
			
			return ret;
		}, parseType("String"));
		var ret = f(left1, top1, width1, height1, left2, top2, width2, height2);
		
		//console.log("here's what i built", ret, getType(ret), isReactive(getType(ret)));
		
		return ret;
	},
	
	<svg:path d="{buildPath left1 top1 width1 height1 left2 top2 width2 height2}" class="link" shape-rendering="optimizeSpeed" />
}