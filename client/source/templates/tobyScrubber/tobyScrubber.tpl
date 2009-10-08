template () {

	// ==========
	// Utility
	// ==========
	
	boolToDisplay = function (x::Bool)::String {
		if (x) return "block";
		else return "none";
	},



	// ==========
	// Sizing, constants
	// ==========

	screenWidth = fetch (UI.ui:screenWidth ui.ui),
	screenHeight = fetch (UI.ui:screenHeight ui.ui),
	
	timelineWidth = screenWidth,
	movieDuration = 7668.189,
	aspectRatio = 2.222,
	
	// UI Sizing Constants
	timelineHeight = 200,
	scrollbarHeight = 14,
	scrollbarButtonWidth = 20,
	layerLabelsWidth = 130,
	rulerHeight = 20,
	
	mainTimelineWidth = subtract timelineWidth layerLabelsWidth,
	mainTimelineLeft = layerLabelsWidth,
	
	
	
	
	// ==========
	// Grabbing timestamps, etc. (will be replaced)
	// ==========
	
	timestampsToPairs = function(timestamps::List Number, endTime::Number)::List ((Number, Number), Null) {
		var pairs = [];
		timestamps = timestamps.asArray;
		forEach(timestamps, function (timestamp, i) {
			var next = (i === timestamps.length - 1) ? endTime : timestamps[i+1];
			var pair = makeTuple2(timestamp, next - timestamp);
			pairs.push(makeTuple2(pair, nullObject));
		});
		
		return arrayToList(pairs);
	},
	
	//chapters = timestampsToPairs chapterTimestamps movieDuration,
	cuts = timestampsToPairs cutTimestamps movieDuration,
	
	
	
	
	// ==========
	// State
	// ==========
	
	// Zoom
	// width = time * zoomFactor
	zoomFactorS = state(Unit Number, 1),
	zoomFactor = fetch zoomFactorS,
	setZoomFactor = action (newZoom::Number, mouse::Number) {
		extract zoomFactorS as oldZoom {
			extract scrollAmountS as oldScroll {
				clampedZoom = clampMin newZoom (divide timelineWidth movieDuration),
				getNewScroll = function (oldZoom::Number, newZoom::Number, oldScroll::Number, mouse::Number)::Number {
					return (newZoom/oldZoom)*(oldScroll+mouse) - mouse;
				},
				newScroll = getNewScroll oldZoom clampedZoom oldScroll mouse,
				set zoomFactorS clampedZoom,
				setScrollAmount newScroll
			}
		}
	},
	
	// Scroll
	// units: pixels
	scrollAmountS = state(Unit Number, 0),
	scrollAmount = fetch scrollAmountS,
	setScrollAmount = action (amount::Number) {
		min = 0,
		max = (subtract (multiply movieDuration zoomFactor) timelineWidth),
		set scrollAmountS (clamp amount min max)
	},
	
	// Preview Time
	// units: seconds
	previewTimeS = state(Unit Number, 0),
	previewTime = fetch previewTimeS,
	
	
	
	
	
	// ==========
	// Derived State
	// ==========
	
	timelineShownStart = divide scrollAmount zoomFactor,
	timelineShownDuration = divide timelineWidth zoomFactor,
	
	
	
	



	
	
	modifyZoom = function (oldZoom::Number, delta::Number)::Number {
		var factor = 1.15;
		if (delta > 0) {
			return oldZoom * factor;
		} else {
			return oldZoom / factor;
		}
	},
	
	
	getFrame = function (time::Number, width::Number, height::Number)::String {
		var s = "";
		if (width > 0) s += "&width="+width;
		if (height > 0) s += "&height="+height;
		return "url(http:/"+"/media.eversplosion.com/mrtesting/frame.php?time=" + time + s + ")";
	},
	formatTime = function (time::Number)::String {
		var seconds = time % 60;
		var minutes = ((time - seconds)/60) % 60;
		var hours = ((time - seconds - minutes*60)/3600);
		
		function pad(n) {
			if (n < 10) return "0" + n;
			else return "" + n;
		}
		
		var s = pad(Math.round(seconds));
		var m = pad(minutes);
		
		return hours + ":" + m + ":" + s;
	},
	
	makePercent = function (fraction::Number)::String {
		return (100*fraction)+"%";
	},
	
	
	
	
	
	layers = state {
		layers <- create(Map Ord (String, Number, XMLP)),
		layer1 = drawTimelineLayer chapters 100 3,
		layer2 = drawTimelineLayer cuts 50 1,
		addEntry layers (numToOrd 1) ("Chapters", 106, layer1),
		addEntry layers (numToOrd 2) ("Shots", 52, layer2),
		return layers
	},
	
	
	
	
	
	<div>
		// <div>
		// 	{previewTime}
		// </div>
	
		// Timeline (in total)
		<div style-width="{timelineWidth}" style-height="{timelineHeight}" style-left="0" style-bottom="0" style-position="absolute" style-background-color="#eee">
			
			// Zoomer
			// TODO
			
			// Layer labels
			<div style-position="absolute" style-top="{rulerHeight}" style-left="0" style-width="{layerLabelsWidth}" style-height="100%" style-border-top="1px solid #666">
				<f:each layers as index, layer>
					<div style-height="{tuple3get2 layer}" style-border-bottom="1px solid #666" style-background-color="#aaa">
						{tuple3get1 layer}
					</div>
				</f:each>
			</div>
			
			// Main part of timeline
			<div style-position="absolute" style-top="0" style-left="{layerLabelsWidth}" style-width="{mainTimelineWidth}" style-height="100%" style-overflow="hidden">
				<f:call>
					dragStart = state(Unit Number),
					scrollAmountStart = state(Unit Number),
					<f:wrapper>
						<f:on mousedown>
							set dragStart event.mouseX,
							set scrollAmountStart scrollAmount
						</f:on>
						<f:each dragStart as from>
							start = fetch scrollAmountStart,
							<f:wrapper>
								<f:on globalmouseup>
									unset dragStart
								</f:on>
								<f:on globalmousemove>
									setScrollAmount (subtract start (subtract event.mouseX from))
								</f:on>
							</f:wrapper>
						</f:each>
						<f:on mousescroll>
							setZoomFactor (modifyZoom zoomFactor event.wheelDelta) (subtract event.mouseX mainTimelineLeft),
							set previewTimeS (divide (plus (subtract event.mouseX mainTimelineLeft) scrollAmount) zoomFactor)
						</f:on>
					</f:wrapper>
				</f:call>
				
				// The part that scrolls
				<div style-position="absolute" style-left="{subtract 0 scrollAmount}" style-top="0" style-width="{multiply movieDuration zoomFactor}" style-height="100%">
					<f:on mousemove>
						set previewTimeS (divide (plus (subtract event.mouseX mainTimelineLeft) scrollAmount) zoomFactor)
					</f:on>

					// Ruler
					<f:call>ruler</f:call>

					<div style-position="absolute" style-top="{rulerHeight}" style-left="0" style-width="100%" style-border-top="1px solid #666">
						<f:each layers as index, layer>
							//layer = getKey index layers,
							//<f:each layer as layer>
								<div style-position="relative" style-width="100%" style-height="{tuple3get2 layer}" style-border-bottom="1px solid #666">
									<f:call>tuple3get3 layer</f:call>
								</div>
							//</f:each>
						</f:each>
					</div>



					// Preview time orange bar
					<div style-position="absolute" style-left="{makePercent (divide previewTime movieDuration)}" style-width="1" style-height="100%" style-border-left="1px solid #f90" />


					// <div style-position="absolute" style-top="120" style-left="0" style-width="100%">
					// 	<f:each captions as caption>
					// 		start = fst (fst caption),
					// 		duration = snd (fst caption),
					// 		<div style-left="{makePercent (divide start movieDuration)}" style-width="{makePercent (divide duration movieDuration)}" style-position="absolute" style-height="10" style-overflow="hidden" style-background-color="#009" class="rounded">
					// 			
					// 		</div>
					// 	</f:each>
					// </div>

				</div>

				// Scrollbar
				<div style-position="absolute" style-bottom="0" style-width="100%" style-height="{scrollbarHeight}" style-background-color="#ccc">
					<div style-position="absolute" style-top="0" style-left="0" style-width="{scrollbarButtonWidth}" style-height="100%" style-background-color="#555">
						L
					</div>
					<div style-position="absolute" style-top="0" style-right="0" style-width="{scrollbarButtonWidth}" style-height="100%" style-background-color="#555">
						R
					</div>
					<f:call>
						scrollbarWidth = subtract mainTimelineWidth (multiply 2 scrollbarButtonWidth),

						// units: fraction
						left = divide scrollAmount (multiply movieDuration zoomFactor),
						width = divide timelineWidth (multiply movieDuration zoomFactor),

						<div style-position="absolute" style-top="0" style-left="{scrollbarButtonWidth}" style-width="{scrollbarWidth}" style-height="100%">
							<f:on click>
								desiredLeft = subtract (divide (subtract event.mouseX scrollbarButtonWidth) scrollbarWidth) (divide width 2),
								setScrollAmount (multiply (multiply movieDuration zoomFactor) desiredLeft)
							</f:on>


							<div style-position="absolute" style-left="{makePercent left}" style-width="{makePercent width}" style-height="100%" style-background-color="#999">
								<f:call>
									dragStart = state(Unit Number),
									leftStart = state(Unit Number),
									<f:wrapper>
										<f:on mousedown>
											set dragStart event.mouseX,
											set leftStart left
										</f:on>
										<f:each dragStart as from>
											start = fetch leftStart,
											<f:wrapper>
												<f:on globalmouseup>
													unset dragStart
												</f:on>
												<f:on globalmousemove>
													desiredLeft = plus start (divide (subtract event.mouseX from) scrollbarWidth),
													setScrollAmount (multiply (multiply movieDuration zoomFactor) desiredLeft)
												</f:on>
											</f:wrapper>
										</f:each>
									</f:wrapper>
								</f:call>
								// <f:call>
								// 	setScroll = action (start::Number, x::Number, y::Number) {
								// 		desiredLeft = plus start (divide x scrollbarWidth),
								// 		setScrollAmount (multiply (multiply movieDuration zoomFactor) desiredLeft)
								// 	},
								// 	dragger (unfetch left) setScroll
								// </f:call>
							</div>
						</div>
					</f:call>
				</div>


			</div>
			
			
		</div>
		

		
		// Preview Movie
		// <div style-position="absolute" style-bottom="200" style-right="0" style-width="320" style-height="144" style-border="1px solid #f90">
		// 	<f:call>
		// 		videoURL = function ()::String {
		// 			return "http:/"+"/media.eversplosion.com/tmp/mr-scrub.mp4";
		// 		},
		// 		
		// 		loadedDurationS = state(Unit Number),
		// 		quicktime 320 144 videoURL previewTimeS loadedDurationS
		// 		//quicktime (screenWidth) (subtract screenHeight 200) videoURL previewTimeS loadedDurationS
		// 	</f:call>
		// </div>
		
	</div>
	
}