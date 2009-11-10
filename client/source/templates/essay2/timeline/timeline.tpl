template () {
	
	// ==========
	// Types
	// ==========
	
	TimeRange := (Number, Number),
	trStart = fst,
	trDuration = snd,
	
	//TimelineItem := (TimeRange, XMLP),
	TimelineItem := (TimeRange, a),
	tiRange = fst,
	tiContent = snd,
	
	// TimelineLayer := (String, Number, XMLP),
	// tllLabel = tuple3get1,
	// tllHeight = tuple3get2,
	// tllContent = tuple3get3,
	
	TimelineLayer := (String, Number, List TimelineItem, List TimelineItem -> XMLP),
	tllLabel = tuple4get1,
	tllHeight = tuple4get2,
	tllItems = tuple4get3,
	tllDisplay = tuple4get4,
	
	
	// ==========
	// Functions dealing with timeline
	// ==========
	
	//snapTimeline = function (snapLeft::Number, snapRight::Number, )


	// ==========
	// Sizing, constants
	// ==========
	
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
		
		addEntry layers (numToOrd 1) ("Chapters", 106, chapters, (drawTimelineLayer 100 3)),
		addEntry layers (numToOrd 3) ("Subtitles", 24, captions, drawBubbles),
		
		
		
		
		// layer1 = drawTimelineLayer chapters 100 3,
		// layer2 = drawTimelineLayer cuts 50 1,
		// layer3 = drawBubbles captions,
		// addEntry layers (numToOrd 1) ("Chapters", 106, layer1),
		// //addEntry layers (numToOrd 2) ("Shots", 52, layer2),
		// addEntry layers (numToOrd 3) ("Captions", 24, layer3),
		
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
	
	
	selectedTimeStartS = state(Unit Number),
	selectedTimeDurationS = state(Unit Number),
	selectedTimeStart = fetch selectedTimeStartS,
	selectedTimeDuration = fetch selectedTimeDurationS,
	
	setSelectedTimeRight = action (time::Number) {
		min = selectedTimeStart,
		max = movieDuration,
		newDuration = subtract (clamp time min max) selectedTimeStart,
		set selectedTimeDurationS newDuration
	},
	setSelectedTimeLeft = action (time::Number) {
		min = 0,
		max = plus selectedTimeStart selectedTimeDuration,
		newStart <~ clamp time min max,
		newDuration <~ subtract (plus selectedTimeStart selectedTimeDuration) newStart,
		set selectedTimeStartS newStart,
		set selectedTimeDurationS newDuration
	},
	
	
	
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
	
	
	
	filterTimelineItems = function (start::Number, duration::Number, items::List TimelineItem)::List TimelineItem {
		var ret = [];
		forEach(items.asArray, function (item) {
			var itemStart = item.asArray[0].asArray[0];
			var itemDuration = item.asArray[0].asArray[1];
			
			if (itemStart < start+duration && itemStart+itemDuration > start) {
				ret.push(item);
			}
		});
		return arrayToList(ret);
	},
	

	
	
	
	
	
	<div>
		
		<div>
			<f:each layers as index, layer>
				<div>
					<b>{tllLabel layer}</b>
					<div>
						<f:each filterTimelineItems selectedTimeStart selectedTimeDuration (tllItems layer) as item>
							<div>
								{tiContent item}
							</div>
						</f:each>
					</div>
				</div>
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
				// pan by dragging the timeline
				<f:call>
					setScroll = action (start::Number, offsetX::Number) {
						setScrollAmount (subtract start offsetX)
					},
					dragger (unfetch scrollAmount) setScroll
				</f:call>
				
				// zoom with mouse wheel
				<f:on mousescroll>
					setZoomFactor (modifyZoom zoomFactor event.wheelDelta) (subtract event.mouseX mainTimelineLeft),
					set previewTimeS (divide (plus (subtract event.mouseX mainTimelineLeft) scrollAmount) zoomFactor)
				</f:on>

				
				// The part that scrolls
				<div style-position="absolute" style-left="{subtract 0 scrollAmount}" style-top="0" style-width="{multiply movieDuration zoomFactor}" style-height="100%">
					<f:on mousemove>
						set previewTimeS (divide (plus (subtract event.mouseX mainTimelineLeft) scrollAmount) zoomFactor)
					</f:on>

					// Ruler
					<f:call>ruler</f:call>
					
					
					// MouseOvered time
					<div style-position="absolute" style-left="{makePercent (divide (fst mouseOveredTime) movieDuration)}" style-width="{makePercent (divide (snd mouseOveredTime) movieDuration)}" style-height="100%" style-background-color="rgba(255, 153, 0, 0.1)" />
					
					// Preview time orange bar
					<div style-position="absolute" style-left="{makePercent (divide previewTime movieDuration)}" style-width="1" style-height="100%" style-border-left="1px solid #f90" />
					
					
					// Selected time
					<div style-position="absolute" style-left="{makePercent (divide selectedTimeStart movieDuration)}" style-width="{makePercent (divide selectedTimeDuration movieDuration)}" style-height="100%" style-background-color="rgba(255, 153, 0, 0.5)">
						// draggable sliders
						<div style-position="absolute" style-left="-6" style-width="12" style-top="0" style-height="19" style-background-color="#aaa">
							<f:call>
								setSelected = action (start::Number, offsetX::Number) {
									setSelectedTimeLeft (plus start (divide offsetX zoomFactor))
								},
								dragger (unfetch selectedTimeStart) setSelected
							</f:call>
						</div>
						<div style-position="absolute" style-right="-6" style-width="12" style-top="0" style-height="19" style-background-color="#aaa">
							<f:call>
								setSelected = action (start::Number, offsetX::Number) {
									setSelectedTimeRight (plus start (divide offsetX zoomFactor))
								},
								dragger (unfetch (plus selectedTimeStart selectedTimeDuration)) setSelected
							</f:call>
						</div>
					</div>
					
					

					<div style-position="absolute" style-top="{rulerHeight}" style-left="0" style-width="100%" style-border-top="1px solid #666">
						<f:each layers as index, layer>
							<div style-position="relative" style-width="100%" style-height="{tllHeight layer}" style-border-bottom="1px solid #666">
								<f:call>(tllDisplay layer) (tllItems layer)</f:call>
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
									setScroll = action (start::Number, x::Number) {
										desiredLeft = plus start (divide x scrollbarWidth),
										setScrollAmount (multiply (multiply movieDuration zoomFactor) desiredLeft)
									},
									dragger (unfetch left) setScroll
								</f:call>
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