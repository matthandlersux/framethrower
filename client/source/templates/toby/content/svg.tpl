//template (focus::a, print::a -> XMLP, getChildren::a -> Set a, scale::Number) {
template (focus, print, getChildren, scale) {
	
	polarCartX = function (radius::Number, theta::Number) {
		return Math.cos(theta) * radius;
	},
	polarCartY = function (radius::Number, theta::Number) {
		return Math.sin(theta) * radius;
	},
	
	
	
	children = getChildren focus,
	<f:wrapper>
		<svg:circle cx="0" cy="0" r="{scale}" fill="none" stroke="black" />
		
	</f:wrapper>
	
	
	// 
	// 
	// 
	// 
	// drawCircleC = template (radius::Number, x::Number, y::Number) {
	// 	<svg:circle cx="{x}" cy="{y}" r="{radius}" stroke="black" />
	// },
	// 
	// 
	// 
	// drawCircles = template (circles::Set XMLP) {
	// 	count = length circles,
	// 	radius = {
	// 		get = function (count) {
	// 			if (count === 0) {
	// 				return 1;
	// 			} else if (count === 1) {
	// 				return 1;
	// 			} else {
	// 				var sin = Math.sin(Math.PI / count);
	// 				return sin / (sin + 1);
	// 			}
	// 		},
	// 		get count
	// 	},
	// 	dist = subtract 1 radius,
	// 	<f:each circles as circle>
	// 		<div />
	// 	</f:each>
	// },
	

	
}