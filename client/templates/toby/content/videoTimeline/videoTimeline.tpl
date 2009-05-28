template (width::Number, height::Number, video::X.video) {
	videoWidth = X.video:width video,
	videoHeight = X.video:height video,
	duration = X.video:duration video,
	url = X.video:url video,
	
	
	previewTime = state(Unit Number),
	currentTime = state(Unit Number),
	
	
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
	
		<f:wrapper>
			<f:on init>
				add(zoomWidth, 3000)
			</f:on>
			
			<div style-width="{width}" style-height="{height}">

				<div class="timeline-left" style-width="{timelineLeft}" style-height="{height}">
					<div class="timeline-container" style-width="{timelineLeft}" style-height="{height}">
						<f:each zoomWidth as zoomWidth>
							timeMultiplier = divide duration zoomWidth,
							<div class="ruler-container" style-width="{zoomWidth}">
								<f:on mousemove>
									add(previewTime, multiply timeMultiplier event.offsetX)
								</f:on>
								<f:on click>
									add(currentTime, multiply timeMultiplier event.offsetX)
								</f:on>
								
								<f:each currentTime as currentTime>
									<f:wrapper>

										<div class="ruler-cursor" style-left="{divide currentTime timeMultiplier}"></div>
									</f:wrapper>
								</f:each>
								<f:each previewTime as previewTime>
									<div class="ruler-cursor" style-left="{divide previewTime timeMultiplier}"></div>
								</f:each>
								
								<f:each currentTime as currentTime><f:on mouseout>
									add(previewTime, currentTime)
								</f:on></f:each>
								
								
							</div>
						</f:each>

					</div>

				</div>
				<div class="timeline-preview" style-width="{scaledWidth}" style-height="{height}" style-left="{timelineLeft}">
					//preview {previewTime}
					<f:call>quicktime scaledWidth scaledHeight url previewTime</f:call>
				</div>
			</div>
		</f:wrapper>
		
		

	
	
	</f:each></f:each></f:each></f:each>	
}