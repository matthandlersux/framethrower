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
	initialDurationFraction = 0.15,
	scrollwheelFactor = 0.666,
	smallTime = 60,
	bigTime = 600,
	smallDuration = bigTime,
	
	// UI parameters:
	screenWidth = fetch (UI.ui:screenWidth ui.ui),
	scrubberWidth = difference screenWidth videoWidth,
	scrubberHeight = videoHeight,
	scrollHeight = videoTimelineCollapsedHeight,
	zoomHeight = difference scrubberHeight scrollHeight,
	
	makeRuler = function(t::Number, dt::Number)::List Number {
		var ticks = [];
		for(var s=dt; s<t; s+=dt)
			ticks.push(s);
		return arrayToList(ticks);
	},

	// UI state:
	bigTicks = makeRuler videoDuration bigTime,
	smallTicks = makeRuler smallDuration smallTime,
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
	durationToScrollWidth = scale videoDuration scrubberWidth,
	scrollWidthToDuration = scale scrubberWidth videoDuration,
	timeToScrollPixels = durationToScrollWidth,
	scrollPixelsToTime = scrollWidthToDuration,
	// conversion between seconds and pixels in the zoomed scrubber:
	durationToZoomWidth = scale zoomDuration scrubberWidth,
	zoomWidthToDuration = scale scrubberWidth zoomDuration,
	timeToZoomPixels = t -> durationToZoomWidth (difference t zoomStart),
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
	drawState = template(className::String, hover::Bool, widthS::Unit Number, heightS::Unit Number, offsetS::Unit Number, durationS::Unit Number) {
		lineID = concat className "Line",
		pointID = concat className "Point",
		line = concat "#" lineID,
		point = concat "#" pointID,
		width = fetch widthS,
		height = fetch heightS,
		offset = fetch offsetS,
		duration = fetch durationS,
		widthToDuration = scale width duration,
		durationToWidth = scale duration width,
		pixelsToTime = x -> sum (widthToDuration x) offset,
		timeToPixels = t -> durationToWidth (difference t offset),

		<f:wrapper>
			<f:each bigTicks as tickTime>
				<svg:use xlink:href="{line}" x="{tickTime}" stroke="#444" opacity="0.5"/>
			</f:each>
			
			<svg:rect width="{loadedTime}" height="1" fill="#888" opacity="0.5"/>
	
			<f:each timepoints as timepoint>
				// TODO deal with multiple infons per timepoint
				infon = fetch (takeOne (getLinksFromTime timepoint)),
				<f:wrapper>
					// 'use' with an event handler bombs in safari...
					// <svg:use xlink:href="{point}" x="{Situation:propTime timepoint}" fill="white" opacity="0.5">
					<svg:rect y="0.3" width="{widthToDuration 5}" height="0.4" rx="{widthToDuration 1.5}" ry="0.18" x="{Situation:propTime timepoint}" fill="white" opacity="0.5">
						<f:each boolToUnit hover as _><f:call>hoveredInfonEvents infon 1</f:call></f:each>
					// </svg:use>
					</svg:rect>
					<f:each reactiveEqual (fetch hoveredInfon) infon as _>
						// <svg:use pointer-events="none" xlink:href="{point}" x="{Situation:propTime timepoint}" fill="orange"/>
						<svg:rect pointer-events="none" y="0.3" width="{widthToDuration 5}" height="0.4" rx="{widthToDuration 1.5}" ry="0.18" x="{Situation:propTime timepoint}" fill="orange" opacity="0.8"/>
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
					<svg:rect x="{start}" y="0.45" width="{duration}" height="0.1" fill="white" opacity="0.5" rx="{product 0.3 duration}" ry="0.06">
						<f:each boolToUnit hover as _><f:call>hoveredInfonEvents infon 1</f:call></f:each>
					</svg:rect>
					<f:each reactiveEqual (fetch hoveredInfon) infon as _>
						<svg:rect pointer-events="none" x="{start}" y="0.45" width="{duration}" height="0.1" fill="orange" rx="{product 0.3 duration}" ry="0.06" opacity="0.8"/>
					</f:each>
				</f:wrapper>
			</f:each>
		</f:wrapper>
	},
	
	<f:wrapper>
		<f:on init>
			add(zoomStartS, 0),
			add(zoomDurationS, product videoDuration initialDurationFraction)
		</f:on>

		// wrapper for entire scrubber:
		<div style-position="absolute" style-width="{scrubberWidth}" style-height="{scrubberHeight}">
		<svg:svg width="{scrubberWidth}" height="{scrubberHeight}" color-rendering="optimizeSpeed" shape-rendering="optimizeSpeed" text-rendering="optimizeSpeed" image-rendering="optimizeSpeed">
			<svg:defs>
				<svg:line id="zoomLine" y2="1" stroke-width="{zoomWidthToDuration 1}"/>
				<svg:line id="scrollLine" y2="1" stroke-width="{scrollWidthToDuration 1}"/>
			</svg:defs>
		
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

				<svg:rect width="100%" height="{zoomHeight}" fill="#CCC"/> // background
				<f:each bigTicks as tickTime>
					<svg:text x="{timeToZoomPixels tickTime}" y="{difference zoomHeight 5}" font-size="10" fill="black" opacity="0.8">
						{quotient tickTime 60}m
					</svg:text>
				</f:each>
				<svg:g transform="{concat (svgScale zoomScale zoomHeight) (svgTranslate (negation zoomStart) 0)}">
					<f:each boolToUnit (lessThan zoomDuration smallDuration) as _>
						// <f:each rangeByKey zoomStartS (mapUnit2 plus zoomStartS zoomDurationS) smallTicks as tickTime>
						<svg:g transform="{svgTranslate (toMultiple floor smallTime zoomStart) 0}">
							<f:each smallTicks as tickTime>
								<svg:use xlink:href="#zoomLine" x="{tickTime}" stroke="#444" opacity="0.2"/>
							</f:each>
						</svg:g>
					</f:each>
				
					<f:call>drawState "zoom" true (unfetch scrubberWidth) (unfetch zoomHeight) zoomStartS zoomDurationS</f:call>

					<svg:use pointer-events="none" xlink:href="#zoomLine" x="{selectStart}" stroke="#CCF"/>
					<svg:rect pointer-events="none" x="{selectStart}" width="{selectDuration}" height="1" fill="#CCF" opacity="0.5"/>

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
			
				<svg:g transform="{svgTranslate 0 zoomHeight}">
					<svg:rect width="100%" height="{scrollHeight}" fill="#AAF"/> // background
					<svg:rect x="{timeToScrollPixels zoomStart}" width="{durationToScrollWidth zoomDuration}" height="{scrollHeight}" fill="#AAA" stroke-width="1" stroke="blue"/>
					<svg:g transform="{svgScale scrollScale scrollHeight}">
						<f:call>drawState "scroll" false (unfetch scrubberWidth) (unfetch scrollHeight) (returnUnit 0) (unfetch videoDuration)</f:call>
					</svg:g>
				</svg:g>
			</f:wrapper>
		</svg:svg>
		</div>
		
		// the preview video:
		<div style-position="absolute" style-left="{scrubberWidth}">
			<f:call>quicktime videoWidth videoHeight videoURL previewTimeS loadedTimeS</f:call>
		</div>
	</f:wrapper>
}
