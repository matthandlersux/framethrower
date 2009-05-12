var mainTemplate = {
	'kind': "templateCode",
	'params': [

	],
	'type': "XMLP",
	'let': {
		'jsfun': {
			'kind': "lineJavascript",
			'type': "Number -> Number",
			'f': function (a) {return a ^ 2 ;}
		},
		'result': {
			'kind': "lineExpr",
			'expr': "jsfun 5",
			'let': {

			}
		},
		'letfile1': {
			'kind': "lineTemplate",
			'template': {
				'kind': "templateCode",
				'params': [
					"a"
				],
				'type': "Number -> XMLP",
				'let': {
					'jsfun': {
						'kind': "lineJavascript",
						'type': "Number -> Number",
						'f': function (a) {return a * 10 ;}
					},
					'result': {
						'kind': "lineExpr",
						'expr': "jsfun a",
						'let': {

						}
					}
				},
				'output': {
					'kind': "lineXML",
					'xml': {
						'kind': "element",
						'nodeName': "p:wrapper",
						'attributes': {

						},
						'style': {

						},
						'children': [
							{
								'kind': "textElement",
								'nodeValue': "\n		"
							},
							{
								'kind': "textElement",
								'nodeValue': {
									'kind': "insert",
									'expr': "result"
								}
							}
						]
					}
				}
			}
		},
		'subfolder1': {
			'kind': "lineTemplate",
			'template': {
				'kind': "templateCode",
				'params': [
					"a"
				],
				'type': "Number -> XMLP",
				'let': {
					'jsfun': {
						'kind': "lineJavascript",
						'type': "Number -> Number",
						'f': function (a) {return a + 10 ;}
					},
					'result': {
						'kind': "lineExpr",
						'expr': "jsfun a",
						'let': {

						}
					}
				},
				'output': {
					'kind': "lineXML",
					'xml': {
						'kind': "element",
						'nodeName': "p:wrapper",
						'attributes': {

						},
						'style': {

						},
						'children': [
							{
								'kind': "textElement",
								'nodeValue': "\n		"
							},
							{
								'kind': "textElement",
								'nodeValue': {
									'kind': "insert",
									'expr': "result"
								}
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
					'nodeValue': "\n		Look at this: "
				},
				{
					'kind': "textElement",
					'nodeValue': {
						'kind': "insert",
						'expr': "variable"
					}
				}
			]
		}
	}
};