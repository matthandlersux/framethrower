// This file is a total mess, redo the whole thing!

/*

LINEACTION
	{kind: "lineAction", params: [VARTOCREATE], actions: [{name?: VARTOCREATE, action: ACTIONUNIT | LINE}], type: TYPE}

ACTIONUNIT
	{kind: "actionCreate", type: TYPE, prop: {PROPERTYNAME: AST}} |
	{kind: "actionUpdate", target: AST, actionType: "add" | "remove", key?: AST, value?: AST} |
	{kind: "extract", select: AST, lineAction: LINEACTION} // this lineAction should take one (or two) parameters.


makeActionClosure returns an INSTRUCTION or a FUN that eventually returns an INSTRUCTION

INSTRUCTION
	{
		kind: "instruction",
		instructions: [INSTRUCTIONBLOCK | INSTRUCTIONCREATE | INSTRUCTIONUPDATE | INSTRUCTIONEXTRACT],
		output?: ACTIONREF
	}

INSTRUCTIONCREATE
	{kind: "instructionCreate", type: TYPE, prop: {PROPERTYNAME: ACTIONREF}, label: ACTIONVARTOCREATE}

INSTRUCTIONUPDATE
	{kind: "instructionUpdate", target: ACTIONREF, actionType: "add" | "remove", key?: ACTIONREF, value?: ACTIONREF}

INSTRUCTIONBLOCK
	{kind: "instructionBlock", instruction: INSTRUCTION, label: ACTIONVARTOCREATE}

INSTRUCTIONEXTRACT
	{kind: "instructionExtract", select: EXPR, inner: FUNCTION} // FUNCTION returns INSTRUCTION

ACTIONREF
	{kind: "actionRef", label: ACTIONVAR, type: TYPE} |
	{kind: "actionRef", label: STRING, left: OBJECTFUN, right: ACTIONREF} |
	OBJECT/CELL/LITERAL

PROPERTYNAME
	string

ACTIONVARTOCREATE
	string (this string then gets bound so that when an ACTIONREF is encountered with this string, it will point here)

*/


function makeActionRef(label, type) {
	return {kind: "actionRef", label: label, type: type};
}

function makeActionClosure(lineAction, env) {
	var params = lineAction.params;
	var type = lineAction.type;
	//var type = parseType(lineAction.type);
	
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
		
		forEach(lineAction.actions, function (actionLet) {
			var action = actionLet.action;
			var result;
			if (action.kind === "actionCreate") {
				var created = {
					kind: "instructionCreate",
					//type: parseType(action.type),
					type: action.type,
					prop: map(action.prop, function (ast) {
						return evaluate(parseExpression(ast, envWithParams));
					}),
					label: localIds()
				};
				instructions.push(created);
				result = makeActionRef(created.label, created.type);
			} else if (action.kind === "actionUpdate") {
				instructions.push({
					kind: "instructionUpdate",
					//target: evaluate(parseExpression(parse(action.target), envWithParams)),
					target: evaluate(parseExpression(action.target, envWithParams)),
					actionType: action.actionType,
					//key: action.key ? evaluate(parseExpression(parse(action.key), envWithParams)) : undefined,
					//value: action.value ? evaluate(parseExpression(parse(action.value), envWithParams)) : undefined
					key: action.key ? evaluate(parseExpression(action.key, envWithParams)) : undefined,
					value: action.value ? evaluate(parseExpression(action.value, envWithParams)) : undefined
				});
			} else if (action.kind === "extract") {
				var actionClosure = makeActionClosure(action.lineAction, envWithParams);
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
					select: parseExpression(action.select, envWithParams),
					inner: inner
				});
				instructions.push(ret);
			} else {
				var evaled = evaluateLine(action, envWithParams);
				if (evaled.kind === "instruction") {
					var block = {
						kind: "instructionBlock",
						instruction: evaled,
						label: localIds()
					};
					instructions.push(block);
					if (evaled.output) {
						var refType = GLOBAL.typeCheck ? getType(evaled.output) : undefined;
						result = makeActionRef(block.label, refType);
					}
				} else {
					result = evaled;
				}
			}
			if (actionLet.name) {
				if (result === undefined) {
					debug.error("Trying to assign a let action, but the action has no return value", actionLet);
				}
				scope[actionLet.name] = result;
			}
			output = result;
		});
		
		var ret = {
			kind: "instruction",
			instructions: instructions,
			output: output,
			type: actionType,
			remote: 2
		};
		return ret;
	}, params.length);

	if (params.length > 0) {
		return makeFun(type, f);
	} else {
		return f;
	}
}




function executeAction(instruction, scope) {
	if (scope === undefined) scope = makeDynamicEnv();
	
	function processActionRef(actionRef) {
		if (actionRef.kind === "actionRef") {
			if (actionRef.left === undefined) {
				//{kind: "actionRef", label: ACTIONVAR, type: TYPE}
				return scope.env(actionRef.label);
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
	
	
	forEach(instruction.instructions, function(instruction) {
		if (instruction.kind === "instructionBlock") {
			var res = executeAction(instruction.instruction, makeDynamicEnv(scope.env));
			if (instruction.label !== undefined) {
				scope.add(instruction.label, res);
			}
		} else if (instruction.kind === "instructionCreate") {
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
				scope.add(instruction.label, made);
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
			var myRemove = cell.injectDependency(function () {
				if (!done) {
					done = true;
					forEach(cell.getState(), function (element) {
						executeAction(instruction.inner(element), makeDynamicEnv(scope.env));
					});					
				}
				
				if (myRemove) myRemove();
			});
			if (done) myRemove();
		}
	});
	
	if (instruction.output) {
		return processActionRef(instruction.output);
	}
}

