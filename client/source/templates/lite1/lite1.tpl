template () {
	
	// =============
	// Types
	// =============
	
	Range := (Number, Number),
	range_start = fst,
	range_duration = snd,
	
	
	
	Timeline := (Movie, XMLP, Range -> Action Void),
	timeline_movie = tuple3get1,
	timeline_xmlp = tuple3get2,
	timeline_jumpTo = tuple3get3,
	
	
	NotePop := XMLP,
	
	// =============
	// State
	// =============
	
	timelines = state(Map Ord Timeline),
	
	fullscreenVideo = state(Unit XMLP),
	
	openMovie = action (movie::Movie) {
		extract reactiveNot (isOpen movie) as _ {
			nextOrd = fetch (getNextOrd timelines),
			addEntry timelines nextOrd (makeTimeline movie)			
		}
	},
	jumpToInMovie = action (movie::Movie, timeRange::Range) {
		openMovie movie,
		extract filter (timeline -> reactiveEqual movie (timeline_movie timeline)) (values timelines) as timeline {
			timeline_jumpTo timeline timeRange
		}
	},
	
	
	notePops = state(Map Ord Note),
	
	openNote = action (note::Note) {
		extract reactiveNot (isNoteOpen note) as _ {
			nextOrd = fetch (getNextOrd notePops),
			addEntry notePops nextOrd note			
		}
	},
	
	
	// =============
	// Derived State
	// =============
	
	openedMovies = mapSet timeline_movie (values timelines),
	isOpen = movie -> isNotEmpty (filter (reactiveEqual movie) openedMovies),
	openedNotes = values notePops,
	isNoteOpen = note -> isNotEmpty (filter (reactiveEqual note) openedNotes),
	
	// =============
	// UI Constants
	// =============
	
	timelineHeight = 140,
	separatorHeight = 6,
	
	
	// =============
	// UI Derived
	// =============
	
	screenWidth = fetch (UI.ui:screenWidth ui.ui),
	screenHeight = fetch (UI.ui:screenHeight ui.ui),
	
	numTimelines = fetch (length (keys timelines)),
	
	mainScreenWidth = screenWidth,
	mainScreenHeight = subtract screenHeight (multiply numTimelines (plus timelineHeight separatorHeight)),
	
	
	
	// =============
	// State and actions for registering svg line info
	// =============
	
	Link := a, // this will either be a TextLink or TimeLink
	
	SVGStyle := (String, String), // for now, just a color string
	
	ScreenLocation := (Number, Number, Number, Number, Bool), // (x, y, width, height, isHorizontal)
	svgInfo = state(Map Link (ColorStyle, Set (Unit ScreenLocation))),
	
	
	
	mouseOverLink = state(Unit Link),

	svgEvents = template (identifier::a, isHorizontal::Bool, colorStyle::ColorStyle) {
		registerSVG = action (identifier::Link, loc::Unit ScreenLocation) {
			extract reactiveNot (contains (keys svgInfo) identifier) as _ {
				newSet <- create(Set (Unit ScreenLocation)),
				addEntry svgInfo identifier (colorStyle, newSet)
			},
			extract getKey identifier svgInfo as pair {
				mySet = snd pair,
				add mySet loc
			}
		},
		unregisterSVG = action (identifier::Link, loc::Unit ScreenLocation) {
			extract getKey identifier svgInfo as pair {
				mySet = snd pair,
				remove mySet loc,
				extract isEmpty mySet as _ {
					removeEntry svgInfo identifier
				}
			}
		},
		myPos = state(Unit ScreenLocation),
		<f:wrapper>
			<f:on init>
				registerSVG identifier myPos
			</f:on>
			<f:on uninit>
				unregisterSVG identifier myPos
			</f:on>
			<f:on domMove>
				set myPos (event.posX, event.posY, event.targetWidth, event.targetHeight, isHorizontal)
			</f:on>
			<f:on mouseover>
				set mouseOverLink identifier
			</f:on>
			<f:on mouseout>
				unset mouseOverLink
			</f:on>
		</f:wrapper>
	},
	
	
	<div>
		// for reals
		<f:on init>
			initDummyData
		</f:on>
	

		
		// <f:each timelines as index, timeline>
		// 	<div>
		// 		<f:on click>
		// 			timeline_jumpTo timeline (5000, 20)
		// 		</f:on>
		// 		testtt
		// 	</div>
		// </f:each>
		
		// style-background-color="rgba(0,255,0,0.2)"
		<div class="zLines" style-position="absolute" style-left="0" style-top="0" style-width="100%" style-height="100%">
			<svg:svg version="1.1" width="{screenWidth}" height="{screenHeight}">
				<f:each svgInfo as identifier, pair>
					locSet = snd pair,
					colorStyle = fst pair,
					<f:each getByPosition 0 locSet as loc1>
						<f:each getByPosition 1 locSet as loc2>
							// x1 = tuple5get1 (fetch loc1),
							// y1 = tuple5get2 (fetch loc1),
							// width1 = tuple5get3 (fetch loc1),
							// x2 = tuple5get1 (fetch loc2),
							// y2 = tuple5get2 (fetch loc2),
							dAtt = function (loc1::ScreenLocation, loc2::ScreenLocation) {
								function getCenter(loc) {
									return {
										x: loc.asArray[0]+(loc.asArray[2] / 2),
										y: loc.asArray[1]+(loc.asArray[3] / 2)
									};
								}
								var center1 = getCenter(loc1);
								var center2 = getCenter(loc2);
								
								var dist = 100;
								
								function getPointAndVel(center1, center2, loc1) {
									var width = loc1.asArray[2];
									var height = loc1.asArray[3];
									var isHorizontal = loc1.asArray[4];
									var point, vel;
									if (isHorizontal) {
										var multiplier = (center1.x < center2.x) ? 1 : -1;
										point = {
											x: center1.x + (multiplier * width / 2),
											y: center1.y
										};
										vel = {
											x: point.x + (multiplier * dist),
											y: center1.y
										};
									} else {
										var multiplier = (center1.y < center2.y) ? 1 : -1;
										point = {
											x: center1.x,
											y: center1.y + (multiplier * height / 2)
										};
										vel = {
											x: point.x,
											y: center1.y + (multiplier * dist)
										};
									}
									return {point:point, vel:vel};
								}
								
								var pv1 = getPointAndVel(center1, center2, loc1);
								var pv2 = getPointAndVel(center2, center1, loc2);
								
								

								
								return "M "+pv1.point.x+" "+pv1.point.y+" C "+pv1.vel.x+" "+pv1.vel.y+" "+pv2.vel.x+" "+pv2.vel.y+" "+pv2.point.x+" "+pv2.point.y;
							},
							
							isHighlighted = bindUnit (reactiveEqual identifier) mouseOverLink,
							
							<svg:path fill="none" stroke-width="{reactiveIfThen isHighlighted 3 2}" stroke="{colorStyle_getBorder colorStyle isHighlighted}" d="{dAtt (fetch loc1) (fetch loc2)}" />
							
							// <div>{loc1} to {loc2}</div>
						</f:each>
					</f:each>
				</f:each>
			</svg:svg>
		</div>
		
		
		// Workspace area
		<div style-position="absolute" style-left="0" style-top="0" style-width="{mainScreenWidth}" style-height="{mainScreenHeight}">
			<f:each fullscreenVideo as xmlp>
				<f:call>xmlp</f:call>
			</f:each>
			<f:each reactiveNot fullscreenVideo as _>
				<f:call>movieSelector</f:call>
			</f:each>
			
			<div style-position="absolute" style-bottom="16" style-right="0">
				<f:each notePops as index, note>
					<div style-position="relative" style-width="260" style-height="190" style-margin="16" style-float="right">
						<div style-position="absolute" style-width="100%" style-height="100%" class="zBackground" style-background-color="#333" />
						<div style-text-align="right">
							<span class="button">
								(x)
								<f:on click>
									removeEntry notePops index
								</f:on>
							</span>
						</div>
						<f:call>displayNote note</f:call>
					</div>
				</f:each>
			</div>
			
		</div>
		
		
		// Timelines
		<div style-position="absolute" style-bottom="0">
			

			
			<div style-clear="both">
				<f:each timelines as index, timeline>
					<f:wrapper>
						<div style-position="relative" style-width="{screenWidth}" style-height="4" class="separator zBackground" />
						<div style-position="relative" style-width="{screenWidth}" style-height="{timelineHeight}" class="timeline">
							<f:call>timeline_xmlp timeline</f:call>
							// Movie Title
							<div class="titlebar" style-position="absolute" style-left="0" style-top="-26" style-height="20">
								{Movie:title (timeline_movie timeline)}
								<span>
									<f:on click>
										removeEntry timelines index
									</f:on>
									(x)
								</span>
							</div>
						</div>
					</f:wrapper>
				</f:each>
			</div>
		</div>
	</div>
}