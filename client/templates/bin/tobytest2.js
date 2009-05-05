var mainTemplate = {
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
			attributes: {},
			style: {},
			children: [
				{
					kind: "textElement",
					nodeValue: "hello world."
				},
				{
					kind: "textElement",
					nodeValue: {
						kind: "insert",
						expr: "testCell"
					}
				},
				{
					kind: "for-each",
					select: "testCell",
					templateCode: {
						kind: "templateCode",
						params: ["entry"],
						type: "Number -> XMLP",
						let: {},
						output: {
							kind: "lineXML",
							xml: {
								kind: "element",
								nodeName: "div",
								attributes: {},
								style: {
									"marginTop": {
										kind: "insert",
										expr: "entry"
									}
								},
								children: [
									{
										kind: "textElement",
										nodeValue: "here's an entry:"
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
				}
			]
		}
	}
};