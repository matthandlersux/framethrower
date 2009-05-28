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
	
		<f:wrapper>
			<f:on init>
				add(zoomWidth, 3000)
			</f:on>
			
			<div style-width="{width}" style-height="{height}">

				<div class="timeline-left" style-width="{timelineLeft}" style-height="{height}">
					<div class="timeline-container" style-width="{timelineLeft}" style-height="{height}" style-color="white">
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
									add(selectionStart, multiply timeMultiplier event.offsetX),
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
								
								
								<f:each previewTime as previewTime>
									<div class="ruler-cursor" style-left="{divide previewTime timeMultiplier}" />
								</f:each>
								
								<f:each currentTime as currentTime>
									<f:wrapper>
										<f:on mouseout>
											add(previewTime, currentTime)
										</f:on>
										<div class="ruler-selected" style-left="{divide currentTime timeMultiplier}" />
									</f:wrapper>
									
								</f:each>

								// <f:each selectionStart as selectionStart><f:each selectionEnd as selectionEnd>
								// 	t1 = min selectionStart selectionEnd,
								// 	t2 = max selectionStart selectionEnd,
								// 	<div class="ruler-selected-range" style-left="{divide t1 timeMultiplier}" style-width="{divide (subtract t2 t1) timeMultiplier}" />
								// </f:each></f:each>
								
								<div class="ruler-selected-range"
									style-left="{defaultValue 10 (mapUnit (swap divide timeMultiplier) selectionMin)}"
									style-width="{defaultValue 10 (mapUnit (swap divide timeMultiplier) selectionDur)}" />
								
							</div>
						</f:each>

					</div>

				</div>
				<div class="timeline-preview" style-width="{scaledWidth}" style-height="{height}" style-left="{timelineLeft}">
					<f:call>quicktime scaledWidth scaledHeight url previewTime</f:call>
				</div>
			</div>
		</f:wrapper>
	</f:each></f:each></f:each></f:each>	
}