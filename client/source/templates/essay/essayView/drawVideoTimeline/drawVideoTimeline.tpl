template (videoTimeline::VideoTimeline) {
	movie = VideoTimeline:movie videoTimeline,
	extVideo = fetch (takeOne (bindUnitSet Situation:propVideo (getAllInherits movie))),

	// video parameters:
	videoHeight = videoTimelineExpandedHeight,
	videoWidth = product videoHeight (ExtVideo:aspectRatio extVideo),
	videoDuration = ExtVideo:duration extVideo,
	videoURL = getMediaURL (ExtVideo:id extVideo) "scrub.mp4",
	
	// arbitrary UI constants:
	minZoomDuration = 60,
	initialDurationFraction = 0.1,
	scrollwheelFactor = 0.666,
	
	// UI parameters:
	screenWidth = fetch (UI.ui:screenWidth ui.ui),
	scrubberWidth = difference screenWidth videoWidth,
	scrubberHeight = videoHeight,
	scrollHeight = videoTimelineCollapsedHeight,
	zoomHeight = difference scrubberHeight scrollHeight,

	// UI state:
	scrubberTicks = state(Set Number),
	scrollingS = state(Unit Number),
	selectingS = state(Unit Number),
	loadedTimeS = state(Unit Number),
	loadedTime = fetch loadedTimeS,
	previewTimeS = VideoTimeline:previewTime videoTimeline,
	previewTime = fetch previewTimeS,
	zoomStartS = VideoTimeline:zoomStart videoTimeline,
	zoomStart = fetch zoomStartS,
	zoomDurationS = VideoTimeline:zoomDuration videoTimeline,
	zoomDuration = fetch zoomDurationS,
	selectStartS = VideoTimeline:selectStart videoTimeline,
	selectStart = fetch selectStartS,
	selectDurationS = VideoTimeline:selectDuration videoTimeline,
	selectDuration = fetch selectDurationS,
	
	// conversion between seconds and pixels along the scroll bar:
	// durationToScrollWidth = scale videoDuration scrubberWidth,
	scrollWidthToDuration = scale scrubberWidth videoDuration,
	// timeToScrollPixels = durationToScrollWidth,
	scrollPixelsToTime = scrollWidthToDuration,
	// conversion between seconds and pixels in the zoomed scrubber:
	// durationToZoomWidth = scale zoomDuration scrubberWidth,
	zoomWidthToDuration = scale scrubberWidth zoomDuration,
	// timeToZoomPixels = t -> durationToZoomWidth (difference t zoomStart),
	zoomPixelsToTime = x -> sum (zoomWidthToDuration x) zoomStart,
	
	// SVG transform stuff:
	scrollScale = quotient scrubberWidth videoDuration,
	zoomScale = quotient scrubberWidth zoomDuration,
	
	// ontology stuff:
	timepoints = filterByType timelinePoint (Situation:contains movie) :: Set Situation,
	timeintervals = filterByType lineInterval (Situation:contains movie) :: Set Situation,
	getLinksFromTime = time -> getInfonsAboutRole time ulinkTarget :: Situation -> Set Pipe,
	
	// harold, dunno if you'll need something like these? It builds a set of tuples out of points and the things they link to.
	// timepointInfonPairs = mapSet (timepoint -> makeTuple2 (Situation:propTime timepoint) (getLinksFromTime timepoint)) timepoints :: Set (Tuple2 (Unit Number) (Set Pipe)),
	// pointsAndLinks = bindSet (pair -> mapUnitSet (mapUnit2 makeTuple2 (fst pair)) (snd pair)) timepointInfonPairs :: Set (Tuple2 Number Pipe),
	
	// the drawing code common to both the zoom part of the scrubber and the scroll part of the scrubber:
	drawState = template(className::String, durationS::Unit Number, hover::Bool) {
		lineID = concat className "Line",
		pointID = concat className "Point",
		line = concat "#" lineID,
		point = concat "#" pointID,
		duration = fetch durationS,
		scale = quotient scrubberWidth duration,

		<f:wrapper>
			<svg:defs>
				<svg:line id="{lineID}" y1="0" y2="1" stroke-width="{reciprocal scale}"/>
				<svg:rect id="{pointID}" y="0.3" width="{quotient 5 scale}" height="0.4" rx="{quotient 1.5 scale}" ry="0.18"/>//stroke-width="0.04"/>
			</svg:defs>
			
			<svg:rect x="0" y="0" width="{loadedTime}" height="1" fill="#888" opacity="0.5"/>
			<f:each scrubberTicks as tickTime>
				x = product videoDuration tickTime,
				<svg:use xlink:href="{line}" x="{x}" stroke="#444"/>
			</f:each>
	
			<f:each timepoints as timepoint>
				// TODO deal with multiple infons per timepoint
				infon = fetch (takeOne (getLinksFromTime timepoint)),
				<f:wrapper>
					<svg:use xlink:href="{point}" x="{Situation:propTime timepoint}" fill="white" opacity="0.5">
						<f:each boolToUnit hover as _><f:call>hoveredInfonEvents infon</f:call></f:each>
					</svg:use>
					<f:each reactiveEqual (fetch hoveredInfon) infon as _>
						<svg:use pointer-events="none" xlink:href="{point}" x="{Situation:propTime timepoint}" fill="orange"/>
					</f:each>
				</f:wrapper>
			</f:each>
	
			<f:each timeintervals as timeinterval>
				intervalInfon = fetch (takeOne (getInfonsAboutRole timeinterval lineHasEndpointsBetween)),
				intervalStart = fetch (takeOne (getInfonRole lineHasEndpointsStart intervalInfon)),
				intervalEnd = fetch (takeOne (getInfonRole lineHasEndpointsEnd intervalInfon)),
				// TODO deal with multiple infons per interval
				infon = fetch (takeOne (getLinksFromTime timeinterval)),
				start = fetch (Situation:propTime intervalStart),
				duration = difference (fetch (Situation:propTime intervalEnd)) start,
				<f:wrapper>
					<svg:rect x="{start}" y="0.4" width="{duration}" height="0.2" fill="white" opacity="0.5" rx="{product 0.3 duration}" ry="0.06">
						<f:each boolToUnit hover as _><f:call>hoveredInfonEvents infon</f:call></f:each>
					</svg:use>
					<f:each reactiveEqual (fetch hoveredInfon) infon as _>
						<svg:rect pointer-events="none" x="{start}" y="0.4" width="{duration}" height="0.2" fill="orange" rx="{product 0.3 duration}" ry="0.06"/>
					</f:each>
				</f:wrapper>
			</f:each>
		</f:wrapper>
	},
	
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
			
			add(zoomStartS, 0),
			add(zoomDurationS, product videoDuration initialDurationFraction)
		</f:on>

		// wrapper for entire scrubber:
		<svg:svg style-position="absolute" style-width="{scrubberWidth}" style-height="{scrubberHeight}" color-rendering="optimizeSpeed" shape-rendering="optimizeSpeed" text-rendering="optimizeSpeed" image-rendering="optimizeSpeed">
		
			// the zoomed in part of the scrubber:
			<f:wrapper>
				<f:on mousedown> // begin selecting
					clickTime = zoomPixelsToTime event.offsetX,
					add(selectStartS, clickTime),
					add(selectDurationS, 0),
					add(selectingS, clickTime)
				</f:on>
				<f:on globalmouseup> // abandon selecting
					remove(selectingS)
				</f:on>
				<f:on mousemove> // update preview time, and update selection if selecting
					newTime = zoomPixelsToTime event.offsetX,
					add(previewTimeS, newTime),
				
					extract selectingS as clickTime {
						newStart = min newTime clickTime,
						newEnd = max newTime clickTime,
						newDuration = difference newEnd newStart,
						add(selectStartS, newStart),
						add(selectDurationS, newDuration)
					}
				</f:on>
				<f:on mouseout> // 'pop' back to selected position
					add(previewTimeS, selectStart)
				</f:on>
				
				<f:on mousescroll> // zoom in or out on zoomed scrubber
					durationFactor = pow scrollwheelFactor (sign event.wheelDelta),
					newDuration = clamp minZoomDuration videoDuration (product zoomDuration durationFactor),
					// want cursor to remain in same place:
					cursorFraction = quotient (difference previewTime zoomStart) zoomDuration,
					newStart = difference previewTime (product cursorFraction newDuration),

					add(zoomStartS, clamp 0 (difference videoDuration newDuration) newStart),
					add(zoomDurationS, newDuration),
					// force cursor to mouse position, in case we had to clamp?
					// add(previewTimeS, zoomPixelsToTime event.offsetX)
				</f:on>

				<svg:rect x="0" y="0" width="100%" height="{zoomHeight}" fill="#CCC"/> // background
				<svg:g transform="{concat (svgScale zoomScale zoomHeight) (svgTranslate (negation zoomStart) 0)}">
					<f:call>drawState "zoom" zoomDurationS true</f:call>

					<svg:rect pointer-events="none" x="{selectStart}" y="0" width="{selectDuration}" height="1" fill="#CCF" opacity="0.5"/>
					<svg:use pointer-events="none" xlink:href="#zoomLine" x="{selectStart}" stroke="#CCF"/>
					
					<svg:use pointer-events="none" xlink:href="#zoomLine" x="{previewTime}" stroke="#FFF"/>
				</svg:g>
			</f:wrapper>
	
			// the scrollbar part of the scrubber:
			<f:wrapper>
				<f:on mousedown> // begin scrolling
					newTime = scrollPixelsToTime event.offsetX,
					scrollOffset = difference newTime zoomStart,
					// if click is outside of the scroller, then center it at click:
					extract boolToUnit (or (lessThan scrollOffset 0) (greaterThan scrollOffset zoomDuration)) as _ {
						newStart = difference newTime (quotient zoomDuration 2),
						add(zoomStartS, clamp 0 (difference videoDuration zoomDuration) newStart)
						// don't need to update scrollOffset, since it is reactive
					},
					add(scrollingS, scrollOffset)
				</f:on>
				<f:on globalmouseup> // abandon scrolling
					remove(scrollingS)
				</f:on>
				<f:on mousemove> // update zoom if scrolling.
					extract scrollingS as scrollOffset {
						newTime = scrollPixelsToTime event.offsetX,
						newStart = difference newTime scrollOffset,
						add(zoomStartS, clamp 0 (difference videoDuration zoomDuration) newStart)
					}
				</f:on>
				
				<f:on mousescroll> // zoom in or out on zoomed scrubber
					durationFactor = pow scrollwheelFactor (sign event.wheelDelta),
					newDuration = clamp minZoomDuration videoDuration (product zoomDuration durationFactor),
					// zoom around center of scrollbar:
					durationDelta = difference newDuration zoomDuration,
					newStart = difference zoomStart (quotient durationDelta 2),

					add(zoomStartS, clamp 0 (difference videoDuration newDuration) newStart),
					add(zoomDurationS, newDuration)
				</f:on>
			
				<svg:rect x="0" y="{zoomHeight}" width="100%" height="{scrollHeight}" fill="#AAF"/> // background
				<svg:g transform="{concat (svgTranslate 0 zoomHeight) (svgScale scrollScale scrollHeight)}">
					<svg:rect x="{zoomStart}" y="0" width="{zoomDuration}" height="1px" fill="#AAA"/>

					<f:call>drawState "scroll" (unfetch videoDuration) false</f:call>
				</svg:g>
			</f:wrapper>
		</svg:svg>
		
		// the preview video:
		<div style-position="absolute" style-left="{scrubberWidth}">
			<f:call>quicktime videoWidth videoHeight videoURL previewTimeS loadedTimeS</f:call>
		</div>
	</f:wrapper>
}
