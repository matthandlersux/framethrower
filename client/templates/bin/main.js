var mainTemplate = {
	kind: "templateCode",
	params: [

	],
	type: "XMLP",
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
				kind: "lineXML",
				xml: {
					kind: "element",
					nodeName: "p:wrapper",
					attributes: {

					},
					style: {

					},
					children: [
						{
							kind: "textElement",
							nodeValue: "
	"
						},
						{
							kind: "textElement",
							nodeValue: {
								kind: "insert",
								expr: "result"
							}
						}
					]
				}
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
				kind: "lineXML",
				xml: {
					kind: "element",
					nodeName: "p:wrapper",
					attributes: {

					},
					style: {

					},
					children: [
						{
							kind: "textElement",
							nodeValue: "
	"
						},
						{
							kind: "textElement",
							nodeValue: {
								kind: "insert",
								expr: "result"
							}
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

			},
			style: {

			},
			children: [
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
							nodeValue: "
			Here is the result:"
						},
						{
							kind: "textElement",
							nodeValue: {
								kind: "insert",
								expr: "result"
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
							nodeValue: "
			Here is (letfile1 result):
		 	"
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
					attributes: {

					},
					style: {

					},
					children: [
						{
							kind: "textElement",
							nodeValue: "
			Here is (subfolder1 result):
		 	"
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
}