template (width::Number, height::Number, video::X.video) {
	videoWidth = X.video:width video,
	videoHeight = X.video:height video,
	duration = X.video:duration video,
	url = X.video:url video,
	
	
	previewTime = state(Unit Number),
	zoomWidth = state(Unit Number),
	
	
	<f:each videoWidth as videoWidth><f:each videoHeight as videoHeight><f:each duration as duration><f:each url as url>
	
		divide = function (x, y) {
			return x / y;
		},
		multiply = function (x, y) {
			return x * y;
		},
		ratio = divide videoWidth videoHeight,
		scaledHeight = height,
		scaledWidth = multiply ratio scaledHeight,
		
		timelineLeft = subtract width scaledWidth,
	
	
		<div style-width="{width}" style-height="{height}">
			<div class="timeline-left" style-width="{timelineLeft}" style-height="{height}">
				<div class="timeline-container" style-width="{timelineLeft}" style-height="{height}">
				
				</div>
			</div>
			<div class="timeline-preview" style-width="{scaledWidth}" style-height="{height}" style-left="{timelineLeft}">
				preview
			</div>
		</div>
	
	
	</f:each></f:each></f:each></f:each>	
}