/*


So we can take an actionCode (this is just like a templateCode) and make a closure in a similar way.

Such a closure is then a function which returns an Action.

An Action consists of a list of Instructions and an (optional) output.

ACTION
	{kind: "action", instructions: [INSTRUCTION], output?: ACTIONREF}

INSTRUCTION
	INSTRUCTIONCREATE | INSTRUCTIONUPDATE | INSTRUCTIONEXTRACT

INSTRUCTIONCREATE
	{kind: "instructionCreate", type: TYPE, prop: {PROPERTYNAME: ACTIONREF}, label: ACTIONVARTOCREATE} |

INSTRUCTIONUPDATE
	{kind: "instructionUpdate", target: ACTIONREF, actionType: "add" | "remove", key?: ACTIONREF, value?: ACTIONREF}

INSTRUCTIONEXTRACT
	{kind: "instructionExtract", select: EXPR, inner: FUNCTION} // FUNCTION returns ACTION

ACTIONREF
	{kind: "actionRef", label: ACTIONVAR, type: TYPE} |
	{kind: "actionRef", label: STRING, left: OBJECTFUN, right: ACTIONREF} |
	OBJECT/CELL/LITERAL


*/

function makeActionRef(label, type) {
	return {kind: "actionRef", label: label, type: type};
}

function makeActionClosure(actionCode, env) {
	var params = actionCode.params;
	var type = actionCode.type;
	//var type = parseType(actionCode.type);
	
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
					//type: parseType(action.type),
					type: action.type,
					prop: map(action.prop, function (expr) {
						return evaluate(parseExpression(parse(expr), envWithParams));
					}),
					label: localIds()
				};
				instructions.push(created);
				result = makeActionRef(created.label, created.type);
			} else if (action.kind === "actionUpdate") {
				instructions.push({
					kind: "instructionUpdate",
					target: evaluate(parseExpression(parse(action.target), envWithParams)),
					actionType: action.actionType,
					//key: action.key ? evaluate(parseExpression(parse(action.key), envWithParams)) : undefined,
					//value: action.value ? evaluate(parseExpression(parse(action.value), envWithParams)) : undefined
					key: action.key ? evaluate(parseExpression(action.key, envWithParams)) : undefined,
					value: action.value ? evaluate(parseExpression(action.value, envWithParams)) : undefined
				});
			} else if (action.kind === "extract") {
				var actionClosure = makeActionClosure(action.action, envWithParams);
				var inner;
				var isMap = !!actionClosure.type.left.left;
				if (isMap) {
					inner = function (o) {
						return evaluate(makeApply(makeApply(actionClosure, o.key), o.val));
					};
				} else {
					inner = function (key) {
						return evaluate(makeApply(actionClosure, key));
					};
				}
				var ret = ({
					kind: "instructionExtract",
					select: parseExpression(parse(action.select), envWithParams),
					inner: inner
				});
				instructions.push(ret);
			} else {
				var evaled = evaluateLine(action, envWithParams);
				if (evaled.kind === "action") {
					instructions = instructions.concat(evaled.instructions);
					result = evaled.output;
				} else {
					result = evaled;
				}
			}
			
			if (result !== undefined && actionLet.name) {
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
		//console.log("made an action", ret);
		lastAction = ret;
		return ret;
	}, params.length);
	
	if (params.length > 0) {
		return makeFun(type, f);
	} else {
		return f;
	}
}

var lastAction;

function executeAction(action, scope) {
	if (scope === undefined) scope = {};
	
	var processActionRef = function(actionRef) {
		if (actionRef.kind === "actionRef") {
			if (actionRef.left === undefined) {
				//{kind: "actionRef", label: ACTIONVAR, type: TYPE}
				var avar = scope[actionRef.label];
				//DEBUG
				if (avar == undefined) {
					debug.error("Variable used in action not found in action scope, Variable Name: ", actionRef.label, actionRef);
				}
				return avar;
			} else if (actionRef.left !== undefined) {
				//{kind: "actionRef", label: STRING, left: OBJECTFUN, right: ACTIONREF}
				var objectFun = actionRef.left;
				var input = processActionRef(actionRef.right);
				//TODO: check evaluate and makeapply syntax
				return evaluate(makeApply(objectFun, input));
			}
		} else {
			//OBJECT/CELL/LITERAL
			return actionRef;
		}
	};
	
	
	forEach(action.instructions, function(instruction) {
		if (instruction.kind === "instructionCreate") {
			var made;
			if (isReactive(instruction.type)) {
				made = makeControlledCell(unparseType(instruction.type));
			} else {
				var processedProp = {};
				forEach(instruction.prop, function(property, propName) {
					processedProp[propName] = processActionRef(property);
				});
			
				var made = objects.make(instruction.type.value, processedProp);
			}
			if (instruction.label !== undefined) {
				scope[instruction.label] = made;
			}
		} else if (instruction.kind === "instructionUpdate") {
			var target = processActionRef(instruction.target);
			var key, value;
			if (instruction.key !== undefined) {
				key = processActionRef(instruction.key);
			}
			if (instruction.value !== undefined) {
				value = processActionRef(instruction.value);
			}
			//DEBUG
			if (target.control === undefined) {
				debug.error("Trying to do action update on non-controlled cell: " + target);
			} else {
				target.control[instruction.actionType](key, value);
			}
		} else if (instruction.kind === "instructionExtract") {
			// var done = false;
			// var myRemove = evaluateAndInject(instruction.select, function () {
			// 	// on done... cleanup
			// 	if (myRemove) myRemove();
			// 	else done = true;
			// }, function (element) {
			// 	executeAction(instruction.inner(element), shallowCopy(scope));
			// });
			// if (done) myRemove();
			var done = false;
			var cell = evaluate(instruction.select);
			var myRemove = cell.inject(function () {
				forEach(cell.getState(), function (element) {
					executeAction(instruction.inner(element), shallowCopy(scope));
				});
				if (myRemove) myRemove();
				else done = true;
			}, emptyFunction);
			if (done) myRemove();
		}
	});
	
	if (action.output) {
		return processActionRef(action.output);
	}
}