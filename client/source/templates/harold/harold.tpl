template () {
	// convert i from [0,m] to [0,n]
	scale = function(m, n, i) {
		return i*n/m;
	},
	
	sigmoid = function(x, t0, z) {
		if(x<t0)
			return t0 - Math.pow(t0-x, z) / Math.pow(t0, z-1);
		else
			return t0 + Math.pow(x-t0, z) / Math.pow(1-t0, z-1);
	},
	
	pixelsToZoom = function(alpha, x) {
		return 1 + alpha*Math.abs(x);
	},
	
	reciprocal = function(x) {
		return 1/x;
	},
	
	video = test.walleVideo,
	videoWidth = X.video:width video,
	videoHeight = X.video:height video,
	videoURL = X.video:url video,
	videoDuration = X.video:duration video,
	videoFrameRate = X.video:frameRate video,
	
	videoCuts = X.video:cuts2 video,
	
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
		
		currentSpace = bindUnit timeToSpace currentUnit,
		loadedSpace = bindUnit timeToSpace (mapUnit secondsToUnits loadedTime),
		// loadedSpace = mapUnit secondsToUnits loadedTime,
		
		<f:wrapper>
			<f:call>quicktime videoWidth videoHeight videoURL currentTime loadedTime</f:call>
			
			<div style-width="{videoWidth}" style-height="10" style-background="#444">
				<f:on init>
					add(currentTime, 0),
					add(zoomLevel, 1)
				</f:on>
				
				<f:on mousedown>
					// newTime = extract spaceToTime (pixelsToUnits event.offsetX),
					newTime = pixelsToUnits event.offsetX,
					add(currentTime, unitsToSeconds newTime),
					add(zoomLevel, pixelsToZoom 1 event.offsetY)
				</f:on>
				
				<div style-position="absolute" style-width="{mapUnit unitsToPixels loadedSpace}" style-height="10" style-background="#888">
				</div>

				// <f:each videoCuts as cutFrame>
				// 	cutTime = framesToSeconds cutFrame,
				// 	cutSpace = timeToSpace (secondsToUnits cutTime),
				// 	<div style-position="absolute" style-left="{mapUnit unitsToPixels cutSpace}" style-width="1" style-height="5" style-background="#ccc"></div>
				// </f:each>
				
				<div style-position="absolute" style-left="{mapUnit unitsToPixels currentSpace}" style-width="1" style-height="10" style-background="#fff">
				</div>
			</div>
		</f:wrapper>
	</f:each></f:each></f:each></f:each></f:each>
}
