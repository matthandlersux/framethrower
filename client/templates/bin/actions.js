var mainTemplate = {
	kind: "templateCode",
	params: [
		"set"
	],
	type: "Set Object -> XMLP",
	let: {
		putObjectInSituation: "action",
		makeTrueInOnt: "action",
		makeCons: "action",
		makeInfon2: "action",
		makeOntProperty: "action",
		nameObject: "action",
		changeName: "action",
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
					nodeValue: "\n		Click Here to perform action\n		"
				},
				{
					kind: "for-each",
					select: "set",
					templateCode: {
						kind: "templateCode",
						params: [
							"key"
						],
						type: "t0 -> XMLP",
						let: {

						},
						output: {
							kind: "lineXML",
							xml: {
								event: "click"
							}
						}
					}
				}
			]
		}
	}
};