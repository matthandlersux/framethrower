template (width::Number, height::Number, video::X.video) {
	videoWidth = X.video:width video,
	videoHeight = X.video:height video,
	duration = X.video:duration video,
	url = X.video:url video,
	
	
	<f:each videoWidth as videoWidth><f:each videoHeight as videoHeight><f:each duration as duration><f:each url as url>
	
		
		// ratio = {
		// 	tmp = function (width, height) {
		// 		return width / height;
		// 	},
		// 	tmp videoWidth videoHeight
		// },
		
		divide = function (x, y) {
			return x / y;
		},
		multiply = function (x, y) {
			return x * y;
		},
		ratio = divide videoWidth videoHeight,
		scaledHeight = height,
		scaledWidth = multiply ratio (divide scaledHeight height),
	
	
		<div style-width="{width}" style-height="{height}">
			{ratio}
			// <div class="timeline" style-width="{subtract width scaledWidth}" style-height="{height}">
			// 	timeline
			// </div>
			// <div class="preview" style-width="{scaledWidth}" style-height="{height}">
			// 	preview
			// </div>
		</div>
	
	
	</f:each></f:each></f:each></f:each>	
}