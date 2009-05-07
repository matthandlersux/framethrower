/*


So we can take an actionCode (this is just like a templateCode) and make a closure in a similar way.

Such a closure is then a function which returns an Action.

An Action consists of a list of Instructions and an (optional) output.

ACTION
	{kind: "action", instructions: [INSTRUCTION], output?: ACTIONREF}

INSTRUCTION
	INSTRUCTIONCREATE | INSTRUCTIONUPDATE

INSTRUCTIONCREATE
	{kind: "instructionCreate", type: TYPE, prop: {PROPERTYNAME: ACTIONREF}, name: ACTIONVARTOCREATE} |

INSTRUCTIONUPDATE
	{kind: "instructionUpdate", target: ACTIONREF, actionType: "add" | "remove", key?: ACTIONREF, value?: ACTIONREF}

ACTIONREF
	{kind: "actionRef", name: ACTIONVAR, type: TYPE} |
	OBJECT/LITERAL |
	an Expression involving only casting and property-accessing functions and ACTIONREFs


TODO: change evaluate or object.js so that casting and property-accessing functions on ACTIONREFs just return their expression.

*/

function makeActionRef(name, type) {
	return {kind: "actionRef", actionRef: true, name: name, type: type};
}

function makeActionClosure(actionCode, env) {
	var params = actionCode.params;
	//var type = actionCode.type;
	var type = parseType(actionCode.type);
	
	var f = curry(function () {
		var scope = {};
		var args = arguments;
		forEach(params, function (param, i) {
			scope[param] = args[i];
		});
		var envWithParams = extendEnv(env, scope);
		
		/* note that for actions, there is an ordering and you can't refer to your lets out of order,
		so we're just going to be adding to scope here and using envWithParams
		instead of the mutual recursion in normal makeClosure() */
		
		var instructions = [];
		var output;
		
		forEach(actionCode.actions, function (actionLet) {
			var action = actionLet.action;
			var result;
			if (action.kind === "actionCreate") {
				var created = {
					kind: "instructionCreate",
					type: parseType(action.type),
					prop: map(action.prop, function (expr) {
						return evaluate(expr, envWithParams);
					}),
					name: localIds()
				};
				instructions.push(created);
				result = makeActionRef(created.name, created.type);
			} else if (action.kind === "actionUpdate") {
				instructions.push({
					kind: "instructionUpdate",
					target: evaluate(action.target, envWithParams),
					actionType: action.actionType,
					key: action.key ? evaluate(action.key, envWithParams) : undefined,
					value: action.value ? evaluate(action.value, envWithParams) : undefined
				});
			} else {
				var evaled = evaluateLine(action, envWithParams);
				console.log("did an evaled", action, evaled);
				if (evaled.kind === "action") {
					instructions = instructions.concat(evaled.instructions);
					result = evaled.output;
				} else {
					result = evaled;
				}
			}
			
			if (result && actionLet.name) {
				scope[actionLet.name] = result;
			}
			output = result;
		});
		
		var ret = {
			kind: "action",
			instructions: instructions,
			output: output,
			type: actionType,
			remote: 2
		};
		console.log("made an action", ret);
		return ret;
	}, params.length);
	
	if (params.length > 0) {
		return makeFun(type, f);
	} else {
		return f;
	}
}
