template () {
	// convert i from [0,m] to [0,n]
	scale = function(m::Number, n::Number, i::Number)::Number {
		return i*n/m;
	},
	
	sigmoid = function(x::Number, t0::Number, z::Number)::Number {
		if(x<t0)
			return t0 - Math.pow(t0-x, z) / Math.pow(t0, z-1);
		else
			return t0 + Math.pow(x-t0, z) / Math.pow(1-t0, z-1);
	},
	
	pixelsToZoom = function(alpha::Number, x::Number)::Number {
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
	
	unitsToGray = function(x::Number)::String {
		var k = Math.round(255*x);
		return "rgb("+k+","+k+","+k+")";
	},
	
	video = test.walleVideo,
	videoWidth = X.video:width video,
	videoHeight = X.video:height video,
	videoURL = X.video:url video,
	videoDuration = X.video:duration video,
	videoFrameRate = X.video:frameRate video,
	
	videoCuts = X.video:cuts2 video,
	
	scrubberSegments = state(Set Number),
	
	currentTime = state(Unit Number),
	zoomLevel = state(Unit Number),
	loadedTime = state(Unit Number),
	
	<f:each videoWidth as videoWidth><f:each videoHeight as videoHeight><f:each videoURL as videoURL><f:each videoDuration as videoDuration><f:each videoFrameRate as videoFrameRate>
		framesToSeconds = scale videoFrameRate 1,
		secondsToFrames = scale 1 videoFrameRate,
		secondsToUnits = scale videoDuration 1,
		unitsToSeconds = scale 1 videoDuration,
		unitsToPixels = scale 1 videoWidth,
		pixelsToUnits = scale videoWidth 1,

		currentUnit = mapUnit secondsToUnits currentTime,
		spaceToTime = x -> mapUnit2 (sigmoid x) currentUnit zoomLevel,
		timeToSpace = t -> mapUnit2 (sigmoid t) currentUnit (mapUnit reciprocal zoomLevel),
		
		durationToLength = d -> t -> mapUnit2 subtract (timeToSpace (plus t d)) (timeToSpace t),
		durationToWidth = d -> t -> mapUnit unitsToPixels (durationToLength d t),
		durationToGray = d -> t -> mapUnit unitsToGray (durationToLength d t),
		
		currentSpace = bindUnit timeToSpace currentUnit,
		loadedSpace = bindUnit timeToSpace (mapUnit secondsToUnits loadedTime),
		// loadedSpace = mapUnit secondsToUnits loadedTime,
		
		<f:wrapper>
			<f:call>quicktime videoWidth videoHeight videoURL currentTime loadedTime</f:call>
			
			<div style-position="absolute" style-width="{videoWidth}" style-height="50" style-background="#444">
				<f:on init>
					add(currentTime, 1000),
					add(zoomLevel, 1),
					add(scrubberSegments, 0),
					add(scrubberSegments, 0.1),
					add(scrubberSegments, 0.2),
					add(scrubberSegments, 0.3),
					add(scrubberSegments, 0.4),
					add(scrubberSegments, 0.5),
					add(scrubberSegments, 0.6),
					add(scrubberSegments, 0.7),
					add(scrubberSegments, 0.8),
					add(scrubberSegments, 0.9)
				</f:on>
				
				<f:on mousemove>
					// newTime = extract spaceToTime (pixelsToUnits event.offsetX),
					newTime = pixelsToUnits event.offsetX,
					add(currentTime, unitsToSeconds newTime),
					add(zoomLevel, pixelsToZoom 0.1 event.offsetY)
				</f:on>

				<f:each scrubberSegments as segmentTime>
					nextSegmentTime = plus 0.1 segmentTime,
					segmentSpace = timeToSpace segmentTime,
					nextSegmentSpace = timeToSpace nextSegmentTime,
					segmentLength = mapUnit2 subtract nextSegmentSpace segmentSpace,
					<div style-position="absolute" style-left="{mapUnit unitsToPixels segmentSpace}" style-width="{mapUnit unitsToPixels segmentLength}" style-background="{mapUnit unitsToGray segmentLength}" style-height="50"/>
				</f:each>
				
				<div style-position="absolute" style-width="{mapUnit unitsToPixels loadedSpace}" style-top="40" style-height="10" style-background="#888"/>

				// <f:each videoCuts as cutFrame>
				// 	cutTime = framesToSeconds cutFrame,
				// 	cutSpace = timeToSpace (secondsToUnits cutTime),
				// 	<div style-position="absolute" style-left="{mapUnit unitsToPixels cutSpace}" style-width="1" style-height="10" style-background="#ccc"/>
				// </f:each>
				
				<div style-position="absolute" style-left="{mapUnit unitsToPixels currentSpace}" style-width="1" style-height="50" style-background="#fff"/>
			</div>
		</f:wrapper>
	</f:each></f:each></f:each></f:each></f:each>
}
