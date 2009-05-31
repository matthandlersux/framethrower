template () {
	
	// Situation
	// 	container: Unit Situation
	// 	contains: Set Situation
	// 
	// Pipe
	// 	type: Situation
	// 	instance: Situation
	// 	container: Map Ord Pipe
	// 	contains: Set Pipe
	// 	truth: Unit Number
	// 
	// makeSituation :: Action Situation
	// makeSituationNamed :: String -> Action Situation
	// putSituationIn :: Situation -> Situation -> Action
	// makeSituationNamedIn :: String -> Situation -> Action Situation
	// 
	// makePipe :: Situation -> Situation -> Action Pipe
	// putPipeIn1 :: Pipe -> Pipe -> Action
	// putPipeIn2 :: Pipe -> Pipe -> Pipe -> Action
	// putPipeIn3 :: Pipe -> Pipe -> Pipe -> Pipe -> Action
	// putPipeIn4 :: Pipe -> Pipe -> Pipe -> Pipe -> Pipe -> Action
	// 
	// makePipeIn1 :: Situation -> Situation -> Pipe -> Action Pipe
	// makePipeIn2 :: Situation -> Situation -> Pipe -> Pipe -> Action Pipe
	// makePipeIn3 :: Situation -> Situation -> Pipe -> Pipe -> Pipe -> Action Pipe
	// makePipeIn4 :: Situation -> Situation -> Pipe -> Pipe -> Pipe -> Pipe -> Action Pipe
	
	makeSituation = action () {
		create(Situation, {})
	},
	nameSituation = action (sit::Situation, name::String) {
		add(Situation:name sit, name)
	},
	makeSituationNamed = action (name::String) {
		sit = makeSituation,
		nameSituation sit name,
		sit
	},
	putSituationIn = action (parent::Situation, child::Situation) {
		add(Situation:contains child, parent),
		add(Situation:container parent, child)
	},
	makeSituationNamedIn = action (name::String, parent::Situation) {
		sit = makeSituationNamed name,
		putSituationIn parent sit,
		sit
	},
	
	makePipe = action (instance::Situation, type::Situation) {
		pipe = create(Pipe, {instance:instance, type:type}),
		add(Pipe:truth pipe, 1),
		pipe
	},
	putPipeIn1 = action (pipe::Pipe, pipe0::Pipe) {
		add(Pipe:container pipe, numToOrd 0, pipe0),
		add(Pipe:contains pipe0, pipe)
	},
	putPipeIn2 = action (pipe::Pipe, pipe0::Pipe, pipe1::Pipe) {
		add(Pipe:container pipe, numToOrd 0, pipe0),
		add(Pipe:container pipe, numToOrd 1, pipe1),
		add(Pipe:contains pipe0, pipe),
		add(Pipe:contains pipe1, pipe)
	},
	putPipeIn3 = action (pipe::Pipe, pipe0::Pipe, pipe1::Pipe, pipe2::Pipe) {
		add(Pipe:container pipe, numToOrd 0, pipe0),
		add(Pipe:container pipe, numToOrd 1, pipe1),
		add(Pipe:container pipe, numToOrd 2, pipe2),
		add(Pipe:contains pipe0, pipe),
		add(Pipe:contains pipe1, pipe),
		add(Pipe:contains pipe2, pipe)
	},
	putPipeIn4 = action (pipe::Pipe, pipe0::Pipe, pipe1::Pipe, pipe2::Pipe, pipe3::Pipe) {
		add(Pipe:container pipe, numToOrd 0, pipe0),
		add(Pipe:container pipe, numToOrd 1, pipe1),
		add(Pipe:container pipe, numToOrd 2, pipe2),
		add(Pipe:container pipe, numToOrd 3, pipe3),
		add(Pipe:contains pipe0, pipe),
		add(Pipe:contains pipe1, pipe),
		add(Pipe:contains pipe2, pipe),
		add(Pipe:contains pipe3, pipe)
	},
	
	makePipeIn1 = action (instance::Situation, type::Situation, pipe0::Pipe) {
		pipe = makePipe instance type,
		putPipeIn1 pipe pipe0,
		pipe
	},
	makePipeIn2 = action (instance::Situation, type::Situation, pipe0::Pipe, pipe1::Pipe) {
		pipe = makePipe instance type,
		putPipeIn2 pipe pipe0 pipe1,
		pipe
	},
	makePipeIn3 = action (instance::Situation, type::Situation, pipe0::Pipe, pipe1::Pipe, pipe2::Pipe) {
		pipe = makePipe instance type,
		putPipeIn3 pipe pipe0 pipe1 pipe2,
		pipe
	},
	makePipeIn4 = action (instance::Situation, type::Situation, pipe0::Pipe, pipe1::Pipe, pipe2::Pipe, pipe3::Pipe) {
		pipe = makePipe instance type,
		putPipeIn4 pipe pipe0 pipe1 pipe2 pipe3,
		pipe
	},
	
	
	
	
	init = action () {
		nameSituation tobytest.realLife "Real Life",
		makeSituationNamedIn "kills"
	},
	
	
	<div>Hello world.asdf
	
		//<f:call>videoTimeline 1200 160 test.walleVideo</f:call>
		// <f:call>caseTest</f:call>
		
		<f:on init>init</f:on>
		
		test: {Situation:name tobytest.realLife}
		
		<f:call>svg</f:call>
		
		
		// <svg:svg id="svgelements" style-position="absolute" style-left="100" style-top="400" style-width="500" style-height="500">
		// 	<svg:g>
		// 		<svg:path d="M 0,50  T300,50" class="link"/>
		// 		<f:wrapper>
		// 			<svg:path d="M 0,200  T300,200" class="link" />
		// 		</f:wrapper>
		// 	</svg:g>
		// </svg:svg>
		
	</div>
}