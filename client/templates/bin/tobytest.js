var mainTemplate = {
	kind: "templateCode",
	params: [

	],
	type: "XMLP",
	let: {
		test: {
			kind: "lineExpr",
			expr: "88",
			let: {

			}
		},
		myTemplate: {
			kind: "lineTemplate",
			template: {
				kind: "templateCode",
				params: [
					"x"
				],
				type: "Number -> XMLP",
				let: {

				},
				output: {
					kind: "lineXML",
					xml: {
						kind: "element",
						nodeName: "div",
						attributes: {

						},
						style: {

						},
						children: [
							{
								kind: "textElement",
								nodeValue: "Here's another template that has access to scope, see: "
							},
							{
								kind: "textElement",
								nodeValue: {
									kind: "insert",
									expr: "test"
								}
							},
							{
								kind: "textElement",
								nodeValue: " , and here's a parameter: "
							},
							{
								kind: "textElement",
								nodeValue: {
									kind: "insert",
									expr: "x"
								}
							}
						]
					}
				}
			}
		},
		jsfun: {
			kind: "lineJavascript",
			type: "Number -> t0",
			f: function (x) {return x + 99 ;}
		},
		stateTest: {
			kind: "lineState",
			type: "Set Number"
		},
		actionTest: {
			kind: "lineAction",
			action: {
				kind: "action",
				params: [

				],
				type: "Action",
				actions: [
					{
						action: {
							kind: "actionUpdate",
							target: "testCell",
							actionType: "add",
							key: "9999",
							val: undefined
						}
					},
					{
						action: {
							kind: "actionCreate",
							type: "Object",
							prop: {

							}
						}
					}
				]
			}
		},
		actionTemplate: {
			kind: "lineTemplate",
			template: {
				kind: "templateCode",
				params: [

				],
				type: "XMLP",
				let: {
					putObjectInSituation: {
						kind: "lineAction",
						action: {
							kind: "action",
							params: [
								"object",
								"situation"
							],
							type: "Object -> Object -> Action",
							actions: [
								{
									name: "in",
									action: {
										kind: "lineExpr",
										expr: "shared.in",
										let: {

										}
									}
								},
								{
									name: "infon",
									action: {
										kind: "lineExpr",
										expr: "makeInfon2 in situation object",
										let: {

										}
									}
								},
								{
									name: "truth",
									action: {
										kind: "lineExpr",
										expr: "Cons::truth infon",
										let: {

										}
									}
								},
								{
									action: {
										kind: "actionUpdate",
										target: "truth",
										actionType: "add",
										key: "null",
										val: undefined
									}
								}
							]
						}
					},
					makeTrueInOnt: {
						kind: "lineAction",
						action: {
							kind: "action",
							params: [
								"infon"
							],
							type: "Cons -> Action",
							actions: [
								{
									name: "ont",
									action: {
										kind: "lineExpr",
										expr: "shared.ont",
										let: {

										}
									}
								},
								{
									action: {
										kind: "lineExpr",
										expr: "putObjectInSituation infon ont",
										let: {

										}
									}
								}
							]
						}
					},
					makeCons: {
						kind: "lineAction",
						action: {
							kind: "action",
							params: [
								"left",
								"right"
							],
							type: "Object -> Object -> Action",
							actions: [
								{
									name: "cons",
									action: {
										kind: "actionCreate",
										type: "Cons",
										prop: {
											left: "left",
											right: "right"
										}
									}
								},
								{
									name: "upRight",
									action: {
										kind: "lineExpr",
										expr: "Object::upRight left",
										let: {

										}
									}
								},
								{
									name: "upLeft",
									action: {
										kind: "lineExpr",
										expr: "Object::upLeft right",
										let: {

										}
									}
								},
								{
									action: {
										kind: "actionUpdate",
										target: "upRight",
										actionType: "add",
										key: "cons",
										val: undefined
									}
								},
								{
									action: {
										kind: "actionUpdate",
										target: "upLeft",
										actionType: "add",
										key: "cons",
										val: undefined
									}
								},
								{
									action: {
										kind: "lineExpr",
										expr: "cons",
										let: {

										}
									}
								}
							]
						}
					},
					makeInfon2: {
						kind: "lineAction",
						action: {
							kind: "action",
							params: [
								"relation",
								"arg1",
								"arg2"
							],
							type: "Object -> Object -> Object -> Action",
							actions: [
								{
									name: "cons1",
									action: {
										kind: "lineExpr",
										expr: "makeCons relation arg1",
										let: {

										}
									}
								},
								{
									action: {
										kind: "lineExpr",
										expr: "makeCons cons1 arg2",
										let: {

										}
									}
								}
							]
						}
					},
					makeOntProperty: {
						kind: "lineAction",
						action: {
							kind: "action",
							params: [
								"relation",
								"arg1",
								"arg2"
							],
							type: "Object -> Object -> Object -> Action",
							actions: [
								{
									name: "infon",
									action: {
										kind: "lineExpr",
										expr: "makeInfon2 relation arg1 arg2",
										let: {

										}
									}
								},
								{
									action: {
										kind: "lineExpr",
										expr: "makeTrueInOnt infon",
										let: {

										}
									}
								}
							]
						}
					},
					nameObject: {
						kind: "lineAction",
						action: {
							kind: "action",
							params: [
								"object",
								"name"
							],
							type: "Object -> String -> Action",
							actions: [
								{
									name: "nameRel",
									action: {
										kind: "lineExpr",
										expr: "shared.name",
										let: {

										}
									}
								},
								{
									name: "nameText",
									action: {
										kind: "actionCreate",
										type: "X.text",
										prop: {
											string: "name"
										}
									}
								},
								{
									action: {
										kind: "lineExpr",
										expr: "makeOntProperty nameRel object nameText",
										let: {

										}
									}
								}
							]
						}
					},
					changeName: {
						kind: "lineAction",
						action: {
							kind: "action",
							params: [
								"focus",
								"newName"
							],
							type: "Object -> String -> Action",
							actions: [
								{
									action: {
										kind: "lineExpr",
										expr: "nameObject focus newName",
										let: {

										}
									}
								}
							]
						}
					},
					message: {
						kind: "lineExpr",
						expr: ""This is a new name"",
						let: {

						}
					}
				},
				output: {
					kind: "lineXML",
					xml: {
						kind: "element",
						nodeName: "div",
						attributes: {

						},
						style: {

						},
						children: [
							{
								kind: "textElement",
								nodeValue: "\n			"
							},
							{
								kind: "textElement",
								nodeValue: {
									kind: "insert",
									expr: "changeName shared.realLife message"
								}
							}
						]
					}
				}
			}
		}
	},
	output: {
		kind: "lineXML",
		xml: {
			kind: "element",
			nodeName: "div",
			attributes: {
				testatt: {
					kind: "insert",
					expr: "test"
				}
			},
			style: {

			},
			children: [
				{
					kind: "textElement",
					nodeValue: "\n		Hello World.\n		"
				},
				{
					kind: "element",
					nodeName: "div",
					attributes: {

					},
					style: {

					},
					children: [
						{
							kind: "textElement",
							nodeValue: "\n			Set test: "
						},
						{
							kind: "textElement",
							nodeValue: {
								kind: "insert",
								expr: "testCell"
							}
						}
					]
				},
				{
					kind: "for-each",
					select: "testCell",
					templateCode: {
						kind: "templateCode",
						params: [
							"entry"
						],
						type: "t0 -> XMLP",
						let: {

						},
						output: {
							kind: "lineXML",
							xml: {
								kind: "element",
								nodeName: "div",
								attributes: {

								},
								style: {

								},
								children: [
									{
										kind: "textElement",
										nodeValue: "An entry: "
									},
									{
										kind: "textElement",
										nodeValue: {
											kind: "insert",
											expr: "entry"
										}
									}
								]
							}
						}
					}
				},
				{
					kind: "call",
					templateCode: {
						kind: "templateCode",
						params: [

						],
						type: "XMLP",
						let: {

						},
						output: {
							kind: "lineExpr",
							expr: "myTemplate ( jsfun 9999 )",
							let: {

							}
						}
					}
				},
				{
					kind: "element",
					nodeName: "div",
					attributes: {

					},
					style: {

					},
					children: [
						{
							kind: "textElement",
							nodeValue: "\n			State test: "
						},
						{
							kind: "textElement",
							nodeValue: {
								kind: "insert",
								expr: "stateTest"
							}
						}
					]
				},
				{
					kind: "element",
					nodeName: "div",
					attributes: {

					},
					style: {

					},
					children: [
						{
							kind: "textElement",
							nodeValue: "\n			Action test: "
						},
						{
							kind: "call",
							templateCode: {
								kind: "templateCode",
								params: [

								],
								type: "XMLP",
								let: {

								},
								output: {
									kind: "lineExpr",
									expr: "actionTemplate",
									let: {

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