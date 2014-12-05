template () {

  //functions

  //automates copying a situation into another one and piping it
  // Sit -> Sit -> Sit
  smudgeInto = action (ObjectToCopy::Situation, Situation::Situation) {
    target = create(Situation),
    putSituationIn Situation Target,
    //check for pipe between the parent of objectToCopy and the situation
    makePipe ObjectToCopy target,
    target
  },

  //automates making a pipe between a story and a prototype situation and then connecting two
  //    within that pipe
  // Sit -> Sit -> Sit -> Sit -> Sit -> Sit -> Pipe
  relateStoryToWithObjects = action (story::Situation, relation::Situation, storyObject1::Situation, relationObject1::Situation, storyObject2::Situation, relationObject2::Situation) {
    pipe = makePipe relation story,
    makePipeIn1 storyObject1 relationObject1 pipe,
    makePipeIn1 storyObject2 relationObject2 pipe,
    pipe
  },
  WalleToRealLifePipe = makePipe walleStory tobytest.realLife,

  //types in real life
  Robot = makeSituationNamedIn "robot" tobytest.realLife,
  Person = makeSituationNamedIn "person" tobytest.realLife,
  Spaceship = makeSituationNamedIn "spaceship" tobytest.realLife,
  Adjective = makeSituationNamedIn "adjective" tobytest.realLife,
  Fat = makeSituationNamedIn "fat" tobytest.realLife,
    makePipe Adjective Fat,
  Many = makeSituationNamedIn "many" tobytest.realLife,
  ManySituation = makeSituationNamedIn "object" Many,
    makePipeIn1 Person ManySituation (makePipe tobytest.realLife Many),

  //situations in real life
  HelloDolly = makeSituationNamedIn "Hello Dolly" tobytest.realLife,
  Couple = makeSituationNamedIn "couple" tobytest.realLife,
    CoupleObject1 = makeSituationNamedIn "object 1" Couple,
    CoupleObject2 = makeSituationNamedIn "object 2" Couple,

  //relation situations in real life
  FallsInLove = makeSituationNamedIn "falls in love with" tobytest.realLife,
    Lover =  makeSituationNamedIn "lover" FallsInLove,
    Lovee =  makeSituationNamedIn "lovee" FallsInLove,
  HasQuality = makeSituationNamedIn "has quality" tobytest.realLife,
    HasQualitySituation = makeSituationNamedIn "situation" HasQuality,
    HasQualityQuality = makeSituationNamedIn "quality" HasQuality,
  Watches = makeSituationNamedIn "watches" tobytest.realLife,
    Watcher = makeSituationNamedIn "watcher" Watches,
    Watched = makeSituationNamedIn "watched" Watches,

  //situations in walle
  Futuristic = makeSituationNamedIn "futuristic" walleStory,
    makePipeIn1 Adjective Futuristic WalleToRealLifePipe, //futuristic is an adjective in walle
    makePipeIn1 SpaceRobot HasQualitySituation WalleHasQualityPipe, //spacerobots have a quality
    makePipeIn1 Futuristic HasQualityQuality WalleHasQualityPipe, //that quality is futuristic
  walleAndEva = makeSituationNamedIn "walle and eva" walleStory,



  //types in walle
  EarthRobot = makeSituationNamedIn "earth robot" walleStory,
    makePipe Robot EarthRobot,
  SpaceRobot = makeSituationNamedIn "space robot" walleStory,
    makePipe Robot SpaceRobot,
  Humans = makeSituationNamedIn "humans" walleStory,
    makePipeIn1 Humans ManySituation (makePipe walleStory Many), //humans is many human
    WalleHasQualityPipe = makePipe walleStory HasQuality,
    makePipeIn1 Humans HasQualitySituation WalleHasQualityPipe,
    makePipeIn2 Fat HasQualityQuality WalleToRealLifePipe WalleHasQualityPipe, //in walle story, humans have quality fat

  //relations piped to walle
  FallsInLoveInWalle = relateStoryToWithObjects walleStory FallsInLove walle Lover eva Lovee,
  WalleAndEvaCouple = relateStoryToWithObjects walleStory Couple walle
  WatchesInWalle = relateStoryToWithObjects walleStory Watches walleAndEva watcher HelloDolly watched,





  //infons in walle





  pipe

}