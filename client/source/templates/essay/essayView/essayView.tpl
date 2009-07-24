template (essay::Situation) {
	
	// utility
	getAllContainers = unfoldSet (compose returnUnitSet Situation:container),
	getAllInherits = unfoldSet (compose (mapSet Pipe:type) Situation:asInstance),
	filterByType = type -> filter (x -> isNotEmpty (filter (reactiveEqual type) (getAllInherits x))),
	
	
	// constants
	videoTimelineExpandedHeight = 180,
	videoTimelineCollapsedHeight = 16,
	
	
	// state
	videoTimelines = state(Set VideoTimeline),
	popup = state(Unit Popup),
	
	
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