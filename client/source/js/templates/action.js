/*

LINEACTION
	{kind: "lineAction", actions: [{name?: VARTOCREATE, action: ACTIONUNIT | LINE}], type: TYPE}

ACTIONUNIT
	{kind: "actionCreate", type: TYPE, prop: {PROPERTYNAME: AST}} |
	{kind: "extract", select: AST, action: LINETEMPLATE} // this lineTemplate should take one (or two) parameters.

*/


function executeAction(instruction) {
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
			var isMap = action.action.params.length==2;
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
		} else if (action.kind === "actionMethod") {
			// we're dealing with: {kind: "actionMethod", f: function}
			output = action.f();
		} else {
			// we're dealing with a LINE
			
			//var evaled = evaluateLine(action, env);
			var evaled = evaluate(evaluateLine(action, env));
			if (evaled.kind === "instruction") {
				// the LINE evaluated to an Action
				output = executeAction(evaled);
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
