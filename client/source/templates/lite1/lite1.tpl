template () {
	
	// =============
	// Types
	// =============
	
	TimeRange := (Number, Number),
	timeRange_start = fst,
	timeRange_duration = snd,
	
	
	
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
		extract reactiveNot (isOpen movie) as _ {
			nextOrd = fetch (getNextOrd timelines),
			addEntry timelines nextOrd (makeTimeline movie)			
		}
	},
	jumpToInMovie = action (movie::Movie, timeRange::TimeRange) {
		openMovie movie,
		extract filter (timeline -> reactiveEqual movie (timeline_movie timeline)) (values timelines) as timeline {
			timeline_jumpTo timeline timeRange
		}
	},
	
	
	// =============
	// Derived State
	// =============
	
	openedMovies = mapSet timeline_movie (values timelines),
	isOpen = movie -> isNotEmpty (filter (reactiveEqual movie) openedMovies),
	
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
					<f:each movies as movie>
						
						<div style-float="left" style-width="100" style-height="120" style-opacity="{reactiveIfThen (isOpen movie) 0.5 1}">
							<f:on click>
								openMovie movie
							</f:on>
							<div style-width="60" style-height="80" style-background-color="#f0f">
							
							</div>
							{Movie:title movie}
						</div>
					</f:each>
					<div style-clear="both" />
				</div>
			</f:each>
			
			<div>
				Jump tester
				<f:on click>
					//openMovie moulinRouge
					jumpToInMovie moulinRouge (4000, 100)
				</f:on>
			</div>
			
			<div style-position="absolute" style-left="20" style-top="100">
				<f:call>
					px = state(Unit Number),
					py = state(Unit Number),
					<div>
						<f:on domMove>
							set px event.posX,
							set py event.posY
						</f:on>
						{px}, {py}
					</div>
				</f:call>
			</div>
		</div>
		
		
		<div style-position="absolute" style-bottom="0">
			<f:each timelines as index, timeline>
				<div style-position="relative" style-width="{screenWidth}" style-height="{timelineHeight}" class="timeline">
					<f:call>timeline_xmlp timeline</f:call>
					// Movie Title
					<div class="titlebar" style-position="absolute" style-left="0" style-top="-26" style-height="20" style-background-color="#333" style-color="#fff" style-padding="3">
						{Movie:title (timeline_movie timeline)}
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