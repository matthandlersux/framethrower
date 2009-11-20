template () {
	
	// =============
	// Types
	// =============
	
	Range := (Number, Number),
	range_start = fst,
	range_duration = snd,
	
	
	
	Timeline := (Movie, XMLP, Range -> Action Void),
	timeline_movie = tuple3get1,
	timeline_xmlp = tuple3get2,
	timeline_jumpTo = tuple3get3,
	
	
	NotePop := XMLP,
	
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
	jumpToInMovie = action (movie::Movie, timeRange::Range) {
		openMovie movie,
		extract filter (timeline -> reactiveEqual movie (timeline_movie timeline)) (values timelines) as timeline {
			timeline_jumpTo timeline timeRange
		}
	},
	
	
	notePops = state(Map Ord Note),
	
	openNote = action (note::Note) {
		extract reactiveNot (isNoteOpen note) as _ {
			nextOrd = fetch (getNextOrd notePops),
			addEntry notePops nextOrd note			
		}
	},
	
	
	// =============
	// Derived State
	// =============
	
	openedMovies = mapSet timeline_movie (values timelines),
	isOpen = movie -> isNotEmpty (filter (reactiveEqual movie) openedMovies),
	openedNotes = values notePops,
	isNoteOpen = note -> isNotEmpty (filter (reactiveEqual note) openedNotes),
	
	// =============
	// UI Constants
	// =============
	
	timelineHeight = 140,
	separatorHeight = 6,
	
	
	// =============
	// UI Derived
	// =============
	
	screenWidth = fetch (UI.ui:screenWidth ui.ui),
	screenHeight = fetch (UI.ui:screenHeight ui.ui),
	
	numTimelines = fetch (length (keys timelines)),
	
	mainScreenWidth = screenWidth,
	mainScreenHeight = subtract screenHeight (multiply numTimelines (plus timelineHeight separatorHeight)),
	
	
	
	
	<div>
		// for reals
		<f:on init>
			initDummyData
		</f:on>
	

		
		// <f:each timelines as index, timeline>
		// 	<div>
		// 		<f:on click>
		// 			timeline_jumpTo timeline (5000, 20)
		// 		</f:on>
		// 		testtt
		// 	</div>
		// </f:each>
		
		<div class="zLines" style-background-color="rgba(0,255,0,0.2)" style-position="absolute" style-left="0" style-top="0" style-width="100%" style-height="100%">
		
		</div>
		
		
		// Workspace area
		<div style-position="absolute" style-left="0" style-top="0" style-width="{mainScreenWidth}" style-height="{mainScreenHeight}">
			<f:each fullscreenVideo as xmlp>
				<f:call>xmlp</f:call>
			</f:each>
			<f:each reactiveNot fullscreenVideo as _>
				<f:call>movieSelector</f:call>
			</f:each>
			
			// <div>
			// 	Jump tester
			// 	<f:on click>
			// 		//openMovie moulinRouge
			// 		jumpToInMovie moulinRouge (4000, 100)
			// 	</f:on>
			// </div>
			
			<div style-position="absolute" style-bottom="16">
				<f:each notePops as index, note>
					<div style-width="260" style-height="190" style-margin="16" style-float="left" style-background-color="#333">
						<div style-text-align="right">
							<span class="button">
								(x)
								<f:on click>
									removeEntry notePops index
								</f:on>
							</span>
						</div>
						<f:call>displayNote note</f:call>
					</div>
				</f:each>
			</div>
			
		</div>
		
		
		// Timelines
		<div style-position="absolute" style-bottom="0">
			

			
			<div style-clear="both">
				<f:each timelines as index, timeline>
					<f:wrapper>
						<div style-position="relative" style-width="{screenWidth}" style-height="4" class="separator zBackground" />
						<div style-position="relative" style-width="{screenWidth}" style-height="{timelineHeight}" class="timeline">
							<f:call>timeline_xmlp timeline</f:call>
							// Movie Title
							<div class="titlebar" style-position="absolute" style-left="0" style-top="-26" style-height="20">
								{Movie:title (timeline_movie timeline)}
								<span>
									<f:on click>
										removeEntry timelines index
									</f:on>
									(x)
								</span>
							</div>
						</div>
					</f:wrapper>
				</f:each>
			</div>
		</div>
	</div>
}