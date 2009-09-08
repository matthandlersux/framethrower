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
	// note that passing a fetched widthToDuration directly would wrap entire template in <f:each>.
	drawState = template(width, height, duration) {
		kt = scale duration width,
		// timeToPixels = t -> durationToWidth (difference t start),
		ky = product height,

		<f:wrapper>
			<f:each bigTicks as tickTime>
				x = kt tickTime,
				<svg:line class="bigTick" x1="{x}" x2="{x}" y2="{ky 1}"/>
			</f:each>
			
			<svg:rect class="loadedDuration" width="{kt loadedDuration}" height="{ky 1}"/>
	
			<f:each timepoints as timepoint>
				// TODO deal with multiple infons per timepoint
				infon = fetch (takeOne (getLinksFromTime timepoint)),
				x = mapUnit kt (Situation:propTime timepoint),
				<f:wrapper>
					// note that <use> with an event handler bombs in safari...
					<svg:line class="timepoint" x1="{x}" x2="{x}" y1="{ky 0.3}" y2="{ky 0.7}">
						<f:call>hoveredInfonEvents infon 1</f:call>
					</svg:line>
					<f:each reactiveEqual (fetch hoveredInfon) infon as _>
						<svg:line class="hoveredTimepoint" pointer-events="none" x1="{x}" x2="{x}" y1="{ky 0.3}" y2="{ky 0.7}" />
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
					<svg:rect class="timeinterval" x="{kt start}" width="{kt duration}" y="{ky 0.45}" height="{ky 0.1}" rx="1.5" ry="{ky 0.06}">
						<f:call>hoveredInfonEvents infon 1</f:call>
					</svg:rect>
					// <f:each reactiveEqual (fetch hoveredInfon) infon as _>
					// 	<svg:rect class="hoveredTimeinterval" pointer-events="none" x="{kt start}" width="{kt duration}" y="{ky 0.45}" height="{ky 0.1}" rx="1.5" ry="{ky 0.06}"/>
					// </f:each>
				</f:wrapper>
			</f:each>
		</f:wrapper>
	},
	
	<f:wrapper>
		<f:on init>
			set zoomStartS 0,
			set zoomDurationS (product videoDuration initialDurationFraction)
		</f:on>

		// wrapper for entire scrubber:
		<div style-position="absolute" style-width="{scrubberWidth}" style-height="{scrubberHeight}">
		<svg:svg width="{scrubberWidth}" height="{scrubberHeight}" color-rendering="optimizeSpeed" shape-rendering="optimizeSpeed" text-rendering="optimizeSpeed" image-rendering="optimizeSpeed">
			<svg:defs>
				<svg:line id="zoomLine" y2="{zoomHeight}" stroke-width="1"/>
				<svg:line id="scrollLine" y2="{scrollHeight}" stroke-width="1"/>
			</svg:defs>
		
			// the zoomed in part of the scrubber:
			<svg:g class="zoomTimeline">
				<f:on mousedown> // begin selecting
					clickTime = zoomPixelsToTime event.offsetX,
					set selectStartS clickTime,
					set selectDurationS 0,
					set selectingS clickTime
				</f:on>
				<f:each selectingS as _>
					<f:on globalmouseup> // abandon selecting
						unset selectingS
					</f:on>
				</f:each>
				<f:on mousemove> // update preview time, and update selection if selecting
					newTime = zoomPixelsToTime event.offsetX,
					set previewTimeS newTime,
				
					extract selectingS as clickTime {
						newStart = min newTime clickTime,
						newEnd = max newTime clickTime,
						newDuration = difference newEnd newStart,
						set selectStartS newStart,
						set selectDurationS newDuration
					}
				</f:on>
				<f:on mouseout> // 'pop' back to selected position
					set previewTimeS selectStart
				</f:on>
				
				<f:on mousescroll> // zoom in or out on zoomed scrubber
					durationFactor = pow scrollwheelFactor (sign event.wheelDelta),
					newDuration = clamp minZoomDuration videoDuration (product zoomDuration durationFactor),
					// want cursor to remain in same place:
					cursorFraction = quotient (difference previewTime zoomStart) zoomDuration,
					newStart = difference previewTime (product cursorFraction newDuration),

					set zoomStartS (clamp 0 (difference videoDuration newDuration) newStart),
					set zoomDurationS newDuration,
					// force cursor to mouse position, in case we had to clamp?
					// add(previewTimeS, zoomPixelsToTime event.offsetX)
				</f:on>

				<svg:rect class="timelineBackground" width="100%" height="{zoomHeight}"/> // background
				<f:each bigTicks as tickTime>
					<svg:text class="tickLabel" x="{timeToZoomPixels tickTime}" y="{difference zoomHeight 5}">
						{quotient tickTime 60}m
					</svg:text>
				</f:each>
				<svg:g transform="{svgTranslate (negation (durationToZoomWidth zoomStart)) 0}">
					<f:each boolToUnit (lessThan zoomDuration smallDuration) as _>
						<f:each rangeByKey zoomStartS (mapUnit2 sum zoomStartS zoomDurationS) smallTicks as tickTime>
							<svg:use class="smallTick" xlink:href="#zoomLine" x="{durationToZoomWidth tickTime}"/>
						</f:each>
					</f:each>
				
					// passing fetched things to templates is ineffecient, so we unfetch:
					<f:call>drawState scrubberWidth zoomHeight zoomDuration</f:call>

					<svg:use class="selectStart" pointer-events="none" xlink:href="#zoomLine" x="{durationToZoomWidth selectStart}"/>
					<svg:rect class="selectDuration" pointer-events="none" x="{durationToZoomWidth selectStart}" width="{durationToZoomWidth selectDuration}" height="{zoomHeight}"/>

					<svg:use class="previewTime" pointer-events="none" xlink:href="#zoomLine" x="{durationToZoomWidth previewTime}"/>
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
						set zoomStartS (clamp 0 (difference videoDuration zoomDuration) newStart)
						// don't need to update scrollOffset, since it is reactive
					},
					set scrollingS scrollOffset
				</f:on>
				
				<f:each scrollingS as scrollOffset>
					<f:wrapper>
						<f:on globalmouseup> // abandon scrolling
							unset scrollingS
						</f:on>
						<f:on globalmousemove> // update zoom if scrolling.
								newTime = scrollPixelsToTime event.offsetX,
								newStart = difference newTime scrollOffset,
								set zoomStartS (clamp 0 (difference videoDuration zoomDuration) newStart)
						</f:on>
					</f:wrapper>
				</f:each>
				
				<f:on mousescroll> // zoom in or out on zoomed scrubber
					durationFactor = pow scrollwheelFactor (sign event.wheelDelta),
					newDuration = clamp minZoomDuration videoDuration (product zoomDuration durationFactor),
					// zoom around center of scrollbar:
					durationDelta = difference newDuration zoomDuration,
					newStart = difference zoomStart (quotient durationDelta 2),

					set zoomStartS (clamp 0 (difference videoDuration newDuration) newStart),
					set zoomDurationS newDuration
				</f:on>
			
				<svg:g transform="{svgTranslate 0 zoomHeight}">
					<svg:rect class="timelineBackground" width="100%" height="{scrollHeight}"/> // background
					<svg:rect class="zoomDuration" x="{timeToScrollPixels zoomStart}" width="{durationToScrollWidth zoomDuration}" height="{scrollHeight}"/>
					// don't allow any pointer events through to the state:
					<svg:g pointer-events="none">
						<f:call>drawState scrubberWidth scrollHeight videoDuration</f:call>
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
