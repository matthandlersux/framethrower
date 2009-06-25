var mainTemplate = {
	'kind': "lineTemplate",
	'template': {
		'kind': "templateCode",
		'params': [

		],
		'type': "XMLP",
		'let': {
			'dragDrop': {
				'kind': "lineTemplate",
				'template': {
					'kind': "templateCode",
					'params': [
						"x"
					],
					'type': "(Unit Number) -> XMLP",
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
							'nodeName': "f:wrapper",
							'attributes': {

							},
							'style': {

							},
							'children': [
								{
									'kind': "for-each",
									'select': "x",
									'templateCode': {
										'kind': "templateCode",
										'params': [
											"x"
										],
										'type': "(t0) -> XMLP",
										'let': {

										},
										'output': {
											'kind': "lineXML",
											'xml': {
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
																'key': "subtract event.mouseX x",
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
													}
												]
											}
										}
									}
								}
							]
						}
					}
				}
			},
			'x': {
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

								}
							}
						},
						{
							'action': {
								'kind': "actionUpdate",
								'target': "x",
								'actionType': "add",
								'key': "50",
								'value': undefined
							}
						},
						{
							'action': {
								'kind': "lineExpr",
								'expr': "x",
								'let': {

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
				'kind': "for-each",
				'select': "x",
				'templateCode': {
					'kind': "templateCode",
					'params': [
						"myx"
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
								'position': "absolute",
								'left': {
									'kind': "insert",
									'expr': "myx"
								}
							},
							'children': [
								{
									'kind': "textElement",
									'nodeValue': "\n            Hey\n            "
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
											'expr': "dragDrop x",
											'let': {

											}
										}
									}
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
};