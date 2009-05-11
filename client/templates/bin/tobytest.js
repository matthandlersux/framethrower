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
			type: "Unit Number"
		},
		changeState: {
			kind: "lineAction",
			action: {
				kind: "action",
				params: [
					"newValue"
				],
				type: "Number -> Action",
				actions: [
					{
						action: {
							kind: "actionUpdate",
							target: "stateTest",
							actionType: "add",
							key: "newValue",
							val: undefined
						}
					}
				]
			}
		},
		counter: {
			kind: "templateCode",
			params: [

			],
			type: "XMLP",
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
							nodeValue: "\n		just a test\n	"
						}
					]
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
									expr: "counter",
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