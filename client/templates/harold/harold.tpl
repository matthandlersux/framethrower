template () {
	// convert i from [0,m] to [0,n]
	scale = function(m,n,i) {
		return i*n/m;
	},
	
	video = test.walleVideo,
	videoWidth = X.video:width video,
	videoHeight = X.video:height video,
	videoURL = X.video:url video,
	videoDuration = X.video:duration video,
	videoFrameRate = X.video:frameRate video,
	
	videoCuts = X.video:cuts2 video,
	
	currentTime = state(Unit Number),
	loadedTime = state(Unit Number),
	
	<f:each videoWidth as videoWidth><f:each videoHeight as videoHeight><f:each videoURL as videoURL><f:each videoDuration as videoDuration><f:each videoFrameRate as videoFrameRate>
		secondsToPixels = scale videoDuration videoWidth,
		pixelsToSeconds = scale videoWidth videoDuration,
		framesToSeconds = scale videoFrameRate 1,
		
		<f:wrapper>
			<f:call>quicktime videoWidth videoHeight videoURL currentTime loadedTime</f:call>
			
			<div style-width="{videoWidth}" style-height="10" style-background="#444">
				<f:on mousemove>
					add(currentTime, pixelsToSeconds event.offsetX)
				</f:on>

				<f:each loadedTime as loadedTime>
					<div style-position="absolute" style-width="{secondsToPixels loadedTime}" style-height="10" style-background="#888">
					</div>
				</f:each>

				<f:each videoCuts as cutFrame>
					cutTime = framesToSeconds cutFrame,
					<div style-position="absolute" style-left="{secondsToPixels cutTime}" style-width="1" style-height="5" style-background="#ccc"></div>
				</f:each>

				<f:each currentTime as currentTime>
					<div style-position="absolute" style-left="{secondsToPixels currentTime}" style-width="1" style-height="10" style-background="#fff">
					</div>
				</f:each>
			</div>
		</f:wrapper>
	</f:each></f:each></f:each></f:each></f:each>
}
