/*

LINEACTION
	{kind: "lineAction", params: [VARTOCREATE], actions: [{name?: VARTOCREATE, action: ACTIONUNIT | LINE}], type: TYPE}

ACTIONUNIT
	{kind: "actionCreate", type: TYPE, prop: {PROPERTYNAME: AST}} |
	{kind: "actionUpdate", target: AST, actionType: "add" | "remove", key?: AST, value?: AST} |
	{kind: "extract", select: AST, lineAction: LINEACTION} // this lineAction should take one (or two) parameters.

*/

function makeActionClosure(lineAction, env) {
	var params = lineAction.params;
	var type = lineAction.type;
	
	var f = curry(function () {
		var scope = {};
		var args = arguments;
		forEach(params, function (param, i) {
			scope[param] = args[i];
		});
		var envWithParams = extendEnv(env, scope);
		
		var ret = {
			kind: "instruction",
			instructions: lineAction.actions,
			env: envWithParams,
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


function executeAction(instruction) {
	var scope = {};
	var env = extendEnv(instruction.env, scope);
	
	var output;
	
	function evalExpr(expr) {
		return evaluate(parseExpression(expr, env));
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
		} else if (action.kind === "actionUpdate") {
			// we're dealing with: {kind: "actionUpdate", target: AST, actionType: "add" | "remove", key?: AST, value?: AST}
			
			var target = evalExpr(action.target);
			var key = action.key ? evalExpr(action.key) : undefined;
			var value = action.value ? evalExpr(action.value) : undefined;
			
			if (target.control === undefined) {
				debug.error("Trying to do action update on non-controlled cell", target);
			} else {
				target.control[action.actionType](key, value);
			}
		} else if (action.kind === "extract") {
			// we're dealing with: {kind: "extract", select: AST, lineAction: LINEACTION} // this lineAction should take one (or two) parameters.
			
			var actionClosure = makeActionClosure(action.lineAction, env);
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
			
		} else {
			// we're dealing with a LINE
			
			var evaled = evaluateLine(action, env);
			if (evaled.kind === "instruction") {
				// the LINE evaluated to an Action
				output = executeAction(evaled);
			} else {
				output = evaled;
			}
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
