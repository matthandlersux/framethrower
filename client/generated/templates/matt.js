var mainTemplate = {
	'kind': "lineTemplate",
	'template': {
		'kind': "templateCode",
		'params': [

		],
		'type': "XMLP",
		'let': {
			'content': {
				'kind': "lineTemplate",
				'template': {
					'kind': "templateCode",
					'params': [

					],
					'type': "XMLP",
					'let': {
						'boxes': {
							'kind': "lineState",
							'action': {
								'kind': "action",
								'params': [

								],
								'type': "Action",
								'actions': [
									{
										'name': "b",
										'action': {
											'kind': "actionCreate",
											'type': "Set Number",
											'prop': {

											},
											'lineNum': "2"
										}
									},
									{
										'action': {
											'kind': "actionUpdate",
											'target': "b",
											'actionType': "add",
											'key': "1",
											'value': undefined,
											'lineNum': "3"
										}
									},
									{
										'action': {
											'kind': "actionUpdate",
											'target': "b",
											'actionType': "add",
											'key': "2",
											'value': undefined,
											'lineNum': "4"
										}
									},
									{
										'action': {
											'kind': "actionUpdate",
											'target': "b",
											'actionType': "add",
											'key': "3",
											'value': undefined,
											'lineNum': "5"
										}
									},
									{
										'action': {
											'kind': "lineExpr",
											'expr': "b"
										}
									}
								],
								'lineNum': "1"
							},
							'lineNum': "1"
						}
					},
					'output': {
						'kind': "lineXML",
						'xml': {
							'kind': "for-each",
							'select': "boxes",
							'templateCode': {
								'kind': "templateCode",
								'params': [
									"box"
								],
								'type': "(t0) -> XMLP",
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
												'nodeValue': "box "
											},
											{
												'kind': "textElement",
												'nodeValue': {
													'kind': "insert",
													'expr': "box"
												}
											}
										],
										'lineNum': "9"
									}
								},
								'lineNum': "8"
							},
							'lineNum': "8"
						}
					},
					'lineNum': "0"
				},
				'fileName': "content.tpl"
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
					'type': "(XMLP) -> (Unit Number) -> (Unit Number) -> XMLP",
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
											'lineNum': "1"
										}
									}
								],
								'lineNum': "1"
							},
							'lineNum': "1"
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
											'lineNum': "2"
										}
									}
								],
								'lineNum': "2"
							},
							'lineNum': "2"
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
											'lineNum': "3"
										}
									}
								],
								'lineNum': "3"
							},
							'lineNum': "3"
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
								},
								'attribute': {
									'kind': "insert",
									'expr': "expr"
								},
								'att2': "5px"
							},
							'children': [
								{
									'kind': "textElement",
									'nodeValue': ""
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
													'value': undefined,
													'lineNum': "6"
												}
											},
											{
												'action': {
													'kind': "actionUpdate",
													'target': "offsetY",
													'actionType': "add",
													'key': "event.offsetY",
													'value': undefined,
													'lineNum': "7"
												}
											},
											{
												'action': {
													'kind': "actionUpdate",
													'target': "dragging",
													'actionType': "add",
													'key': "null",
													'value': undefined,
													'lineNum': "8"
												}
											}
										],
										'lineNum': "5"
									},
									'lineNum': "5"
								},
								{
									'kind': "textElement",
									'nodeValue': ""
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
												'nodeName': "span",
												'attributes': {

												},
												'style': {

												},
												'children': [
													{
														'kind': "textElement",
														'nodeValue': ""
													},
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
																	'kind': "trigger",
																	'trigger': "UI.ui:mouseX ui.ui",
																	'action': {
																		'kind': "action",
																		'params': [
																			"mouseX"
																		],
																		'type': "(t0) -> Action",
																		'actions': [
																			{
																				'action': {
																					'kind': "actionUpdate",
																					'target': "x",
																					'actionType': "add",
																					'key': "subtract mouseX offsetX",
																					'value': undefined,
																					'lineNum': "14"
																				}
																			}
																		],
																		'lineNum': "13"
																	},
																	'lineNum': "13"
																}
															},
															'lineNum': "12"
														},
														'lineNum': "12"
													},
													{
														'kind': "textElement",
														'nodeValue': ""
													},
													{
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
																	'kind': "trigger",
																	'trigger': "UI.ui:mouseY ui.ui",
																	'action': {
																		'kind': "action",
																		'params': [
																			"mouseY"
																		],
																		'type': "(t0) -> Action",
																		'actions': [
																			{
																				'action': {
																					'kind': "actionUpdate",
																					'target': "y",
																					'actionType': "add",
																					'key': "subtract mouseY offsetY",
																					'value': undefined,
																					'lineNum': "19"
																				}
																			}
																		],
																		'lineNum': "18"
																	},
																	'lineNum': "18"
																}
															},
															'lineNum': "17"
														},
														'lineNum': "17"
													},
													{
														'kind': "textElement",
														'nodeValue': ""
													},
													{
														'kind': "trigger",
														'trigger': "reactiveNot (UI.ui:mouseDown ui.ui)",
														'action': {
															'kind': "action",
															'params': [
																"_"
															],
															'type': "(t0) -> Action",
															'actions': [
																{
																	'action': {
																		'kind': "actionUpdate",
																		'target': "offsetX",
																		'actionType': "remove",
																		'key': undefined,
																		'value': undefined,
																		'lineNum': "23"
																	}
																},
																{
																	'action': {
																		'kind': "actionUpdate",
																		'target': "offsetY",
																		'actionType': "remove",
																		'key': undefined,
																		'value': undefined,
																		'lineNum': "24"
																	}
																},
																{
																	'action': {
																		'kind': "actionUpdate",
																		'target': "dragging",
																		'actionType': "remove",
																		'key': undefined,
																		'value': undefined,
																		'lineNum': "25"
																	}
																}
															],
															'lineNum': "22"
														},
														'lineNum': "22"
													},
													{
														'kind': "textElement",
														'nodeValue': ""
													}
												],
												'lineNum': "11"
											}
										},
										'lineNum': "10"
									},
									'lineNum': "10"
								},
								{
									'kind': "textElement",
									'nodeValue': ""
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
											'expr': "content"
										},
										'lineNum': "29"
									},
									'lineNum': "29"
								},
								{
									'kind': "textElement",
									'nodeValue': ""
								}
							],
							'lineNum': "4"
						}
					},
					'lineNum': "0"
				},
				'fileName': "dragdrop.tpl"
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