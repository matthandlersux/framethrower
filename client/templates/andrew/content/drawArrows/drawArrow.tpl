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
	
	getQ1 = function(tox, fromx) {
		return (tox - fromx) * 3/8 + fromx;
	},
	getQ2 = function(toy, fromy) {
		return (toy - fromy)/8 + fromy;
	},
	getQ34 = function(to, from) {
		return to/2 + from/2;
	},
	addHalf = function(base, width) {
		return base + width/2;
	},
	
	makeDString = function(fromx, fromy, tox, toy, Q1, Q2, Q3, Q4) {
		return "M" + fromx + "," + fromy + " Q" + Q1 + "," + Q2 + " " + Q3 + "," + Q4 + " T" + tox + "," + toy;
	},
	
	<f:wrapper>
		<f:each left1 as left1><f:each top1 as top1><f:each width1 as width1><f:each height1 as height1>
		<f:each left2 as left2><f:each top2 as top2><f:each width2 as width2><f:each height2 as height2>
			fromx = addHalf left1 width1,
			fromy = addHalf top1 height1,
			tox = addHalf left2 width2,
			toy = addHalf top2 height2,
	
			Q1 = getQ1 tox fromx,
			Q2 = getQ2 toy fromy,
			Q3 = getQ34 tox fromx,
			Q4 = getQ34 toy fromy,
			dstring = makeDString fromx fromy tox toy Q1 Q2 Q3 Q4,
			<f:on init>
				add(dstringGlobal, dstring)
			</f:on>
		</f:each></f:each></f:each></f:each>
		</f:each></f:each></f:each></f:each>
		<svg:path d="{dstringGlobal}" class="link" shape-rendering="optimizeSpeed"/>
	</f:wrapper>
}