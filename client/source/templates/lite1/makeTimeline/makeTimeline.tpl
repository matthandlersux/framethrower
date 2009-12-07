template (movie::Movie)::Timeline {
	
	// ==========
	// Sizing, constants
	// ==========
	
	timelineWidth = screenWidth,
	movieDuration = Movie:duration movie,
	aspectRatio = Movie:aspectRatio movie,
	movieId = Movie:id movie,
	
	// UI Sizing Constants
	scrollbarHeight = 16,
	scrollbarButtonWidth = 20,
	rulerHeight = 20,
	
	scrubImageHeight = 100,
	scrubImageWidth = multiply scrubImageHeight aspectRatio,
	
	// small preview (on the right side of the timeline if the video is not full-screened)
	fullscreened = bindUnit (reactiveEqual fullscreenXMLP) fullscreenVideo,
	smallPreviewHeight = timelineHeight,
	smallPreviewWidth = multiply smallPreviewHeight aspectRatio,
	
	
	mainTimelineWidth = fetch (reactiveIfThen fullscreened timelineWidth (subtract timelineWidth smallPreviewWidth)),
	mainTimelineLeft = 0,
	//mainTimelineHeight = subtract timelineHeight (plus scrollbarHeight rulerHeight),
	mainTimelineHeight = subtract timelineHeight scrollbarHeight,
	
	
	
	
	// ==========
	// State
	// ==========
	
	// Zoom
	// width = time * zoomFactor
	zoomFactorS = state(Unit Number, 1),
	zoomFactor = fetch zoomFactorS,
	setZoomFactor = action (newZoom::Number, mouse::Number) {
		extract zoomFactorS as oldZoom {
			extract scrollAmountS as oldScroll {
				clampedZoom = clampMin newZoom (divide mainTimelineWidth movieDuration),
				getNewScroll = function (oldZoom::Number, newZoom::Number, oldScroll::Number, mouse::Number)::Number {
					return (newZoom/oldZoom)*(oldScroll+mouse) - mouse;
				},
				newScroll = getNewScroll oldZoom clampedZoom oldScroll mouse,
				set zoomFactorS clampedZoom,
				setScrollAmount newScroll
			}
		}
	},
	modifyZoom = function (oldZoom::Number, delta::Number)::Number {
		var factor = 1.15;
		if (delta > 0) {
			return oldZoom * factor;
		} else {
			return oldZoom / factor;
		}
	},
	
	// Scroll
	// units: pixels
	scrollAmountS = state(Unit Number, 0),
	scrollAmount = fetch scrollAmountS,
	setScrollAmount = action (amount::Number) {
		min = 0,
		max = (subtract (multiply movieDuration zoomFactor) mainTimelineWidth),
		set scrollAmountS (clamp amount min max)
	},
	
	
	// Mouse Time
	// units: seconds
	mouseTimeS = state(Unit Number, 0),
	mouseTime = fetch mouseTimeS,
	
	// Preview Time
	// units: seconds
	previewTimeS = state(Unit Number, 0),
	previewTime = fetch previewTimeS,
	
	scrubbingS = state(Unit Null),
	
	// is occupied if the player is playing currently
	// controlled by the play/pause button in the center of the video
	// automatically set to pause when the timeline is mousedown'ed
	playingS = state(Unit Number, 0),
	
	
	
	selectedTimeStartS = state(Unit Number),
	selectedTimeDurationS = state(Unit Number),
	selectedTimeStart = fetch selectedTimeStartS,
	selectedTimeDuration = fetch selectedTimeDurationS,
	
	setSelectedTimeRight = action (time::Number) {
		min = selectedTimeStart,
		max = movieDuration,
		newDuration = subtract (clamp time min max) selectedTimeStart,
		set selectedTimeDurationS newDuration
	},
	setSelectedTimeLeft = action (time::Number) {
		min = 0,
		max = plus selectedTimeStart selectedTimeDuration,
		newStart <~ clamp time min max,
		newDuration <~ subtract (plus selectedTimeStart selectedTimeDuration) newStart,
		set selectedTimeStartS newStart,
		set selectedTimeDurationS newDuration
	},
	
	
	
	// ==========
	// Derived State
	// ==========
	
	timelineShownStart = divide scrollAmount zoomFactor,
	timelineShownDuration = divide mainTimelineWidth zoomFactor,
	
	selectedTimeStartPercent = defaultValue offscreen (unfetch (makePercent (divide selectedTimeStart movieDuration))),
	selectedTimeDurationPercent = makePercent (divide selectedTimeDuration movieDuration),
	
	
	
	
	
	formatTime = function (time::Number)::String {
		var seconds = time % 60;
		var minutes = ((time - seconds)/60) % 60;
		var hours = ((time - seconds - minutes*60)/3600);
		
		function pad(n) {
			if (n < 10) return "0" + n;
			else return "" + n;
		}
		
		var s = pad(Math.round(seconds));
		var m = pad(minutes);
		
		return hours + ":" + m + ":" + s;
	},
	
	makePercent = function (fraction::Number)::String {
		return (100*fraction)+"%";
	},
	
	offscreen = "-100",
	
	
	
	
	
	
	
	jumpTo = action (timeRange::Range) {
		padding = 0.4,
		maxZoomRatio = 25, // this ensures that the jumped to range is sufficiently zoomed in
		
		jumpStart = range_start timeRange,
		jumpDuration = range_duration timeRange,
		
		
		set selectedTimeStartS jumpStart,
		set selectedTimeDurationS jumpDuration,
		set previewTimeS jumpStart,
		
		
		
		
		
		durationMin = multiply (plus 1 (multiply 2 padding)) jumpDuration,
		//durationMax = multiply maxZoomRatio jumpDuration,
		//newDuration = clamp timelineShownDuration durationMin durationMax,
		newDuration = clampMin timelineShownDuration durationMin, 
		
		paddingTime = multiply padding jumpDuration,
		startMin = subtract (plus (plus jumpStart jumpDuration) paddingTime) newDuration,
		startMax = subtract jumpStart paddingTime,
		newStart = clamp timelineShownStart startMin startMax,
		
		setZoomFactor (divide mainTimelineWidth newDuration) 0,
		setScrollAmount (multiply newStart zoomFactor)
		
		
	},
	
	xmlp = <div style-width="{timelineWidth}" style-height="{timelineHeight}" style-position="relative" class="timeline-container">
			
			// Zoomer
			// TODO
			
			
			// Main part of timeline
			<div style-position="absolute" style-top="0" style-left="0" style-width="{mainTimelineWidth}" style-height="100%">
				// // pan by dragging the timeline
				// <f:call>
				// 	setScroll = action (start::Number, offsetX::Number) {
				// 		setScrollAmount (subtract start offsetX)
				// 	},
				// 	dragger (unfetch scrollAmount) setScroll
				// </f:call>
				
				// zoom with mouse wheel
				<f:on mousescroll>
					setZoomFactor (modifyZoom zoomFactor event.wheelDelta) (subtract event.mouseX mainTimelineLeft),
					set mouseTimeS (divide (plus (subtract event.mouseX mainTimelineLeft) scrollAmount) zoomFactor)
				</f:on>
				
				

				// Scroll container
				<div style-position="absolute" style-width="{mainTimelineWidth}" style-height="{mainTimelineHeight}" style-overflow="hidden">
				
					// The part that scrolls
					<div style-position="absolute" style-left="{subtract 0 scrollAmount}" style-top="0" style-width="{multiply movieDuration zoomFactor}" style-height="{mainTimelineHeight}">
						<f:on mousemove>
							set mouseTimeS (divide (plus (subtract event.mouseX mainTimelineLeft) scrollAmount) zoomFactor),
							extract scrubbingS as _ {
								set previewTimeS mouseTime
							}
						</f:on>
						<f:on mouseout>
							unset mouseTimeS
						</f:on>
					
						// Chapter backgrounds, mouse time
						<div style-position="absolute" style-top="0" style-left="0" style-width="100%" style-height="100%">
							<f:on mousedown>
								set scrubbingS null,
								set playingS 0,
								set previewTimeS mouseTime,
								unset selectedTimeStartS,
								unset selectedTimeDurationS
							</f:on>
							<f:on globalmouseup>
								extract scrubbingS as _ {
									unset scrubbingS,
									extract reactiveNot selectedTimeStartS as _ {
										set selectedTimeStartS previewTime,
										set selectedTimeDurationS 0							
									}							
								}
							</f:on>
							<div style-position="absolute" class="zBackground" style-width="100%" style-height="100%">
								<f:call>chapterImages mainTimelineHeight (Movie:chapters movie)</f:call>
							</div>
						
							// Mouse time
							<div style-position="absolute" style-left="{makePercent (divide mouseTime movieDuration)}" style-width="1" style-height="100%" style-border-left="1px solid rgba(255,153,0,0.3)" />
						
						</div>

						// Ruler
						//<f:call>ruler</f:call>
					
					
						// Selected time
						<div class="zForeground" style-position="absolute" style-left="{selectedTimeStartPercent}" style-width="{selectedTimeDurationPercent}" style-height="100%" style-background-color="rgba(255, 204, 51, 0.5)">
							// draggable sliders
							<div class="selection-drag-left" >
								<f:call>
									oldTimeS = state(Unit Number),
									setSelected = action (start::Number, offsetX::Number) {
										extract reactiveNot oldTimeS as _ {
											set oldTimeS previewTime
										},
										time = plus start (divide offsetX zoomFactor),
										setSelectedTimeLeft time,
										set playingS 0,
										set previewTimeS (clamp time selectedTimeStart (plus selectedTimeStart selectedTimeDuration)),
										unset mouseTimeS
									},
									doneAction = action () {
										set previewTimeS (fetch oldTimeS),
										unset oldTimeS
									},
									dragger (unfetch selectedTimeStart) setSelected doneAction
								</f:call>
							</div>
							<div class="selection-drag-right" >
								<f:call>
									oldTimeS = state(Unit Number),
									setSelected = action (start::Number, offsetX::Number) {
										extract reactiveNot oldTimeS as _ {
											set oldTimeS previewTime
										},
										time = plus start (divide offsetX zoomFactor),
										setSelectedTimeRight time,
										set playingS 0,
										set previewTimeS (clamp time selectedTimeStart (plus selectedTimeStart selectedTimeDuration)),
										unset mouseTimeS
									},
									doneAction = action () {
										set previewTimeS (fetch oldTimeS),
										unset oldTimeS
									},
									dragger (unfetch (plus selectedTimeStart selectedTimeDuration)) setSelected doneAction
								</f:call>
							</div>
						</div>
					
						// Preview time
						<div class="zForeground" style-position="absolute" style-left="{makePercent (divide previewTime movieDuration)}" style-height="100%">
							<div style-position="absolute" style-left="-1" style-top="0" style-width="1" style-height="100%" style-border-left="3px solid rgba(255,153,0,1.0)" />
							//<div style-position="absolute" style-left="-6" style-width="12" style-height="12" style-background-color="#999" style-top="-24" />
						
						</div>
					
					
						// Notes (time region bubbles)
						<div style-position="absolute" style-top="40" style-width="100%">
							<f:each movie_linksFromNotes movie as timeLink>
								<f:each timeRange_range (timeLink_target timeLink) as range>
									regionLeft = makePercent (divide (range_start range) movieDuration),
									regionWidth = makePercent (divide (range_duration range) movieDuration),
									colorStyle = defaultColorStyle,
									isHighlighted = bindUnit (reactiveEqual (timeLink_target timeLink)) mouseOverLink,
									<div class="zForeground timeline-region" style-position="absolute" style-left="{regionLeft}" style-width="{regionWidth}" style-top="0">
										<div class="inside" style-border-color="{colorStyle_getBorder colorStyle isHighlighted}" style-background-color="{colorStyle_getInner colorStyle isHighlighted}">
											<f:on click>
												note = textRange_note (timeLink_source timeLink),
												openNote note
											</f:on>
											<f:call>svgEvents (timeLink_target timeLink) false defaultColorStyle</f:call>
										</div>
									</div>
								</f:each>
							</f:each>
						</div>


				
					

					
						// Add my own notes
						<div class="zForeground" style-position="absolute" style-top="20" style-width="100%">
							<div style-position="absolute" class="timeline-region mine" style-left="{selectedTimeStartPercent}" style-width="{selectedTimeDurationPercent}" style-top="0">
								<div class="inside">
									<div class="comment-button">
									</div>
									<f:on click>
										createSimpleNoteWithLink movie selectedTimeStart selectedTimeDuration,
										unset selectedTimeStartS,
										unset selectedTimeDurationS,
									</f:on>
									<f:call>
										myDragLink = (movie, selectedTimeStartS, selectedTimeDurationS),
										<f:wrapper>
											<f:on dragstart>
												unset draggingLinkTentative,
												set draggingLink myDragLink,
												set draggingTimeRange (selectedTimeStart, selectedTimeDuration)
											</f:on>
											<f:on mousedown>
											</f:on>
											<f:call>svgEvents myDragLink false draggingColorStyle</f:call>
										</f:wrapper>
									</f:call>
									<f:on mouseover>set draggingLinkTentative null</f:on>
									<f:on mouseout>unset draggingLinkTentative</f:on>
									<f:call>tooltipInfo "Add a new comment"</f:call>
								</div>
							</div>
						</div>
					


					
					

					</div>

				</div>

				// Scrollbar
				<div style-position="absolute" style-bottom="0" style-width="100%" style-height="{scrollbarHeight}" class="scrollbar">
					<div class="zBackground" style-position="absolute" style-width="100%" style-height="100%" style-background-color="#111" />
					<f:call>
						scrollbarWidth = subtract mainTimelineWidth (multiply 2 scrollbarButtonWidth),
						scrollbarBackground = state(Unit String, "rgba(68, 68, 88, 0.8)"),
						scrollLeftOpacity = state(Unit String, ".5"),
						scrollRightOpacity = state(Unit String, ".5"),
			
						// units: fraction
						left = divide scrollAmount (multiply movieDuration zoomFactor),
						width = divide mainTimelineWidth (multiply movieDuration zoomFactor),
						<f:wrapper>
							<div class="zForeground button scroll-button-left" style-opacity="{scrollLeftOpacity}" style-position="absolute" style-top="0" style-left="0" style-width="{scrollbarButtonWidth}" style-height="100%">
								//L
								<f:call>
									mouseClickSwitch scrollLeftOpacity "0.7" "1"
								</f:call>
								//<f:on click>notYetImplemented</f:on>
							</div>
							<div class="zForeground button scroll-button-right" style-opacity="{scrollRightOpacity}" style-position="absolute" style-top="0" style-right="0" style-width="{scrollbarButtonWidth}" style-height="100%">
								//R
								<f:call>
									mouseClickSwitch scrollRightOpacity "0.7" "1"
								</f:call>
								//<f:on click>notYetImplemented</f:on>
							</div>
							<div style-position="absolute" style-top="0" style-left="{scrollbarButtonWidth}" style-width="{scrollbarWidth}" style-height="100%">
								<f:on click>
									desiredLeft = subtract (divide (subtract (subtract event.mouseX scrollbarButtonWidth) mainTimelineLeft) scrollbarWidth) (divide width 2),
									setScrollAmount (multiply (multiply movieDuration zoomFactor) desiredLeft)
								</f:on>

								<div class="zForeground" style-position="absolute" style-background-color="{scrollbarBackground}" style-left="{makePercent left}" style-width="{makePercent width}" style-height="72%" class="scroller">
									<f:call>
										mouseClickSwitch scrollbarBackground "rgba(68, 68, 88, .9)" "rgba(88, 88, 108, .9)"
									</f:call>
									<f:call>
										setScroll = action (start::Number, x::Number) {
											desiredLeft = plus start (divide x scrollbarWidth),
											setScrollAmount (multiply (multiply movieDuration zoomFactor) desiredLeft)
										},
										dragger (unfetch left) setScroll emptyAction
									</f:call>
								</div>
							</div>
						</f:wrapper>
					</f:call>
				</div>
				
				// Small Preview
				<f:each reactiveNot fullscreened as _>
					<div class="video" style-position="absolute" style-top="0" style-left="{mainTimelineWidth}" style-width="{smallPreviewWidth}" style-height="{smallPreviewHeight}">
						<f:call>
							fullscreenButton = <div class="button fullscreen-button" style-position="absolute">
								<f:on click>
									set fullscreenVideo fullscreenXMLP
								</f:on>
							</div>,
							displayFlashVideo fullscreenButton
						</f:call>
					</div>
				</f:each>
				
				// // full screen on opening if nothing is already full screened
				// <f:on init>
				// 	extract reactiveNot fullscreenVideo as _ {
				// 		set fullscreenVideo fullscreenXMLP
				// 	}
				// </f:on>
				
				// if full screened, remove full screen on close (that is, uninit)
				<f:on uninit>
					extract mapUnit (reactiveEqual fullscreenXMLP) fullscreenVideo as _ {
						unset fullscreenVideo
					}
				</f:on>


			</div>
			
			
	</div>,
	
	displayFlashVideo = template (fullscreenButton::XMLP) {
		<f:wrapper>
			<div style-position="absolute" style-width="100%" style-height="100%" class="zBackground">
				<f:call>flashVideo movieId previewTimeS (unfetch (plus selectedTimeStart selectedTimeDuration)) playingS</f:call>
			</div>
		
			
			<f:call>fullscreenButton</f:call>
			
			// <div style-position="absolute" style-left="50%" style-top="50%" style-width="{scrubImageWidth}" style-height="{scrubImageHeight}" style-margin-left="{multiply -0.5 scrubImageWidth}" style-margin-top="{multiply -0.5 scrubImageHeight}">
			// 	<f:call>scrubImages</f:call>
			// </div>
			
			<div style-position="absolute" style-left="50%" style-top="50%" style-width="50" style-height="50" style-margin-left="-25" style-margin-top="-25">
				<f:each bindUnit (reactiveEqual 0) playingS as _>
					<div style-width="60" style-height="60" class="button play-button">
						<f:on click>
							extract bindUnit (reactiveEqual 0) selectedTimeDurationS as _ {
								unset selectedTimeStartS,
								unset selectedTimeDurationS
							},
							set playingS 1
						</f:on>
						//play button
					</div>
				</f:each>
				<f:each bindUnit (reactiveEqual 1) playingS as _>
					<div style-width="78" style-height="22" class="loading-icon">
						<f:on click>
							set playingS 0,
							extract reactiveNot selectedTimeStartS as _ {
								set selectedTimeStartS previewTime,
								set selectedTimeDurationS 0							
							}
						</f:on>
						//loading icon
					</div>
				</f:each>
				<f:each bindUnit (reactiveEqual 2) playingS as _>
					<div style-width="60" style-height="60" class="button pause-button">
						<f:on click>
							set playingS 0,
							extract reactiveNot selectedTimeStartS as _ {
								set selectedTimeStartS previewTime,
								set selectedTimeDurationS 0							
							}
						</f:on>
						//pause button
					</div>
				</f:each>
			</div>
		</f:wrapper>
	},
	
	fullscreenXMLP = template () {
		
		videoWidth = clampMax mainScreenWidth (multiply aspectRatio mainScreenHeight),
		videoHeight = clampMax mainScreenHeight (divide mainScreenWidth aspectRatio),
		<div class="video">
			<div style-position="absolute" style-width="{videoWidth}" style-height="{videoHeight}" style-left="{divide (subtract mainScreenWidth videoWidth) 2}" style-top="{divide (subtract mainScreenHeight videoHeight) 2}">
				<f:call>
					fullscreenButton = <div class="button unfullscreen-button" style-position="absolute">
						<f:on click>
							unset fullscreenVideo
						</f:on>
					</div>,
					displayFlashVideo fullscreenButton
				</f:call>

			</div>
		</div>
	},
	
	
	(movie, xmlp, jumpTo)
}