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

  inject = action (target::Situation, parent::Situation, child::Situation) {
    parentimage = makeSituation,
    putSituationIn target parentimage,
    pipe1 = makepipe parentimage parent,
    childimage = makeSituation,
    putSituationIn parentimage childimage,
    pipe2 = makepipe childimage child,
    putPipeIn1 pipe2 pipe1,
    pipe1
  },



  init = action () {
    nameSituation tobytest.realLife "Real Life",
    agent = makeSituiationNamedIn "Agent" tobytest.realLife,

    //generic essay structure
    essay = makeSituationNamedIn "Essay" tobytest.reallife,
    ulink = makeSituationNamedIn "Unstructured Link" essay,
    source = makeSituationNamedIn "Source" ulink,
    target = makeSituationNamedIn "Target" ulink,

    //tedg's Moulin Rouge essay
    mressay = makeSituationNamedIn "Tedg's Moulin Rouge Essay" tobytest.realLife,

    //generic movie structure
    movie = makeSituiationNamedIn "Movie" tobytest.realLife,
    making = makeSituiationNamedIn "Movie's Making" movie,
    pres = makeSituiationNamedIn "Movie's Presentation" movie,
    story = makeSituiationNamedIn "Movie's Story" movie,
    video = makeSituiationNamedIn "Video" movie,
    ccaptions = makeSituiationNamedIn "Closed Captions" movie,

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
      pointTotimepoint = makePipeIn1 timelinepoint point lineTotimeline,
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
      mrintomressay = inject mressay mr mrvideo,



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