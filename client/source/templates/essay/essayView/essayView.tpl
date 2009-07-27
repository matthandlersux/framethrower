template (essay::Situation) {
	
	// utility
	getAllContainers = unfoldSet (compose returnUnitSet Situation:container),
	getAllInherits = unfoldSet (compose (mapSet Pipe:type) Situation:asInstance),
	filterByType = type -> filter (x -> isNotEmpty (filter (reactiveEqual type) (getAllInherits x))),
	
	listLast = xs -> head xs, // TODO fix this
	getLastParentPipe = pipe -> mapUnit listLast (Pipe:container pipe),
	
	getInfonsAboutRole = subject -> role -> bindUnitSet getLastParentPipe (filter (pipe -> reactiveEqual role (Pipe:type pipe)) (Situation:asInstance subject)),
	
	getInfonRole = role -> infon -> mapSet Pipe:instance (filter (pipe -> reactiveEqual role (Pipe:type pipe)) (Pipe:contains infon)),
	
	
	
	// constants
	videoTimelineExpandedHeight = 180,
	videoTimelineCollapsedHeight = 16,
	
	
	// state
	videoTimelines = state(Set VideoTimeline),
	popup = state(Unit Popup),
	hoveredInfon = state(Unit Pipe),
	
	
	// things to extract from the essay
	videosFromEssay = filterByType movie (Situation:contains essay),
	

	
	
	<f:wrapper>
		<f:on init>
			universeInit,
			initEssay,
			extract videosFromEssay as movie {
				vt = create(VideoTimeline, {movie: movie}),
				add(videoTimelines, vt)
			}
		</f:on>
		
		<f:call>
			screenWidth = fetch (UI.ui:screenWidth ui.ui),
			screenHeight = fetch (UI.ui:screenHeight ui.ui),
			
			numExpanded = fetch (length (filter (compose reactiveNot VideoTimeline:collapsed) videoTimelines)),
			numCollapsed = fetch (length (filter VideoTimeline:collapsed videoTimelines)),
			videoTimelinesTotalHeight = plus (multiply numExpanded videoTimelineExpandedHeight) (multiply numCollapsed videoTimelineCollapsedHeight),
			essayHeight = subtract screenHeight videoTimelinesTotalHeight,
			
			<div style-position="absolute" style-width="{screenWidth}" style-height="{screenHeight}">
				<div style-position="absolute" style-width="{screenWidth}" style-height="{essayHeight}" style-left="0" style-top="0" style-overflow="auto">
					<f:call>drawEssay</f:call>
				</div>
		
				<div style-position="absolute" style-width="{screenWidth}" style-height="{videoTimelinesTotalHeight}" style-left="0" style-top="{essayHeight}">
					<f:each videoTimelines as videoTimeline>
						<div style-width="{screenWidth}" style-height="{videoTimelineExpandedHeight}">
							<f:call>drawVideoTimeline videoTimeline</f:call>
							// <f:call>
							// 	movie = VideoTimeline:movie videoTimeline,
							// 	timepoints = filterByType timelinePoint (Situation:contains movie) :: Set Situation,
							// 	timeintervals = filterByType lineInterval (Situation:contains movie) :: Set Situation,
							// 	getLinksFromTime = time -> getInfonsAboutRole time ulinkTarget :: Situation -> Set Pipe,
							// 	
							// 	// harold, dunno if you'll need something like these? It builds a set of tuples out of points and the things they link to.
							// 	timepointInfonPairs = mapSet (timepoint -> makeTuple2 (Situation:propTime timepoint) (getLinksFromTime timepoint)) timepoints :: Set (Tuple2 (Unit Number) (Set Pipe)),
							// 	pointsAndLinks = bindSet (pair -> mapUnitSet (mapUnit2 makeTuple2 (fst pair)) (snd pair)) timepointInfonPairs :: Set (Tuple2 Number Pipe),
							// 	
							// 	
							// 	<div style-width="{screenWidth}" style-height="{videoTimelineExpandedHeight}" style-overflow="auto">
							// 		<div>TimePoints:
							// 			<f:each timepoints as timepoint>
							// 				<div>{fetch (Situation:propTime timepoint)} - {getLinksFromTime timepoint}</div>
							// 			</f:each>
							// 		</div>
							// 		<div>Time Intervals:
							// 			<f:each timeintervals as timeinterval>
							// 				intervalInfon = fetch (takeOne (getInfonsAboutRole timeinterval lineHasEndpointsBetween)),
							// 				intervalStart = fetch (takeOne (getInfonRole lineHasEndpointsStart intervalInfon)),
							// 				intervalEnd = fetch (takeOne (getInfonRole lineHasEndpointsEnd intervalInfon)),
							// 				<div>{fetch (Situation:propTime intervalStart)} - {fetch (Situation:propTime intervalEnd)} - {getLinksFromTime timeinterval}</div>
							// 			</f:each>
							// 		</div>
							// 	</div>
							// </f:call>
						</div>
					</f:each>
				</div>
				
				<f:each popup as popup>
					<f:call>drawPopup popup</f:call>
				</f:each>
			</div>
		</f:call>

	</f:wrapper>
}