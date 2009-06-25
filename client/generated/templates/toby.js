var mainTemplate = {
	'kind': "lineTemplate",
	'template': {
		'kind': "templateCode",
		'params': [

		],
		'type': "XMLP",
		'let': {
			'divide': {
				'kind': "lineJavascript",
				'type': "t0 -> t1 -> t2",
				'f': function ( x,  y) {
        return x / y;
    }
			},
			'swapDivide': {
				'kind': "lineJavascript",
				'type': "t0 -> t1 -> t2",
				'f': function ( x,  y) {
        return y / x;
    }
			},
			'multiply': {
				'kind': "lineJavascript",
				'type': "t0 -> t1 -> t2",
				'f': function ( x,  y) {
        return x * y;
    }
			},
			'min': {
				'kind': "lineJavascript",
				'type': "t0 -> t1 -> t2",
				'f': function ( x,  y) {
        return Math.min(x, y);
    }
			},
			'max': {
				'kind': "lineJavascript",
				'type': "t0 -> t1 -> t2",
				'f': function ( x,  y) {
        return Math.max(x, y);
    }
			},
			'abs': {
				'kind': "lineJavascript",
				'type': "t0 -> t1",
				'f': function ( x) {
        return Math.abs(x);
    }
			},
			'content': {
				'kind': "lineTemplate",
				'template': {
					'kind': "templateCode",
					'params': [

					],
					'type': "XMLP",
					'let': {
						'makeSituation': {
							'kind': "lineAction",
							'action': {
								'kind': "action",
								'params': [

								],
								'type': "Action",
								'actions': [
									{
										'action': {
											'kind': "actionCreate",
											'type': "Situation",
											'prop': {

											}
										}
									}
								]
							}
						},
						'nameSituation': {
							'kind': "lineAction",
							'action': {
								'kind': "action",
								'params': [
									"sit",
									"name"
								],
								'type': "(Situation) -> (String) -> Action",
								'actions': [
									{
										'action': {
											'kind': "actionUpdate",
											'target': "Situation:propName sit",
											'actionType': "add",
											'key': "name",
											'value': undefined
										}
									}
								]
							}
						},
						'timeSituation': {
							'kind': "lineAction",
							'action': {
								'kind': "action",
								'params': [
									"sit",
									"time"
								],
								'type': "(Situation) -> (Number) -> Action",
								'actions': [
									{
										'action': {
											'kind': "actionUpdate",
											'target': "Situation:propTime sit",
											'actionType': "add",
											'key': "time",
											'value': undefined
										}
									}
								]
							}
						},
						'makeSituationNamed': {
							'kind': "lineAction",
							'action': {
								'kind': "action",
								'params': [
									"name"
								],
								'type': "(String) -> Action",
								'actions': [
									{
										'name': "sit",
										'action': {
											'kind': "lineExpr",
											'expr': "makeSituation",
											'let': {

											}
										}
									},
									{
										'action': {
											'kind': "lineExpr",
											'expr': "nameSituation sit name",
											'let': {

											}
										}
									},
									{
										'action': {
											'kind': "lineExpr",
											'expr': "sit",
											'let': {

											}
										}
									}
								]
							}
						},
						'putSituationIn': {
							'kind': "lineAction",
							'action': {
								'kind': "action",
								'params': [
									"parent",
									"child"
								],
								'type': "(Situation) -> (Situation) -> Action",
								'actions': [
									{
										'action': {
											'kind': "actionUpdate",
											'target': "Situation:contains parent",
											'actionType': "add",
											'key': "child",
											'value': undefined
										}
									},
									{
										'action': {
											'kind': "actionUpdate",
											'target': "Situation:container child",
											'actionType': "add",
											'key': "parent",
											'value': undefined
										}
									}
								]
							}
						},
						'makeSituationNamedIn': {
							'kind': "lineAction",
							'action': {
								'kind': "action",
								'params': [
									"name",
									"parent"
								],
								'type': "(String) -> (Situation) -> Action",
								'actions': [
									{
										'name': "sit",
										'action': {
											'kind': "lineExpr",
											'expr': "makeSituationNamed name",
											'let': {

											}
										}
									},
									{
										'action': {
											'kind': "lineExpr",
											'expr': "putSituationIn parent sit",
											'let': {

											}
										}
									},
									{
										'action': {
											'kind': "lineExpr",
											'expr': "sit",
											'let': {

											}
										}
									}
								]
							}
						},
						'makePipe': {
							'kind': "lineAction",
							'action': {
								'kind': "action",
								'params': [
									"instance",
									"type"
								],
								'type': "(Situation) -> (Situation) -> Action",
								'actions': [
									{
										'name': "pipe",
										'action': {
											'kind': "actionCreate",
											'type': "Pipe",
											'prop': {
												'instance': "instance",
												'type': "type"
											}
										}
									},
									{
										'action': {
											'kind': "actionUpdate",
											'target': "Pipe:truth pipe",
											'actionType': "add",
											'key': "1",
											'value': undefined
										}
									},
									{
										'action': {
											'kind': "actionUpdate",
											'target': "Situation:pipesOut instance",
											'actionType': "add",
											'key': "pipe",
											'value': undefined
										}
									},
									{
										'action': {
											'kind': "actionUpdate",
											'target': "Situation:pipesIn type",
											'actionType': "add",
											'key': "pipe",
											'value': undefined
										}
									},
									{
										'action': {
											'kind': "lineExpr",
											'expr': "pipe",
											'let': {

											}
										}
									}
								]
							}
						},
						'putPipeIn1': {
							'kind': "lineAction",
							'action': {
								'kind': "action",
								'params': [
									"pipe",
									"pipe0"
								],
								'type': "(Pipe) -> (Pipe) -> Action",
								'actions': [
									{
										'action': {
											'kind': "actionUpdate",
											'target': "Pipe:container pipe",
											'actionType': "add",
											'key': "numToOrd 0",
											'value': "pipe0"
										}
									},
									{
										'action': {
											'kind': "actionUpdate",
											'target': "Pipe:contains pipe0",
											'actionType': "add",
											'key': "pipe",
											'value': undefined
										}
									}
								]
							}
						},
						'putPipeIn2': {
							'kind': "lineAction",
							'action': {
								'kind': "action",
								'params': [
									"pipe",
									"pipe0",
									"pipe1"
								],
								'type': "(Pipe) -> (Pipe) -> (Pipe) -> Action",
								'actions': [
									{
										'action': {
											'kind': "actionUpdate",
											'target': "Pipe:container pipe",
											'actionType': "add",
											'key': "numToOrd 0",
											'value': "pipe0"
										}
									},
									{
										'action': {
											'kind': "actionUpdate",
											'target': "Pipe:container pipe",
											'actionType': "add",
											'key': "numToOrd 1",
											'value': "pipe1"
										}
									},
									{
										'action': {
											'kind': "actionUpdate",
											'target': "Pipe:contains pipe0",
											'actionType': "add",
											'key': "pipe",
											'value': undefined
										}
									},
									{
										'action': {
											'kind': "actionUpdate",
											'target': "Pipe:contains pipe1",
											'actionType': "add",
											'key': "pipe",
											'value': undefined
										}
									}
								]
							}
						},
						'putPipeIn3': {
							'kind': "lineAction",
							'action': {
								'kind': "action",
								'params': [
									"pipe",
									"pipe0",
									"pipe1",
									"pipe2"
								],
								'type': "(Pipe) -> (Pipe) -> (Pipe) -> (Pipe) -> Action",
								'actions': [
									{
										'action': {
											'kind': "actionUpdate",
											'target': "Pipe:container pipe",
											'actionType': "add",
											'key': "numToOrd 0",
											'value': "pipe0"
										}
									},
									{
										'action': {
											'kind': "actionUpdate",
											'target': "Pipe:container pipe",
											'actionType': "add",
											'key': "numToOrd 1",
											'value': "pipe1"
										}
									},
									{
										'action': {
											'kind': "actionUpdate",
											'target': "Pipe:container pipe",
											'actionType': "add",
											'key': "numToOrd 2",
											'value': "pipe2"
										}
									},
									{
										'action': {
											'kind': "actionUpdate",
											'target': "Pipe:contains pipe0",
											'actionType': "add",
											'key': "pipe",
											'value': undefined
										}
									},
									{
										'action': {
											'kind': "actionUpdate",
											'target': "Pipe:contains pipe1",
											'actionType': "add",
											'key': "pipe",
											'value': undefined
										}
									},
									{
										'action': {
											'kind': "actionUpdate",
											'target': "Pipe:contains pipe2",
											'actionType': "add",
											'key': "pipe",
											'value': undefined
										}
									}
								]
							}
						},
						'putPipeIn4': {
							'kind': "lineAction",
							'action': {
								'kind': "action",
								'params': [
									"pipe",
									"pipe0",
									"pipe1",
									"pipe2",
									"pipe3"
								],
								'type': "(Pipe) -> (Pipe) -> (Pipe) -> (Pipe) -> (Pipe) -> Action",
								'actions': [
									{
										'action': {
											'kind': "actionUpdate",
											'target': "Pipe:container pipe",
											'actionType': "add",
											'key': "numToOrd 0",
											'value': "pipe0"
										}
									},
									{
										'action': {
											'kind': "actionUpdate",
											'target': "Pipe:container pipe",
											'actionType': "add",
											'key': "numToOrd 1",
											'value': "pipe1"
										}
									},
									{
										'action': {
											'kind': "actionUpdate",
											'target': "Pipe:container pipe",
											'actionType': "add",
											'key': "numToOrd 2",
											'value': "pipe2"
										}
									},
									{
										'action': {
											'kind': "actionUpdate",
											'target': "Pipe:container pipe",
											'actionType': "add",
											'key': "numToOrd 3",
											'value': "pipe3"
										}
									},
									{
										'action': {
											'kind': "actionUpdate",
											'target': "Pipe:contains pipe0",
											'actionType': "add",
											'key': "pipe",
											'value': undefined
										}
									},
									{
										'action': {
											'kind': "actionUpdate",
											'target': "Pipe:contains pipe1",
											'actionType': "add",
											'key': "pipe",
											'value': undefined
										}
									},
									{
										'action': {
											'kind': "actionUpdate",
											'target': "Pipe:contains pipe2",
											'actionType': "add",
											'key': "pipe",
											'value': undefined
										}
									},
									{
										'action': {
											'kind': "actionUpdate",
											'target': "Pipe:contains pipe3",
											'actionType': "add",
											'key': "pipe",
											'value': undefined
										}
									}
								]
							}
						},
						'makePipeIn1': {
							'kind': "lineAction",
							'action': {
								'kind': "action",
								'params': [
									"instance",
									"type",
									"pipe0"
								],
								'type': "(Situation) -> (Situation) -> (Pipe) -> Action",
								'actions': [
									{
										'name': "pipe",
										'action': {
											'kind': "lineExpr",
											'expr': "makePipe instance type",
											'let': {

											}
										}
									},
									{
										'action': {
											'kind': "lineExpr",
											'expr': "putPipeIn1 pipe pipe0",
											'let': {

											}
										}
									},
									{
										'action': {
											'kind': "lineExpr",
											'expr': "pipe",
											'let': {

											}
										}
									}
								]
							}
						},
						'makePipeIn2': {
							'kind': "lineAction",
							'action': {
								'kind': "action",
								'params': [
									"instance",
									"type",
									"pipe0",
									"pipe1"
								],
								'type': "(Situation) -> (Situation) -> (Pipe) -> (Pipe) -> Action",
								'actions': [
									{
										'name': "pipe",
										'action': {
											'kind': "lineExpr",
											'expr': "makePipe instance type",
											'let': {

											}
										}
									},
									{
										'action': {
											'kind': "lineExpr",
											'expr': "putPipeIn2 pipe pipe0 pipe1",
											'let': {

											}
										}
									},
									{
										'action': {
											'kind': "lineExpr",
											'expr': "pipe",
											'let': {

											}
										}
									}
								]
							}
						},
						'makePipeIn3': {
							'kind': "lineAction",
							'action': {
								'kind': "action",
								'params': [
									"instance",
									"type",
									"pipe0",
									"pipe1",
									"pipe2"
								],
								'type': "(Situation) -> (Situation) -> (Pipe) -> (Pipe) -> (Pipe) -> Action",
								'actions': [
									{
										'name': "pipe",
										'action': {
											'kind': "lineExpr",
											'expr': "makePipe instance type",
											'let': {

											}
										}
									},
									{
										'action': {
											'kind': "lineExpr",
											'expr': "putPipeIn3 pipe pipe0 pipe1 pipe2",
											'let': {

											}
										}
									},
									{
										'action': {
											'kind': "lineExpr",
											'expr': "pipe",
											'let': {

											}
										}
									}
								]
							}
						},
						'makePipeIn4': {
							'kind': "lineAction",
							'action': {
								'kind': "action",
								'params': [
									"instance",
									"type",
									"pipe0",
									"pipe1",
									"pipe2",
									"pipe3"
								],
								'type': "(Situation) -> (Situation) -> (Pipe) -> (Pipe) -> (Pipe) -> (Pipe) -> Action",
								'actions': [
									{
										'name': "pipe",
										'action': {
											'kind': "lineExpr",
											'expr': "makePipe instance type",
											'let': {

											}
										}
									},
									{
										'action': {
											'kind': "lineExpr",
											'expr': "putPipeIn4 pipe pipe0 pipe1 pipe2 pipe3",
											'let': {

											}
										}
									},
									{
										'action': {
											'kind': "lineExpr",
											'expr': "pipe",
											'let': {

											}
										}
									}
								]
							}
						},
						'init': {
							'kind': "lineAction",
							'action': {
								'kind': "action",
								'params': [

								],
								'type': "Action",
								'actions': [
									{
										'action': {
											'kind': "lineExpr",
											'expr': "nameSituation tobytest.realLife \"Real Life\"",
											'let': {

											}
										}
									},
									{
										'name': "walleStory",
										'action': {
											'kind': "lineExpr",
											'expr': "makeSituationNamedIn \"Wall-E Story\" tobytest.realLife",
											'let': {

											}
										}
									},
									{
										'name': "kills",
										'action': {
											'kind': "lineExpr",
											'expr': "makeSituationNamedIn \"kills\" walleStory",
											'let': {

											}
										}
									},
									{
										'name': "relation",
										'action': {
											'kind': "lineExpr",
											'expr': "makeSituationNamedIn \"relation\" walleStory",
											'let': {

											}
										}
									},
									{
										'name': "canHappenAtTime",
										'action': {
											'kind': "lineExpr",
											'expr': "makeSituationNamedIn \"can happen at time\" walleStory",
											'let': {

											}
										}
									},
									{
										'name': "timeline",
										'action': {
											'kind': "lineExpr",
											'expr': "makeSituationNamedIn \"timeline\" walleStory",
											'let': {

											}
										}
									},
									{
										'name': "onScreen1",
										'action': {
											'kind': "lineExpr",
											'expr': "makeSituationNamedIn \"On Screen { T1 , T2 }\" walleStory",
											'let': {

											}
										}
									},
									{
										'name': "onScreen2",
										'action': {
											'kind': "lineExpr",
											'expr': "makeSituationNamedIn \"On Screen { T3 , T4 }\" walleStory",
											'let': {

											}
										}
									},
									{
										'name': "someInfon",
										'action': {
											'kind': "lineExpr",
											'expr': "makeSituationNamedIn \"Infon 1\" walleStory",
											'let': {

											}
										}
									},
									{
										'name': "eva",
										'action': {
											'kind': "lineExpr",
											'expr': "makeSituationNamedIn \"Eva\" onScreen1",
											'let': {

											}
										}
									},
									{
										'name': "walle",
										'action': {
											'kind': "lineExpr",
											'expr': "makeSituationNamedIn \"Wall-E\" onScreen2",
											'let': {

											}
										}
									},
									{
										'name': "evaInfon",
										'action': {
											'kind': "lineExpr",
											'expr': "makeSituationNamedIn \"Eva\" someInfon",
											'let': {

											}
										}
									},
									{
										'name': "walleInfon",
										'action': {
											'kind': "lineExpr",
											'expr': "makeSituationNamedIn \"Wall-E\" someInfon",
											'let': {

											}
										}
									},
									{
										'name': "timePointInfon",
										'action': {
											'kind': "lineExpr",
											'expr': "makeSituationNamedIn \"time point\" someInfon",
											'let': {

											}
										}
									},
									{
										'name': "relator",
										'action': {
											'kind': "lineExpr",
											'expr': "makeSituationNamedIn \"relator\" relation",
											'let': {

											}
										}
									},
									{
										'name': "relatee",
										'action': {
											'kind': "lineExpr",
											'expr': "makeSituationNamedIn \"relatee\" relation",
											'let': {

											}
										}
									},
									{
										'name': "timePoint",
										'action': {
											'kind': "lineExpr",
											'expr': "makeSituationNamedIn \"time point\" canHappenAtTime",
											'let': {

											}
										}
									},
									{
										'name': "timelineTimePoint",
										'action': {
											'kind': "lineExpr",
											'expr': "makeSituationNamedIn \"time point\" timeline",
											'let': {

											}
										}
									},
									{
										'name': "isBefore",
										'action': {
											'kind': "lineExpr",
											'expr': "makeSituationNamedIn \"is before\" timeline",
											'let': {

											}
										}
									},
									{
										'name': "sameTimeAs",
										'action': {
											'kind': "lineExpr",
											'expr': "makeSituationNamedIn \"same time as\" timeline",
											'let': {

											}
										}
									},
									{
										'name': "interval",
										'action': {
											'kind': "lineExpr",
											'expr': "makeSituationNamedIn \"interval\" timeline",
											'let': {

											}
										}
									},
									{
										'name': "btimePoint1",
										'action': {
											'kind': "lineExpr",
											'expr': "makeSituationNamedIn \"time point\" isBefore",
											'let': {

											}
										}
									},
									{
										'name': "btimepoint2",
										'action': {
											'kind': "lineExpr",
											'expr': "makeSituationNamedIn \"time point\" isBefore",
											'let': {

											}
										}
									},
									{
										'name': "stimepoint1",
										'action': {
											'kind': "lineExpr",
											'expr': "makeSituationNamedIn \"time point\" sameTimeAs",
											'let': {

											}
										}
									},
									{
										'name': "stimepoint2",
										'action': {
											'kind': "lineExpr",
											'expr': "makeSituationNamedIn \"time point\" sameTimeAs",
											'let': {

											}
										}
									},
									{
										'name': "itimepoint2",
										'action': {
											'kind': "lineExpr",
											'expr': "makeSituationNamedIn \"time point\" interval",
											'let': {

											}
										}
									},
									{
										'name': "itimepoint2",
										'action': {
											'kind': "lineExpr",
											'expr': "makeSituationNamedIn \"time point\" interval",
											'let': {

											}
										}
									},
									{
										'name': "interior",
										'action': {
											'kind': "lineExpr",
											'expr': "makeSituationNamedIn \"interior\" interval",
											'let': {

											}
										}
									},
									{
										'name': "onScreen1ToInfon",
										'action': {
											'kind': "lineExpr",
											'expr': "makePipe onScreen1 someInfon",
											'let': {

											}
										}
									},
									{
										'name': "onScreen2ToInfon",
										'action': {
											'kind': "lineExpr",
											'expr': "makePipe onScreen2 someInfon",
											'let': {

											}
										}
									},
									{
										'name': "timelineToCanHappen",
										'action': {
											'kind': "lineExpr",
											'expr': "makePipe timeline canHappenAtTime",
											'let': {

											}
										}
									},
									{
										'name': "timelineToWalleStory",
										'action': {
											'kind': "lineExpr",
											'expr': "makePipe timeline walleStory",
											'let': {

											}
										}
									},
									{
										'name': "canHappenToRelation",
										'action': {
											'kind': "lineExpr",
											'expr': "makePipe canHappenAtTime relation",
											'let': {

											}
										}
									},
									{
										'name': "relationToInfon",
										'action': {
											'kind': "lineExpr",
											'expr': "makePipe relation someInfon",
											'let': {

											}
										}
									},
									{
										'name': "timelineToisBefore",
										'action': {
											'kind': "lineExpr",
											'expr': "makePipe timeline isBefore",
											'let': {

											}
										}
									},
									{
										'name': "timelineTosameTimeAs",
										'action': {
											'kind': "lineExpr",
											'expr': "makePipe timeline sameTimeAs",
											'let': {

											}
										}
									},
									{
										'name': "timelineTointerval",
										'action': {
											'kind': "lineExpr",
											'expr': "makePipe timeline interval",
											'let': {

											}
										}
									},
									{
										'name': "timepointTobtimepoint1",
										'action': {
											'kind': "lineExpr",
											'expr': "makePipeIn1 timelineTimepoint btimepoint1 timelineToisBefore",
											'let': {

											}
										}
									},
									{
										'name': "timepointTobtimepoint2",
										'action': {
											'kind': "lineExpr",
											'expr': "makePipeIn1 timelineTimepoint btimepoint2 timelineToisBefore",
											'let': {

											}
										}
									},
									{
										'name': "timepointTostimepoint1",
										'action': {
											'kind': "lineExpr",
											'expr': "makePipeIn1 timelineTimepoint stimepoint1 timelineTosameTimeAs",
											'let': {

											}
										}
									},
									{
										'name': "timepointTostimepoint2",
										'action': {
											'kind': "lineExpr",
											'expr': "makePipeIn1 timelineTimepoint stimepoint2 timelineTosameTimeAs",
											'let': {

											}
										}
									},
									{
										'name': "timepointToitimepoint1",
										'action': {
											'kind': "lineExpr",
											'expr': "makePipeIn1 timelineTimepoint itimepoint1 timelineTointerval",
											'let': {

											}
										}
									},
									{
										'name': "timepointToitimepoint2",
										'action': {
											'kind': "lineExpr",
											'expr': "makePipeIn1 timelineTimepoint itimepoint2 timelineTointerval",
											'let': {

											}
										}
									},
									{
										'name': "intervalToOnScreen1",
										'action': {
											'kind': "lineExpr",
											'expr': "makePipeIn1 interval onScreen1 timelineToWalleStory",
											'let': {

											}
										}
									},
									{
										'name': "intervalToOnScreen2",
										'action': {
											'kind': "lineExpr",
											'expr': "makePipeIn1 interval onScreen2 timelineToWalleStory",
											'let': {

											}
										}
									},
									{
										'name': "timepointToCanHappenTimepoint",
										'action': {
											'kind': "lineExpr",
											'expr': "makePipeIn1 timelineTimepoint timepoint timelineToCanHappen",
											'let': {

											}
										}
									},
									{
										'name': "evaToEvaInfon",
										'action': {
											'kind': "lineExpr",
											'expr': "makePipeIn1 eva evaInfon onScreen1ToInfon",
											'let': {

											}
										}
									},
									{
										'name': "walleToWalleInfon",
										'action': {
											'kind': "lineExpr",
											'expr': "makePipeIn1 walle walleInfon onScreen2ToInfon",
											'let': {

											}
										}
									},
									{
										'name': "canHappenTimePointToEvaInfon",
										'action': {
											'kind': "lineExpr",
											'expr': "makePipeIn2 timePoint timePointInfon canHappenToRelation relationToInfon",
											'let': {

											}
										}
									},
									{
										'name': "relatorToEvaInfon",
										'action': {
											'kind': "lineExpr",
											'expr': "makePipeIn1 relator evaInfon relationToInfon",
											'let': {

											}
										}
									},
									{
										'name': "relateeToWalleInfon",
										'action': {
											'kind': "lineExpr",
											'expr': "makePipeIn1 relatee walleInfon relationToInfon",
											'let': {

											}
										}
									},
									{
										'action': {
											'kind': "lineExpr",
											'expr': "tobytest.realLife",
											'let': {

											}
										}
									}
								]
							}
						},
						'print': {
							'kind': "lineTemplate",
							'template': {
								'kind': "templateCode",
								'params': [
									"sit"
								],
								'type': "(Situation) -> XMLP",
								'let': {

								},
								'output': {
									'kind': "lineXML",
									'xml': {
										'kind': "element",
										'nodeName': "div",
										'attributes': {

										},
										'style': {

										},
										'children': [
											{
												'kind': "textElement",
												'nodeValue': {
													'kind': "insert",
													'expr': "Situation:name sit"
												}
											}
										]
									}
								}
							}
						},
						'testState': {
							'kind': "lineState",
							'action': {
								'kind': "action",
								'params': [

								],
								'type': "Action",
								'actions': [
									{
										'action': {
											'kind': "actionCreate",
											'type': "Unit Number",
											'prop': {

											}
										}
									}
								]
							}
						},
						'caseTest': {
							'kind': "lineTemplate",
							'template': {
								'kind': "templateCode",
								'params': [

								],
								'type': "XMLP",
								'let': {
									'test': {
										'kind': "lineState",
										'action': {
											'kind': "action",
											'params': [

											],
											'type': "Action",
											'actions': [
												{
													'action': {
														'kind': "actionCreate",
														'type': "Unit Number",
														'prop': {

														}
													}
												}
											]
										}
									}
								},
								'output': {
									'kind': "lineXML",
									'xml': {
										'kind': "element",
										'nodeName': "div",
										'attributes': {

										},
										'style': {

										},
										'children': [
											{
												'kind': "textElement",
												'nodeValue': "\n        "
											},
											{
												'kind': "call",
												'templateCode': {
													'kind': "templateCode",
													'params': [

													],
													'type': "XMLP",
													'let': {

													},
													'output': {
														'kind': "lineXML",
														'xml': {
															'kind': "case",
															'test': "test",
															'templateCode': {
																'kind': "templateCode",
																'params': [
																	"hello"
																],
																'type': "t0 -> XMLP",
																'let': {

																},
																'output': {
																	'kind': "lineXML",
																	'xml': {
																		'kind': "element",
																		'nodeName': "div",
																		'attributes': {

																		},
																		'style': {

																		},
																		'children': [
																			{
																				'kind': "textElement",
																				'nodeValue': "Test has value: "
																			},
																			{
																				'kind': "textElement",
																				'nodeValue': {
																					'kind': "insert",
																					'expr': "hello"
																				}
																			}
																		]
																	}
																}
															},
															'otherwise': {
																'kind': "templateCode",
																'params': [

																],
																'type': "XMLP",
																'let': {

																},
																'output': {
																	'kind': "lineXML",
																	'xml': {
																		'kind': "element",
																		'nodeName': "div",
																		'attributes': {

																		},
																		'style': {

																		},
																		'children': [
																			{
																				'kind': "textElement",
																				'nodeValue': "Test has no value"
																			}
																		]
																	}
																}
															}
														}
													}
												}
											},
											{
												'kind': "textElement",
												'nodeValue': "\n        "
											},
											{
												'kind': "element",
												'nodeName': "div",
												'attributes': {

												},
												'style': {

												},
												'children': [
													{
														'kind': "textElement",
														'nodeValue': "\n            "
													},
													{
														'kind': "on",
														'event': "click",
														'action': {
															'kind': "action",
															'params': [

															],
															'type': "Action",
															'actions': [
																{
																	'action': {
																		'kind': "actionUpdate",
																		'target': "test",
																		'actionType': "add",
																		'key': "77",
																		'value': undefined
																	}
																}
															]
														}
													},
													{
														'kind': "textElement",
														'nodeValue': "\n            Change it!\n        "
													}
												]
											},
											{
												'kind': "textElement",
												'nodeValue': "\n        "
											},
											{
												'kind': "element",
												'nodeName': "div",
												'attributes': {

												},
												'style': {

												},
												'children': [
													{
														'kind': "textElement",
														'nodeValue': "\n            "
													},
													{
														'kind': "on",
														'event': "click",
														'action': {
															'kind': "action",
															'params': [

															],
															'type': "Action",
															'actions': [
																{
																	'action': {
																		'kind': "actionUpdate",
																		'target': "test",
																		'actionType': "remove",
																		'key': undefined,
																		'value': undefined
																	}
																}
															]
														}
													},
													{
														'kind': "textElement",
														'nodeValue': "\n            Remove it!\n        "
													}
												]
											},
											{
												'kind': "textElement",
												'nodeValue': "\n    "
											}
										]
									}
								}
							}
						},
						'populate': {
							'kind': "lineTemplate",
							'template': {
								'kind': "templateCode",
								'params': [

								],
								'type': "XMLP",
								'let': {

								},
								'output': {
									'kind': "lineXML",
									'xml': {
										'kind': "element",
										'nodeName': "div",
										'attributes': {

										},
										'style': {

										},
										'children': [

										]
									}
								}
							}
						},
						'svg': {
							'kind': "lineTemplate",
							'template': {
								'kind': "templateCode",
								'params': [
									"focus",
									"print",
									"getChildren",
									"scale"
								],
								'type': "(t0) -> (t1) -> (t2) -> (t3) -> XMLP",
								'let': {
									'polarCartX': {
										'kind': "lineJavascript",
										'type': "(Number) -> (Number) -> t0",
										'f': function ( radius,  theta) {
        return Math.cos(theta) * radius;
    }
									},
									'polarCartY': {
										'kind': "lineJavascript",
										'type': "(Number) -> (Number) -> t0",
										'f': function ( radius,  theta) {
        return Math.sin(theta) * radius;
    }
									},
									'children': {
										'kind': "lineExpr",
										'expr': "getChildren focus",
										'let': {

										}
									}
								},
								'output': {
									'kind': "lineXML",
									'xml': {
										'kind': "element",
										'nodeName': "f:wrapper",
										'attributes': {

										},
										'style': {

										},
										'children': [
											{
												'kind': "element",
												'nodeName': "svg:circle",
												'attributes': {
													'cx': "0",
													'cy': "0",
													'r': {
														'kind': "insert",
														'expr': "scale"
													},
													'fill': "none",
													'stroke': "black"
												},
												'style': {

												},
												'children': [

												]
											}
										]
									}
								}
							}
						},
						'videoTimeline': {
							'kind': "lineTemplate",
							'template': {
								'kind': "templateCode",
								'params': [
									"width",
									"height",
									"video"
								],
								'type': "(Number) -> (Number) -> (X.video) -> XMLP",
								'let': {
									'videoWidth': {
										'kind': "lineExpr",
										'expr': "X.video:width video",
										'let': {

										}
									},
									'videoHeight': {
										'kind': "lineExpr",
										'expr': "X.video:height video",
										'let': {

										}
									},
									'duration': {
										'kind': "lineExpr",
										'expr': "X.video:duration video",
										'let': {

										}
									},
									'url': {
										'kind': "lineExpr",
										'expr': "X.video:url video",
										'let': {

										}
									},
									'timeLoaded': {
										'kind': "lineState",
										'action': {
											'kind': "action",
											'params': [

											],
											'type': "Action",
											'actions': [
												{
													'action': {
														'kind': "actionCreate",
														'type': "Unit Number",
														'prop': {

														}
													}
												}
											]
										}
									},
									'previewTime': {
										'kind': "lineState",
										'action': {
											'kind': "action",
											'params': [

											],
											'type': "Action",
											'actions': [
												{
													'action': {
														'kind': "actionCreate",
														'type': "Unit Number",
														'prop': {

														}
													}
												}
											]
										}
									},
									'currentTime': {
										'kind': "lineState",
										'action': {
											'kind': "action",
											'params': [

											],
											'type': "Action",
											'actions': [
												{
													'action': {
														'kind': "actionCreate",
														'type': "Unit Number",
														'prop': {

														}
													}
												}
											]
										}
									},
									'selectionStart': {
										'kind': "lineState",
										'action': {
											'kind': "action",
											'params': [

											],
											'type': "Action",
											'actions': [
												{
													'action': {
														'kind': "actionCreate",
														'type': "Unit Number",
														'prop': {

														}
													}
												}
											]
										}
									},
									'selectionEnd': {
										'kind': "lineState",
										'action': {
											'kind': "action",
											'params': [

											],
											'type': "Action",
											'actions': [
												{
													'action': {
														'kind': "actionCreate",
														'type': "Unit Number",
														'prop': {

														}
													}
												}
											]
										}
									},
									'selecting': {
										'kind': "lineState",
										'action': {
											'kind': "action",
											'params': [

											],
											'type': "Action",
											'actions': [
												{
													'action': {
														'kind': "actionCreate",
														'type': "Unit Null",
														'prop': {

														}
													}
												}
											]
										}
									},
									'selectionMin': {
										'kind': "lineExpr",
										'expr': "mapUnit2 min selectionStart selectionEnd",
										'let': {

										}
									},
									'selectionDur': {
										'kind': "lineExpr",
										'expr': "mapUnit2 (x -> y -> abs (subtract x y)) selectionStart selectionEnd",
										'let': {

										}
									},
									'zoomWidth': {
										'kind': "lineState",
										'action': {
											'kind': "action",
											'params': [

											],
											'type': "Action",
											'actions': [
												{
													'action': {
														'kind': "actionCreate",
														'type': "Unit Number",
														'prop': {

														}
													}
												}
											]
										}
									},
									'drawCuts': {
										'kind': "lineJavascript",
										'type': "(JSON) -> (Number) -> t0",
										'f': function ( cuts,  multiplier) {
    var ret = createEl("div");
    forEach(cuts, function (cut) {
        var d = createEl("div");
        d.className = "ruler-notch-3";
        d.style.left = (cut * multiplier) + "px";
        ret.appendChild(d);
    });
    return makeXMLP({node: ret, cleanup: null});
}
									},
									'quicktime': {
										'kind': "lineJavascript",
										'type': "(Number) -> (Number) -> (String) -> (Unit Number) -> (Unit Number) -> t0",
										'f': function ( width,  height,  src,  gotoTime,  timeLoaded) {
    
    function makeQTMovie(src, width, height, autoplay) {
        var mov = createEl("embed");

        function setAtt(name, value) {
            setAttr(mov, name, value);
        }
        
        setAtt("width", width);
        setAtt("height", height);
        setAtt("enablejavascript", "true");
        setAtt("postdomevents", "true");
        setAtt("scale", "aspect");
        setAtt("controller", "false");

        if (autoplay) {
            setAtt("autoplay", "true");        
        } else {
            setAtt("autoplay", "false");
        }

        setAtt("src", src);
                                        
        return mov;

    }
    
    
    var mov = makeQTMovie(src, width, height, false);
    
    var cleanupFuncs = new Array();
    
    cleanupFuncs.push(evaluateAndInject(gotoTime, emptyFunction, function (time) {
        try {
            mov.SetTime(time * mov.GetTimeScale());
        } catch (e) {
            
        }
    }));
    
    mov.addEventListener("qt_progress", function () {
        timeLoaded.control.add(mov.GetMaxTimeLoaded() / mov.GetTimeScale());
    }, true);
    
    
    function cleanup() {
        forEach(cleanupFuncs, function (f) {
            f();
        });
    }
    
    var ret = makeXMLP({node: mov, cleanup: cleanup});
    
    return ret;
}
									}
								},
								'output': {
									'kind': "lineXML",
									'xml': {
										'kind': "for-each",
										'select': "videoWidth",
										'templateCode': {
											'kind': "templateCode",
											'params': [
												"videoWidth"
											],
											'type': "(t0) -> XMLP",
											'let': {

											},
											'output': {
												'kind': "lineXML",
												'xml': {
													'kind': "for-each",
													'select': "videoHeight",
													'templateCode': {
														'kind': "templateCode",
														'params': [
															"videoHeight"
														],
														'type': "(t0) -> XMLP",
														'let': {

														},
														'output': {
															'kind': "lineXML",
															'xml': {
																'kind': "for-each",
																'select': "duration",
																'templateCode': {
																	'kind': "templateCode",
																	'params': [
																		"duration"
																	],
																	'type': "(t0) -> XMLP",
																	'let': {

																	},
																	'output': {
																		'kind': "lineXML",
																		'xml': {
																			'kind': "for-each",
																			'select': "url",
																			'templateCode': {
																				'kind': "templateCode",
																				'params': [
																					"url"
																				],
																				'type': "(t0) -> XMLP",
																				'let': {
																					'drawTimeline': {
																						'kind': "lineTemplate",
																						'template': {
																							'kind': "templateCode",
																							'params': [
																								"width",
																								"height"
																							],
																							'type': "(t0) -> (t1) -> XMLP",
																							'let': {

																							},
																							'output': {
																								'kind': "lineXML",
																								'xml': {
																									'kind': "element",
																									'nodeName': "div",
																									'attributes': {
																										'class': "timeline-container"
																									},
																									'style': {
																										'width': {
																											'kind': "insert",
																											'expr': "width"
																										},
																										'height': {
																											'kind': "insert",
																											'expr': "height"
																										},
																										'color': "white"
																									},
																									'children': [
																										{
																											'kind': "textElement",
																											'nodeValue': "\n                "
																										},
																										{
																											'kind': "for-each",
																											'select': "zoomWidth",
																											'templateCode': {
																												'kind': "templateCode",
																												'params': [
																													"zoomWidth"
																												],
																												'type': "(t0) -> XMLP",
																												'let': {
																													'timeMultiplier': {
																														'kind': "lineExpr",
																														'expr': "divide duration zoomWidth",
																														'let': {

																														}
																													}
																												},
																												'output': {
																													'kind': "lineXML",
																													'xml': {
																														'kind': "element",
																														'nodeName': "div",
																														'attributes': {
																															'class': "ruler-container"
																														},
																														'style': {
																															'width': {
																																'kind': "insert",
																																'expr': "zoomWidth"
																															}
																														},
																														'children': [
																															{
																																'kind': "textElement",
																																'nodeValue': "\n                        "
																															},
																															{
																																'kind': "on",
																																'event': "mousemove",
																																'action': {
																																	'kind': "action",
																																	'params': [

																																	],
																																	'type': "Action",
																																	'actions': [
																																		{
																																			'action': {
																																				'kind': "actionUpdate",
																																				'target': "previewTime",
																																				'actionType': "add",
																																				'key': "multiply timeMultiplier event.offsetX",
																																				'value': undefined
																																			}
																																		}
																																	]
																																}
																															},
																															{
																																'kind': "textElement",
																																'nodeValue': "\n                        "
																															},
																															{
																																'kind': "on",
																																'event': "click",
																																'action': {
																																	'kind': "action",
																																	'params': [

																																	],
																																	'type': "Action",
																																	'actions': [
																																		{
																																			'action': {
																																				'kind': "actionUpdate",
																																				'target': "currentTime",
																																				'actionType': "add",
																																				'key': "multiply timeMultiplier event.offsetX",
																																				'value': undefined
																																			}
																																		},
																																		{
																																			'action': {
																																				'kind': "actionUpdate",
																																				'target': "selectionStart",
																																				'actionType': "remove",
																																				'key': undefined,
																																				'value': undefined
																																			}
																																		},
																																		{
																																			'action': {
																																				'kind': "actionUpdate",
																																				'target': "selectionEnd",
																																				'actionType': "remove",
																																				'key': undefined,
																																				'value': undefined
																																			}
																																		}
																																	]
																																}
																															},
																															{
																																'kind': "textElement",
																																'nodeValue': "\n                        \n                        "
																															},
																															{
																																'kind': "on",
																																'event': "mousedown",
																																'action': {
																																	'kind': "action",
																																	'params': [

																																	],
																																	'type': "Action",
																																	'actions': [
																																		{
																																			'name': "start",
																																			'action': {
																																				'kind': "lineExpr",
																																				'expr': "multiply timeMultiplier event.offsetX",
																																				'let': {

																																				}
																																			}
																																		},
																																		{
																																			'action': {
																																				'kind': "actionUpdate",
																																				'target': "selectionStart",
																																				'actionType': "add",
																																				'key': "start",
																																				'value': undefined
																																			}
																																		},
																																		{
																																			'action': {
																																				'kind': "actionUpdate",
																																				'target': "selectionEnd",
																																				'actionType': "add",
																																				'key': "start",
																																				'value': undefined
																																			}
																																		},
																																		{
																																			'action': {
																																				'kind': "actionUpdate",
																																				'target': "selecting",
																																				'actionType': "add",
																																				'key': "null",
																																				'value': undefined
																																			}
																																		},
																																		{
																																			'action': {
																																				'kind': "actionUpdate",
																																				'target': "currentTime",
																																				'actionType': "remove",
																																				'key': undefined,
																																				'value': undefined
																																			}
																																		}
																																	]
																																}
																															},
																															{
																																'kind': "textElement",
																																'nodeValue': "\n                        "
																															},
																															{
																																'kind': "on",
																																'event': "mouseup",
																																'action': {
																																	'kind': "action",
																																	'params': [

																																	],
																																	'type': "Action",
																																	'actions': [
																																		{
																																			'action': {
																																				'kind': "actionUpdate",
																																				'target': "selecting",
																																				'actionType': "remove",
																																				'key': undefined,
																																				'value': undefined
																																			}
																																		}
																																	]
																																}
																															},
																															{
																																'kind': "textElement",
																																'nodeValue': "\n                        "
																															},
																															{
																																'kind': "for-each",
																																'select': "selecting",
																																'templateCode': {
																																	'kind': "templateCode",
																																	'params': [
																																		"_"
																																	],
																																	'type': "(t0) -> XMLP",
																																	'let': {

																																	},
																																	'output': {
																																		'kind': "lineXML",
																																		'xml': {
																																			'kind': "on",
																																			'event': "mousemove",
																																			'action': {
																																				'kind': "action",
																																				'params': [

																																				],
																																				'type': "Action",
																																				'actions': [
																																					{
																																						'action': {
																																							'kind': "actionUpdate",
																																							'target': "selectionEnd",
																																							'actionType': "add",
																																							'key': "multiply timeMultiplier event.offsetX",
																																							'value': undefined
																																						}
																																					}
																																				]
																																			}
																																		}
																																	}
																																}
																															},
																															{
																																'kind': "textElement",
																																'nodeValue': "\n                        \n                                                                                                                                                \n                        "
																															},
																															{
																																'kind': "element",
																																'nodeName': "div",
																																'attributes': {
																																	'class': "timeline-loading"
																																},
																																'style': {
																																	'width': {
																																		'kind': "insert",
																																		'expr': "mapUnit (swap divide timeMultiplier) timeLoaded"
																																	}
																																},
																																'children': [

																																]
																															},
																															{
																																'kind': "textElement",
																																'nodeValue': "\n\n                        \n                        "
																															},
																															{
																																'kind': "for-each",
																																'select': "X.video:cuts video",
																																'templateCode': {
																																	'kind': "templateCode",
																																	'params': [
																																		"cuts"
																																	],
																																	'type': "(t0) -> XMLP",
																																	'let': {

																																	},
																																	'output': {
																																		'kind': "lineXML",
																																		'xml': {
																																			'kind': "call",
																																			'templateCode': {
																																				'kind': "templateCode",
																																				'params': [

																																				],
																																				'type': "XMLP",
																																				'let': {

																																				},
																																				'output': {
																																					'kind': "lineExpr",
																																					'expr': "drawCuts cuts (divide 0.0417083322 timeMultiplier)",
																																					'let': {

																																					}
																																				}
																																			}
																																		}
																																	}
																																}
																															},
																															{
																																'kind': "textElement",
																																'nodeValue': "\n                        \n                        \n                                                \n                        "
																															},
																															{
																																'kind': "element",
																																'nodeName': "div",
																																'attributes': {
																																	'class': "ruler-cursor"
																																},
																																'style': {
																																	'left': {
																																		'kind': "insert",
																																		'expr': "defaultValue -10 (mapUnit (swap divide timeMultiplier) previewTime)"
																																	}
																																},
																																'children': [

																																]
																															},
																															{
																																'kind': "textElement",
																																'nodeValue': "\n                        \n                        "
																															},
																															{
																																'kind': "element",
																																'nodeName': "div",
																																'attributes': {
																																	'class': "ruler-selected"
																																},
																																'style': {
																																	'left': {
																																		'kind': "insert",
																																		'expr': "defaultValue -10 (mapUnit (swap divide timeMultiplier) currentTime)"
																																	}
																																},
																																'children': [

																																]
																															},
																															{
																																'kind': "textElement",
																																'nodeValue': "\n                        \n                        "
																															},
																															{
																																'kind': "element",
																																'nodeName': "div",
																																'attributes': {
																																	'class': "ruler-selected-range"
																																},
																																'style': {
																																	'left': {
																																		'kind': "insert",
																																		'expr': "defaultValue -10 (mapUnit (swap divide timeMultiplier) selectionMin)"
																																	},
																																	'width': {
																																		'kind': "insert",
																																		'expr': "defaultValue 0 (mapUnit (swap divide timeMultiplier) selectionDur)"
																																	}
																																},
																																'children': [

																																]
																															},
																															{
																																'kind': "textElement",
																																'nodeValue': "\n\n                                                                                                                                                \n\n                        \n                    "
																															}
																														]
																													}
																												}
																											}
																										},
																										{
																											'kind': "textElement",
																											'nodeValue': "\n\n            "
																										}
																									]
																								}
																							}
																						}
																					},
																					'drawPreview': {
																						'kind': "lineTemplate",
																						'template': {
																							'kind': "templateCode",
																							'params': [
																								"width",
																								"height"
																							],
																							'type': "(t0) -> (t1) -> XMLP",
																							'let': {

																							},
																							'output': {
																								'kind': "lineXML",
																								'xml': {
																									'kind': "element",
																									'nodeName': "div",
																									'attributes': {
																										'class': "timeline-preview"
																									},
																									'style': {
																										'width': {
																											'kind': "insert",
																											'expr': "width"
																										},
																										'height': {
																											'kind': "insert",
																											'expr': "height"
																										}
																									},
																									'children': [
																										{
																											'kind': "textElement",
																											'nodeValue': "\n                "
																										},
																										{
																											'kind': "call",
																											'templateCode': {
																												'kind': "templateCode",
																												'params': [

																												],
																												'type': "XMLP",
																												'let': {

																												},
																												'output': {
																													'kind': "lineExpr",
																													'expr': "quicktime width height url previewTime timeLoaded",
																													'let': {

																													}
																												}
																											}
																										},
																										{
																											'kind': "textElement",
																											'nodeValue': "\n            "
																										}
																									]
																								}
																							}
																						}
																					},
																					'ratio': {
																						'kind': "lineExpr",
																						'expr': "divide videoWidth videoHeight",
																						'let': {

																						}
																					},
																					'scaledHeight': {
																						'kind': "lineExpr",
																						'expr': "height",
																						'let': {

																						}
																					},
																					'scaledWidth': {
																						'kind': "lineExpr",
																						'expr': "multiply ratio scaledHeight",
																						'let': {

																						}
																					},
																					'timelineWidth': {
																						'kind': "lineExpr",
																						'expr': "subtract width scaledWidth",
																						'let': {

																						}
																					},
																					'timelineControlsWidth': {
																						'kind': "lineExpr",
																						'expr': "20",
																						'let': {

																						}
																					}
																				},
																				'output': {
																					'kind': "lineXML",
																					'xml': {
																						'kind': "element",
																						'nodeName': "div",
																						'attributes': {

																						},
																						'style': {
																							'width': {
																								'kind': "insert",
																								'expr': "width"
																							},
																							'height': {
																								'kind': "insert",
																								'expr': "height"
																							}
																						},
																						'children': [
																							{
																								'kind': "textElement",
																								'nodeValue': "\n            "
																							},
																							{
																								'kind': "on",
																								'event': "init",
																								'action': {
																									'kind': "action",
																									'params': [

																									],
																									'type': "Action",
																									'actions': [
																										{
																											'action': {
																												'kind': "actionUpdate",
																												'target': "zoomWidth",
																												'actionType': "add",
																												'key': "3000",
																												'value': undefined
																											}
																										}
																									]
																								}
																							},
																							{
																								'kind': "textElement",
																								'nodeValue': "\n            "
																							},
																							{
																								'kind': "element",
																								'nodeName': "div",
																								'attributes': {
																									'class': "timeline-left"
																								},
																								'style': {
																									'width': {
																										'kind': "insert",
																										'expr': "timelineWidth"
																									},
																									'height': {
																										'kind': "insert",
																										'expr': "height"
																									}
																								},
																								'children': [
																									{
																										'kind': "textElement",
																										'nodeValue': "\n                "
																									},
																									{
																										'kind': "element",
																										'nodeName': "div",
																										'attributes': {
																											'class': "timeline-controls"
																										},
																										'style': {
																											'width': {
																												'kind': "insert",
																												'expr': "timelineControlsWidth"
																											},
																											'height': {
																												'kind': "insert",
																												'expr': "height"
																											}
																										},
																										'children': [
																											{
																												'kind': "textElement",
																												'nodeValue': "\n                    "
																											},
																											{
																												'kind': "for-each",
																												'select': "zoomWidth",
																												'templateCode': {
																													'kind': "templateCode",
																													'params': [
																														"zoomWidthValue"
																													],
																													'type': "(t0) -> XMLP",
																													'let': {

																													},
																													'output': {
																														'kind': "lineXML",
																														'xml': {
																															'kind': "element",
																															'nodeName': "f:wrapper",
																															'attributes': {

																															},
																															'style': {

																															},
																															'children': [
																																{
																																	'kind': "element",
																																	'nodeName': "div",
																																	'attributes': {
																																		'class': "button-zoomIn"
																																	},
																																	'style': {

																																	},
																																	'children': [
																																		{
																																			'kind': "textElement",
																																			'nodeValue': "\n                                "
																																		},
																																		{
																																			'kind': "on",
																																			'event': "click",
																																			'action': {
																																				'kind': "action",
																																				'params': [

																																				],
																																				'type': "Action",
																																				'actions': [
																																					{
																																						'action': {
																																							'kind': "actionUpdate",
																																							'target': "zoomWidth",
																																							'actionType': "add",
																																							'key': "multiply zoomWidthValue 1.5",
																																							'value': undefined
																																						}
																																					}
																																				]
																																			}
																																		},
																																		{
																																			'kind': "textElement",
																																			'nodeValue': "\n                            "
																																		}
																																	]
																																},
																																{
																																	'kind': "element",
																																	'nodeName': "div",
																																	'attributes': {
																																		'class': "button-zoomOut"
																																	},
																																	'style': {

																																	},
																																	'children': [
																																		{
																																			'kind': "textElement",
																																			'nodeValue': "\n                                "
																																		},
																																		{
																																			'kind': "on",
																																			'event': "click",
																																			'action': {
																																				'kind': "action",
																																				'params': [

																																				],
																																				'type': "Action",
																																				'actions': [
																																					{
																																						'action': {
																																							'kind': "actionUpdate",
																																							'target': "zoomWidth",
																																							'actionType': "add",
																																							'key': "divide zoomWidthValue 1.5",
																																							'value': undefined
																																						}
																																					}
																																				]
																																			}
																																		},
																																		{
																																			'kind': "textElement",
																																			'nodeValue': "\n                            "
																																		}
																																	]
																																}
																															]
																														}
																													}
																												}
																											},
																											{
																												'kind': "textElement",
																												'nodeValue': "\n                "
																											}
																										]
																									},
																									{
																										'kind': "textElement",
																										'nodeValue': "\n                "
																									},
																									{
																										'kind': "element",
																										'nodeName': "div",
																										'attributes': {

																										},
																										'style': {
																											'position': "absolute",
																											'left': {
																												'kind': "insert",
																												'expr': "timelineControlsWidth"
																											}
																										},
																										'children': [
																											{
																												'kind': "textElement",
																												'nodeValue': "\n                    "
																											},
																											{
																												'kind': "call",
																												'templateCode': {
																													'kind': "templateCode",
																													'params': [

																													],
																													'type': "XMLP",
																													'let': {

																													},
																													'output': {
																														'kind': "lineExpr",
																														'expr': "drawTimeline (subtract timelineWidth timelineControlsWidth) height",
																														'let': {

																														}
																													}
																												}
																											},
																											{
																												'kind': "textElement",
																												'nodeValue': "\n                "
																											}
																										]
																									},
																									{
																										'kind': "textElement",
																										'nodeValue': "\n            "
																									}
																								]
																							},
																							{
																								'kind': "textElement",
																								'nodeValue': "\n            \n            "
																							},
																							{
																								'kind': "element",
																								'nodeName': "div",
																								'attributes': {

																								},
																								'style': {
																									'position': "absolute",
																									'left': {
																										'kind': "insert",
																										'expr': "timelineWidth"
																									}
																								},
																								'children': [
																									{
																										'kind': "textElement",
																										'nodeValue': "\n                "
																									},
																									{
																										'kind': "call",
																										'templateCode': {
																											'kind': "templateCode",
																											'params': [

																											],
																											'type': "XMLP",
																											'let': {

																											},
																											'output': {
																												'kind': "lineExpr",
																												'expr': "drawPreview scaledWidth scaledHeight",
																												'let': {

																												}
																											}
																										}
																									},
																									{
																										'kind': "textElement",
																										'nodeValue': "\n            "
																									}
																								]
																							},
																							{
																								'kind': "textElement",
																								'nodeValue': "\n        "
																							}
																						]
																					}
																				}
																			}
																		}
																	}
																}
															}
														}
													}
												}
											}
										}
									}
								}
							}
						}
					},
					'output': {
						'kind': "lineXML",
						'xml': {
							'kind': "element",
							'nodeName': "div",
							'attributes': {

							},
							'style': {

							},
							'children': [
								{
									'kind': "textElement",
									'nodeValue': "Hello world.asdf\n    \n                        \n        "
								},
								{
									'kind': "on",
									'event': "init",
									'action': {
										'kind': "action",
										'params': [

										],
										'type': "Action",
										'actions': [
											{
												'action': {
													'kind': "lineExpr",
													'expr': "init",
													'let': {

													}
												}
											}
										]
									}
								},
								{
									'kind': "textElement",
									'nodeValue': "\n        \n        test: "
								},
								{
									'kind': "textElement",
									'nodeValue': {
										'kind': "insert",
										'expr': "Situation:name tobytest.realLife"
									}
								},
								{
									'kind': "element",
									'nodeName': "div",
									'attributes': {

									},
									'style': {

									},
									'children': [
										{
											'kind': "textElement",
											'nodeValue': "\n            "
										},
										{
											'kind': "on",
											'event': "dblclick",
											'action': {
												'kind': "action",
												'params': [

												],
												'type': "Action",
												'actions': [
													{
														'action': {
															'kind': "actionUpdate",
															'target': "testState",
															'actionType': "add",
															'key': "400",
															'value': undefined
														}
													}
												]
											}
										},
										{
											'kind': "textElement",
											'nodeValue': "\n            bleh: "
										},
										{
											'kind': "textElement",
											'nodeValue': {
												'kind': "insert",
												'expr': "testState"
											}
										},
										{
											'kind': "element",
											'nodeName': "svg:svg",
											'attributes': {

											},
											'style': {
												'width': "500",
												'height': "300"
											},
											'children': [
												{
													'kind': "textElement",
													'nodeValue': "\n                "
												},
												{
													'kind': "element",
													'nodeName': "svg:g",
													'attributes': {
														'transform': "translate ( 250 , 150 )"
													},
													'style': {

													},
													'children': [
														{
															'kind': "textElement",
															'nodeValue': "\n                    "
														},
														{
															'kind': "call",
															'templateCode': {
																'kind': "templateCode",
																'params': [

																],
																'type': "XMLP",
																'let': {

																},
																'output': {
																	'kind': "lineExpr",
																	'expr': "svg tobytest.realLife print Situation:contains 150",
																	'let': {

																	}
																}
															}
														},
														{
															'kind': "textElement",
															'nodeValue': "\n                "
														}
													]
												},
												{
													'kind': "textElement",
													'nodeValue': "\n            "
												}
											]
										},
										{
											'kind': "textElement",
											'nodeValue': "\n        "
										}
									]
								},
								{
									'kind': "textElement",
									'nodeValue': "\n        \n                \n        \n                                                                        \n    "
								}
							]
						}
					}
				}
			},
			'dragdrop': {
				'kind': "lineTemplate",
				'template': {
					'kind': "templateCode",
					'params': [
						"content",
						"x",
						"y"
					],
					'type': "XMLP -> Unit Number -> Unit Number -> XMLP",
					'let': {
						'offsetX': {
							'kind': "lineState",
							'action': {
								'kind': "action",
								'params': [

								],
								'type': "Action",
								'actions': [
									{
										'action': {
											'kind': "actionCreate",
											'type': "Unit Number",
											'prop': {

											}
										}
									}
								]
							}
						},
						'offsetY': {
							'kind': "lineState",
							'action': {
								'kind': "action",
								'params': [

								],
								'type': "Action",
								'actions': [
									{
										'action': {
											'kind': "actionCreate",
											'type': "Unit Number",
											'prop': {

											}
										}
									}
								]
							}
						},
						'dragging': {
							'kind': "lineState",
							'action': {
								'kind': "action",
								'params': [

								],
								'type': "Action",
								'actions': [
									{
										'action': {
											'kind': "actionCreate",
											'type': "Unit Null",
											'prop': {

											}
										}
									}
								]
							}
						}
					},
					'output': {
						'kind': "lineXML",
						'xml': {
							'kind': "element",
							'nodeName': "div",
							'attributes': {

							},
							'style': {
								'position': "absolute",
								'left': {
									'kind': "insert",
									'expr': "x"
								},
								'top': {
									'kind': "insert",
									'expr': "y"
								}
							},
							'children': [
								{
									'kind': "textElement",
									'nodeValue': "\n        "
								},
								{
									'kind': "on",
									'event': "mousedown",
									'action': {
										'kind': "action",
										'params': [

										],
										'type': "Action",
										'actions': [
											{
												'action': {
													'kind': "actionUpdate",
													'target': "offsetX",
													'actionType': "add",
													'key': "event.offsetX",
													'value': undefined
												}
											},
											{
												'action': {
													'kind': "actionUpdate",
													'target': "offsetY",
													'actionType': "add",
													'key': "event.offsetY",
													'value': undefined
												}
											},
											{
												'action': {
													'kind': "actionUpdate",
													'target': "dragging",
													'actionType': "add",
													'key': "null",
													'value': undefined
												}
											}
										]
									}
								},
								{
									'kind': "textElement",
									'nodeValue': "\n        "
								},
								{
									'kind': "for-each",
									'select': "dragging",
									'templateCode': {
										'kind': "templateCode",
										'params': [
											"_"
										],
										'type': "t0 -> XMLP",
										'let': {

										},
										'output': {
											'kind': "lineXML",
											'xml': {
												'kind': "element",
												'nodeName': "span",
												'attributes': {

												},
												'style': {

												},
												'children': [
													{
														'kind': "textElement",
														'nodeValue': "\n                "
													},
													{
														'kind': "for-each",
														'select': "offsetX",
														'templateCode': {
															'kind': "templateCode",
															'params': [
																"offsetX"
															],
															'type': "t0 -> XMLP",
															'let': {

															},
															'output': {
																'kind': "lineXML",
																'xml': {
																	'kind': "trigger",
																	'trigger': "UI.ui:mouseX ui.ui",
																	'action': {
																		'kind': "action",
																		'params': [
																			"mouseX"
																		],
																		'type': "t0 -> Action",
																		'actions': [
																			{
																				'action': {
																					'kind': "actionUpdate",
																					'target': "x",
																					'actionType': "add",
																					'key': "subtract mouseX offsetX",
																					'value': undefined
																				}
																			}
																		]
																	}
																}
															}
														}
													},
													{
														'kind': "textElement",
														'nodeValue': "\n                "
													},
													{
														'kind': "for-each",
														'select': "offsetY",
														'templateCode': {
															'kind': "templateCode",
															'params': [
																"offsetY"
															],
															'type': "t0 -> XMLP",
															'let': {

															},
															'output': {
																'kind': "lineXML",
																'xml': {
																	'kind': "trigger",
																	'trigger': "UI.ui:mouseY ui.ui",
																	'action': {
																		'kind': "action",
																		'params': [
																			"mouseY"
																		],
																		'type': "t0 -> Action",
																		'actions': [
																			{
																				'action': {
																					'kind': "actionUpdate",
																					'target': "y",
																					'actionType': "add",
																					'key': "subtract mouseY offsetY",
																					'value': undefined
																				}
																			}
																		]
																	}
																}
															}
														}
													},
													{
														'kind': "textElement",
														'nodeValue': "\n                "
													},
													{
														'kind': "trigger",
														'trigger': "reactiveNot (UI.ui:mouseDown ui.ui)",
														'action': {
															'kind': "action",
															'params': [
																"_"
															],
															'type': "t0 -> Action",
															'actions': [
																{
																	'action': {
																		'kind': "actionUpdate",
																		'target': "offsetX",
																		'actionType': "remove",
																		'key': undefined,
																		'value': undefined
																	}
																},
																{
																	'action': {
																		'kind': "actionUpdate",
																		'target': "offsetY",
																		'actionType': "remove",
																		'key': undefined,
																		'value': undefined
																	}
																},
																{
																	'action': {
																		'kind': "actionUpdate",
																		'target': "dragging",
																		'actionType': "remove",
																		'key': undefined,
																		'value': undefined
																	}
																}
															]
														}
													},
													{
														'kind': "textElement",
														'nodeValue': "\n            "
													}
												]
											}
										}
									}
								},
								{
									'kind': "textElement",
									'nodeValue': "\n        "
								},
								{
									'kind': "call",
									'templateCode': {
										'kind': "templateCode",
										'params': [

										],
										'type': "XMLP",
										'let': {

										},
										'output': {
											'kind': "lineExpr",
											'expr': "content",
											'let': {

											}
										}
									}
								},
								{
									'kind': "textElement",
									'nodeValue': "\n    "
								}
							]
						}
					}
				}
			}
		},
		'output': {
			'kind': "lineXML",
			'xml': {
				'kind': "call",
				'templateCode': {
					'kind': "templateCode",
					'params': [

					],
					'type': "XMLP",
					'let': {

					},
					'output': {
						'kind': "lineExpr",
						'expr': "content",
						'let': {

						}
					}
				}
			}
		}
	}
};