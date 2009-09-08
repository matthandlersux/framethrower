template () {
	// convert i from [0,m] to [0,n]
	scale = function(m::Number, n::Number, i::Number)::Number {
		return i*n/m;
	},
	
	sigmoid = function(t0::Number, z::Number, x::Number)::Number {
		if(x<t0)
			return t0 - Math.pow(t0-x, z) / Math.pow(t0, z-1);
		else
			return t0 + Math.pow(x-t0, z) / Math.pow(1-t0, z-1);
	},
	
	getZoomLevel = function(alpha::Number, x::Number)::Number {
		return 1 + alpha*Math.abs(x);
	},
	
	reciprocal = function(x::Number)::Number {
		return 1/x;
	},
	
	product = function(x::Number,y::Number)::Number {
		return x*y;
	},
	
	ceil = function(x::Number)::Number {
		return Math.ceil(x);
	},

	abs = function(x::Number)::Number {
		return Math.abs(x);
	},

	max = function(x::Number, y::Number)::Number {
		return Math.max(x,y);
	},
	
	unitsToGray = function(x::Number)::String {
		var k = Math.round(255*x);
		return "rgb("+k+","+k+","+k+")";
	},

	repeat = function(a::Action Void, dt::Number)::Action JSON {
		return makeActionJavascript(function() {
			return setInterval(function() {
				executeAction(a);
			}, dt*1000);
		});
	},
	cancelRepeat = function(repeatID::JSON)::Action Void {
		return makeActionJavascript(function() {
			clearInterval(repeatID);
		});
	},
	delay = function(a::Action Void, dt::Number)::Action JSON {
		return makeActionJavascript(function() {
			return setTimeout(function() {
				executeAction(a);
			}, dt*1000);
		});
	},
	cancelDelay = function(delayID::JSON)::Action Void {
		return makeActionJavascript(function() {
			clearTimeout(delayID);
		});
	},

	timerDelta = 0.1,
	timerLife = 5,
	enabledSinceS = state(Unit Number, 0),
	enabledSince = fetch enabledSinceS,
	enabledUntilS = state(Unit Number, 0),
	enabledUntil = fetch enabledUntilS,
	timeS = state(Unit Number, 0),
	time = fetch timeS,
	timerS = state(Unit JSON),
	tick = action() {
		set timeS (plus time timerDelta),
		extract boolToUnit (greaterThan time enabledUntil) as _ { // timer has expired
			disableTime
		}
	},
	enableTime = action() {
		extract reactiveNot timerS as _ { // timer is not running
			set enabledSinceS time,
			timer <- repeat tick timerDelta,
			set timerS timer
		},
		set enabledUntilS (plus time timerLife) // tick will cancel itself
	},
	disableTime = action() {
		// note that nothing will happen if timerS is already unset:
		cancelRepeat (fetch timerS),
		unset timerS
	},
	
	video = test.walleVideo,
	videoWidth = X.video:width video,
	videoHeight = X.video:height video,
	videoURL = X.video:url video,
	videoDuration = X.video:duration video,
	videoFrameRate = X.video:frameRate video,
	
	videoCuts = X.video:cuts2 video,
	
	scrubberSegments = state(Set Number),
	
	currentTimeS = state(Unit Number, 1000),
	currentTime = fetch currentTimeS,
	baseZoomLevelS = state(Unit Number, 5),
	baseZoomLevel = fetch baseZoomLevelS,
	zoomLevelS = state(Unit Number, 1),
	zoomLevel = fetch zoomLevelS,
	// zoomLevel = plus 1 (abs (subtract time (product (plus enabledSince enabledUntil) 0.5))),
	loadedTimeS = state(Unit Number),
	loadedTime = fetch loadedTimeS,
	
	framesToSeconds = scale videoFrameRate 1,
	secondsToFrames = scale 1 videoFrameRate,
	secondsToUnits = scale videoDuration 1,
	unitsToSeconds = scale 1 videoDuration,
	unitsToPixels = scale 1 videoWidth,
	pixelsToUnits = scale videoWidth 1,

	currentUnit = secondsToUnits currentTime,
	spaceToTime = sigmoid currentUnit zoomLevel,
	timeToSpace = sigmoid currentUnit (reciprocal zoomLevel),
	
	durationToLength = d -> t -> subtract (timeToSpace (plus t d)) (timeToSpace t),
	durationToWidth = d -> t -> unitsToPixels (durationToLength d t),
	durationToGray = d -> t -> unitsToGray (durationToLength d t),
	
	currentSpace = timeToSpace currentUnit,
	loadedSpace = timeToSpace (secondsToUnits loadedTime),
	// loadedSpace = secondsToUnits loadedTime,
	
	<f:wrapper>
		<div>{enabledSinceS}</div>
		<div>{timeS}</div>
		<div>{enabledUntilS}</div>
		
		<f:call>quicktime videoWidth videoHeight videoURL currentTimeS loadedTimeS</f:call>
		
		<div style-position="absolute" style-width="{videoWidth}" style-height="50" style-background="#444">
			<f:on init>
				// add scrubberSegments 0,
				add scrubberSegments 0.1,
				add scrubberSegments 0.2,
				add scrubberSegments 0.3,
				add scrubberSegments 0.4,
				add scrubberSegments 0.5,
				add scrubberSegments 0.6,
				add scrubberSegments 0.7,
				add scrubberSegments 0.8,
				add scrubberSegments 0.9
			</f:on>
			
			<f:on mousemove>
				// newTime = extract mapUnit2 (a -> b -> sigmoid (secondsToUnits a) b (pixelsToUnits event.offsetX)) currentTimeS zoomLevelS,
				// newTime = spaceToTime (pixelsToUnits event.offsetX),
				newTime = pixelsToUnits event.offsetX,
				set currentTimeS (unitsToSeconds (spaceToTime newTime)),
				// set currentTimeS (unitsToSeconds newTime),
				// set zoomLevelS (pixelsToZoom 0.1 event.offsetY),
				extract reactiveNot timerS as _ { // timer is not running (mouse motion is just beginning)
					set baseZoomLevelS zoomLevel // store 'base' zoom level
				},
				enableTime // even if timer is already running, enabling lengthens its timeout
			</f:on>

			<f:each scrubberSegments as segmentTime>
				nextSegmentTime = plus 0.1 segmentTime,
				segmentSpace = timeToSpace segmentTime,
				// nextSegmentSpace = timeToSpace nextSegmentTime,
				// segmentLength = subtract nextSegmentSpace segmentSpace,
				// <div style-position="absolute" style-left="{unitsToPixels segmentSpace}" style-width="{unitsToPixels segmentLength}" style-background="{unitsToGray segmentLength}" style-height="50"/>
				<div style-position="absolute" style-left="{unitsToPixels segmentSpace}" style-width="1" style-background="#000" style-height="50"/>
			</f:each>
			
			<div style-position="absolute" style-width="{unitsToPixels loadedSpace}" style-top="40" style-height="10" style-background="#888"/>

			// <f:each videoCuts as cutFrame>
			// 	cutTime = framesToSeconds cutFrame,
			// 	cutSpace = timeToSpace (secondsToUnits cutTime),
			// 	<div style-position="absolute" style-left="{unitsToPixels cutSpace}" style-width="1" style-height="10" style-background="#ccc"/>
			// </f:each>
			
			<div style-position="absolute" style-left="{unitsToPixels currentSpace}" style-width="1" style-height="50" style-background="#fff"/>
		</div>
	</f:wrapper>
}
