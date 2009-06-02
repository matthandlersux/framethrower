template (width::Unit Number, height::Unit Number) {
	//locations = state(Map Situation ShapePosition),
	timelines = state(Map Situation TimeSelection),
	//popupNav = state(Unit Situation),
	//situations = state(Map Situation childProp),
	
	timelineHeight = 180,
	allTimelinesHeight = mapUnit (multiply timelineHeight) (length (keys timelines)),
	sitViewHeight = mapUnit2 subtract height allTimelinesHeight,
	
	<div>
		<f:on init>
			timeSel = create(TimeSelection),
			add(timelines, tobytest.myTimelineSit, timeSel)
		</f:on>
		<div style-position="absolute" style-width="{width}" style-height="{sitViewHeight}">
			Sit View
		</div>
		<div style-position="absolute" style-width="{width}" style-height="{allTimelinesHeight}" style-top="{sitViewHeight}">
			<f:each timelines as timelineSit, timeSelection>
				video = bindUnit Timeline:video (Situation:propTimeline timelineSit),
				<div style-position="relative" style-width="{width}" style-height="{timelineHeight}">
					<f:each width as width><f:each video as video>
						<f:call>videoTimeline width timelineHeight video timeSelection</f:call>
					</f:each></f:each>
				</div>
			</f:each>
		</div>
	</div>
}