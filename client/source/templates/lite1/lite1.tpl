template () {
	
	// =============
	// Types
	// =============
	
	TimeRange := (Number, Number),
	timeRange_start = fst,
	timeRange_duration = snd,
	
	Movie := (String, String, Number, Number, List (TimeRange, String)),
	movie_id = tuple5get1,
	movie_title = tuple5get2,
	movie_duration = tuple5get3,
	movie_aspectRatio = tuple5get4,
	movie_chapters = tuple5get5,
	
	Timeline := (Movie, XMLP, TimeRange -> Action Void),
	timeline_movie = tuple3get1,
	timeline_xmlp = tuple3get2,
	timeline_jumpTo = tuple3get3,
	
	
	// =============
	// State
	// =============
	
	timelines = state(Map Ord Timeline),
	
	fullscreenVideo = state(Unit XMLP),
	
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
	
	numTimelines = fetch (length (keys timelines)),
	
	mainScreenWidth = screenWidth,
	mainScreenHeight = subtract screenHeight (multiply numTimelines timelineHeight),
	
	
	
	
	<div>
		<f:on init>
			openMovie moulinRouge
		</f:on>
		

		
		// <f:each timelines as index, timeline>
		// 	<div>
		// 		<f:on click>
		// 			timeline_jumpTo timeline (5000, 20)
		// 		</f:on>
		// 		testtt
		// 	</div>
		// </f:each>
		
		<div style-position="absolute" style-left="0" style-top="0" style-width="{mainScreenWidth}" style-height="{mainScreenHeight}">
			<f:each fullscreenVideo as xmlp>
				<f:call>xmlp</f:call>
			</f:each>
			<f:each reactiveNot fullscreenVideo as _>
				<div>
					Movies:
					<f:each movies as movie>
						<div>
							<f:on click>
								openMovie movie
							</f:on>
							{movie_title movie}
						</div>
					</f:each>
				</div>
			</f:each>
		</div>
		
		
		<div style-position="absolute" style-bottom="0">
			<f:each timelines as index, timeline>
				<div style-position="relative" style-width="{screenWidth}" style-height="{timelineHeight}">
					<f:call>timeline_xmlp timeline</f:call>
					// Movie Title
					<div style-position="absolute" style-left="0" style-top="0" style-background-color="rgba(0,0,0,0.5)">
						{movie_title (timeline_movie timeline)}
						<span>
							<f:on click>
								removeEntry timelines index
							</f:on>
							(x)
						</span>
					</div>
				</div>
			</f:each>
		</div>
	</div>
}