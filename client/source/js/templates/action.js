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
				//TODO: want these cells to be garbage collected, but they won't if they are in memo table
				output = makeCC(action.type);
			} else {
				//TODO: same as above applies to these objects' reactive fields
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

// executeAction(instruction, callback) performs instruction and then calls callback with the result of the last line of instruction

function executeAction (instruction, callback) {
	//any asynchronous calls that result from helpExecuteAction will be returned back to executeUntilDone
	//executeUntilDone will keep calling helpExecuteAction until no more asynchronous calls are needed
	
	function executeUntilDone(result) {
		if (result.async) {
			setTimeout(function() {
				result.asyncFunction(executeUntilDone);
			}, 0); //this prevents stack from growing from too many recursive calls
		} else {
			if (callback) {
				callback(result.value);
			}
		}
	}
	executeUntilDone(helpExecuteAction(instruction));
}

// helpExecuteAction(instruction)
// helpExecuteAction will execute instruction until the instruction requires an asynchronous call (asyncFunction) to be made to the server
// if this happens, helpExecuteAction will return a function that will run asyncFunction and then continue executing the action
// if no asynchronous call is needed, helpExecuteAction will return the result of the last instruction
//
// helpExecuteAction returns:
//	 {async:true, asyncFunction: function(aSyncCallback)}  where aSyncCallback(accum) is called with the result of asyncFunction
// | {async:false, value: value}
function helpExecuteAction (instruction) {
	if (instruction.kind === "remoteInstruction") {
		return {
			async:true,
			asyncFunction:function (callback) {
				console.log("Executing remote Instruction!", instruction);
				var wrappedCallback = function(result) {
					callback({async:false, value:result});
				};
				session.perform(instruction.name, instruction.params, wrappedCallback);
			}
		};
	} else {
		var scope = {};
		var env = extendEnv(instruction.env, scope);
		return foldAsynchronous(instruction.instructions, undefined, function (actionLet) {
			var action = actionLet.action;
			var actionKind = action.kind;
			var output;

			if (actionKind === "actionCreate") {
				// we're dealing with: {kind: "actionCreate", type: TYPE, prop: {PROPERTYNAME: AST}}
				var created;
				if (isReactive(action.type)) { 	//creating a cell
					created = makeCC(action.type);
				} else { 						//creating an object
					var evaledProps = map(action.prop, function (expr) {
						return evaluate2(parseExpression(expr, env));
					});
					created = objects.make(action.type.value, evaledProps);
				}
				output = {async:false, value:created};
			} else if (actionKind === "actionMethod") {
				// we're dealing with: {kind: "actionMethod", f: function}
				output = {async:false, value:action.f()};
			} else if (actionKind === "lineExpr" || actionKind === "lineTemplate") {
				// we're dealing with a LINE

				var evaled = evaluate(evaluateLine(action, env));
				if (evaled.kind === "instruction" || evaled.kind === "remoteInstruction") {	// the LINE should evaluate to an Action
					output = helpExecuteAction(evaled);
				} else debug.error("non-action expression in an action", action);
			} else if (actionKind === "extract") {
				// we're dealing with: {kind: "extract", select: AST, action: LINETEMPLATE} // this lineTemplate should take one (or two) parameters.

				var closure = makeClosure(action.action, env);
				var inner;
				if (closure.argsLength==2) { //extracting a map
					inner = function (o) {
						return evaluate(makeApply(makeApply(closure, o.key), o.val));
					};
				} else { //extracting a set or unit
					inner = function (key) {
						return evaluate(makeApply(closure, key));
					};
				}

				var select = evaluate(parseExpression(action.select, env));
				if (select.kind === "list") {
					forEach(select.asArray, function (element) {
						executeAction(inner(element));
					});
				} else { // select is a cell
					var done = false; uninjected = false; 
					var state;
					var injectedFunc = select.injectDependency(function () { // wait until select cell is 'done', then iterate over its elements
						if (!done) {
							done = true;
							state = select.getState();
							if (injectedFunc !== undefined) {
								injectedFunc.unInject();
								uninjected = true;
								forEach(state, function (element) {
									executeAction(inner(element));
								});
							}
						}
					});
					if (done && !uninjected) {
						injectedFunc.unInject();
						forEach(state, function (element) {
							executeAction(inner(element));
						});
					}
				}
				// extract returns undefined, so even if it is asynchronous we don't need to wait for it
				output = {async:false, value:undefined};
			} else if (actionKind === "case") {
				var template = makeClosure(action.lineTemplate, env),
					otherwise = makeClosure(action.otherwise, env);
				var cell = evaluate(parseExpression(action.test, env));
				var done = false;
				var action;
				var injectedFunc = cell.injectDependency(function () {
					if (!done) {
						done = true;
						if(cell.getState().length>0)
							action = evaluate( makeApply(template, cell.getState()[0]) );
						else
							action = otherwise;
					}
				});
				//TODO: make case in actions work for server
				console.log("TODO: make case in actions work for server");
				injectedFunc.unInject();
				output = helpExecuteAction(action);
			}
			//now wrap the output if needed
			if (output.async) {
				return { // return a function to run the asynchronous action, add the result to the scope, and continue with provided callback
					async:true, 
					asyncFunction: function (continuation) {
						output.asyncFunction(function(accum) {
							addLetToScope(accum.value, actionLet, scope);
							return continuation(accum);
						});
					}
				};
			} else { // action not asynchronous, so it's been executed
				addLetToScope(output.value, actionLet, scope);
				return output;
			}
		});
	}
}

function addLetToScope (output, actionLet, scope) {
	if (actionLet.name) {
		if (output === undefined) {
			debug.error("Trying to assign a let action, but the action has no return value", actionLet);
		}
		scope[actionLet.name] = output;
	}
}