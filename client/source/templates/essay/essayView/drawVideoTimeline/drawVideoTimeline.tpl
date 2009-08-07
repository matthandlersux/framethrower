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
	
	makeRuler = function(t::Number, dt::Number)::Set Number {
		var ticks = [];
		for(var s=dt; s<t; s+=dt)
			ticks.push(s);
		return arrayToSet(ticks);
	},

	// UI state:
	bigTicks = makeRuler videoDuration bigTime,
	smallTicks = makeRuler videoDuration smallTime,
	scrollingS = state(Unit Number),
	selectingS = state(Unit Number),
	loadedDurationS = state(Unit Number),
	loadedDuration = fetch loadedDurationS,
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
	
	// the drawing code common to both the zoom part of the scrubber and the scroll part of the scrubber:
	drawState = template(line::String, hover::Bool, widthS::Unit Number, heightS::Unit Number, offsetS::Unit Number, durationS::Unit Number) {
		hoverCursor = tertiary hover "pointer" "inherit",
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
				<svg:use class="bigTick" xlink:href="{line}" x="{tickTime}"/>
			</f:each>
			
			<svg:rect class="loadedDuration" width="{loadedDuration}" height="1"/>
	
			<f:each timepoints as timepoint>
				// TODO deal with multiple infons per timepoint
				infon = fetch (takeOne (getLinksFromTime timepoint)),
				<f:wrapper>
					// 'use' with an event handler bombs in safari...
					// <svg:use xlink:href="{point}" x="{Situation:propTime timepoint}" fill="white" opacity="0.5">
					<svg:rect class="timepoint" x="{Situation:propTime timepoint}" width="{widthToDuration 5}" y="0.3" height="0.4" rx="{widthToDuration 1.5}" ry="0.18" cursor="{hoverCursor}">
						<f:each boolToUnit hover as _><f:call>hoveredInfonEvents infon 1</f:call></f:each>
					// </svg:use>
					</svg:rect>
					<f:each reactiveEqual (fetch hoveredInfon) infon as _>
						// <svg:use pointer-events="none" xlink:href="{point}" x="{Situation:propTime timepoint}" fill="orange"/>
						<svg:rect class="hoveredTimepoint" pointer-events="none" x="{Situation:propTime timepoint}" width="{widthToDuration 5}" y="0.3" height="0.4" rx="{widthToDuration 1.5}" ry="0.18"/>
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
					<svg:rect class="timeinterval" x="{start}" width="{duration}" y="0.45" height="0.1" rx="{product 0.3 duration}" ry="0.06">
						<f:each boolToUnit hover as _><f:call>hoveredInfonEvents infon 1</f:call></f:each>
					</svg:rect>
					<f:each reactiveEqual (fetch hoveredInfon) infon as _>
						<svg:rect class="hoveredTimeinterval" pointer-events="none" x="{start}" width="{duration}" y="0.45" height="0.1" rx="{product 0.3 duration}" ry="0.06"/>
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
			<svg:g class="zoomTimeline">
				<f:on mousedown> // begin selecting
					clickTime = zoomPixelsToTime event.offsetX,
					add(selectStartS, clickTime),
					add(selectDurationS, 0),
					add(selectingS, clickTime)
				</f:on>
				<f:each selectingS as _>
					<f:on globalmouseup> // abandon selecting
						remove(selectingS)
					</f:on>
				</f:each>
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

				<svg:rect class="timelineBackground" width="100%" height="{zoomHeight}"/> // background
				<f:each bigTicks as tickTime>
					<svg:text class="tickLabel" x="{timeToZoomPixels tickTime}" y="{difference zoomHeight 5}">
						{quotient tickTime 60}m
					</svg:text>
				</f:each>
				<svg:g transform="{concat (svgScale zoomScale zoomHeight) (svgTranslate (negation zoomStart) 0)}">
					<f:each boolToUnit (lessThan zoomDuration smallDuration) as _>
						<f:each rangeByKey zoomStartS (mapUnit2 sum zoomStartS zoomDurationS) smallTicks as tickTime>
							<svg:use class="smallTick" xlink:href="#zoomLine" x="{tickTime}"/>
						</f:each>
					</f:each>
				
					<f:call>drawState "#zoomLine" true (unfetch scrubberWidth) (unfetch zoomHeight) zoomStartS zoomDurationS</f:call>

					<svg:use class="selectStart" pointer-events="none" xlink:href="#zoomLine" x="{selectStart}"/>
					<svg:rect class="selectDuration" pointer-events="none" x="{selectStart}" width="{selectDuration}" height="1"/>

					<svg:use class="previewTime" pointer-events="none" xlink:href="#zoomLine" x="{previewTime}"/>
				</svg:g>
			</svg:g>
	
			// the scrollbar part of the scrubber:
			<svg:g class="scrollTimeline">
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
				
				<f:each scrollingS as scrollOffset>
					<f:wrapper>
						<f:on globalmouseup> // abandon scrolling
							remove(scrollingS)
						</f:on>
						<f:on globalmousemove> // update zoom if scrolling.
								newTime = scrollPixelsToTime event.offsetX,
								newStart = difference newTime scrollOffset,
								add(zoomStartS, clamp 0 (difference videoDuration zoomDuration) newStart)
						</f:on>
					</f:wrapper>
				</f:each>
				
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
					<svg:rect class="timelineBackground" width="100%" height="{scrollHeight}"/> // background
					<svg:rect class="zoomDuration" x="{timeToScrollPixels zoomStart}" width="{durationToScrollWidth zoomDuration}" height="{scrollHeight}" cursor="move"/>
					<svg:g transform="{svgScale scrollScale scrollHeight}">
						<f:call>drawState "#scrollLine" false (unfetch scrubberWidth) (unfetch scrollHeight) (returnUnit 0) (unfetch videoDuration)</f:call>
					</svg:g>
				</svg:g>
			</svg:g>
		</svg:svg>
		</div>
		
		// the preview video:
		<div style-position="absolute" style-left="{scrubberWidth}">
			<f:call>quicktime videoWidth videoHeight videoURL previewTimeS loadedDurationS</f:call>
		</div>
	</f:wrapper>
}
