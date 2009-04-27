{
	kind: "templateCode",
	params: [

	],
	type: " -> XMLP",
	let: {
		jsfun: {
			kind: "lineJavascript",
			type: "Number -> Number",
			f: function (a) {return a * 2 ;}
		},
		result: {
			kind: "lineExpr",
			expr: "jsfun 5",
			let: {

			}
		},
		letfile1: {
			kind: "templateCode",
			params: [
				{
					name: "a",
					type: "Number"
				}
			],
			type: "Number -> XMLP",
			let: {
				jsfun: {
					kind: "lineJavascript",
					type: "Number -> Number",
					f: function (a) {return a * 10 ;}
				},
				result: {
					kind: "lineExpr",
					expr: "jsfun a",
					let: {

					}
				}
			},
			output: {
				kind: "element",
				nodeName: "f:wrapper",
				attributes: [

				],
				style: undefined,
				children: [
					{
						kind: "insert",
						expr: "result"
					}
				]
			}
		},
		subfolder1: {
			kind: "templateCode",
			params: [
				{
					name: "a",
					type: "Number"
				}
			],
			type: "Number -> XMLP",
			let: {
				jsfun: {
					kind: "lineJavascript",
					type: "Number -> Number",
					f: function (a) {return a + 10 ;}
				},
				result: {
					kind: "lineExpr",
					expr: "jsfun a",
					let: {

					}
				}
			},
			output: {
				kind: "element",
				nodeName: "f:wrapper",
				attributes: [

				],
				style: undefined,
				children: [
					{
						kind: "insert",
						expr: "result"
					}
				]
			}
		}
	},
	output: {
		kind: "element",
		nodeName: "div",
		attributes: [

		],
		style: undefined,
		children: [
			{
				kind: "element",
				nodeName: "div",
				attributes: [

				],
				style: undefined,
				children: [
					{
						kind: "textElement",
						nodeValue: "Here is the result :"
					},
					{
						kind: "insert",
						expr: "result"
					}
				]
			},
			{
				kind: "element",
				nodeName: "div",
				attributes: [

				],
				style: undefined,
				children: [
					{
						kind: "textElement",
						nodeValue: "Here is ( letfile1 result ) :"
					},
					{
						kind: "call",
						templateCode: {
							kind: "templateCode",
							params: [

							],
							type: " -> XMLP",
							let: {

							},
							output: {
								kind: "lineExpr",
								expr: "letfile1 result",
								let: {

								}
							}
						}
					}
				]
			},
			{
				kind: "element",
				nodeName: "div",
				attributes: [

				],
				style: undefined,
				children: [
					{
						kind: "textElement",
						nodeValue: "Here is ( subfolder1 result ) :"
					},
					{
						kind: "call",
						templateCode: {
							kind: "templateCode",
							params: [

							],
							type: " -> XMLP",
							let: {

							},
							output: {
								kind: "lineExpr",
								expr: "subfolder1 result",
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