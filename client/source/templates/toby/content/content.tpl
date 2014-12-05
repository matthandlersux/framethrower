template () {

  // Situation
  //   container: Unit Situation
  //   contains: Set Situation
  //  pipesIn: Set Pipe
  //  pipesOut: Set Pipe
  //  propName: Unit String
  //  propTime: Unit Number
  //
  // Pipe
  //   type: Situation
  //   instance: Situation
  //   container: Map Ord Pipe
  //   contains: Set Pipe
  //   truth: Unit Number
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




  init = action () {
    nameSituation tobytest.realLife "Real Life",
    agent = makeSituiationNamedIn "Agent" tobytest.realLife,

    //generic movie structure
    movie = makeSituiationNamedIn "Movie" tobytest.realLife,
    making = makeSituiationNamedIn "Movie's Making" movie,
    presentation = makeSituiationNamedIn "Movie's Presentation" making,
    story = makeSituiationNamedIn "Movie's Story" presentation,

    //making
      director = makeSituiationNamedIn "Director" making,
      actor = makeSituiationNamedIn "Actor" making,

    //presentation
      cammove = makeSituiationNamedIn "Camera Movements" presentation,
        zooms = makeSituationNamedIn "Zooms" cammove,
          camera = makeSituationNamedIn "Camera" zooms,

    //story
      character = makeSituiationNamedIn "Character" story,

    //genre items
    lovestory = makeSituationNamedIn "Love Story" tobytest.realLife,
    scifi = makeSituationNamedIn "Scifi" tobytest.realLife,
    animation = makeSituationNamedIn "Animation" tobytest.realLife,

    //lovestory
      lover = makeSituationNamedIn "Lover" lovestory,
      loved = makeSituationNamedIn "Loved" lovestory,
      loves = makeSituationNamedIn "Loves" lovestory,
        inlover = makeSituationIn loves,
        inloved = makeSituationIn loves,
      conflict = makeSituationNamedIn "has Conflict with" lovestory,
        fighter1 = makeSituationIn conflict,
        fighter2 = makeSituationIn conflict,

    //scifi
      sentient = makeSituationNamedIn "Sentient Being" scifi,

    //animation
      animator = makeSituationNamedIn "Animation Director" animation,

    //walle things
    walleMovie = makeSituiationNamedIn "Wall-E" tobytest.realLife,
    walleMaking = makeSituiationNamedIn "Wall-E's Making" walleMovie,
        wdirector = makeSituationNamedIn "Andrew Stanton" walleMaking,
        wadirector = makeSituationNamedIn "Angus MacLane" walleMaking,
    wallePres = makeSituiationNamedIn "Wall-E's Presentation" walleMaking,
      wallezoom = makeSituationNamedIn "Zoom" wallePres,
        wcamera = makeSituationIn wallezooms,
        zoomtime = makeSituationNamedIn "4:36" wallezooms,
    walleStory = makeSituationNamedIn "Wall-E's Story" wallePres,

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

    //zeroth level pipes
      relationToInfon = makePipe relation someInfon,
      onScreen1ToInfon = makePipe onScreen1 someInfon,
      onScreen2ToInfon = makePipe onScreen2 someInfon,
      canHappenToRelation = makePipe canHappenAtTime relation,
      canHappenTocammove = makePipe canHappenAtTime cammove,
      cammoveTowallePres = makePipe cammove wallePres,

      //timeline pipes
      timelineToCanHappen = makePipe timeline canHappenAtTime,
      timelineToWalleStory = makePipe timeline walleStory,
      timelineToisBefore = makePipe timeline isBefore,
      timelineTosameTimeAs = makePipe timeline sameTimeAs,
      timelineTointerval = makePipe timeline interval,

      //connection from general movie to wall-e
      movieTowalleMovie = makePipe movie wallemovie,
      makingTowalleMaking = makePipe making walleMaking,
      presTowallePres = makePipe presentation wallePres,
      storyTowalleStory = makePipe story walleStory,

      //connection to/from lovestory
      reallifeTolovesotry = makePipe tobytest.realLife lovestory,
      lovestoryToloves = makePipe lovestory loves,
      lovestoryToconflict = makePipe lovestory conflict,
      lovestoryTowalleStory = makePipe lovestory walleStory,

      //connection to/from scifi
      reallifeToscifi = makePipe tobytest.realLife scifi,
      scifiTowalleStory = makePipe scifi walleStory,

      //connection to/from animation
      reallifeToanimation = makePipe tobytest.realLife animation,
      animationTowalleMaking = makePipe animation walleMaking,


    //first level pipes
      zoomsTowallezoom = makePipeIn1 zooms wallezoom cammoveTowallePres,
      cameraTowcamera = makePipeIn1 camera wcamera zoomsTowallezoom,

      //connection to/from timeline
      timepointTobtimepoint1 = makePipeIn1 timelineTimepoint btimepoint1 timelineToisBefore,
      timepointTobtimepoint2 = makePipeIn1 timelineTimepoint btimepoint2 timelineToisBefore,
      timepointTostimepoint1 = makePipeIn1 timelineTimepoint stimepoint1 timelineTosameTimeAs,
      timepointTostimepoint2 = makePipeIn1 timelineTimepoint stimepoint2 timelineTosameTimeAs,
      timepointToitimepoint1 = makePipeIn1 timelineTimepoint itimepoint1 timelineTointerval,
      timepointToitimepoint2 = makePipeIn1 timelineTimepoint itimepoint2 timelineTointerval,
      intervalToOnScreen1 = makePipeIn1 interval onScreen1 timelineToWalleStory,
      intervalToOnScreen2 = makePipeIn1 interval onScreen2 timelineToWalleStory,
      timepointToCanHappenTimepoint = makePipeIn1 timelineTimepoint timepoint timelineToCanHappen,

      //connection to/from onscreen
      evaToEvaInfon = makePipeIn1 eva evaInfon onScreen1ToInfon,
      walleToWalleInfon = makePipeIn1 walle walleInfon onScreen2ToInfon,

      //connection to/from infon
      relatorToEvaInfon = makePipeIn1 relator evaInfon relationToInfon,
      relateeToWalleInfon = makePipeIn1 relatee walleInfon relationToInfon,

      //connection from general movie to walle
      directorTowdirector = makePipeIn1 director wdirector makingTowalleMaking,
      characterTowalle = makePipeIn1 character walle storyTowalleStory,
      characterToeva = makePipeIn1 character eva storyTowalleStory,


      //connection to/from lovestory
      loverToinlover = makePipeIn1 lover inlover lovestoryToloves,
      lovedToinloved = makePipeIn1 loved inloved lovestoryToloves,
      loverTofighter1 = makePipeIn1 lover fighter1 lovestoryToconflict,
      lovedTofighter2 = makePipeIn1 loved fighter2 lovestoryToconflict,

      //connection to/from scifi
      sentientTowalle = makePipeIn1 sentient walle scifiTowalleStory,
      sentientToeva = makePipeIn1 sentient eva scifiTowalleStory,

      //connection to/from animation
      animatorTowadirector = makePipeIn1 director wadirector animationTowalleMaking,


      //connection from real life
      agentTolover = makePipeIn1 agent lover reallifeTolovestory,
      agentToloved = makePipeIn1 agent loved reallifeTolovestory,
      agentTosentient = makePipeIn1 agent sentient reallifeToscifi,
      agentToanimator = makePipeIn1 agent animator reallifeToanimation,

    //second level pipes
      canHappenTimePointToEvaInfon = makePipeIn2 timePoint timePointInfon canHappenToRelation relationToInfon,
      timepointTozoomtime = makePipeIn2 timepoint zoomtime canHappenTocammov zoomsTowallezoom,

      tobytest.realLife
  },



  print = template(sit::Situation) {
    <div>{Situation:name sit}</div>
  },

  testState = state(Unit Number),

  <div>Hello world.asdf

    //<f:call>videoTimeline 1200 160 test.walleVideo</f:call>
    // <f:call>caseTest</f:call>

    <f:on init>init</f:on>

    test: {Situation:name tobytest.realLife}

    <div>
      <f:on dblclick>
        add(testState, 400)
      </f:on>
      bleh: {testState}
      <svg:svg style-width="500" style-height="300">
        <svg:g transform="translate(250, 150)">
          <f:call>svg tobytest.realLife print Situation:contains 150</f:call>
        </svg:g>
      </svg:svg>
    </div>

    //<f:call>svg</f:call>


    // <svg:svg id="svgelements" style-position="absolute" style-left="100" style-top="400" style-width="500" style-height="500">
    //   <svg:g>
    //     <svg:path d="M 0,50  T300,50" class="link"/>
    //     <f:wrapper>
    //       <svg:path d="M 0,200  T300,200" class="link" />
    //     </f:wrapper>
    //   </svg:g>
    // </svg:svg>

  </div>
}