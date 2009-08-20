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
	// testPopup = <div>
	// 	<f:call>
	// 		extVideo = state {
	// 			create(ExtVideo, {id: "mr", aspectRatio: 2.222, duration: 7668})
	// 		},
	// 		drawVideoPlayer extVideo 2000 10 400
	// 	</f:call>
	// </div>,
	// popup = state {
	// 	popup = create(Unit Popup),
	// 	instance = create(Popup, {content: testPopup, x: 100, y: 100, direction: 1, width: 400, height: 300}),
	// 	add(popup, instance),
	// 	popup
	// },
	
	
	hoveredInfon = state(Unit Pipe),
	hoveredInfonEvents = template (infon::Pipe, direction::Number) {
		<f:wrapper>
			<f:on mouseover>
				set hoveredInfon infon
			</f:on>
			<f:on mouseout>
				unset hoveredInfon
			</f:on>
			<f:on click>
				popupInfon infon event.mouseX event.mouseY direction
			</f:on>
		</f:wrapper>
	},
	
	
	// things to extract from the essay
	videosFromEssay = filterByType movie (Situation:contains essay),
	

	
	
	<f:wrapper>
		<f:on init>
			universeInit,
			initEssay,
			extract videosFromEssay as movie {
				vt <- create(VideoTimeline, {movie: movie}),
				insert videoTimelines vt
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
						</div>
					</f:each>
				</div>
				
				<f:each popup as pop>
					<f:call>drawPopup pop</f:call>
				</f:each>
				
				// <f:on click>
				// 	instance = create(Popup, {content: testPopup, x: event.mouseX, y: event.mouseY, direction: 1, width: 400, height: 300}),
				// 	add(popup, instance)
				// </f:on>
			</div>
		</f:call>

	</f:wrapper>
}