template () {
	videoTimelines = state(Set VideoTimeline),
	popup = state(Unit Popup),
	
	<div>
		<f:each videoTimelines as videoTimeline>
			<f:call>drawVideoTimeline videoTimeline</f:call>
		</f:each>
		<f:each popup as popup>
			<f:call>drawPopup popup</f:call>
		</f:each>
	</div>
}