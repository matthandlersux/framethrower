var mainTemplate = {
	'kind': "templateCode",
	'params': [

	],
	'type': "XMLP",
	'let': {
		'test': {
			'kind': "lineExpr",
			'expr': "88",
			'let': {

			}
		},
		'myTemplate': {
			'kind': "lineTemplate",
			'template': {
				'kind': "templateCode",
				'params': [
					"x"
				],
				'type': "Number -> XMLP",
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
								'nodeValue': "Here's another template that has access to scope, see: "
							},
							{
								'kind': "textElement",
								'nodeValue': {
									'kind': "insert",
									'expr': "test"
								}
							},
							{
								'kind': "textElement",
								'nodeValue': " , and here's a parameter: "
							},
							{
								'kind': "textElement",
								'nodeValue': {
									'kind': "insert",
									'expr': "x"
								}
							}
						]
					}
				}
			}
		},
		'jsfun': {
			'kind': "lineJavascript",
			'type': "Number -> t0",
			'f': function (x) {return x + 99 ;}
		},
		'counter': {
			'kind': "lineTemplate",
			'template': {
				'kind': "templateCode",
				'params': [

				],
				'type': "XMLP",
				'let': {
					'counterValue': {
						'kind': "lineState",
						'type': "Unit Number"
					},
					'changeState': {
						'kind': "lineAction",
						'action': {
							'kind': "action",
							'params': [
								"newValue"
							],
							'type': "Number -> Action",
							'actions': [
								{
									'action': {
										'kind': "actionUpdate",
										'target': "counterValue",
										'actionType': "add",
										'key': "newValue",
										'val': undefined
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
							'testatt': {
								'kind': "insert",
								'expr': "test"
							}
						},
						'style': {

						},
						'children': [
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
										'nodeValue': "\n			Counter value: "
									},
									{
										'kind': "textElement",
										'nodeValue': {
											'kind': "insert",
											'expr': "counterValue"
										}
									}
								]
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
														'kind': "lineExpr",
														'expr': "changeState 0",
														'let': {

														}
													}
												}
											]
										}
									},
									{
										'kind': "textElement",
										'nodeValue': "\n			Reset Counter\n		"
									}
								]
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
										'kind': "for-each",
										'select': "counterValue",
										'templateCode': {
											'kind': "templateCode",
											'params': [
												"currentState"
											],
											'type': "t0 -> XMLP",
											'let': {

											},
											'output': {
												'kind': "lineXML",
												'xml': {
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
																	'kind': "lineExpr",
																	'expr': "changeState (plus currentState 1)",
																	'let': {

																	}
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
										'nodeValue': "\n			Increment Counter\n		"
									}
								]
							}
						]
					}
				}
			}
		},
		'dragging': {
			'kind': "lineTemplate",
			'template': {
				'kind': "templateCode",
				'params': [

				],
				'type': "XMLP",
				'let': {
					'dragging': {
						'kind': "lineState",
						'type': "Unit Null"
					},
					'startDrag': {
						'kind': "lineAction",
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
										'val': undefined
									}
								}
							]
						}
					},
					'stopDrag': {
						'kind': "lineAction",
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
										'actionType': "remove",
										'key': undefined,
										'val': undefined
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
								'nodeValue': "\n		Draggin "
							},
							{
								'kind': "textElement",
								'nodeValue': {
									'kind': "insert",
									'expr': "UI.ui:mouseX ui.ui"
								}
							},
							{
								'kind': "textElement",
								'nodeValue': " "
							},
							{
								'kind': "textElement",
								'nodeValue': {
									'kind': "insert",
									'expr': "UI.ui:mouseY ui.ui"
								}
							}
						]
					}
				}
			}
		},
		'set': {
			'kind': "lineTemplate",
			'template': {
				'kind': "templateCode",
				'params': [

				],
				'type': "XMLP",
				'let': {
					'myset': {
						'kind': "lineState",
						'type': "Set Number"
					},
					'randomNumber': {
						'kind': "lineJavascript",
						'type': "t0 -> t1",
						'f': function (n) {return Math.round (Math.random () * n) ;}
					},
					'addToSet': {
						'kind': "lineAction",
						'action': {
							'kind': "action",
							'params': [
								"n"
							],
							'type': "t0 -> Action",
							'actions': [
								{
									'action': {
										'kind': "actionUpdate",
										'target': "myset",
										'actionType': "add",
										'key': "n",
										'val': undefined
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
								'kind': "element",
								'nodeName': "div",
								'attributes': {

								},
								'style': {

								},
								'children': [
									{
										'kind': "textElement",
										'nodeValue': "The set: "
									},
									{
										'kind': "textElement",
										'nodeValue': {
											'kind': "insert",
											'expr': "myset"
										}
									}
								]
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
														'kind': "lineExpr",
														'expr': "addToSet 30",
														'let': {

														}
													}
												}
											]
										}
									},
									{
										'kind': "textElement",
										'nodeValue': "\n			Add a number to the set\n		"
									}
								]
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
														'kind': "lineExpr",
														'expr': "addToSet 22",
														'let': {

														}
													}
												}
											]
										}
									},
									{
										'kind': "textElement",
										'nodeValue': "\n			Add a different number\n		"
									}
								]
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
			'kind': "element",
			'nodeName': "div",
			'attributes': {
				'testatt': {
					'kind': "insert",
					'expr': "test"
				}
			},
			'style': {

			},
			'children': [
				{
					'kind': "textElement",
					'nodeValue': "\n		Hello World.\n		"
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
							'nodeValue': "\n			Set test: "
						},
						{
							'kind': "textElement",
							'nodeValue': {
								'kind': "insert",
								'expr': "testCell"
							}
						}
					]
				},
				{
					'kind': "for-each",
					'select': "testCell",
					'templateCode': {
						'kind': "templateCode",
						'params': [
							"entry"
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
										'nodeValue': "An entry: "
									},
									{
										'kind': "textElement",
										'nodeValue': {
											'kind': "insert",
											'expr': "entry"
										}
									}
								]
							}
						}
					}
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
							'expr': "myTemplate (jsfun 9999)",
							'let': {

							}
						}
					}
				},
				{
					'kind': "element",
					'nodeName': "hr",
					'attributes': {

					},
					'style': {

					},
					'children': [

					]
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
									'expr': "counter",
									'let': {

									}
								}
							}
						}
					]
				},
				{
					'kind': "element",
					'nodeName': "hr",
					'attributes': {

					},
					'style': {

					},
					'children': [

					]
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
									'expr': "set",
									'let': {

									}
								}
							}
						}
					]
				},
				{
					'kind': "element",
					'nodeName': "hr",
					'attributes': {

					},
					'style': {

					},
					'children': [

					]
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
									'expr': "dragging",
									'let': {

									}
								}
							}
						}
					]
				}
			]
		}
	}
};