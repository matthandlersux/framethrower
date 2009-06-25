var mainTemplate = {
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

								},
								'lineNum': "8"
							}
						}
					],
					'lineNum': "7"
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
								'value': undefined,
								'lineNum': "11"
							}
						}
					],
					'lineNum': "10"
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
								'value': undefined,
								'lineNum': "14"
							}
						}
					],
					'lineNum': "13"
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
								'expr': "makeSituation"
							}
						},
						{
							'action': {
								'kind': "lineExpr",
								'expr': "nameSituation sit name"
							}
						},
						{
							'action': {
								'kind': "lineExpr",
								'expr': "sit"
							}
						}
					],
					'lineNum': "16"
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
								'value': undefined,
								'lineNum': "22"
							}
						},
						{
							'action': {
								'kind': "actionUpdate",
								'target': "Situation:container child",
								'actionType': "add",
								'key': "parent",
								'value': undefined,
								'lineNum': "23"
							}
						}
					],
					'lineNum': "21"
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
								'expr': "makeSituationNamed name"
							}
						},
						{
							'action': {
								'kind': "lineExpr",
								'expr': "putSituationIn parent sit"
							}
						},
						{
							'action': {
								'kind': "lineExpr",
								'expr': "sit"
							}
						}
					],
					'lineNum': "25"
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
								},
								'lineNum': "32"
							}
						},
						{
							'action': {
								'kind': "actionUpdate",
								'target': "Pipe:truth pipe",
								'actionType': "add",
								'key': "1",
								'value': undefined,
								'lineNum': "33"
							}
						},
						{
							'action': {
								'kind': "actionUpdate",
								'target': "Situation:pipesOut instance",
								'actionType': "add",
								'key': "pipe",
								'value': undefined,
								'lineNum': "34"
							}
						},
						{
							'action': {
								'kind': "actionUpdate",
								'target': "Situation:pipesIn type",
								'actionType': "add",
								'key': "pipe",
								'value': undefined,
								'lineNum': "35"
							}
						},
						{
							'action': {
								'kind': "lineExpr",
								'expr': "pipe"
							}
						}
					],
					'lineNum': "31"
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
								'value': "pipe0",
								'lineNum': "39"
							}
						},
						{
							'action': {
								'kind': "actionUpdate",
								'target': "Pipe:contains pipe0",
								'actionType': "add",
								'key': "pipe",
								'value': undefined,
								'lineNum': "40"
							}
						}
					],
					'lineNum': "38"
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
								'value': "pipe0",
								'lineNum': "43"
							}
						},
						{
							'action': {
								'kind': "actionUpdate",
								'target': "Pipe:container pipe",
								'actionType': "add",
								'key': "numToOrd 1",
								'value': "pipe1",
								'lineNum': "44"
							}
						},
						{
							'action': {
								'kind': "actionUpdate",
								'target': "Pipe:contains pipe0",
								'actionType': "add",
								'key': "pipe",
								'value': undefined,
								'lineNum': "45"
							}
						},
						{
							'action': {
								'kind': "actionUpdate",
								'target': "Pipe:contains pipe1",
								'actionType': "add",
								'key': "pipe",
								'value': undefined,
								'lineNum': "46"
							}
						}
					],
					'lineNum': "42"
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
								'value': "pipe0",
								'lineNum': "49"
							}
						},
						{
							'action': {
								'kind': "actionUpdate",
								'target': "Pipe:container pipe",
								'actionType': "add",
								'key': "numToOrd 1",
								'value': "pipe1",
								'lineNum': "50"
							}
						},
						{
							'action': {
								'kind': "actionUpdate",
								'target': "Pipe:container pipe",
								'actionType': "add",
								'key': "numToOrd 2",
								'value': "pipe2",
								'lineNum': "51"
							}
						},
						{
							'action': {
								'kind': "actionUpdate",
								'target': "Pipe:contains pipe0",
								'actionType': "add",
								'key': "pipe",
								'value': undefined,
								'lineNum': "52"
							}
						},
						{
							'action': {
								'kind': "actionUpdate",
								'target': "Pipe:contains pipe1",
								'actionType': "add",
								'key': "pipe",
								'value': undefined,
								'lineNum': "53"
							}
						},
						{
							'action': {
								'kind': "actionUpdate",
								'target': "Pipe:contains pipe2",
								'actionType': "add",
								'key': "pipe",
								'value': undefined,
								'lineNum': "54"
							}
						}
					],
					'lineNum': "48"
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
								'value': "pipe0",
								'lineNum': "57"
							}
						},
						{
							'action': {
								'kind': "actionUpdate",
								'target': "Pipe:container pipe",
								'actionType': "add",
								'key': "numToOrd 1",
								'value': "pipe1",
								'lineNum': "58"
							}
						},
						{
							'action': {
								'kind': "actionUpdate",
								'target': "Pipe:container pipe",
								'actionType': "add",
								'key': "numToOrd 2",
								'value': "pipe2",
								'lineNum': "59"
							}
						},
						{
							'action': {
								'kind': "actionUpdate",
								'target': "Pipe:container pipe",
								'actionType': "add",
								'key': "numToOrd 3",
								'value': "pipe3",
								'lineNum': "60"
							}
						},
						{
							'action': {
								'kind': "actionUpdate",
								'target': "Pipe:contains pipe0",
								'actionType': "add",
								'key': "pipe",
								'value': undefined,
								'lineNum': "61"
							}
						},
						{
							'action': {
								'kind': "actionUpdate",
								'target': "Pipe:contains pipe1",
								'actionType': "add",
								'key': "pipe",
								'value': undefined,
								'lineNum': "62"
							}
						},
						{
							'action': {
								'kind': "actionUpdate",
								'target': "Pipe:contains pipe2",
								'actionType': "add",
								'key': "pipe",
								'value': undefined,
								'lineNum': "63"
							}
						},
						{
							'action': {
								'kind': "actionUpdate",
								'target': "Pipe:contains pipe3",
								'actionType': "add",
								'key': "pipe",
								'value': undefined,
								'lineNum': "64"
							}
						}
					],
					'lineNum': "56"
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
								'expr': "makePipe instance type"
							}
						},
						{
							'action': {
								'kind': "lineExpr",
								'expr': "putPipeIn1 pipe pipe0"
							}
						},
						{
							'action': {
								'kind': "lineExpr",
								'expr': "pipe"
							}
						}
					],
					'lineNum': "67"
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
								'expr': "makePipe instance type"
							}
						},
						{
							'action': {
								'kind': "lineExpr",
								'expr': "putPipeIn2 pipe pipe0 pipe1"
							}
						},
						{
							'action': {
								'kind': "lineExpr",
								'expr': "pipe"
							}
						}
					],
					'lineNum': "72"
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
								'expr': "makePipe instance type"
							}
						},
						{
							'action': {
								'kind': "lineExpr",
								'expr': "putPipeIn3 pipe pipe0 pipe1 pipe2"
							}
						},
						{
							'action': {
								'kind': "lineExpr",
								'expr': "pipe"
							}
						}
					],
					'lineNum': "77"
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
								'expr': "makePipe instance type"
							}
						},
						{
							'action': {
								'kind': "lineExpr",
								'expr': "putPipeIn4 pipe pipe0 pipe1 pipe2 pipe3"
							}
						},
						{
							'action': {
								'kind': "lineExpr",
								'expr': "pipe"
							}
						}
					],
					'lineNum': "82"
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
								'expr': "nameSituation tobytest.realLife \"Real Life\""
							}
						},
						{
							'action': {
								'kind': "lineExpr",
								'expr': "nameSituation tobytest.myTimelineSit \"wall-e timeline\""
							}
						},
						{
							'name': "timeline",
							'action': {
								'kind': "actionCreate",
								'type': "Timeline",
								'prop': {
									'duration': "5894.139"
								},
								'lineNum': "97"
							}
						},
						{
							'action': {
								'kind': "actionUpdate",
								'target': "Timeline:video timeline",
								'actionType': "add",
								'key': "test.walleVideo",
								'value': undefined,
								'lineNum': "98"
							}
						},
						{
							'action': {
								'kind': "actionUpdate",
								'target': "Situation:propTimeline tobytest.myTimelineSit",
								'actionType': "add",
								'key': "timeline",
								'value': undefined,
								'lineNum': "99"
							}
						},
						{
							'name': "s1",
							'action': {
								'kind': "lineExpr",
								'expr': "makeSituationNamedIn \"blah\" tobytest.realLife"
							}
						},
						{
							'name': "s2",
							'action': {
								'kind': "lineExpr",
								'expr': "makeSituationNamedIn \"blah2\" s1"
							}
						},
						{
							'action': {
								'kind': "lineExpr",
								'expr': "tobytest.realLife"
							}
						}
					],
					'lineNum': "93"
				}
			},
			'divide': {
				'kind': "lineJavascript",
				'type': "(Number) -> (Number) -> (Number )",
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
			'concat': {
				'kind': "lineJavascript",
				'type': "(String) -> (String) -> (String )",
				'f': function ( s,  t) {
	return s+t;
}
			},
			'fileName': "util.let",
			'top': {
				'kind': "lineTemplate",
				'template': {
					'kind': "templateCode",
					'params': [
						"width",
						"height"
					],
					'type': "(Unit Number) -> (Unit Number) -> XMLP",
					'let': {
						'onmouseups': {
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
											'type': "Set Action",
											'prop': {

											},
											'lineNum': "2"
										}
									}
								],
								'lineNum': "2"
							},
							'lineNum': "2"
						},
						'timelines': {
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
											'type': "Map Situation TimeSelection",
											'prop': {

											},
											'lineNum': "6"
										}
									}
								],
								'lineNum': "6"
							},
							'lineNum': "6"
						},
						'timelineHeight': {
							'kind': "lineExpr",
							'expr': "180"
						},
						'allTimelinesHeight': {
							'kind': "lineExpr",
							'expr': "mapUnit (multiply timelineHeight) (length (keys timelines))"
						},
						'sitViewHeight': {
							'kind': "lineExpr",
							'expr': "mapUnit2 subtract height allTimelinesHeight"
						},
						'initChildren': {
							'kind': "lineState",
							'action': {
								'kind': "action",
								'params': [

								],
								'type': "Action",
								'actions': [
									{
										'name': "children",
										'action': {
											'kind': "actionCreate",
											'type': "Map Situation ChildProp",
											'prop': {

											},
											'lineNum': "15"
										}
									},
									{
										'name': "position",
										'action': {
											'kind': "actionCreate",
											'type': "Position",
											'prop': {

											},
											'lineNum': "16"
										}
									},
									{
										'action': {
											'kind': "actionUpdate",
											'target': "Position:x position",
											'actionType': "add",
											'key': "0",
											'value': undefined,
											'lineNum': "17"
										}
									},
									{
										'action': {
											'kind': "actionUpdate",
											'target': "Position:y position",
											'actionType': "add",
											'key': "0",
											'value': undefined,
											'lineNum': "18"
										}
									},
									{
										'name': "childProp",
										'action': {
											'kind': "actionCreate",
											'type': "ChildProp",
											'prop': {
												'position': "position"
											},
											'lineNum': "19"
										}
									},
									{
										'action': {
											'kind': "actionUpdate",
											'target': "ChildProp:scale childProp",
											'actionType': "add",
											'key': "0.9",
											'value': undefined,
											'lineNum': "20"
										}
									},
									{
										'action': {
											'kind': "actionUpdate",
											'target': "children",
											'actionType': "add",
											'key': "tobytest.realLife",
											'value': "childProp",
											'lineNum': "21"
										}
									},
									{
										'action': {
											'kind': "lineExpr",
											'expr': "children"
										}
									}
								],
								'lineNum': "14"
							},
							'lineNum': "14"
						},
						'dragdrop': {
							'kind': "lineTemplate",
							'template': {
								'kind': "templateCode",
								'params': [
									"dragX",
									"dragY",
									"onDrop"
								],
								'type': "(Unit Number) -> (Unit Number) -> (Action) -> XMLP",
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

														},
														'lineNum': "2"
													}
												}
											],
											'lineNum': "2"
										},
										'lineNum': "2"
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

														},
														'lineNum': "3"
													}
												}
											],
											'lineNum': "3"
										},
										'lineNum': "3"
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

														},
														'lineNum': "4"
													}
												}
											],
											'lineNum': "4"
										},
										'lineNum': "4"
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
												'kind': "on",
												'event': "dragstart",
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
																'key': "event.mouseX",
																'value': undefined,
																'lineNum': "8"
															}
														},
														{
															'action': {
																'kind': "actionUpdate",
																'target': "offsetY",
																'actionType': "add",
																'key': "event.mouseY",
																'value': undefined,
																'lineNum': "9"
															}
														},
														{
															'action': {
																'kind': "actionUpdate",
																'target': "dragging",
																'actionType': "add",
																'key': "null",
																'value': undefined,
																'lineNum': "10"
															}
														}
													],
													'lineNum': "7"
												},
												'lineNum': "7"
											},
											{
												'kind': "for-each",
												'select': "dragging",
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
															'kind': "element",
															'nodeName': "f:wrapper",
															'attributes': {

															},
															'style': {

															},
															'children': [
																{
																	'kind': "for-each",
																	'select': "offsetX",
																	'templateCode': {
																		'kind': "templateCode",
																		'params': [
																			"offsetX"
																		],
																		'type': "(t0) -> XMLP",
																		'let': {

																		},
																		'output': {
																			'kind': "lineXML",
																			'xml': {
																				'kind': "for-each",
																				'select': "offsetY",
																				'templateCode': {
																					'kind': "templateCode",
																					'params': [
																						"offsetY"
																					],
																					'type': "(t0) -> XMLP",
																					'let': {

																					},
																					'output': {
																						'kind': "lineXML",
																						'xml': {
																							'kind': "on",
																							'event': "globalmousemove",
																							'action': {
																								'kind': "action",
																								'params': [

																								],
																								'type': "Action",
																								'actions': [
																									{
																										'action': {
																											'kind': "actionUpdate",
																											'target': "dragX",
																											'actionType': "add",
																											'key': "subtract event.mouseX offsetX",
																											'value': undefined,
																											'lineNum': "16"
																										}
																									},
																									{
																										'action': {
																											'kind': "actionUpdate",
																											'target': "dragY",
																											'actionType': "add",
																											'key': "subtract event.mouseY offsetY",
																											'value': undefined,
																											'lineNum': "17"
																										}
																									}
																								],
																								'lineNum': "15"
																							},
																							'lineNum': "15"
																						}
																					},
																					'lineNum': "14"
																				},
																				'lineNum': "14"
																			}
																		},
																		'lineNum': "14"
																	},
																	'lineNum': "14"
																},
																{
																	'kind': "on",
																	'event': "globalmouseup",
																	'action': {
																		'kind': "action",
																		'params': [

																		],
																		'type': "Action",
																		'actions': [
																			{
																				'action': {
																					'kind': "lineExpr",
																					'expr': "onDrop"
																				}
																			},
																			{
																				'action': {
																					'kind': "actionUpdate",
																					'target': "dragging",
																					'actionType': "remove",
																					'key': undefined,
																					'value': undefined,
																					'lineNum': "23"
																				}
																			},
																			{
																				'action': {
																					'kind': "actionUpdate",
																					'target': "dragX",
																					'actionType': "remove",
																					'key': undefined,
																					'value': undefined,
																					'lineNum': "24"
																				}
																			},
																			{
																				'action': {
																					'kind': "actionUpdate",
																					'target': "dragY",
																					'actionType': "remove",
																					'key': undefined,
																					'value': undefined,
																					'lineNum': "25"
																				}
																			},
																			{
																				'action': {
																					'kind': "actionUpdate",
																					'target': "offsetX",
																					'actionType': "remove",
																					'key': undefined,
																					'value': undefined,
																					'lineNum': "26"
																				}
																			},
																			{
																				'action': {
																					'kind': "actionUpdate",
																					'target': "offsetY",
																					'actionType': "remove",
																					'key': undefined,
																					'value': undefined,
																					'lineNum': "27"
																				}
																			}
																		],
																		'lineNum': "20"
																	},
																	'lineNum': "20"
																}
															],
															'lineNum': "13"
														}
													},
													'lineNum': "12"
												},
												'lineNum': "12"
											}
										],
										'lineNum': "6"
									}
								},
								'lineNum': "1"
							},
							'fileName': "dragdrop.tpl"
						},
						'situationView': {
							'kind': "lineTemplate",
							'template': {
								'kind': "templateCode",
								'params': [
									"width",
									"height",
									"children"
								],
								'type': "(Unit Number) -> (Unit Number) -> (Map Situation ChildProp) -> XMLP",
								'let': {
									'makeTranslate': {
										'kind': "lineJavascript",
										'type': "t0 -> t1 -> t2",
										'f': function (x,  y) {
		return "translate(" + x + "," + y + ")";
	}
									},
									'reactiveDisplay': {
										'kind': "lineExpr",
										'expr': "pred -> reactiveIfThen pred \"block\" \"none\""
									},
									'dragStartSit': {
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
														'type': "Unit Situation",
														'prop': {

														},
														'lineNum': "26"
													}
												}
											],
											'lineNum': "26"
										},
										'lineNum': "26"
									},
									'dragEndSit': {
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
														'type': "Unit Situation",
														'prop': {

														},
														'lineNum': "27"
													}
												}
											],
											'lineNum': "27"
										},
										'lineNum': "27"
									},
									'dragEndInside': {
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

														},
														'lineNum': "28"
													}
												}
											],
											'lineNum': "28"
										},
										'lineNum': "28"
									},
									'dragOperation': {
										'kind': "lineExpr",
										'expr': "bindUnit (swap (reactiveIfThen dragEndInside) 2) (reactiveIfThen (mapUnit2 reactiveEqual (bindUnit Situation:container dragStartSit) dragEndSit) 1 3)"
									},
									'globalScale': {
										'kind': "lineState",
										'action': {
											'kind': "action",
											'params': [

											],
											'type': "Action",
											'actions': [
												{
													'name': "x",
													'action': {
														'kind': "actionCreate",
														'type': "Unit Number",
														'prop': {

														},
														'lineNum': "37"
													}
												},
												{
													'action': {
														'kind': "actionUpdate",
														'target': "x",
														'actionType': "add",
														'key': "1",
														'value': undefined,
														'lineNum': undefined
													}
												},
												{
													'action': {
														'kind': "lineExpr",
														'expr': "x"
													}
												}
											],
											'lineNum': "37"
										},
										'lineNum': "37"
									},
									'globalTranslateX': {
										'kind': "lineState",
										'action': {
											'kind': "action",
											'params': [

											],
											'type': "Action",
											'actions': [
												{
													'name': "x",
													'action': {
														'kind': "actionCreate",
														'type': "Unit Number",
														'prop': {

														},
														'lineNum': "38"
													}
												},
												{
													'action': {
														'kind': "actionUpdate",
														'target': "x",
														'actionType': "add",
														'key': "0",
														'value': undefined,
														'lineNum': undefined
													}
												},
												{
													'action': {
														'kind': "lineExpr",
														'expr': "x"
													}
												}
											],
											'lineNum': "38"
										},
										'lineNum': "38"
									},
									'globalTranslateY': {
										'kind': "lineState",
										'action': {
											'kind': "action",
											'params': [

											],
											'type': "Action",
											'actions': [
												{
													'name': "x",
													'action': {
														'kind': "actionCreate",
														'type': "Unit Number",
														'prop': {

														},
														'lineNum': "39"
													}
												},
												{
													'action': {
														'kind': "actionUpdate",
														'target': "x",
														'actionType': "add",
														'key': "0",
														'value': undefined,
														'lineNum': undefined
													}
												},
												{
													'action': {
														'kind': "lineExpr",
														'expr': "x"
													}
												}
											],
											'lineNum': "39"
										},
										'lineNum': "39"
									},
									'drawSituation': {
										'kind': "lineTemplate",
										'template': {
											'kind': "templateCode",
											'params': [
												"x",
												"y",
												"scale",
												"focus",
												"dragHandler"
											],
											'type': "(Unit Number) -> (Unit Number) -> (Unit Number) -> (Situation) -> (XMLP) -> XMLP",
											'let': {
												'children': {
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
																	'type': "Map Situation ChildProp",
																	'prop': {

																	},
																	'lineNum': "46"
																}
															}
														],
														'lineNum': "46"
													},
													'lineNum': "46"
												},
												'imBeingDragged': {
													'kind': "lineExpr",
													'expr': "bindUnit (reactiveEqual focus) dragStartSit"
												},
												'imBeingDraggedClass': {
													'kind': "lineExpr",
													'expr': "reactiveIfThen imBeingDragged \"gsv-dragStart \" \"\""
												},
												'imBeingOffset': {
													'kind': "lineExpr",
													'expr': "reactiveAnd (bindUnit (reactiveEqual 1) dragOperation) imBeingDragged"
												},
												'imBeingOffsetClass': {
													'kind': "lineExpr",
													'expr': "reactiveIfThen imBeingOffset \"gsv-offsetting \" \"\""
												},
												'finalClass': {
													'kind': "lineExpr",
													'expr': "mapUnit2 concat imBeingDraggedClass imBeingOffsetClass"
												}
											},
											'output': {
												'kind': "lineXML",
												'xml': {
													'kind': "element",
													'nodeName': "svg:g",
													'attributes': {
														'class': {
															'kind': "insert",
															'expr': "finalClass"
														}
													},
													'style': {

													},
													'children': [
														{
															'kind': "trigger",
															'trigger': "Situation:contains focus",
															'action': {
																'kind': "action",
																'params': [
																	"child"
																],
																'type': "(t0) -> Action",
																'actions': [
																	{
																		'name': "position",
																		'action': {
																			'kind': "actionCreate",
																			'type': "Position",
																			'prop': {

																			},
																			'lineNum': "57"
																		}
																	},
																	{
																		'action': {
																			'kind': "actionUpdate",
																			'target': "Position:x position",
																			'actionType': "add",
																			'key': "0",
																			'value': undefined,
																			'lineNum': "58"
																		}
																	},
																	{
																		'action': {
																			'kind': "actionUpdate",
																			'target': "Position:y position",
																			'actionType': "add",
																			'key': "0",
																			'value': undefined,
																			'lineNum': "59"
																		}
																	},
																	{
																		'name': "childProp",
																		'action': {
																			'kind': "actionCreate",
																			'type': "ChildProp",
																			'prop': {
																				'position': "position"
																			},
																			'lineNum': "60"
																		}
																	},
																	{
																		'action': {
																			'kind': "actionUpdate",
																			'target': "ChildProp:scale childProp",
																			'actionType': "add",
																			'key': "0.5",
																			'value': undefined,
																			'lineNum': "61"
																		}
																	},
																	{
																		'action': {
																			'kind': "actionUpdate",
																			'target': "children",
																			'actionType': "add",
																			'key': "child",
																			'value': "childProp",
																			'lineNum': "62"
																		}
																	}
																],
																'lineNum': "56"
															},
															'lineNum': "56"
														},
														{
															'kind': "element",
															'nodeName': "svg:g",
															'attributes': {
																'class': "gsv-situation"
															},
															'style': {

															},
															'children': [
																{
																	'kind': "element",
																	'nodeName': "svg:circle",
																	'attributes': {
																		'class': "gsv-hit-inner",
																		'r': {
																			'kind': "insert",
																			'expr': "scale"
																		},
																		'cx': {
																			'kind': "insert",
																			'expr': "x"
																		},
																		'cy': {
																			'kind': "insert",
																			'expr': "y"
																		},
																		'shape-rendering': "optimizeSpeed"
																	},
																	'style': {

																	},
																	'children': [
																		{
																			'kind': "on",
																			'event': "mouseover",
																			'action': {
																				'kind': "action",
																				'params': [

																				],
																				'type': "Action",
																				'actions': [
																					{
																						'action': {
																							'kind': "actionUpdate",
																							'target': "dragEndInside",
																							'actionType': "add",
																							'key': "null",
																							'value': undefined,
																							'lineNum': "67"
																						}
																					}
																				],
																				'lineNum': "67"
																			},
																			'lineNum': "67"
																		}
																	],
																	'lineNum': "66"
																},
																{
																	'kind': "element",
																	'nodeName': "svg:g",
																	'attributes': {

																	},
																	'style': {

																	},
																	'children': [
																		{
																			'kind': "on",
																			'event': "mouseover",
																			'action': {
																				'kind': "action",
																				'params': [

																				],
																				'type': "Action",
																				'actions': [
																					{
																						'action': {
																							'kind': "actionUpdate",
																							'target': "dragEndSit",
																							'actionType': "add",
																							'key': "focus",
																							'value': undefined,
																							'lineNum': "70"
																						}
																					}
																				],
																				'lineNum': "70"
																			},
																			'lineNum': "70"
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
																					'expr': "dragHandler"
																				},
																				'lineNum': "71"
																			},
																			'lineNum': "71"
																		},
																		{
																			'kind': "element",
																			'nodeName': "svg:circle",
																			'attributes': {
																				'class': "gsv-icon",
																				'r': {
																					'kind': "insert",
																					'expr': "scale"
																				},
																				'cx': {
																					'kind': "insert",
																					'expr': "x"
																				},
																				'cy': {
																					'kind': "insert",
																					'expr': "y"
																				},
																				'shape-rendering': "optimizeSpeed"
																			},
																			'style': {

																			},
																			'children': [

																			],
																			'lineNum': "72"
																		},
																		{
																			'kind': "element",
																			'nodeName': "svg:circle",
																			'attributes': {
																				'class': "gsv-hit-object",
																				'r': {
																					'kind': "insert",
																					'expr': "scale"
																				},
																				'cx': {
																					'kind': "insert",
																					'expr': "x"
																				},
																				'cy': {
																					'kind': "insert",
																					'expr': "y"
																				},
																				'shape-rendering': "optimizeSpeed"
																			},
																			'style': {

																			},
																			'children': [
																				{
																					'kind': "on",
																					'event': "mouseout",
																					'action': {
																						'kind': "action",
																						'params': [

																						],
																						'type': "Action",
																						'actions': [
																							{
																								'action': {
																									'kind': "actionUpdate",
																									'target': "dragEndInside",
																									'actionType': "remove",
																									'key': undefined,
																									'value': undefined,
																									'lineNum': "74"
																								}
																							}
																						],
																						'lineNum': "74"
																					},
																					'lineNum': "74"
																				}
																			],
																			'lineNum': "73"
																		},
																		{
																			'kind': "element",
																			'nodeName': "svg:text",
																			'attributes': {
																				'x': {
																					'kind': "insert",
																					'expr': "x"
																				},
																				'y': {
																					'kind': "insert",
																					'expr': "mapUnit2 subtract y scale"
																				},
																				'text-anchor': "middle",
																				'shape-rendering': "optimizeSpeed"
																			},
																			'style': {

																			},
																			'children': [
																				{
																					'kind': "textElement",
																					'nodeValue': {
																						'kind': "insert",
																						'expr': "scale"
																					}
																				}
																			],
																			'lineNum': "76"
																		}
																	],
																	'lineNum': "69"
																}
															],
															'lineNum': "65"
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
																	'expr': "drawSituationChildren x y scale children"
																},
																'lineNum': "81"
															},
															'lineNum': "81"
														}
													],
													'lineNum': "53"
												}
											},
											'lineNum': "45"
										}
									},
									'drawSituationChildren': {
										'kind': "lineTemplate",
										'template': {
											'kind': "templateCode",
											'params': [
												"x",
												"y",
												"scale",
												"children"
											],
											'type': "(Unit Number) -> (Unit Number) -> (Unit Number) -> (Map Situation ChildProp) -> XMLP",
											'let': {
												'relToAbsX': {
													'kind': "lineExpr",
													'expr': "relX -> mapUnit2 plus x (mapUnit2 multiply scale relX)"
												},
												'relToAbsY': {
													'kind': "lineExpr",
													'expr': "relY -> mapUnit2 plus y (mapUnit2 multiply scale relY)"
												}
											},
											'output': {
												'kind': "lineXML",
												'xml': {
													'kind': "for-each",
													'select': "children",
													'templateCode': {
														'kind': "templateCode",
														'params': [
															"child",
															"childProp"
														],
														'type': "(t0) -> (t1) -> XMLP",
														'let': {
															'childPosition': {
																'kind': "lineExpr",
																'expr': "returnFutureUnit (ChildProp:position childProp)"
															},
															'childX': {
																'kind': "lineExpr",
																'expr': "bindUnit Position:x childPosition"
															},
															'childY': {
																'kind': "lineExpr",
																'expr': "bindUnit Position:y childPosition"
															},
															'childAbsX': {
																'kind': "lineExpr",
																'expr': "relToAbsX childX"
															},
															'childAbsY': {
																'kind': "lineExpr",
																'expr': "relToAbsY childY"
															},
															'childScale': {
																'kind': "lineExpr",
																'expr': "mapUnit2 multiply (ChildProp:scale childProp) scale"
															},
															'dragX': {
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

																				},
																				'lineNum': "99"
																			}
																		}
																	],
																	'lineNum': "99"
																},
																'lineNum': "99"
															},
															'dragY': {
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

																				},
																				'lineNum': "100"
																			}
																		}
																	],
																	'lineNum': "100"
																},
																'lineNum': "100"
															},
															'draggedToX': {
																'kind': "lineExpr",
																'expr': "mapUnit2 plus childX (mapUnit2 divide dragX scale)"
															},
															'draggedToY': {
																'kind': "lineExpr",
																'expr': "mapUnit2 plus childY (mapUnit2 divide dragY scale)"
															},
															'onDrop': {
																'kind': "lineAction",
																'action': {
																	'kind': "action",
																	'params': [

																	],
																	'type': "Action",
																	'actions': [
																		{
																			'action': {
																				'kind': "extract",
																				'select': "childPosition",
																				'action': {
																					'kind': "action",
																					'params': [
																						"childPosition"
																					],
																					'type': "(t0) -> Action",
																					'actions': [
																						{
																							'action': {
																								'kind': "extract",
																								'select': "draggedToX",
																								'action': {
																									'kind': "action",
																									'params': [
																										"draggedToX"
																									],
																									'type': "(t0) -> Action",
																									'actions': [
																										{
																											'action': {
																												'kind': "extract",
																												'select': "draggedToY",
																												'action': {
																													'kind': "action",
																													'params': [
																														"draggedToY"
																													],
																													'type': "(t0) -> Action",
																													'actions': [
																														{
																															'action': {
																																'kind': "actionUpdate",
																																'target': "Position:x childPosition",
																																'actionType': "add",
																																'key': "draggedToX",
																																'value': undefined,
																																'lineNum': "108"
																															}
																														},
																														{
																															'action': {
																																'kind': "actionUpdate",
																																'target': "Position:y childPosition",
																																'actionType': "add",
																																'key': "draggedToY",
																																'value': undefined,
																																'lineNum': "109"
																															}
																														}
																													],
																													'lineNum': "107"
																												},
																												'lineNum': "107"
																											}
																										}
																									],
																									'lineNum': "106"
																								},
																								'lineNum': "106"
																							}
																						}
																					],
																					'lineNum': "105"
																				},
																				'lineNum': "105"
																			}
																		}
																	],
																	'lineNum': "104"
																}
															},
															'dragHandler': {
																'kind': "lineXML",
																'xml': {
																	'kind': "call",
																	'templateCode': {
																		'kind': "templateCode",
																		'params': [

																		],
																		'type': "XMLP",
																		'let': {
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

																								},
																								'lineNum': "114"
																							}
																						}
																					],
																					'lineNum': "114"
																				},
																				'lineNum': "114"
																			},
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

																								},
																								'lineNum': "115"
																							}
																						}
																					],
																					'lineNum': "115"
																				},
																				'lineNum': "115"
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

																								},
																								'lineNum': "116"
																							}
																						}
																					],
																					'lineNum': "116"
																				},
																				'lineNum': "116"
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
																						'kind': "on",
																						'event': "dragstart",
																						'action': {
																							'kind': "action",
																							'params': [

																							],
																							'type': "Action",
																							'actions': [
																								{
																									'action': {
																										'kind': "actionUpdate",
																										'target': "dragStartSit",
																										'actionType': "add",
																										'key': "child",
																										'value': undefined,
																										'lineNum': "119"
																									}
																								},
																								{
																									'action': {
																										'kind': "actionUpdate",
																										'target': "offsetX",
																										'actionType': "add",
																										'key': "event.mouseX",
																										'value': undefined,
																										'lineNum': "120"
																									}
																								},
																								{
																									'action': {
																										'kind': "actionUpdate",
																										'target': "offsetY",
																										'actionType': "add",
																										'key': "event.mouseY",
																										'value': undefined,
																										'lineNum': "121"
																									}
																								},
																								{
																									'action': {
																										'kind': "actionUpdate",
																										'target': "dragging",
																										'actionType': "add",
																										'key': "null",
																										'value': undefined,
																										'lineNum': "122"
																									}
																								}
																							],
																							'lineNum': "118"
																						},
																						'lineNum': "118"
																					},
																					{
																						'kind': "for-each",
																						'select': "dragging",
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
																									'kind': "element",
																									'nodeName': "f:wrapper",
																									'attributes': {

																									},
																									'style': {

																									},
																									'children': [
																										{
																											'kind': "for-each",
																											'select': "offsetX",
																											'templateCode': {
																												'kind': "templateCode",
																												'params': [
																													"offsetX"
																												],
																												'type': "(t0) -> XMLP",
																												'let': {

																												},
																												'output': {
																													'kind': "lineXML",
																													'xml': {
																														'kind': "for-each",
																														'select': "offsetY",
																														'templateCode': {
																															'kind': "templateCode",
																															'params': [
																																"offsetY"
																															],
																															'type': "(t0) -> XMLP",
																															'let': {

																															},
																															'output': {
																																'kind': "lineXML",
																																'xml': {
																																	'kind': "on",
																																	'event': "globalmousemove",
																																	'action': {
																																		'kind': "action",
																																		'params': [

																																		],
																																		'type': "Action",
																																		'actions': [
																																			{
																																				'action': {
																																					'kind': "actionUpdate",
																																					'target': "dragX",
																																					'actionType': "add",
																																					'key': "subtract event.mouseX offsetX",
																																					'value': undefined,
																																					'lineNum': "128"
																																				}
																																			},
																																			{
																																				'action': {
																																					'kind': "actionUpdate",
																																					'target': "dragY",
																																					'actionType': "add",
																																					'key': "subtract event.mouseY offsetY",
																																					'value': undefined,
																																					'lineNum': "129"
																																				}
																																			}
																																		],
																																		'lineNum': "127"
																																	},
																																	'lineNum': "127"
																																}
																															},
																															'lineNum': "126"
																														},
																														'lineNum': "126"
																													}
																												},
																												'lineNum': "126"
																											},
																											'lineNum': "126"
																										},
																										{
																											'kind': "on",
																											'event': "globalmouseup",
																											'action': {
																												'kind': "action",
																												'params': [

																												],
																												'type': "Action",
																												'actions': [
																													{
																														'action': {
																															'kind': "lineExpr",
																															'expr': "onDrop"
																														}
																													},
																													{
																														'action': {
																															'kind': "actionUpdate",
																															'target': "dragging",
																															'actionType': "remove",
																															'key': undefined,
																															'value': undefined,
																															'lineNum': "135"
																														}
																													},
																													{
																														'action': {
																															'kind': "actionUpdate",
																															'target': "dragX",
																															'actionType': "remove",
																															'key': undefined,
																															'value': undefined,
																															'lineNum': "136"
																														}
																													},
																													{
																														'action': {
																															'kind': "actionUpdate",
																															'target': "dragY",
																															'actionType': "remove",
																															'key': undefined,
																															'value': undefined,
																															'lineNum': "137"
																														}
																													},
																													{
																														'action': {
																															'kind': "actionUpdate",
																															'target': "offsetX",
																															'actionType': "remove",
																															'key': undefined,
																															'value': undefined,
																															'lineNum': "138"
																														}
																													},
																													{
																														'action': {
																															'kind': "actionUpdate",
																															'target': "offsetY",
																															'actionType': "remove",
																															'key': undefined,
																															'value': undefined,
																															'lineNum': "139"
																														}
																													},
																													{
																														'action': {
																															'kind': "actionUpdate",
																															'target': "dragStartSit",
																															'actionType': "remove",
																															'key': undefined,
																															'value': undefined,
																															'lineNum': "140"
																														}
																													}
																												],
																												'lineNum': "132"
																											},
																											'lineNum': "132"
																										}
																									],
																									'lineNum': "125"
																								}
																							},
																							'lineNum': "124"
																						},
																						'lineNum': "124"
																					}
																				],
																				'lineNum': "117"
																			}
																		},
																		'lineNum': "113"
																	},
																	'lineNum': "113"
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
																				'expr': "drawSituation childAbsX childAbsY childScale child dragHandler"
																			},
																			'lineNum': "148"
																		},
																		'lineNum': "148"
																	},
																	{
																		'kind': "element",
																		'nodeName': "svg:circle",
																		'attributes': {
																			'class': "dragCircle",
																			'r': {
																				'kind': "insert",
																				'expr': "childScale"
																			},
																			'cx': {
																				'kind': "insert",
																				'expr': "relToAbsX draggedToX"
																			},
																			'cy': {
																				'kind': "insert",
																				'expr': "relToAbsY draggedToY"
																			},
																			'pointer-events': "none"
																		},
																		'style': {
																			'display': {
																				'kind': "insert",
																				'expr': "reactiveDisplay dragX"
																			}
																		},
																		'children': [

																		],
																		'lineNum': "149"
																	}
																],
																'lineNum': "147"
															}
														},
														'lineNum': "90"
													},
													'lineNum': "90"
												}
											},
											'lineNum': "86"
										}
									},
									'globalClass': {
										'kind': "lineExpr",
										'expr': "reactiveIfThen dragStartSit \"gsv-dragging\" \"gsv-nodrag\""
									},
									'mouseScrollAction': {
										'kind': "lineXML",
										'xml': {
											'kind': "on",
											'event': "mousescroll",
											'action': {
												'kind': "action",
												'params': [

												],
												'type': "Action",
												'actions': [
													{
														'name': "wheelDeltaToMultiplier",
														'action': {
															'kind': "lineJavascript",
															'type': "t0 -> t1",
															'f': function ( wd) {
		if (wd > 0) return 1.2;
		else return 1/1.2;
	}
														}
													},
													{
														'name': "newTranslateX",
														'action': {
															'kind': "lineJavascript",
															'type': "t0 -> t1 -> t2 -> t3",
															'f': function ( zoomX,  oldTranslateX,  multiplier) {
		return zoomX - multiplier * (zoomX - oldTranslateX);
	}
														}
													},
													{
														'name': "newTranslateY",
														'action': {
															'kind': "lineJavascript",
															'type': "t0 -> t1 -> t2 -> t3",
															'f': function ( zoomY,  oldTranslateY,  multiplier) {
		return zoomY - multiplier * (zoomY - oldTranslateY);
	}
														}
													},
													{
														'action': {
															'kind': "extract",
															'select': "globalScale",
															'action': {
																'kind': "action",
																'params': [
																	"gs"
																],
																'type': "(t0) -> Action",
																'actions': [
																	{
																		'action': {
																			'kind': "extract",
																			'select': "globalTranslateX",
																			'action': {
																				'kind': "action",
																				'params': [
																					"oldTranslateX"
																				],
																				'type': "(t0) -> Action",
																				'actions': [
																					{
																						'action': {
																							'kind': "extract",
																							'select': "globalTranslateY",
																							'action': {
																								'kind': "action",
																								'params': [
																									"oldTranslateY"
																								],
																								'type': "(t0) -> Action",
																								'actions': [
																									{
																										'action': {
																											'kind': "extract",
																											'select': "width",
																											'action': {
																												'kind': "action",
																												'params': [
																													"width"
																												],
																												'type': "(t0) -> Action",
																												'actions': [
																													{
																														'action': {
																															'kind': "extract",
																															'select': "height",
																															'action': {
																																'kind': "action",
																																'params': [
																																	"height"
																																],
																																'type': "(t0) -> Action",
																																'actions': [
																																	{
																																		'name': "multiplier",
																																		'action': {
																																			'kind': "lineExpr",
																																			'expr': "wheelDeltaToMultiplier event.wheelDelta"
																																		}
																																	},
																																	{
																																		'action': {
																																			'kind': "actionUpdate",
																																			'target': "globalScale",
																																			'actionType': "add",
																																			'key': "multiply gs multiplier",
																																			'value': undefined,
																																			'lineNum': "20"
																																		}
																																	},
																																	{
																																		'name': "zoomX",
																																		'action': {
																																			'kind': "lineExpr",
																																			'expr': "subtract event.offsetX (divide width 2)"
																																		}
																																	},
																																	{
																																		'name': "zoomY",
																																		'action': {
																																			'kind': "lineExpr",
																																			'expr': "subtract event.offsetY (divide height 2)"
																																		}
																																	},
																																	{
																																		'action': {
																																			'kind': "actionUpdate",
																																			'target': "globalTranslateX",
																																			'actionType': "add",
																																			'key': "newTranslateX zoomX oldTranslateX multiplier",
																																			'value': undefined,
																																			'lineNum': "23"
																																		}
																																	},
																																	{
																																		'action': {
																																			'kind': "actionUpdate",
																																			'target': "globalTranslateY",
																																			'actionType': "add",
																																			'key': "newTranslateY zoomY oldTranslateY multiplier",
																																			'value': undefined,
																																			'lineNum': "24"
																																		}
																																	}
																																],
																																'lineNum': "17"
																															},
																															'lineNum': "17"
																														}
																													}
																												],
																												'lineNum': "16"
																											},
																											'lineNum': "16"
																										}
																									}
																								],
																								'lineNum': "15"
																							},
																							'lineNum': "15"
																						}
																					}
																				],
																				'lineNum': "14"
																			},
																			'lineNum': "14"
																		}
																	}
																],
																'lineNum': "13"
															},
															'lineNum': "13"
														}
													}
												],
												'lineNum': "1"
											},
											'lineNum': "1"
										},
										'fileName': "mouseScrollAction.tpl"
									}
								},
								'output': {
									'kind': "lineXML",
									'xml': {
										'kind': "element",
										'nodeName': "svg:svg",
										'attributes': {
											'class': {
												'kind': "insert",
												'expr': "globalClass"
											}
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
												'kind': "element",
												'nodeName': "svg:g",
												'attributes': {
													'transform': {
														'kind': "insert",
														'expr': "mapUnit2 makeTranslate (mapUnit2 plus (mapUnit (swap divide 2) width) globalTranslateX) (mapUnit2 plus (mapUnit (swap divide 2) height) globalTranslateY)"
													}
												},
												'style': {

												},
												'children': [
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
																'expr': "drawSituationChildren (returnUnit 0) (returnUnit 0) (mapUnit2 multiply globalScale (mapUnit (swap divide 2) height)) children"
															},
															'lineNum': "158"
														},
														'lineNum': "158"
													}
												],
												'lineNum': "157"
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
														'expr': "mouseScrollAction"
													},
													'lineNum': "163"
												},
												'lineNum': "163"
											}
										],
										'lineNum': "156"
									}
								},
								'lineNum': "1"
							},
							'fileName': "situationView.tpl"
						},
						'videoTimeline': {
							'kind': "lineTemplate",
							'template': {
								'kind': "templateCode",
								'params': [
									"width",
									"height",
									"video",
									"timeSelection"
								],
								'type': "(Number) -> (Number) -> (X.video) -> (TimeSelection) -> XMLP",
								'let': {
									'videoWidth': {
										'kind': "lineExpr",
										'expr': "X.video:width video"
									},
									'videoHeight': {
										'kind': "lineExpr",
										'expr': "X.video:height video"
									},
									'duration': {
										'kind': "lineExpr",
										'expr': "X.video:duration video"
									},
									'url': {
										'kind': "lineExpr",
										'expr': "X.video:url video"
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

														},
														'lineNum': "8"
													}
												}
											],
											'lineNum': "8"
										},
										'lineNum': "8"
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

														},
														'lineNum': "10"
													}
												}
											],
											'lineNum': "10"
										},
										'lineNum': "10"
									},
									'selStart': {
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

														},
														'lineNum': "13"
													}
												}
											],
											'lineNum': "13"
										},
										'lineNum': "13"
									},
									'selDuration': {
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

														},
														'lineNum': "14"
													}
												}
											],
											'lineNum': "14"
										},
										'lineNum': "14"
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

														},
														'lineNum': "15"
													}
												}
											],
											'lineNum': "15"
										},
										'lineNum': "15"
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

														},
														'lineNum': "18"
													}
												}
											],
											'lineNum': "18"
										},
										'lineNum': "18"
									},
									'sel1': {
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

														},
														'lineNum': "19"
													}
												}
											],
											'lineNum': "19"
										},
										'lineNum': "19"
									},
									'sel2': {
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

														},
														'lineNum': "20"
													}
												}
											],
											'lineNum': "20"
										},
										'lineNum': "20"
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
},
										'fileName': "drawCuts.tpl"
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
},
										'fileName': "quicktime.tpl"
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
																											'kind': "on",
																											'event': "mouseout",
																											'action': {
																												'kind': "action",
																												'params': [

																												],
																												'type': "Action",
																												'actions': [
																													{
																														'action': {
																															'kind': "extract",
																															'select': "selStart",
																															'action': {
																																'kind': "action",
																																'params': [
																																	"selStart"
																																],
																																'type': "(t0) -> Action",
																																'actions': [
																																	{
																																		'action': {
																																			'kind': "extract",
																																			'select': "selDuration",
																																			'action': {
																																				'kind': "action",
																																				'params': [
																																					"selDuration"
																																				],
																																				'type': "(t0) -> Action",
																																				'actions': [
																																					{
																																						'action': {
																																							'kind': "actionUpdate",
																																							'target': "previewTime",
																																							'actionType': "add",
																																							'key': "selStart",
																																							'value': undefined,
																																							'lineNum': "29"
																																						}
																																					},
																																					{
																																						'action': {
																																							'kind': "actionUpdate",
																																							'target': "TimeSelection:start timeSelection",
																																							'actionType': "add",
																																							'key': "selStart",
																																							'value': undefined,
																																							'lineNum': "30"
																																						}
																																					},
																																					{
																																						'action': {
																																							'kind': "actionUpdate",
																																							'target': "TimeSelection:duration timeSelection",
																																							'actionType': "add",
																																							'key': "selDuration",
																																							'value': undefined,
																																							'lineNum': "31"
																																						}
																																					}
																																				],
																																				'lineNum': "28"
																																			},
																																			'lineNum': "28"
																																		}
																																	}
																																],
																																'lineNum': "27"
																															},
																															'lineNum': "27"
																														}
																													}
																												],
																												'lineNum': "26"
																											},
																											'lineNum': "26"
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
																														'expr': "divide duration zoomWidth"
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
																																				'value': undefined,
																																				'lineNum': "39"
																																			}
																																		}
																																	],
																																	'lineNum': "38"
																																},
																																'lineNum': "38"
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
																																				'target': "sel1",
																																				'actionType': "remove",
																																				'key': undefined,
																																				'value': undefined,
																																				'lineNum': "42"
																																			}
																																		},
																																		{
																																			'action': {
																																				'kind': "actionUpdate",
																																				'target': "sel2",
																																				'actionType': "remove",
																																				'key': undefined,
																																				'value': undefined,
																																				'lineNum': "43"
																																			}
																																		},
																																		{
																																			'action': {
																																				'kind': "actionUpdate",
																																				'target': "selStart",
																																				'actionType': "add",
																																				'key': "multiply timeMultiplier event.offsetX",
																																				'value': undefined,
																																				'lineNum': "44"
																																			}
																																		},
																																		{
																																			'action': {
																																				'kind': "actionUpdate",
																																				'target': "selDuration",
																																				'actionType': "add",
																																				'key': "0",
																																				'value': undefined,
																																				'lineNum': "45"
																																			}
																																		}
																																	],
																																	'lineNum': "41"
																																},
																																'lineNum': "41"
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
																																				'target': "selecting",
																																				'actionType': "add",
																																				'key': "null",
																																				'value': undefined,
																																				'lineNum': "49"
																																			}
																																		},
																																		{
																																			'action': {
																																				'kind': "actionUpdate",
																																				'target': "sel1",
																																				'actionType': "add",
																																				'key': "event.offsetX",
																																				'value': undefined,
																																				'lineNum': "50"
																																			}
																																		},
																																		{
																																			'action': {
																																				'kind': "actionUpdate",
																																				'target': "sel2",
																																				'actionType': "add",
																																				'key': "event.offsetX",
																																				'value': undefined,
																																				'lineNum': "51"
																																			}
																																		}
																																	],
																																	'lineNum': "48"
																																},
																																'lineNum': "48"
																															},
																															{
																																'kind': "on",
																																'event': "globalmouseup",
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
																																				'value': undefined,
																																				'lineNum': "54"
																																			}
																																		}
																																	],
																																	'lineNum': "53"
																																},
																																'lineNum': "53"
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
																																							'target': "sel2",
																																							'actionType': "add",
																																							'key': "event.offsetX",
																																							'value': undefined,
																																							'lineNum': "58"
																																						}
																																					}
																																				],
																																				'lineNum': "57"
																																			},
																																			'lineNum': "57"
																																		}
																																	},
																																	'lineNum': "56"
																																},
																																'lineNum': "56"
																															},
																															{
																																'kind': "trigger",
																																'trigger': "mapUnit2 min sel1 sel2",
																																'action': {
																																	'kind': "action",
																																	'params': [
																																		"s"
																																	],
																																	'type': "(t0) -> Action",
																																	'actions': [
																																		{
																																			'action': {
																																				'kind': "actionUpdate",
																																				'target': "selStart",
																																				'actionType': "add",
																																				'key': "multiply timeMultiplier s",
																																				'value': undefined,
																																				'lineNum': "63"
																																			}
																																		}
																																	],
																																	'lineNum': "62"
																																},
																																'lineNum': "62"
																															},
																															{
																																'kind': "trigger",
																																'trigger': "mapUnit abs (mapUnit2 subtract sel1 sel2)",
																																'action': {
																																	'kind': "action",
																																	'params': [
																																		"s"
																																	],
																																	'type': "(t0) -> Action",
																																	'actions': [
																																		{
																																			'action': {
																																				'kind': "actionUpdate",
																																				'target': "selDuration",
																																				'actionType': "add",
																																				'key': "multiply timeMultiplier s",
																																				'value': undefined,
																																				'lineNum': "66"
																																			}
																																		}
																																	],
																																	'lineNum': "65"
																																},
																																'lineNum': "65"
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

																																],
																																'lineNum': "71"
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
																																					'expr': "drawCuts cuts (divide 0.0417083322 timeMultiplier)"
																																				},
																																				'lineNum': "75"
																																			},
																																			'lineNum': "75"
																																		}
																																	},
																																	'lineNum': "74"
																																},
																																'lineNum': "74"
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

																																],
																																'lineNum': "79"
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
																																		'expr': "defaultValue -10 (mapUnit (swap divide timeMultiplier) selStart)"
																																	},
																																	'width': {
																																		'kind': "insert",
																																		'expr': "defaultValue 0 (mapUnit (swap divide timeMultiplier) selDuration)"
																																	}
																																},
																																'children': [

																																],
																																'lineNum': "83"
																															}
																														],
																														'lineNum': "37"
																													}
																												},
																												'lineNum': "35"
																											},
																											'lineNum': "35"
																										}
																									],
																									'lineNum': "25"
																								}
																							},
																							'lineNum': "24"
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
																													'expr': "quicktime width height url previewTime timeLoaded"
																												},
																												'lineNum': "94"
																											},
																											'lineNum': "94"
																										}
																									],
																									'lineNum': "93"
																								}
																							},
																							'lineNum': "92"
																						}
																					},
																					'ratio': {
																						'kind': "lineExpr",
																						'expr': "divide videoWidth videoHeight"
																					},
																					'scaledHeight': {
																						'kind': "lineExpr",
																						'expr': "height"
																					},
																					'scaledWidth': {
																						'kind': "lineExpr",
																						'expr': "multiply ratio scaledHeight"
																					},
																					'timelineWidth': {
																						'kind': "lineExpr",
																						'expr': "subtract width scaledWidth"
																					},
																					'timelineControlsWidth': {
																						'kind': "lineExpr",
																						'expr': "20"
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
																												'value': undefined,
																												'lineNum': "109"
																											}
																										}
																									],
																									'lineNum': "108"
																								},
																								'lineNum': "108"
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
																																							'value': undefined,
																																							'lineNum': "116"
																																						}
																																					}
																																				],
																																				'lineNum': "116"
																																			},
																																			'lineNum': "116"
																																		}
																																	],
																																	'lineNum': "115"
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
																																							'value': undefined,
																																							'lineNum': "119"
																																						}
																																					}
																																				],
																																				'lineNum': "119"
																																			},
																																			'lineNum': "119"
																																		}
																																	],
																																	'lineNum': "118"
																																}
																															],
																															'lineNum': "114"
																														}
																													},
																													'lineNum': "113"
																												},
																												'lineNum': "113"
																											}
																										],
																										'lineNum': "112"
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
																														'expr': "drawTimeline (subtract timelineWidth timelineControlsWidth) height"
																													},
																													'lineNum': "125"
																												},
																												'lineNum': "125"
																											}
																										],
																										'lineNum': "124"
																									}
																								],
																								'lineNum': "111"
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
																												'expr': "drawPreview scaledWidth scaledHeight"
																											},
																											'lineNum': "130"
																										},
																										'lineNum': "130"
																									}
																								],
																								'lineNum': "129"
																							}
																						],
																						'lineNum': "107"
																					}
																				},
																				'lineNum': "22"
																			},
																			'lineNum': "22"
																		}
																	},
																	'lineNum': "22"
																},
																'lineNum': "22"
															}
														},
														'lineNum': "22"
													},
													'lineNum': "22"
												}
											},
											'lineNum': "22"
										},
										'lineNum': "22"
									}
								},
								'lineNum': "1"
							},
							'fileName': "videoTimeline.tpl"
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
									'kind': "on",
									'event': "init",
									'action': {
										'kind': "action",
										'params': [

										],
										'type': "Action",
										'actions': [
											{
												'name': "timeSel",
												'action': {
													'kind': "actionCreate",
													'type': "TimeSelection",
													'prop': {

													},
													'lineNum': "27"
												}
											},
											{
												'action': {
													'kind': "actionUpdate",
													'target': "timelines",
													'actionType': "add",
													'key': "tobytest.myTimelineSit",
													'value': "timeSel",
													'lineNum': "28"
												}
											}
										],
										'lineNum': "26"
									},
									'lineNum': "26"
								},
								{
									'kind': "element",
									'nodeName': "div",
									'attributes': {

									},
									'style': {
										'position': "absolute",
										'width': {
											'kind': "insert",
											'expr': "width"
										},
										'height': {
											'kind': "insert",
											'expr': "sitViewHeight"
										}
									},
									'children': [
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
													'expr': "situationView width sitViewHeight initChildren"
												},
												'lineNum': "32"
											},
											'lineNum': "32"
										}
									],
									'lineNum': "31"
								}
							],
							'lineNum': "25"
						}
					},
					'lineNum': "1"
				},
				'fileName': "top.tpl"
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
										'expr': "init"
									}
								}
							],
							'lineNum': "115"
						},
						'lineNum': "115"
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
								'expr': "top (UI.ui:screenWidth ui.ui) (UI.ui:screenHeight ui.ui)"
							},
							'lineNum': "116"
						},
						'lineNum': "116"
					}
				],
				'lineNum': "114"
			}
		},
		'lineNum': "1"
	},
	'fileName': "andrew.tpl"
};