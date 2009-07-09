template () {
	//videoTimelines = state(Set VideoTimeline),
	videoTimelines = state {
		vts = create(Set VideoTimeline),
		vt = create(VideoTimeline),
		add(vts, vt),
		vts
	},
	popup = state(Unit Popup),
	
	videoTimelineExpandedHeight = 180,
	videoTimelineCollapsedHeight = 16,
	
	// videoTimelinesTotalHeight = {
	// 	numExpandedU = length (filter (compose reactiveNot VideoTimeline:collapsed) videoTimelines),
	// 	numCollapsedU = length (filter VideoTimeline:collapsed videoTimelines),
	// 	numExpanded = fetch numExpandedU,
	// 	numCollapsed = fetch numCollapsedU,
	// 	plus (multiply numExpanded videoTimelineExpandedHeight) (multiply numCollapsed videoTimelineCollapsedHeight)
	// },

	
	<div>
		<div>
			<f:call>drawEssay</f:call>
		</div>
		<f:each videoTimelines as videoTimeline>
			<f:call>drawVideoTimeline videoTimeline</f:call>
		</f:each>
		<f:each popup as popup>
			<f:call>drawPopup popup</f:call>
		</f:each>
	</div>
}