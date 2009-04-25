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
				kind: "textElement",
				nodeValue: "		
		Look a this one! (haha)"
			},
			{
				kind: "insert",
				expr: "a"
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
						nodeValue: "
			What's going on?
		"
					}
				]
			},
			{
				kind: "textElement",
				nodeValue: "
		hey there bub
	"
			}
		]
	}
}