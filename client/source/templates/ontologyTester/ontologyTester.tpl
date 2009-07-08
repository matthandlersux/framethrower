template () {
	
	mainSit = state {
		nameSituation tobytest.realLife "Real Life",
		agent = makeSituationNamedIn "Agent" tobytest.realLife,

		//generic essay structure
		essay = makeSituationNamedIn "Essay" tobytest.realLife,
		ulink = makeSituationNamedIn "Unstructured Link" essay,
		source = makeSituationNamedIn "Source" ulink,
		target = makeSituationNamedIn "Target" ulink,

		//tedg's Moulin Rouge essay
		mressay = makeSituationNamedIn "Tedg's Moulin Rouge Essay" tobytest.realLife,

		//generic movie structure
		movie = makeSituationNamedIn "Movie" tobytest.realLife,
		making = makeSituationNamedIn "Movie's Making" movie,
		pres = makeSituationNamedIn "Movie's Presentation" movie,
		story = makeSituationNamedIn "Movie's Story" movie,
		video = makeSituationNamedIn "Video" movie,
		ccaptions = makeSituationNamedIn "Closed Captions" movie,

		//Moulin Rouge
		mr = makeSituationNamedIn "Moulin Rouge" tobytest.realLife, 
		mrvideo = makeSituationNamedIn "Video" mr,
		mrcc = makeSituationNamedIn "Closed Captions" mr,
		mrmaking = makeSituationNamedIn "Making" mr,
		mrpres = makeSituationNamedIn "Presentation" mr,
		mrstory= makeSituationNamedIn "Story" mr,


		//line
		line = makeSituationNamedIn "Line" tobytest.realLife,
		point = makeSituationNamedIn "Point" line,
		linterval = makeSituationNamedIn "Interval" line,
		isLessThan = makeSituationNamedIn "is less than" line,
		cpt1 = makeSituationNamedIn "point" isLessThan,
		cpt2 = makeSituationNamedIn "point" isLessThan,
		hasEndpoints = makeSituationNamedIn "has Endpoints" line,
		start = makeSituationNamedIn "Start" hasEndpoints,
		end = makeSituationNamedIn "End" hasEndpoints,
		between = makeSituationNamedIn "Interval" hasEndpoints,
		length = makeSituationNamedIn "Length" line,

		//timeline
		timeline = makeSituationNamedIn "Timeline" tobytest.realLife,
		timelinePoint = makeSituationNamedIn "time point" timeline,

		//textline
		textline = makeSituationNamedIn "Textline" tobytest.realLife,
		textlinepoint = makeSituationNamedIn "text point" textline,

		//has articfact
		hasArtifact = makeSituationNamedIn "has artifact" tobytest.realLife,
		object = makeSituationNamedIn "object" hasArtifact,
		artifactType = makeSituationNamedIn "artifact type" hasArtifact,

		//has marker
		hasTime = makeSituationNamedIn "has time" tobytest.realLife,
		timeMarked = makeSituationNamedIn "time point" hasTime,
		timeNumber = makeSituationNamedIn "seconds" hasTime, 

		//has video
		hasVideo = makeSituationNamedIn "has video clip" tobytest.realLife,
		textMarked = makeSituationNamedIn "text interval" hasVideo,
		clip = makeSituationNamedIn "video clip" hasVideo,  

		//has name
		hasName = makeSituationNamedIn "has name" tobytest.realLife,
		namedObject = makeSituationNamedIn "object" hasName,
		name = makeSituationNamedIn "name" hasName,

		//zeroth level pipes
			movieTomr = makePipe mr movie,

			//pipes from essay
			essayTomressay = makePipe mressay essay,
			ulinkTomressay = makePipe mressay ulink, 
			ulinkTomressay = makePipe mressay ulink, 
			ulinkTomressay = makePipe mressay ulink, 

			//pipes from line
			lineTotimeline = makePipe timeline line,
			lineTotextline = makePipe textline line,
			lineTohasEndpoints = makePipe hasEndpoints line,
			lineToisLessThan = makePipe isLessThan line,
			hasEndpointsTomressay = makePipe mressay hasEndpoints,

			//pipes from timeline
			timelineTovideo = makePipe video timeline,

			//pipes from textline
			textlineToessay = makePipe essay textline,

			//pipes from hasArtifact
			artifactTotime = makePipe hasTime hasArtifact,
			artifactTovideo = makePipe hasVideo hasArtifact,
			artifactToname = makePipe hasName hasArtifact,

		//first level pipes
			pointTotimepoint = makePipeIn1 timelinePoint point lineTotimeline,
			pointTotextpoint = makePipeIn1 textlinepoint point lineTotextline,
			videoTomrvideo = makePipeIn1 mrvideo video movieTomr,
			ccTomrcc = makePipeIn1 mrcc ccaptions movieTomr, 

			objectTotimeMarked = makePipeIn1 timeMarked object artifactTotime,
			artifactTypeTotimeNumber = makePipeIn1 timeNumber artifactType artifactTotime,

			objectTotextMarked = makePipeIn1 textMarked object artifactTovideo,
			artifactTypeToclip = makePipeIn1 clip artifactType artifactTovideo,

			objectTonamedObject = makePipeIn1 namedObject object artifactToname,
			artifactTypeToname = makePipeIn1 name artifactType artifactToname,

		//second level pipes
			intervalTosource = makePipeIn2 source linterval lineTotextline textlineToessay,

		//injections
			//mrintomressay = inject mressay mr mrvideo, 



			tobytest.realLife
		
	},
	
	
	
	
	
	
	// mainSit = state {
	// 	tester = makeSituationNamed "tester",
	// 	child = makeSituationNamedIn "child" tester,
	// 	tester
	// },
	
	
	situations = state {
		situations = create(Set Situation),
		add(situations, mainSit),
		situations
	},
	
	
	
	
	
	
	
	linkToSit = template (sit::Situation) {
		<span style-color="blue">
			<f:on click>
				add(situations, sit)
			</f:on>
			{Situation:propName sit}
		</span>
	},
	
	situationsCount = length situations,
	divide = function (x::Number, y::Number) {
		return x / y;
	},
	width = mapUnit2 divide (UI.ui:screenWidth ui.ui) situationsCount,
	
	<div style-width="{UI.ui:screenWidth ui.ui}" style-height="{UI.ui:screenHeight ui.ui}">
		<f:each situations as sit>
			
			<div style-position="absolute" style-width="{width}" style-left="{mapUnit2 multiply (getPosition sit situations) width}" style-overflow="auto" style-height="{UI.ui:screenHeight ui.ui}" style-borderRight="1px solid #999">
				<div style-color="red">
					<f:on click>remove(situations, sit)</f:on>
					(Close)
				</div>
				<f:call>viewSituation sit</f:call>
			</div>
		</f:each>
	</div>
}