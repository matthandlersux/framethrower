template () {

	timestampsToPairs = function(timestamps::List Number, endTime::Number)::List (Tuple2 Number Number) {
		var pairs = [];
		timestamps = timestamps.asArray;
		forEach(timestamps, function (timestamp, i) {
			var next = (i === timestamps.length - 1) ? endTime : timestamps[i+1];
			var pair = makeTuple2(timestamp, next - timestamp);
			pairs.push(pair);
		});
		
		return arrayToList(pairs);
	},
	
	chapters = timestampsToPairs chapterTimestamps movieDuration,
	cuts = timestampsToPairs cutTimestamps movieDuration,
	
	
	
	
	

	
	screenWidth = fetch (UI.ui:screenWidth ui.ui),
	screenHeight = fetch (UI.ui:screenHeight ui.ui),
	
	
	
	timelineWidth = screenWidth,
	movieDuration = 7668.189,
	aspectRatio = 2.222,
	
	// width = time * zoomFactor
	zoomFactorS = state(Unit Number, 1),
	zoomFactor = fetch zoomFactorS,

	
	// units: pixels
	scrollAmountS = state(Unit Number, 0),
	scrollAmount = fetch scrollAmountS,
	
	
	previewTimeS = state(Unit Number, 0),
	previewTime = fetch previewTimeS,
	
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

	setScrollAmount = action (amount::Number) {
		min = 0,
		max = (subtract (multiply movieDuration zoomFactor) timelineWidth),
		set scrollAmountS (clamp amount min max)
	},
	
	
	modifyZoom = function (oldZoom::Number, delta::Number)::Number {
		var factor = 1.15;
		if (delta > 0) {
			return oldZoom * factor;
		} else {
			return oldZoom / factor;
		}
	},
	
	
	getFrame = function (time::Number)::String {
		return "url(http:/"+"/media.eversplosion.com/mrtesting/frame.php?time="+time+")";
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
	
	rulerMarkings = function ()::List Number {
		var markings = [];
		for (var i = 0; i < 7668; i += 600) {
			markings.push(i);
		}
		return arrayToList(markings);
	},
	
	
	<div>
		<div style-width="{timelineWidth}" style-height="200" style-left="0" style-bottom="0" style-overflow="hidden" style-position="absolute" style-background-color="#eee">
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
						setZoomFactor (modifyZoom zoomFactor event.wheelDelta) event.mouseX,
						set previewTimeS (divide (plus event.mouseX scrollAmount) zoomFactor)
					</f:on>
					
					
				</f:wrapper>
			</f:call>
			<div style-position="absolute" style-left="{subtract 0 scrollAmount}" style-top="0" style-width="{multiply movieDuration zoomFactor}">
				<f:on mousemove>
					set previewTimeS (divide (plus event.mouseX scrollAmount) zoomFactor)
				</f:on>
				
				<div style-position="absolute" style-top="0" style-left="0" style-width="100%" style-height="200">
					<f:each rulerMarkings as rulerMarking>
						<div style-left="{makePercent (divide rulerMarking movieDuration)}" style-top="0" style-height="100%" style-border-left="1px dashed #999" style-color="#999" style-font-size="11" style-padding-left="3" style-position="absolute">
							{formatTime rulerMarking}
						</div>
					</f:each>
				</div>
				
				<div style-position="absolute" style-top="20" style-left="0" style-width="100%">
					<f:each chapters as chapter>
						start = fst chapter,
						duration = snd chapter,
						<div style-left="{makePercent (divide start movieDuration)}" style-width="{makePercent (divide duration movieDuration)}" style-position="absolute" style-height="200" style-overflow="hidden">
							<div style-padding="4" style-border-right="1px solid #ccc">
								<div style-height="100" style-background-color="#ccc" style-background-image="{getFrame start}" style-background-repeat="no-repeat" style-background-position="center center" />
							</div>
						</div>
					</f:each>
				</div>
				
				<div style-position="absolute" style-left="{makePercent (divide previewTime movieDuration)}" style-width="1" style-height="200" style-border-left="1px solid #f90" />
				
				
				// <div style-position="absolute" style-top="100" style-left="0" style-width="100%">
				// 	<f:each cuts as cut>
				// 		start = fst cut,
				// 		duration = snd cut,
				// 		<div style-left="{makePercent (divide start movieDuration)}" style-width="{makePercent (divide duration movieDuration)}" style-position="absolute" style-height="200" style-overflow="hidden">
				// 			<div style-padding="1">
				// 				<div style-height="100" style-background-color="#ccc" style-background-image="{getFrame start}" style-background-repeat="no-repeat" style-background-position="center center" />
				// 			</div>
				// 		</div>
				// 	</f:each>
				// </div>
				
				<div style-position="absolute" style-top="120" style-left="0" style-width="100%">
					<f:each captions as caption>
						start = fst (fst caption),
						duration = snd (fst caption),
						<div style-left="{makePercent (divide start movieDuration)}" style-width="{makePercent (divide duration movieDuration)}" style-position="absolute" style-height="10" style-overflow="hidden" style-background-color="#009" class="rounded">
							
						</div>
					</f:each>
				</div>
				
			</div>
		</div>
		
		<div style-position="absolute" style-bottom="0" style-width="{timelineWidth}" style-height="12" style-background-color="#ccc">
			<f:call>
				zoomedStart = divide scrollAmount (multiply movieDuration zoomFactor),
				zoomedEnd = divide (plus scrollAmount timelineWidth) (multiply movieDuration zoomFactor),
				
				left = zoomedStart,
				//width = subtract zoomedEnd zoomedStart,
				width = divide timelineWidth (multiply movieDuration zoomFactor),
				
				<div style-position="absolute" style-left="{makePercent left}" style-width="{makePercent width}" style-height="100%" style-background-color="#999" />
			</f:call>
		</div>
		
		<div style-position="absolute" style-bottom="200" style-right="0" style-width="320" style-height="144" style-border="1px solid #f90">
			<f:call>
				videoURL = function ()::String {
					return "http:/"+"/media.eversplosion.com/tmp/mr-scrub.mp4";
				},
				
				loadedDurationS = state(Unit Number),
				quicktime 320 144 videoURL previewTimeS loadedDurationS
				//quicktime (screenWidth) (subtract screenHeight 200) videoURL previewTimeS loadedDurationS
			</f:call>
		</div>
	</div>
	
}