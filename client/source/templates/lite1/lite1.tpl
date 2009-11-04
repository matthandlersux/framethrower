template () {
	
	// =============
	// Types
	// =============
	
	TimeRange := (Number, Number),
	timeRange_start = fst,
	timeRange_duration = snd,
	
	Movie := (String, Number, Number, List (TimeRange, String)),
	movie_id = tuple4get1,
	movie_duration = tuple4get2,
	movie_aspectRatio = tuple4get3,
	movie_chapters = tuple4get4,
	
	Timeline := (Movie, XMLP, TimeRange -> Action Void),
	timeline_movie = tuple3get1,
	timeline_xmlp = tuple3get2,
	timeline_jumpTo = tuple3get3,
	
	
	// =============
	// State
	// =============
	
	timelines = state(Map Ord Timeline),
	openMovie = action (movie::Movie) {
		
		// TODO
		//existingTimeline = takeOne (filter (timeline -> equal movie (timeline_movie timeline)) (values timelines)),
		
		nextOrd = fetch (getNextOrd timelines),
		addEntry timelines nextOrd (makeTimeline movie)
	},
	jumpToInMovie = action (movie::Movie, timeRange::TimeRange) {
		// TODO
	},
	
	
	// =============
	// UI Constants
	// =============
	
	timelineHeight = 140,
	
	
	// =============
	// UI Derived
	// =============
	
	screenWidth = fetch (UI.ui:screenWidth ui.ui),
	screenHeight = fetch (UI.ui:screenHeight ui.ui),
	
	
	
	
	<div>
		<f:on init>
			openMovie moulinRouge
		</f:on>
		
		// <div>
		// 	<f:on click>
		// 		extract timelines as index, timeline {
		// 			(timeline_jumpTo timeline) (5000, 20)
		// 		}
		// 	</f:on>
		// 	test
		// </div>
		
		<f:each timelines as index, timeline>
			<div>
				<f:on click>
					timeline_jumpTo timeline (5000, 20)
				</f:on>
				testtt
			</div>
		</f:each>
		
		
		<div style-position="absolute" style-bottom="0">
			<f:each timelines as index, timeline>
				// <div style-position="relative" style-width="{screenWidth}" style-height="{timelineHeight}">
				// 					A timeline
				// 				</div>
				<f:call>timeline_xmlp timeline</f:call>
			</f:each>
		</div>
	</div>
}