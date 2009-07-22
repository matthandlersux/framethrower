template (essay::Situation) {
	
	
	getAllContainers = unfoldSet (compose returnUnitSet Situation:container),
	getAllInherits = unfoldSet (compose (mapSet Pipe:type) Situation:asInstance),
	
	videosFromEssay = filter (x -> isNotEmpty (filter (reactiveEqual movie) (getAllInherits x))) (Situation:contains essay),
	
	
	
	videoTimelines = state(Set VideoTimeline),
	popup = state(Unit Popup),
	
	videoTimelineExpandedHeight = 180,
	videoTimelineCollapsedHeight = 16,
	
	
	numExpanded = fetch (length (filter (compose reactiveNot VideoTimeline:collapsed) videoTimelines)),
	numCollapsed = fetch (length (filter VideoTimeline:collapsed videoTimelines)),
	videoTimelinesTotalHeight = plus (multiply numExpanded videoTimelineExpandedHeight) (multiply numCollapsed videoTimelineCollapsedHeight),
	

	
	<div>
		<f:on init>
			init,
			extract videosFromEssay as movie {
				vt = create(VideoTimeline, {movie: movie}),
				add(videoTimelines, vt)
			}

		</f:on>
	
		<f:each videosFromEssay as blah>
			<div>{Situation:propName blah}</div>
		</f:each>
		
		{Situation:propName essay}
		<div>
			<f:call>drawEssay</f:call>
		</div>
		{videoTimelinesTotalHeight}
		<f:each videoTimelines as videoTimeline>
			<f:call>drawVideoTimeline videoTimeline</f:call>
		</f:each>
		<f:each popup as popup>
			<f:call>drawPopup popup</f:call>
		</f:each>
	</div>
}