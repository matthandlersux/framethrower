var mainTemplate = {
	'kind': "lineTemplate",
	'template': {
		'kind': "templateCode",
		'params': [

		],
		'type': "XMLP",
		'let': {
			'makeNamedObject': {
				'kind': "lineAction",
				'action': {
					'kind': "action",
					'params': [
						"name",
						"type"
					],
					'type': "String -> Object -> Action",
					'actions': [
						{
							'name': "object",
							'action': {
								'kind': "actionCreate",
								'type': "Object",
								'prop': {

								}
							}
						},
						{
							'action': {
								'kind': "lineExpr",
								'expr': "nameObject object name",
								'let': {

								}
							}
						},
						{
							'action': {
								'kind': "lineExpr",
								'expr': "typeObject object type",
								'let': {

								}
							}
						}
					]
				}
			},
			'nameObject': {
				'kind': "lineAction",
				'action': {
					'kind': "action",
					'params': [
						"object",
						"name"
					],
					'type': "Object -> String -> Action",
					'actions': [
						{
							'name': "nameText",
							'action': {
								'kind': "actionCreate",
								'type': "X.text",
								'prop': {
									'string': "name"
								}
							}
						},
						{
							'action': {
								'kind': "lineExpr",
								'expr': "makeOntProperty shared.name object (X.text~Object nameText)",
								'let': {

								}
							}
						}
					]
				}
			},
			'thumbnailObject': {
				'kind': "lineAction",
				'action': {
					'kind': "action",
					'params': [
						"object",
						"url",
						"width",
						"height"
					],
					'type': "Object -> String -> Number -> Number -> Action",
					'actions': [
						{
							'name': "pic",
							'action': {
								'kind': "actionCreate",
								'type': "X.picture",
								'prop': {
									'url': "url",
									'width': "width",
									'height': "height"
								}
							}
						},
						{
							'action': {
								'kind': "lineExpr",
								'expr': "makeOntProperty relation object pic",
								'let': {

								}
							}
						}
					]
				}
			},
			'typeObject': {
				'kind': "lineAction",
				'action': {
					'kind': "action",
					'params': [
						"object",
						"type"
					],
					'type': "Object -> Object -> Action",
					'actions': [
						{
							'action': {
								'kind': "lineExpr",
								'expr': "makeOntProperty shared.isA object type",
								'let': {

								}
							}
						}
					]
				}
			},
			'makeType': {
				'kind': "lineAction",
				'action': {
					'kind': "action",
					'params': [
						"object"
					],
					'type': "Object -> Action",
					'actions': [
						{
							'name': "infon",
							'action': {
								'kind': "lineExpr",
								'expr': "makeInfon1 shared.isType object",
								'let': {

								}
							}
						},
						{
							'action': {
								'kind': "lineExpr",
								'expr': "makeTrueInOnt infon",
								'let': {

								}
							}
						}
					]
				}
			},
			'makeOntProperty': {
				'kind': "lineAction",
				'action': {
					'kind': "action",
					'params': [
						"relation",
						"arg1",
						"arg2"
					],
					'type': "Object -> Object -> Object -> Action",
					'actions': [
						{
							'name': "infon",
							'action': {
								'kind': "lineExpr",
								'expr': "makeInfon2 relation arg1 arg2",
								'let': {

								}
							}
						},
						{
							'action': {
								'kind': "lineExpr",
								'expr': "makeTrueInOnt infon",
								'let': {

								}
							}
						}
					]
				}
			},
			'makeTrueInOnt': {
				'kind': "lineAction",
				'action': {
					'kind': "action",
					'params': [
						"infon"
					],
					'type': "Cons -> Action",
					'actions': [
						{
							'action': {
								'kind': "lineExpr",
								'expr': "putObjectInSituation (Cons~Object infon) shared.ont",
								'let': {

								}
							}
						}
					]
				}
			},
			'putObjectInSituation': {
				'kind': "lineAction",
				'action': {
					'kind': "action",
					'params': [
						"object",
						"situation"
					],
					'type': "Object -> Object -> Action",
					'actions': [
						{
							'name': "infon",
							'action': {
								'kind': "lineExpr",
								'expr': "makeInfon2 shared.in situation object",
								'let': {

								}
							}
						},
						{
							'action': {
								'kind': "actionUpdate",
								'target': "Cons:truth infon",
								'actionType': "add",
								'key': "null",
								'val': undefined
							}
						}
					]
				}
			},
			'makeCons': {
				'kind': "lineAction",
				'action': {
					'kind': "action",
					'params': [
						"left",
						"right"
					],
					'type': "Object -> Object -> Action",
					'actions': [
						{
							'name': "cons",
							'action': {
								'kind': "actionCreate",
								'type': "Cons",
								'prop': {
									'left': "left",
									'right': "right"
								}
							}
						},
						{
							'action': {
								'kind': "actionUpdate",
								'target': "Object:upRight left",
								'actionType': "add",
								'key': "cons",
								'val': undefined
							}
						},
						{
							'action': {
								'kind': "actionUpdate",
								'target': "Object:upLeft right",
								'actionType': "add",
								'key': "cons",
								'val': undefined
							}
						},
						{
							'action': {
								'kind': "lineExpr",
								'expr': "cons",
								'let': {

								}
							}
						}
					]
				}
			},
			'makeInfon1': {
				'kind': "lineExpr",
				'expr': "makeCons",
				'let': {

				}
			},
			'makeInfon2': {
				'kind': "lineAction",
				'action': {
					'kind': "action",
					'params': [
						"relation",
						"arg1",
						"arg2"
					],
					'type': "Object -> Object -> Object -> Action",
					'actions': [
						{
							'name': "cons1",
							'action': {
								'kind': "lineExpr",
								'expr': "makeCons relation arg1",
								'let': {

								}
							}
						},
						{
							'action': {
								'kind': "lineExpr",
								'expr': "makeCons (Cons~Object cons1) arg2",
								'let': {

								}
							}
						}
					]
				}
			},
			'makeInfon3': {
				'kind': "lineAction",
				'action': {
					'kind': "action",
					'params': [
						"relation",
						"arg1",
						"arg2",
						"arg3"
					],
					'type': "Object -> Object -> Object -> Object -> Action",
					'actions': [
						{
							'name': "cons1",
							'action': {
								'kind': "lineExpr",
								'expr': "makeCons relation arg1",
								'let': {

								}
							}
						},
						{
							'name': "cons2",
							'action': {
								'kind': "lineExpr",
								'expr': "makeCons (Cons~Object cons1) arg2",
								'let': {

								}
							}
						},
						{
							'action': {
								'kind': "lineExpr",
								'expr': "makeCons (Cons~Object cons2) arg3",
								'let': {

								}
							}
						}
					]
				}
			},
			'prepareState': {
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
								'expr': "makeType shared.type",
								'let': {

								}
							}
						},
						{
							'action': {
								'kind': "lineExpr",
								'expr': "makeType shared.type.situation",
								'let': {

								}
							}
						},
						{
							'action': {
								'kind': "lineExpr",
								'expr': "makeType shared.type.entity",
								'let': {

								}
							}
						},
						{
							'action': {
								'kind': "lineExpr",
								'expr': "nameObject shared.type \"Type\"",
								'let': {

								}
							}
						},
						{
							'action': {
								'kind': "lineExpr",
								'expr': "nameObject shared.type.situation \"Situation\"",
								'let': {

								}
							}
						},
						{
							'action': {
								'kind': "lineExpr",
								'expr': "nameObject shared.type.entity \"Entity\"",
								'let': {

								}
							}
						},
						{
							'action': {
								'kind': "lineExpr",
								'expr': "typeObject shared.type.situation shared.type",
								'let': {

								}
							}
						},
						{
							'action': {
								'kind': "lineExpr",
								'expr': "typeObject shared.type.entity shared.type",
								'let': {

								}
							}
						},
						{
							'action': {
								'kind': "lineExpr",
								'expr': "nameObject shared.ont \"Ontological Layer\"",
								'let': {

								}
							}
						},
						{
							'action': {
								'kind': "lineExpr",
								'expr': "typeObject shared.ont shared.type.situation",
								'let': {

								}
							}
						},
						{
							'action': {
								'kind': "lineExpr",
								'expr': "nameObject shared.realLife \"Real Life\"",
								'let': {

								}
							}
						},
						{
							'action': {
								'kind': "lineExpr",
								'expr': "typeObject shared.realLife shared.type.situation",
								'let': {

								}
							}
						},
						{
							'action': {
								'kind': "lineExpr",
								'expr': "nameObject shared.test.walleMovie \"Wall-E\"",
								'let': {

								}
							}
						},
						{
							'action': {
								'kind': "lineExpr",
								'expr': "putObjectInSituation shared.test.walleMovie shared.realLife",
								'let': {

								}
							}
						}
					]
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
							'type': "Unit Number"
						},
						'offsetY': {
							'kind': "lineState",
							'type': "Unit Number"
						},
						'dragging': {
							'kind': "lineState",
							'type': "Unit Null"
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
													'val': undefined
												}
											},
											{
												'action': {
													'kind': "actionUpdate",
													'target': "offsetY",
													'actionType': "add",
													'key': "event.offsetY",
													'val': undefined
												}
											},
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
																					'val': undefined
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
																					'val': undefined
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
																		'val': undefined
																	}
																},
																{
																	'action': {
																		'kind': "actionUpdate",
																		'target': "offsetY",
																		'actionType': "remove",
																		'key': undefined,
																		'val': undefined
																	}
																},
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
			},
			'outline': {
				'kind': "lineTemplate",
				'template': {
					'kind': "templateCode",
					'params': [
						"focus",
						"print",
						"getChildren"
					],
					'type': "t0 -> t1 -> t2 -> XMLP",
					'let': {
						'expanded': {
							'kind': "lineState",
							'type': "Unit Null"
						}
					},
					'output': {
						'kind': "lineXML",
						'xml': {
							'kind': "element",
							'nodeName': "div",
							'attributes': {
								'class': "outline"
							},
							'style': {

							},
							'children': [
								{
									'kind': "textElement",
									'nodeValue': "\n        "
								},
								{
									'kind': "for-each",
									'select': "expanded",
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
												'nodeName': "div",
												'attributes': {
													'class': "outline-expanded"
												},
												'style': {

												},
												'children': [
													{
														'kind': "textElement",
														'nodeValue': "\n                "
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
																		'target': "expanded",
																		'actionType': "remove",
																		'key': undefined,
																		'val': undefined
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
									'kind': "for-each",
									'select': "reactiveNot expanded",
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
												'nodeName': "div",
												'attributes': {
													'class': "outline-collapsed"
												},
												'style': {

												},
												'children': [
													{
														'kind': "textElement",
														'nodeValue': "\n                "
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
																		'target': "expanded",
																		'actionType': "add",
																		'key': "null",
																		'val': undefined
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
									'nodeValue': "\n        \n        "
								},
								{
									'kind': "element",
									'nodeName': "div",
									'attributes': {
										'class': "outline-entry"
									},
									'style': {

									},
									'children': [
										{
											'kind': "textElement",
											'nodeValue': "\n            "
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
													'expr': "print focus",
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
								},
								{
									'kind': "textElement",
									'nodeValue': "\n        "
								},
								{
									'kind': "for-each",
									'select': "expanded",
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
												'nodeName': "div",
												'attributes': {
													'class': "outline-children"
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
														'select': "getChildren focus",
														'templateCode': {
															'kind': "templateCode",
															'params': [
																"child"
															],
															'type': "t0 -> XMLP",
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
																			'expr': "outline child print getChildren",
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
														'nodeValue': "\n            "
													}
												]
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
			},
			'printObject': {
				'kind': "lineTemplate",
				'template': {
					'kind': "templateCode",
					'params': [
						"focus"
					],
					'type': "Object -> XMLP",
					'let': {
						'name': {
							'kind': "lineExpr",
							'expr': "getName focus",
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

							},
							'children': [
								{
									'kind': "textElement",
									'nodeValue': "\n        "
								},
								{
									'kind': "for-each",
									'select': "name",
									'templateCode': {
										'kind': "templateCode",
										'params': [
											"name"
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
														'nodeValue': {
															'kind': "insert",
															'expr': "name"
														}
													}
												]
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
			},
			'videoTimeline': {
				'kind': "lineTemplate",
				'template': {
					'kind': "templateCode",
					'params': [
						"width",
						"height"
					],
					'type': "Number -> Number -> XMLP",
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
									'nodeValue': "\n        \n    "
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

				},
				'style': {

				},
				'children': [
					{
						'kind': "textElement",
						'nodeValue': "\n        "
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
										'expr': "prepareState",
										'let': {

										}
									}
								}
							]
						}
					},
					{
						'kind': "textElement",
						'nodeValue': "\n        Hello.\n        "
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
								'expr': "printObject shared.realLife",
								'let': {

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
										'expr': "outline shared.realLife printObject getAllIn",
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
								'kind': "call",
								'templateCode': {
									'kind': "templateCode",
									'params': [

									],
									'type': "XMLP",
									'let': {
										'x': {
											'kind': "lineState",
											'type': "Unit Number"
										},
										'y': {
											'kind': "lineState",
											'type': "Unit Number"
										}
									},
									'output': {
										'kind': "lineExpr",
										'expr': "dragdrop (printObject shared.realLife) x y",
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
					},
					{
						'kind': "textElement",
						'nodeValue': "\n    "
					}
				]
			}
		}
	}
};