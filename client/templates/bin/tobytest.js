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
			kind: "action",
			params: [

			],
			type: "ACTION",
			actions: [
				{
					name: "ob",
					type: undefined,
					value: {
						kind: "actionCreate",
						type: "Object",
						prop: "{undefined}"
					}
				},
				{
					name: undefined,
					type: undefined,
					value: {
						kind: "lineExpr",
						expr: "ob",
						let: {

						}
					}
				}
			]
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
							kind: "textElement",
							nodeValue: {
								kind: "insert",
								expr: "actionTest"
							}
						}
					]
				}
			]
		}
	}
};