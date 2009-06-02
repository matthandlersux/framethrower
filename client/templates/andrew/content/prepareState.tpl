template () {
	// Situation
	// 	container: Unit Situation
	// 	contains: Set Situation
	//	propName: Unit String
	//	propTime: Unit Number
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
		walleStory = makeSituationNamedIn "Wall-E Story" tobytest.realLife,
		
		kills = makeSituationNamedIn "kills" walleStory,
		relation = makeSituationNamedIn "relation" walleStory,
		canHappenAtTime = makeSituationNamedIn "can happen at time" walleStory,
		timeline = makeSituationNamedIn "timeline" walleStory,
		onScreen1 = makeSituationNamedIn "On Screen {T1, T2}" walleStory,
		onScreen2 = makeSituationNamedIn "On Screen {T3, T4}" walleStory,
		someInfon = makeSituationNamedIn "Infon 1" walleStory,
		
		//on screen t1, t2
			eva = makeSituationNamedIn "Eva" onScreen1,
		
		//on screen t3, t4
			walle = makeSituationNamedIn "Wall-E" onScreen2,
		
		//some infon
			evaInfon = makeSituationNamedIn "Eva" someInfon,
			walleInfon = makeSituationNamedIn "Wall-E" someInfon,
			timePointInfon = makeSituationNamedIn "time point" someInfon,
		
		//relation
			relator = makeSituationNamedIn "relator" relation,
			relatee = makeSituationNamedIn "relatee" relation,
		
		//can happen at time
			timePoint = makeSituationNamedIn "time point" canHappenAtTime,
		
		//timeline
			timelineTimePoint = makeSituationNamedIn "time point" timeline,
			isBefore = makeSituationNamedIn "is before" timeline,
			sameTimeAs = makeSituationNamedIn "same time as" timeline,
			interval = makeSituationNamedIn "interval" timeline,
		
		//isBefore
				btimePoint1 = makeSituationNamedIn "time point" isBefore,
				btimepoint2 = makeSituationNamedIn "time point" isBefore,
				
		//sameTimeAs
				stimepoint1 = makeSituationNamedIn "time point" sameTimeAs,
				stimepoint2 = makeSituationNamedIn "time point" sameTimeAs,
				
		//interval 
				itimepoint2 = makeSituationNamedIn "time point" interval,
				itimepoint2 = makeSituationNamedIn "time point" interval,
				interior = makeSituationNamedIn "interior" interval,
			
		//first level pipes
			onScreen1ToInfon = makePipe onScreen1 someInfon,
			onScreen2ToInfon = makePipe onScreen2 someInfon,
			timelineToCanHappen = makePipe timeline canHappenAtTime,
			timelineToWalleStory = makePipe timeline walleStory,
			canHappenToRelation = makePipe canHappenAtTime relation,
			relationToInfon = makePipe relation someInfon,
			timelineToisBefore = makePipe timeline isBefore,
			timelineTosameTimeAs = makePipe timeline sameTimeAs,
			timelineTointerval = makePipe timeline interval,
			
			

			
			//connection to/from onscreen
			evaToEvaInfon = makePipeIn1 eva evaInfon onScreen1ToInfon,
			walleToWalleInfon = makePipeIn1 walle walleInfon onScreen2ToInfon,
			
			//conection to/from infon
			canHappenTimePointToEvaInfon = makePipeIn2 timePoint timePointInfon canHappenToRelation relationToInfon,
			relatorToEvaInfon = makePipeIn1 relator evaInfon relationToInfon,
			relateeToWalleInfon = makePipeIn1 relatee walleInfon relationToInfon,
			tobytest.realLife
	},
	<f:on init>init</f:on>
}