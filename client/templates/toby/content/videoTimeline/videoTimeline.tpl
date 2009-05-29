template (width::Number, height::Number, video::X.video) {
	videoWidth = X.video:width video,
	videoHeight = X.video:height video,
	duration = X.video:duration video,
	url = X.video:url video,
	
	
	previewTime = state(Unit Number),
	currentTime = state(Unit Number),
	
	selectionStart = state(Unit Number),
	selectionEnd = state(Unit Number),
	selecting = state(Unit Null),
	
	mapUnit2 = f -> x -> bindUnit (reactiveApply (mapUnit f x)),
	selectionMin = mapUnit2 min selectionStart selectionEnd,
	selectionDur = mapUnit2 (x -> y -> abs (subtract x y)) selectionStart selectionEnd,
	
	
	zoomWidth = state(Unit Number),
	
	<f:each videoWidth as videoWidth><f:each videoHeight as videoHeight><f:each duration as duration><f:each url as url>
		ratio = divide videoWidth videoHeight,
		scaledHeight = height,
		scaledWidth = multiply ratio scaledHeight,
		
		timelineLeft = subtract width scaledWidth,
		
		drawTimeline = template (width, height) {
			<div class="timeline-container" style-width="{width}" style-height="{height}" style-color="white">
				<f:each zoomWidth as zoomWidth>
					timeMultiplier = divide duration zoomWidth,
					<div class="ruler-container" style-width="{zoomWidth}">
						<f:on mousemove>
							add(previewTime, multiply timeMultiplier event.offsetX)
						</f:on>
						<f:on click>
							add(currentTime, multiply timeMultiplier event.offsetX),
							remove(selectionStart),
							remove(selectionEnd)
						</f:on>
						
						<f:on mousedown>
							start = multiply timeMultiplier event.offsetX,
							add(selectionStart, start),
							add(selectionEnd, start),
							add(selecting, null),
							remove(currentTime)
						</f:on>
						<f:on mouseup>
							remove(selecting)
						</f:on>
						<f:each selecting>
							<f:on mousemove>
								add(selectionEnd, multiply timeMultiplier event.offsetX)
							</f:on>
						</f:each>
						
						// <f:each currentTime as currentTime>
						// 	<f:on mouseout>
						// 		add(previewTime, currentTime)
						// 	</f:on>
						// </f:each>
						
						
						<f:each X.video:cuts video as cuts>
							<f:call>drawCuts cuts (divide 0.0417083322 timeMultiplier)</f:call>
						</f:each>
						
						
						
						// TODO: decide if this method with defaultValue is faster or slower than f:each and the div gets recomputed
						
						<div class="ruler-cursor" style-left="{defaultValue -10 (mapUnit (swap divide timeMultiplier) previewTime)}" />
						
						<div class="ruler-selected" style-left="{defaultValue -10 (mapUnit (swap divide timeMultiplier) currentTime)}" />
						
						<div class="ruler-selected-range" style-left="{defaultValue -10 (mapUnit (swap divide timeMultiplier) selectionMin)}" style-width="{defaultValue 0 (mapUnit (swap divide timeMultiplier) selectionDur)}" />

						// <f:each selectionStart as selectionStart><f:each selectionEnd as selectionEnd>
						// 	t1 = min selectionStart selectionEnd,
						// 	t2 = max selectionStart selectionEnd,
						// 	<div class="ruler-selected-range" style-left="{divide t1 timeMultiplier}" style-width="{divide (subtract t2 t1) timeMultiplier}" />
						// </f:each></f:each>
						

						
					</div>
				</f:each>

			</div>
		},
		drawPreview = template (width, height) {
			<div class="timeline-preview" style-width="{width}" style-height="{height}">
				<f:call>quicktime width height url previewTime</f:call>
			</div>
		},
	
		<f:wrapper>
			<f:on init>
				add(zoomWidth, 3000)
			</f:on>
			
			<div style-width="{width}" style-height="{height}">
				<div class="timeline-left" style-width="{timelineLeft}" style-height="{height}">
					<f:call>drawTimeline timelineLeft height</f:call>
				</div>
				
				<div style-position="absolute" style-left="{timelineLeft}">
					<f:call>drawPreview scaledWidth scaledHeight</f:call>
				</div>
			</div>
		</f:wrapper>
	</f:each></f:each></f:each></f:each>	
}