template () {
	
	// ==============================================================
	// Utility Functions
	// ==============================================================
	
	divide = function (x::Number, y::Number)::Number {
		return x / y;
	},
	swapDivide = function (x, y) {
		return y / x;
	},
	multiply = function (x, y) {
		return x * y;
	},
	min = function (x, y) {
		return Math.min(x, y);
	},
	max = function (x, y) {
		return Math.max(x, y);
	},
	abs = function (x) {
		return Math.abs(x);
	},
	concat = function (s::String, t::String)::String {
		return s+t;
	},
	
	
	// ==============================================================
	// Population Actions
	// ==============================================================
	
	makeSituation = action () {
		create(Situation, {})
	},
	nameSituation = action (sit::Situation, name::String) {
		add(Situation:propName sit, name)
	},
	timeSituation = action (sit::Situation, time::Number) {
		add(Situation:propTime sit, time)
	},
	makeSituationNamed = action (name::String) {
		sit = makeSituation,
		nameSituation sit name,
		sit
	},
	putSituationIn = action (parent::Situation, child::Situation) {
		add(Situation:contains parent, child),
		add(Situation:container child, parent)
	},
	makeSituationNamedIn = action (name::String, parent::Situation) {
		sit = makeSituationNamed name,
		putSituationIn parent sit,
		sit
	},
	
	makePipe = action (instance::Situation, type::Situation) {
		pipe = create(Pipe, {instance:instance, type:type}),
		add(Pipe:truth pipe, 1),
		add(Situation:pipesOut instance, pipe),
		add(Situation:pipesIn type, pipe),
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
	
	
	// ==============================================================
	// Population Init
	// ==============================================================
	
	init = action () {
		nameSituation tobytest.realLife "Real Life",
		
		nameSituation tobytest.myTimelineSit "wall-e timeline",
		timeline = create(Timeline, {duration: 5894.139}),
		add(Timeline:video timeline, test.walleVideo),
		add(Situation:propTimeline tobytest.myTimelineSit, timeline),
		
		s1 = makeSituationNamedIn "blah" tobytest.realLife,
		s2 = makeSituationNamedIn "blah2" s1,
		tobytest.realLife
	},
	
	
	
	
	
	// ==============================================================
	// Draw it
	// ==============================================================
	
	<f:wrapper>
		<f:on init>init</f:on>
		<f:call>top (UI.ui:screenWidth ui.ui) (UI.ui:screenHeight ui.ui)</f:call>
	</f:wrapper>
}