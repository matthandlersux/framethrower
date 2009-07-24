template (videoTimeline::VideoTimeline) {
	movie = VideoTimeline:movie videoTimeline,
	extVideo = fetch (takeOne (bindUnitSet Situation:propVideo (getAllInherits movie))),

	// video parameters:
	videoWidth = 320,
	videoHeight = quotient 320 (ExtVideo:aspectRatio extVideo),
	videoDuration = ExtVideo:duration extVideo,
	videoURL = getMediaURL (ExtVideo:id extVideo) "scrub.mp4",
	
	// UI parameters:
	screenWidth = fetch (UI.ui:screenWidth ui.ui),
	scrubberWidth = difference screenWidth videoWidth,
	scrollFraction = 0.1,
	scrollHeight = product videoHeight scrollFraction,
	zoomHeight = difference videoHeight scrollHeight,
	minZoomDuration = 60,
	

	// UI state:
	scrubberTicks = state(Set Number),
	scrollingS = state(Unit Null),
	selectingS = state(Unit Null),
	loadedTimeS = state(Unit Number),
	loadedTime = fetch loadedTimeS,
	previewTimeS = VideoTimeline:previewTime videoTimeline,
	previewTime = fetch previewTimeS,
	zoomStartS = VideoTimeline:scrollStart videoTimeline,
	zoomStart = fetch zoomStartS,
	zoomDurationS = VideoTimeline:scrollDuration videoTimeline,
	zoomDuration = fetch zoomDurationS,
	selectStartS = VideoTimeline:selectStart videoTimeline,
	selectStart = fetch selectStartS,
	selectDurationS = VideoTimeline:selectDuration videoTimeline,
	selectDuration = fetch selectDurationS,
	
	// conversion between seconds and pixels along the scroll bar:
	durationToScrollWidth = scale videoDuration scrubberWidth,
	scrollWidthToDuration = scale scrubberWidth videoDuration,
	timeToScrollPixels = durationToScrollWidth,
	scrollPixelsToTime = scrollWidthToDuration,
	// conversion between seconds and pixels in the zoomed scrubber:
	durationToZoomWidth = scale zoomDuration scrubberWidth,
	zoomWidthToDuration = scale scrubberWidth zoomDuration,
	timeToZoomPixels = t -> durationToZoomWidth (difference t zoomStart),
	zoomPixelsToTime = x -> sum (zoomWidthToDuration x) zoomStart,
	
	<f:wrapper>
		<f:on init>
			add(scrubberTicks, 0.1),
			add(scrubberTicks, 0.2),
			add(scrubberTicks, 0.3),
			add(scrubberTicks, 0.4),
			add(scrubberTicks, 0.5),
			add(scrubberTicks, 0.6),
			add(scrubberTicks, 0.7),
			add(scrubberTicks, 0.8),
			add(scrubberTicks, 0.9),
			
			add(zoomStartS, product videoDuration 0.05),
			add(zoomDurationS, product videoDuration 0.1),
		</f:on>

		<f:wrapper> // wrapper for entire scrubber, for scrolling and mouseout
			<f:on mousescroll> // zoom in or out on zoomed scrubber
				//can't make duration too small:
				minDurationDelta = difference minZoomDuration zoomDuration,
				//can't go past left end (t=0):
				maxDurationDelta0 = zoomStart,
				//can't go past right end (t=videoDuration):
				maxDurationDelta1 = difference videoDuration (sum zoomStart zoomDuration),
				// only half of delta goes in each direction, so we can have as much as twice the smallest one:
				maxDurationDelta = product 2 (min maxDurationDelta0 maxDurationDelta1),
				// use scrollWidthToDuration as a reasonable factor on wheelDelta:
				durationDelta = clamp minDurationDelta maxDurationDelta (scrollWidthToDuration event.wheelDelta),
			
				add(zoomStartS, difference zoomStart (quotient durationDelta 2)),
				add(zoomDurationS, sum zoomDuration durationDelta)
			</f:on>
			<f:on mouseout> // 'pop' back to selected position
				add(previewTimeS, selectStart)
			</f:on>
		
			// the zoomed in part of the scrubber:
			<div style-position="absolute"
				style-width="{scrubberWidth}" style-height="{zoomHeight}"
				style-background="#AAA">
				<f:on mousedown> // begin selecting
					add(selectStartS, zoomPixelsToTime event.offsetX),
					add(selectDurationS, 0),
					add(selectingS,null)
				</f:on>
				<f:on globalmouseup> // abandon selecting
					remove(selectingS)
				</f:on>
				<f:on mouseup> // finish selecting
					extract selectingS as _ {					
						remove(selectingS),
						newTime = zoomPixelsToTime event.offsetX,
						newStart = min newTime selectStart,
						newEnd = max newTime selectStart,
						newDuration = difference newEnd newStart,
						add(selectStartS, newStart),
						add(selectDurationS, newDuration)
					}
				</f:on>
				<f:on mousemove> // update preview time, and update selection if selecting
					newTime = zoomPixelsToTime event.offsetX,
					add(previewTimeS, newTime),
				
					extract selectingS as _ {
						newStart = min newTime selectStart,
						newEnd = max newTime selectStart,
						newDuration = difference newEnd newStart,
						add(selectStartS, newStart),
						add(selectDurationS, newDuration)
					}
				</f:on>
			
				<f:each scrubberTicks as tickTime>
					<div style-position="absolute" style-left="{timeToZoomPixels (product videoDuration tickTime)}"
						style-height="{zoomHeight}"
						style-borderLeft="1px solid #444"/>
				</f:each>
				<div style-position="absolute" style-left="{timeToZoomPixels selectStart}"
					style-width="{max 1 (durationToZoomWidth selectDuration)}" style-height="{zoomHeight}"
					style-background="rgba(192,192,255,0.5)"/>
				<div style-position="absolute" style-left="{timeToZoomPixels previewTime}"
					style-height="{zoomHeight}"
					style-borderLeft="1px solid #FFF"/>
			</div>
	
			// the scroll bar part of the scrubber:
			<div style-position="absolute" style-top="{zoomHeight}"
				style-width="{scrubberWidth}" style-height="{scrollHeight}"
				style-background="#AAF">
				<f:on mousedown> // begin scrolling
					add(scrollingS, null)
				</f:on>
				<f:on globalmouseup> // abandon scrolling
					remove(scrollingS)
				</f:on>
				<f:on mouseup> // finish scrolling
					extract scrollingS as _ {					
						remove(scrollingS),
						newTime = scrollPixelsToTime event.offsetX,
						newStart = difference newTime (quotient zoomDuration 2),
						maxStart = difference videoDuration zoomDuration,
						add(zoomStartS, clamp 0 maxStart newStart)
					}
				</f:on>
				<f:on mousemove> // update preview time, and update zoom if scrolling
					newTime = scrollPixelsToTime event.offsetX,
					add(previewTimeS, newTime),
				
					extract scrollingS as _ {
						newStart = difference newTime (quotient zoomDuration 2),
						maxStart = difference videoDuration zoomDuration,
						add(zoomStartS, clamp 0 maxStart newStart)
					}
				</f:on>
			
				<div style-position="absolute"
					style-width="{durationToScrollWidth loadedTime}" style-height="{scrollHeight}"
					style-background="#88F"/>
				<f:each scrubberTicks as tickTime>
					<div style-position="absolute" style-left="{timeToScrollPixels (product videoDuration tickTime)}"
						style-height="{scrollHeight}"
						style-borderLeft="1px solid #444"/>
				</f:each>
				<div style-position="absolute" style-left="{timeToScrollPixels zoomStart}"
					style-width="{durationToScrollWidth zoomDuration}" style-height="{difference scrollHeight 2}"
					style-border="1px solid" style-background="rgba(192,192,192,0.8)"/>
				<div style-position="absolute" style-left="{timeToScrollPixels previewTime}"
					style-height="{scrollHeight}"
					style-borderLeft="1px solid #FFF"/>
			</div>
		</f:wrapper>
		
		// the preview video:
		<div style-position="absolute" style-left="{scrubberWidth}">
			<f:call>quicktime videoWidth videoHeight videoURL previewTimeS loadedTimeS</f:call>
		</div>
	</f:wrapper>
}
