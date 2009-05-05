var mainTemplate = {
	kind: "templateCode",
	params: [
		"set"
	],
	type: "Set Object -> XMLP",
	let: {
		putObjectInSituation: {
			kind: "action",
			params: [
				"object",
				"situation"
			],
			type: "Object -> Object -> ACTION",
			actions: [
				{
					name: "in",
					type: undefined,
					value: {
						kind: "lineExpr",
						expr: "shared.in",
						let: {

						}
					}
				},
				{
					name: "infon",
					type: undefined,
					value: {
						kind: "lineExpr",
						expr: "makeInfon2 in situation object",
						let: {

						}
					}
				},
				{
					name: "truth",
					type: undefined,
					value: {
						kind: "lineExpr",
						expr: "Cons::truth infon",
						let: {

						}
					}
				},
				{
					name: undefined,
					type: undefined,
					value: {
						kind: "actionUpdate",
						target: "truth",
						actionType: "add",
						key: "null",
						val: undefined
					}
				}
			]
		},
		makeTrueInOnt: {
			kind: "action",
			params: [
				"infon"
			],
			type: "Cons -> ACTION",
			actions: [
				{
					name: "ont",
					type: undefined,
					value: {
						kind: "lineExpr",
						expr: "shared.ont",
						let: {

						}
					}
				},
				{
					name: undefined,
					type: undefined,
					value: {
						kind: "lineExpr",
						expr: "putObjectInSituation infon ont",
						let: {

						}
					}
				}
			]
		},
		makeCons: {
			kind: "action",
			params: [
				"left",
				"right"
			],
			type: "Object -> Object -> ACTION",
			actions: [
				{
					name: "cons",
					type: undefined,
					value: {
						kind: "actionCreate",
						type: "Cons",
						prop: "{left : left , right : right}"
					}
				},
				{
					name: "upRight",
					type: undefined,
					value: {
						kind: "lineExpr",
						expr: "Object::upRight left",
						let: {

						}
					}
				},
				{
					name: "upLeft",
					type: undefined,
					value: {
						kind: "lineExpr",
						expr: "Object::upLeft right",
						let: {

						}
					}
				},
				{
					name: undefined,
					type: undefined,
					value: {
						kind: "actionUpdate",
						target: "upRight",
						actionType: "add",
						key: "cons",
						val: undefined
					}
				},
				{
					name: undefined,
					type: undefined,
					value: {
						kind: "actionUpdate",
						target: "upLeft",
						actionType: "add",
						key: "cons",
						val: undefined
					}
				},
				{
					name: undefined,
					type: undefined,
					value: {
						kind: "lineExpr",
						expr: "cons",
						let: {

						}
					}
				}
			]
		},
		makeInfon2: {
			kind: "action",
			params: [
				"relation",
				"arg1",
				"arg2"
			],
			type: "Object -> Object -> Object -> ACTION",
			actions: [
				{
					name: "cons1",
					type: undefined,
					value: {
						kind: "lineExpr",
						expr: "makeCons relation arg1",
						let: {

						}
					}
				},
				{
					name: undefined,
					type: undefined,
					value: {
						kind: "lineExpr",
						expr: "makeCons cons1 arg2",
						let: {

						}
					}
				}
			]
		},
		makeOntProperty: {
			kind: "action",
			params: [
				"relation",
				"arg1",
				"arg2"
			],
			type: "Object -> Object -> Object -> ACTION",
			actions: [
				{
					name: "infon",
					type: undefined,
					value: {
						kind: "lineExpr",
						expr: "makeInfon2 relation arg1 arg2",
						let: {

						}
					}
				},
				{
					name: undefined,
					type: undefined,
					value: {
						kind: "lineExpr",
						expr: "makeTrueInOnt infon",
						let: {

						}
					}
				}
			]
		},
		nameObject: {
			kind: "action",
			params: [
				"object",
				"name"
			],
			type: "Object -> String -> ACTION",
			actions: [
				{
					name: "nameRel",
					type: undefined,
					value: {
						kind: "lineExpr",
						expr: "shared.name",
						let: {

						}
					}
				},
				{
					name: "nameText",
					type: undefined,
					value: {
						kind: "actionCreate",
						type: "X.text",
						prop: "{string : name}"
					}
				},
				{
					name: undefined,
					type: undefined,
					value: {
						kind: "lineExpr",
						expr: "makeOntProperty nameRel object nameText",
						let: {

						}
					}
				}
			]
		},
		changeName: {
			kind: "action",
			params: [
				"focus",
				"newName"
			],
			type: "Object -> String -> ACTION",
			actions: [
				{
					name: undefined,
					type: undefined,
					value: {
						kind: "lineExpr",
						expr: "nameObject focus newName",
						let: {

						}
					}
				}
			]
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
								kind: "on",
								event: "click",
								templateCode: {
									kind: "action",
									params: [

									],
									type: "ACTION",
									actions: [
										{
											kind: "lineExpr",
											expr: "changeName key message",
											let: {

											}
										}
									]
								}
							}
						}
					}
				}
			]
		}
	}
};