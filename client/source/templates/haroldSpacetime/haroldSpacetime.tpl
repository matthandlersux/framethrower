template () {
// ** simple utils **
	// convert x from [0,a] to [0,b]
	scale = function(a::Number, b::Number, x::Number)::Number {
		if(a===0)
			return 0;
		return x*b/a;
	},
	// bounded linear interpolation of x from [a,b] to [c,d]
	binterpolate = function(a::Number, b::Number, c::Number, d::Number, x::Number)::Number {
		if(x<=a)
			return c;
		if(x>=b)
			return d;
		return (x-a)*(d-c)/(b-a) + c;
	},
	reciprocal = function(x::Number)::Number {
		return 1/x;
	},
	product = function(x::Number,y::Number)::Number {
		return x*y;
	},
	quotient = function(x::Number,y::Number)::Number {
		return x/y;
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
	choose = function(predicate::Boolean, a::t, b::t)::t {
		return predicate ? a : b;
	},
	unitsToGray = function(x::Number)::String {
		var k = Math.round(255*x);
		return "rgb("+k+","+k+","+k+")";
	},
	
// ** JS timer utils **
	repeat = jsaction(a::Action Void, dt::Number)::JSON {
		return setInterval(function() { executeAction(a); }, dt*1000);
	},
	cancelRepeat = jsaction(repeatID::JSON)::Void {
		clearInterval(repeatID);
	},
	delay = jsaction(a::Action Void, dt::Number)::JSON {
		return setTimeout(function() { executeAction(a); }, dt*1000);
	},
	cancelDelay = jsaction(delayID::JSON)::Void {
		clearTimeout(delayID);
	},

// ** wind-up clock **
	clockDelta = 0.03,
	clockLife = 1,
	clockUntilS = state(Unit Number, 0),
	clockUntil = fetch clockUntilS,
	clockTimeS = state(Unit Number, 0),
	clockTime = fetch clockTimeS,
	clockS = state(Unit JSON),
	clockTick = action() {
		set clockTimeS (plus clockTime clockDelta),
		extract boolToUnit (greaterThan clockTime clockUntil) as _ { // clock has expired
			cancelRepeat (fetch clockS),
			unset clockS
		}
	},
	windClock = action() { // 'wind up' clock so that it runs for clockLife
		extract reactiveNot clockS as _ { // clock is not running
			clock <- repeat clockTick clockDelta,
			set clockS clock
		},
		set clockUntilS (plus clockTime clockLife)
	},

// ** sigmoid math **
	sigmoid = function(t0::Number, z::Number, x::Number)::Number {
		if(x<t0)
			return t0 - Math.pow(t0-x, z) / Math.pow(t0, z-1);
		else
			return t0 + Math.pow(x-t0, z) / Math.pow(1-t0, z-1);
	},
	sogmiod = x0 -> z -> t -> sigmoid x0 (reciprocal z) t,
	getZoomLevel = function(alpha::Number, x::Number)::Number {
		return 1 + alpha*Math.abs(x);
	},

// ** video **
	video = test.walleVideo,
	videoWidth = X.video:width video,
	videoHeight = X.video:height video,
	videoURL = X.video:url video,
	videoDuration = X.video:duration video,
	videoFrameRate = X.video:frameRate video,
	videoCuts = X.video:cuts2 video,
	loadedTimeS = state(Unit Number),

// ** UI State **
	motionClockTimeS = state(Unit Number, -1),
	motionClockTime = fetch motionClockTimeS,
	motionZoomLevelS = state(Unit Number, 1),
	motionFocusTimeS = state(Unit Number, 0),
	
	targetTimeS = state(Unit Number, 1000),
	targetZoomLevelS = state(Unit Number, 5),

// ** UI **
	framesToSeconds = scale videoFrameRate 1,
	secondsToFrames = scale 1 videoFrameRate,
	secondsToFraction = scale videoDuration 1,
	fractionToSeconds = scale 1 videoDuration,
	pixelsToFraction = scale videoWidth 1,
	fractionToPixels = scale 1 videoWidth,
	
	motionLife = 0.1,
	// time at which user is 'idle':
	idleClockTime = plus motionClockTime motionLife,
	// focusTime = binterpolate idleClockTime clockUntil (fetch motionFocusTimeS) (fetch targetTimeS) clockTime,
	focusTime = fetch targetTimeS,
 	zoomLevel0 = binterpolate idleClockTime clockUntil (fetch motionZoomLevelS) (fetch targetZoomLevelS) clockTime,
	zoomLevel = max 1 zoomLevel0,
	focusFraction = secondsToFraction focusTime,
	spaceToTime = x -> fractionToSeconds (sigmoid focusFraction zoomLevel (pixelsToFraction x)),
	timeToSpace = t -> fractionToPixels (sogmiod focusFraction zoomLevel (secondsToFraction t)),

	scrubberSegments = state(Set Number),
	
	<f:wrapper>
		<div>{motionClockTimeS} {clockTimeS} {clockUntilS}</div>
		<div>{motionFocusTimeS} {focusTime} {targetTimeS} {videoDuration}</div>
		<div>{motionZoomLevelS} {zoomLevel} {targetZoomLevelS}</div>
		
		<f:call>quicktime videoWidth videoHeight videoURL targetTimeS loadedTimeS</f:call>
		
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
				// compute target time based on current spaceToTime, before it changes:
				extract unfetch (spaceToTime event.offsetX) as newTargetTime {
					set motionFocusTimeS focusTime,
					set motionZoomLevelS (quotient zoomLevel 1.1),
					// we change motionClockTime and targetTime last since they affect focusTime and zoomLevel:
					set motionClockTimeS clockTime,
					set targetTimeS newTargetTime
				},
				windClock
			</f:on>

			<f:each scrubberSegments as segmentFraction>
				segmentTime = scale 1 videoDuration segmentFraction,
				<div style-position="absolute" style-left="{timeToSpace segmentTime}" style-width="1" style-background="#000" style-height="50"/>
			</f:each>
			
			<div style-position="absolute" style-width="{timeToSpace (fetch loadedTimeS)}" style-top="40" style-height="10" style-background="#888"/>

			// <f:each videoCuts as cutFrame>
			// 	cutTime = framesToSeconds cutFrame,
			// 	cutSpace = timeToSpace (secondsToUnits cutTime),
			// 	<div style-position="absolute" style-left="{unitsToPixels cutSpace}" style-width="1" style-height="10" style-background="#ccc"/>
			// </f:each>
			
			<div style-position="absolute" style-left="{timeToSpace (fetch targetTimeS)}" style-width="1" style-height="50" style-background="#fff"/>
		</div>
	</f:wrapper>
}
