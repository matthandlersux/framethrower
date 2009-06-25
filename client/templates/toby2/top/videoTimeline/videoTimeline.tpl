template (width::Number, height::Number, video::X.video, timeSelection::TimeSelection) {
	videoWidth = X.video:width video,
	videoHeight = X.video:height video,
	duration = X.video:duration video,
	url = X.video:url video,
	
	
	timeLoaded = state(Unit Number),
	
	previewTime = state(Unit Number),
	
	
	selStart = state(Unit Number),
	selDuration = state(Unit Number),
	selecting = state(Unit Null),
	
	
	zoomWidth = state(Unit Number),
	sel1 = state(Unit Number),
	sel2 = state(Unit Number),
	
	<f:each videoWidth as videoWidth><f:each videoHeight as videoHeight><f:each duration as duration><f:each url as url>
	
		drawTimeline = template (width, height) {
			<div class="timeline-container" style-width="{width}" style-height="{height}" style-color="white">
				<f:on mouseout>
					extract selStart as selStart {
						extract selDuration as selDuration {
							add(previewTime, selStart),
							add(TimeSelection:start timeSelection, selStart),
							add(TimeSelection:duration timeSelection, selDuration)
						}
					}
				</f:on>
				<f:each zoomWidth as zoomWidth>
					timeMultiplier = divide duration zoomWidth,
					<div class="ruler-container" style-width="{zoomWidth}">
						<f:on mousemove>
							add(previewTime, multiply timeMultiplier event.offsetX)
						</f:on>
						<f:on click>
							remove(sel1),
							remove(sel2),
							add(selStart, multiply timeMultiplier event.offsetX),
							add(selDuration, 0)
						</f:on>
						
						<f:on mousedown>
							add(selecting, null),
							add(sel1, event.offsetX),
							add(sel2, event.offsetX)
						</f:on>
						<f:on globalmouseup>
							remove(selecting)
						</f:on>
						<f:each selecting>
							<f:on mousemove>
								add(sel2, event.offsetX)
							</f:on>
						</f:each>
						
						<f:trigger mapUnit2 min sel1 sel2 as s>
							add(selStart, multiply timeMultiplier s)
						</f:trigger>
						<f:trigger mapUnit abs (mapUnit2 subtract sel1 sel2) as s>
							add(selDuration, multiply timeMultiplier s)
						</f:trigger>
						

						
						<div class="timeline-loading" style-width="{mapUnit (swap divide timeMultiplier) timeLoaded}" />

						
						<f:each X.video:cuts video as cuts>
							<f:call>drawCuts cuts (divide 0.0417083322 timeMultiplier)</f:call>
						</f:each>
						
						
						<div class="ruler-cursor" style-left="{defaultValue -10 (mapUnit (swap divide timeMultiplier) previewTime)}" />
						
						//<div class="ruler-selected" style-left="{defaultValue -10 (mapUnit (swap divide timeMultiplier) currentTime)}" />
						
						<div class="ruler-selected-range" style-left="{defaultValue -10 (mapUnit (swap divide timeMultiplier) selStart)}" style-width="{defaultValue 0 (mapUnit (swap divide timeMultiplier) selDuration)}" />

					</div>
				</f:each>

			</div>
		},
		
		
		drawPreview = template (width, height) {
			<div class="timeline-preview" style-width="{width}" style-height="{height}">
				<f:call>quicktime width height url previewTime timeLoaded</f:call>
			</div>
		},
		
		
		
		ratio = divide videoWidth videoHeight,
		scaledHeight = height,
		scaledWidth = multiply ratio scaledHeight,
		
		timelineWidth = subtract width scaledWidth,
		timelineControlsWidth = 20,
	
		<div style-width="{width}" style-height="{height}">
			<f:on init>
				add(zoomWidth, 3000)
			</f:on>
			<div class="timeline-left" style-width="{timelineWidth}" style-height="{height}">
				<div class="timeline-controls" style-width="{timelineControlsWidth}" style-height="{height}">
					<f:each zoomWidth as zoomWidthValue>
						<f:wrapper>
							<div class="button-zoomIn">
								<f:on click>add(zoomWidth, multiply zoomWidthValue 1.5)</f:on>
							</div>
							<div class="button-zoomOut">
								<f:on click>add(zoomWidth, divide zoomWidthValue 1.5)</f:on>
							</div>
						</f:wrapper>
					</f:each>
				</div>
				<div style-position="absolute" style-left="{timelineControlsWidth}">
					<f:call>drawTimeline (subtract timelineWidth timelineControlsWidth) height</f:call>
				</div>
			</div>
			
			<div style-position="absolute" style-left="{timelineWidth}">
				<f:call>drawPreview scaledWidth scaledHeight</f:call>
			</div>
		</div>
	</f:each></f:each></f:each></f:each>	
}