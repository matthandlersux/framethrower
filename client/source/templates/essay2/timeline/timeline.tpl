template () {
	
	// ==========
	// Types
	// ==========
	
	TimeRange := (Number, Number),
	trStart = fst,
	trDuration = snd,
	
	TimelineLayer := (String, Number, XMLP),
	tllLabel = tuple3get1,
	tllHeight = tuple3get2,
	tllContent = tuple3get3,


	// ==========
	// Sizing, constants
	// ==========

	screenWidth = fetch (UI.ui:screenWidth ui.ui),
	screenHeight = fetch (UI.ui:screenHeight ui.ui),
	
	timelineWidth = screenWidth,
	movieDuration = 7668.189,
	aspectRatio = 2.222,
	
	// UI Sizing Constants
	timelineHeight = 260,
	scrollbarHeight = 14,
	scrollbarButtonWidth = 20,
	layerLabelsWidth = 130,
	rulerHeight = 20,
	
	// Derived Constants
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
	// Layers State
	// ==========
	
	layers = state {
		layers <- create(Map Ord TimelineLayer),
		layer1 = drawTimelineLayer chapters 100 3,
		layer2 = drawTimelineLayer cuts 50 1,
		layer3 = drawBubbles captions,
		addEntry layers (numToOrd 1) ("Chapters", 106, layer1),
		//addEntry layers (numToOrd 2) ("Shots", 52, layer2),
		addEntry layers (numToOrd 3) ("Captions", 24, layer3),
		return layers
	},
	
	
	
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
				clampedZoom = clampMin newZoom (divide mainTimelineWidth movieDuration),
				getNewScroll = function (oldZoom::Number, newZoom::Number, oldScroll::Number, mouse::Number)::Number {
					return (newZoom/oldZoom)*(oldScroll+mouse) - mouse;
				},
				newScroll = getNewScroll oldZoom clampedZoom oldScroll mouse,
				set zoomFactorS clampedZoom,
				setScrollAmount newScroll
			}
		}
	},
	modifyZoom = function (oldZoom::Number, delta::Number)::Number {
		var factor = 1.15;
		if (delta > 0) {
			return oldZoom * factor;
		} else {
			return oldZoom / factor;
		}
	},
	
	// Scroll
	// units: pixels
	scrollAmountS = state(Unit Number, 0),
	scrollAmount = fetch scrollAmountS,
	setScrollAmount = action (amount::Number) {
		min = 0,
		max = (subtract (multiply movieDuration zoomFactor) mainTimelineWidth),
		set scrollAmountS (clamp amount min max)
	},
	
	// Preview Time
	// units: seconds
	previewTimeS = state(Unit Number, 0),
	previewTime = fetch previewTimeS,
	
	// Mouseovered Time
	// units: seconds
	mouseOveredTimeS = state(Unit (Number, Number)),
	mouseOveredTime = fetch mouseOveredTimeS,
	
	
	
	tmpXMLP = state(Unit XMLP),
	
	
	
	// ==========
	// Derived State
	// ==========
	
	timelineShownStart = divide scrollAmount zoomFactor,
	timelineShownDuration = divide timelineWidth zoomFactor,
	
	
	
	



	
	

	
	
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
	
	
	
	
	

	
	
	
	
	
	<div>
		<div>
			<f:each tmpXMLP as tmp>
				//<div style-position="absolute" style-background-color="#fff" style-border="1px solid #999" style-left="{subtract (fetch (UI.ui:mouseX ui.ui)) 100}" style-top="{subtract (fetch (UI.ui:mouseY ui.ui)) 300}" style-width="300" style-height="120">
					<f:call>tmp</f:call>
				//</div>
			</f:each>
		</div>
	
		// Timeline (in total)
		<div style-width="{timelineWidth}" style-height="{timelineHeight}" style-left="0" style-bottom="0" style-position="absolute" style-background-color="#eee">
			
			// Zoomer
			// TODO
			
			// Layer labels
			<div style-position="absolute" style-top="0" style-left="0" style-width="{layerLabelsWidth}" style-height="100%" style-background-color="#ccc">
				<div style-position="absolute" style-top="0" style-left="0" style-width="{layerLabelsWidth}" style-height="{rulerHeight}">
					<div style-text-align="right" style-padding="4" style-height="100%" style-border-right="1px solid #666" style-background-color="#888">
						Moulin Rouge
					</div>
				</div>
				<div style-position="absolute" style-top="{rulerHeight}" style-left="0" style-width="{layerLabelsWidth}" style-border-top="1px solid #666">
					<f:each layers as index, layer>
						<div style-height="{tllHeight layer}" style-border-bottom="1px solid #666" style-background-color="#aaa" style-overflow="hidden">
							<div style-text-align="right" style-padding="4" style-height="100%" style-border-right="1px solid #666">
								{tllLabel layer}
							</div>
						</div>
					</f:each>
				</div>
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
					
					
					// MouseOvered time
					<div style-position="absolute" style-left="{makePercent (divide (fst mouseOveredTime) movieDuration)}" style-width="{makePercent (divide (snd mouseOveredTime) movieDuration)}" style-height="100%" style-background-color="rgba(255, 153, 0, 0.5)" />
					
					// Preview time orange bar
					<div style-position="absolute" style-left="{makePercent (divide previewTime movieDuration)}" style-width="1" style-height="100%" style-border-left="1px solid #f90" />
					

					<div style-position="absolute" style-top="{rulerHeight}" style-left="0" style-width="100%" style-border-top="1px solid #666">
						<f:each layers as index, layer>
							<div style-position="relative" style-width="100%" style-height="{tuple3get2 layer}" style-border-bottom="1px solid #666">
								<f:call>tllContent layer</f:call>
							</div>
						</f:each>
					</div>

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
						width = divide mainTimelineWidth (multiply movieDuration zoomFactor),

						<div style-position="absolute" style-top="0" style-left="{scrollbarButtonWidth}" style-width="{scrollbarWidth}" style-height="100%">
							<f:on click>
								desiredLeft = subtract (divide (subtract (subtract event.mouseX scrollbarButtonWidth) mainTimelineLeft) scrollbarWidth) (divide width 2),
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