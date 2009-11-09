/*

LINEACTION
	{kind: "lineAction", actions: [{name?: VARTOCREATE, action: ACTIONUNIT | LINE}], type: TYPE}

ACTIONUNIT
	{kind: "actionCreate", type: TYPE, prop: {PROPERTYNAME: AST}} |
	{kind: "extract", select: AST, action: LINETEMPLATE} // this lineTemplate should take one (or two) parameters.

*/

//executeState is a limited form of execute action that returns a result rather than using a callback
//TODO: make executeState actually have limited functionality
function executeState(instruction) {
	if (instruction.kind === "remoteInstruction") {
		console.log("Executing remote Instruction!", instruction);
		var callback = function (result) {
			console.log("Action result, ignoring for now:", result);
		};
		session.perform(instruction.name, instruction.params, callback);
	} else {
		var scope = {};
		var env = extendEnv(instruction.env, scope);

		var output;

		function evalExpr(expr) {
			return evaluate2(parseExpression(expr, env));
		}

		forEach(instruction.instructions, function (actionLet) {
			output = undefined;
			var action = actionLet.action;
			if (action.kind === "actionCreate") {
				// we're dealing with: {kind: "actionCreate", type: TYPE, prop: {PROPERTYNAME: AST}}

				if (isReactive(action.type)) {
					output = makeCC(action.type);
				} else {
					output = objects.make(action.type.value, map(action.prop, evalExpr));
				}
			} else if (action.kind === "extract") {
				// we're dealing with: {kind: "extract", select: AST, action: LINETEMPLATE} // this lineTemplate should take one (or two) parameters.

				var closure = makeClosure(action.action, env);
				var inner;
				var isMap = !!closure.type.left.left;
				if (isMap) {
					inner = function (o) {
						return evaluate(makeApply(makeApply(closure, o.key), o.val));
					};
				} else {
					inner = function (key) {
						return evaluate(makeApply(closure, key));
					};
				}

				var select = evalExpr(action.select);

				// note that output will be the result of the last action:
				if (select.kind === "list") {
					forEach(select.asArray, function (element) {
						output = executeState(inner(element));
					});
				} else {
					var done = false;
					var cell = select;
					var injectedFunc = cell.injectDependency(function () {
						if (!done) {
							done = true;
							forEach(cell.getState(), function (element) {
								output = executeState(inner(element));
							});
						}
					});
					injectedFunc.unInject();
				}
			} else if (action.kind === "actionJavascript") {
				// we're dealing with: {kind: "actionJavascript", f: function}
				output = action.f();
			} else {
				// we're dealing with a LINE

				//var evaled = evaluateLine(action, env);
				var evaled = evaluate(evaluateLine(action, env));
				if (evaled.kind === "instruction") {
					// the LINE evaluated to an Action
					output = executeState(evaled);
				} else
					debug.error("non-action expression in an action", action);
			}

			if (actionLet.name) {
				if (output === undefined) {
					debug.error("Trying to assign a let action, but the action has no return value", actionLet);
				}
				scope[actionLet.name] = output;
			}
		});

		return output;		
	}

}

// executeAction will perform the instruction, calling callback with the result, possibly asynchronously. It returns undefined.
function executeAction(instruction, callback) {
	if (instruction.kind === "remoteInstruction") {
		console.log("Executing remote Instruction!", instruction);
		var callback = function (result) {
			console.log("Action result, ignoring for now:", result);
		};
		session.perform(instruction.name, instruction.params, callback);
	} else {
		var scope = {};
		var env = extendEnv(instruction.env, scope);

		var output;

		function evalExpr(expr) {
			return evaluate2(parseExpression(expr, env));
		}

		executeNextAction(instruction.instructions, env, callback);

		return output;		
	}

}


function executeNextAction (instructions, env, callback) {
	var actionLet = instructions[0];
	var restOfInstructions = instructions.slice(1);
	
	var action = actionLet.action;
	
	var processLet = function(output) {
		if (actionLet.name) {
			if (output === undefined) {
				debug.error("Trying to assign a let action, but the action has no return value", actionLet);
			}
			scope[actionLet.name] = output;
		}
		executeNextAction(restOfInstructions, env, callback);
	};
	
	if (action.kind === "actionCreate") {
		// we're dealing with: {kind: "actionCreate", type: TYPE, prop: {PROPERTYNAME: AST}}

		if (isReactive(action.type)) {
			output = makeCC(action.type);
		} else {
			output = objects.make(action.type.value, map(action.prop, evalExpr));
		}
		processLet(output);
	} else if (action.kind === "extract") {
		// we're dealing with: {kind: "extract", select: AST, action: LINETEMPLATE} // this lineTemplate should take one (or two) parameters.

		var closure = makeClosure(action.action, env);
		var inner;
		var isMap = !!closure.type.left.left;
		if (isMap) {
			inner = function (o) {
				return evaluate(makeApply(makeApply(closure, o.key), o.val));
			};
		} else {
			inner = function (key) {
				return evaluate(makeApply(closure, key));
			};
		}

		var select = evalExpr(action.select);

		// note that output will be the result of the last action:
		if (select.kind === "list") {
			forEach(select.asArray, function (element) {
				output = executeAction(inner(element));
			});
		} else {
			var done = false;
			var cell = select;
			var injectedFunc = cell.injectDependency(function () {
				if (!done) {
					done = true;
					forEach(cell.getState(), function (element) {
						output = executeAction(inner(element));
					});
				}
			});
			injectedFunc.unInject();
		}
		processLet(output);
	} else if (action.kind === "actionJavascript") {
		// we're dealing with: {kind: "actionJavascript", f: function}
		output = action.f();
		processLet(output);
	} else {
		// we're dealing with a LINE

		//var evaled = evaluateLine(action, env);
		var evaled = evaluate(evaluateLine(action, env));
		if (evaled.kind === "instruction") {
			// the LINE evaluated to an Action
			executeAction(evaled, processLet);
		} else
			debug.error("non-action expression in an action", action);
	}
	return undefined;
}