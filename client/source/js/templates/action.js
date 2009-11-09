/*

LINEACTION
	{kind: "lineAction", actions: [{name?: VARTOCREATE, action: ACTIONUNIT | LINE}], type: TYPE}

ACTIONUNIT
	{kind: "actionCreate", type: TYPE, prop: {PROPERTYNAME: AST}} |
	{kind: "extract", select: AST, action: LINETEMPLATE} // this lineTemplate should take one (or two) parameters.

*/


//TODO: this is a temporary copy of the old executeAction code until we make State have more limited functionality
function executeState(instruction) {
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
			var isMap = closure.argsLength==2;
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
					executeState(inner(element));
				});
			} else {
				var done = false;
				var cell = select;
				var injectedFunc = cell.injectDependency(function () {
					if (!done) {
						done = true;
						forEach(cell.getState(), function (element) {
							executeState(inner(element));
						});
					}
				});
				injectedFunc.unInject();
			}
		} else if (action.kind === "case") {
			var template = makeClosure(action.lineTemplate, env),
				otherwise = makeClosure(action.otherwise, env);
			var cell = evalExpr(action.test);
			var done = false;
			var injectedFunc = cell.injectDependency(function () {
				if (!done) {
					done = true;
					var action;
					if(cell.getState().length>0)
						action = evaluate( makeApply(template, cell.getState()[0]) );
					else
						action = otherwise;
					output = executeState(action);
				}
			});
			injectedFunc.unInject();
		} else if (action.kind === "actionMethod") {
			// we're dealing with: {kind: "actionMethod", f: function}
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




function executeAction(instruction, callback) {
	if (instruction.kind === "remoteInstruction") {
		console.log("Executing remote Instruction!", instruction);
		session.perform(instruction.name, instruction.params, callback);
		return {usedCallback:true};
	} else {
	
		var scope = {};
		var env = extendEnv(instruction.env, scope);
	
		function evalExpr (expr) {
			return evaluate2(parseExpression(expr, env));
		}

		function executeInstructions(instructions, output) {
			if (!output) output = {usedCallback: false};
			while (!output.usedCallback && instructions.length > 0) {
				output = executeNextInstruction(instructions);
				instructions = instructions.slice(1);
			}
			return output;
		}

		function executeNextInstruction (instructions) {
			var output;
		
			var actionLet = instructions[0];
			var action = actionLet.action;
		
			function addLetToScope(output) {
				if (actionLet.name) {
					if (output === undefined) {
						debug.error("Trying to assign a let action, but the action has no return value", actionLet);
					}
					scope[actionLet.name] = output;
				}	
			}

			function recurseOnOutput (output) {
				console.log("recurse on output");
				addLetToScope(output);
				var restOfInstructions = instructions.slice(1);
				executeInstructions(restOfInstructions, output);
			}
		
			if (action.kind === "actionCreate") {
				// we're dealing with: {kind: "actionCreate", type: TYPE, prop: {PROPERTYNAME: AST}}
				var created;
				if (isReactive(action.type)) {
					created = makeCC(action.type);
				} else {
					created = objects.make(action.type.value, map(action.prop, evalExpr));
				}
				output = {usedCallback: false, value: created};
			} else if (action.kind === "extract") {
				// we're dealing with: {kind: "extract", select: AST, action: LINETEMPLATE} // this lineTemplate should take one (or two) parameters.

				var closure = makeClosure(action.action, env);
				var inner;
				var isMap = closure.argsLength==2;
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

				if (select.kind === "list") {
					forEach(select.asArray, function (element) {
						executeAction(inner(element));
					});
				} else {
					var done = false;
					var cell = select;
					var injectedFunc = cell.injectDependency(function () {
						if (!done) {
							done = true;
							forEach(cell.getState(), function (element) {
								executeAction(inner(element));
							});
						}
					});
					injectedFunc.unInject();
				}
				// extract returns undefined
				output = {usedCallback:false};
			} else if (action.kind === "case") {
				var template = makeClosure(action.lineTemplate, env),
					otherwise = makeClosure(action.otherwise, env);
				var cell = evalExpr(action.test);
				var done = false;
				var injectedFunc = cell.injectDependency(function () {
					if (!done) {
						done = true;
						var action;
						if(cell.getState().length>0)
							action = evaluate( makeApply(template, cell.getState()[0]) );
						else
							action = otherwise;
						output = executeAction(action, recurseOnOutput);
					}
				});
				injectedFunc.unInject();
			} else if (action.kind === "actionMethod") {
				// we're dealing with: {kind: "actionMethod", f: function}
				var result = action.f();
				output = {usedCallback:false, value:result};
			} else {
				// we're dealing with a LINE

				//var evaled = evaluateLine(action, env);
				var evaled = evaluate(evaluateLine(action, env));
				if (evaled.kind === "instruction" || evaled.kind === "remoteInstruction") {
					// the LINE evaluated to an Action
					output = executeAction(evaled, recurseOnOutput);
				} else
					debug.error("non-action expression in an action", action);
			}
			if (!output.usedCallback) {
				addLetToScope(output.value);
			}
			return output;
		}


		return executeInstructions(instruction.instructions);
	}
}
