/*
queryExpr(expr)
	returns a controlled cell
	pipes results of query into it



remote has 3 values:
	0: shared
	1: remote
	2: local

to getRemote(expr), take max up the tree

now, on evaluate
	if the expr is remote and a cell, query the server for it
	if the expr is remote and not a cell,
		do like normal
	if the expr is shared or local, do like normal
*/


function getRemote(expr) {
	// if literal, remote is shared, 0
	if (typeOf(expr) !== "object") {
		return 0;
	} else {
		if (expr.remote === undefined) {
			if (expr.kind === "var") {
				expr.remote = 0;
			} else if (expr.kind === "exprLambda" || expr.kind === "exprApply") {
				expr.remote =  Math.max(getRemote(expr.left), getRemote(expr.right));
			} else if (expr === getExpr(expr)) {
				expr.remote = 2;
			} else {
				expr.remote = getRemote(getExpr(expr));
			}
		}
		return expr.remote;
	}
}

function getRemoteType(type) {
	if (type.kind === "typeName") {
		if (objects.inherits(type.value, "Object")) {
			return 1;
		} else if (objects.isClass(type.value) || type.value === "JS") {
			return 2;
		} else {
			return 0;
		}
	} else if (type.kind === "typeVar") {
		return 0;
	} else {
		return Math.max(getRemoteType(type.left), getRemoteType(type.right));
	}
}




var debugRemoteObjects = {};

function makeRemoteObject(name, type) {
	var o = {
		kind: "remoteObject",
		remote: 1,
		name: name,
		type: type
	};
	debugRemoteObjects[name] = o;
	return o;
}

function queryExpr(expr) {
	// TODO
	
	//var type = getType(expr);
	//var cell = makeCC(type);
	
	// TODO make it not persist, and proper onRemove handler to tell the server to stop updating
	
	
	//return cell;
}












var maxCalls = 12;





var timeoutDefault = 30 * 1000; // 30 seconds

if (!window.serverBaseUrl) {
	window.serverBaseUrl = "http://clever.eversplosion.com:8000/";
}



function xhr(url, post, callback, failCallback, timeout) {
	
	// maxCalls--;
	// if (maxCalls <= 0) {
	// 	console.error("Max calls exceeded");
	// 	return;
	// }
	
	// BROWSER: this is just to test from local files, will be removed
	if (window.netscape){
		try {
			netscape.security.PrivilegeManager.enablePrivilege("UniversalBrowserRead");
		} catch (err){}
	}
	
	if (!timeout) timeout = timeoutDefault;
	
	function fail() {
		//console.error("fail called", req);
		if (failCallback) {
			failCallback();
		} else {
			// retry
			setTimeout(function () {
				xhr(url, post, callback, failCallback, timeout);
			}, 1);
		}
	}
	
	var timer;
	
	var req = new XMLHttpRequest();
	req.open("POST", url + "?" + Math.random(), true);
	req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	//req.setRequestHeader("Content-length", post.length);
	//req.setRequestHeader("Connection", "close");
	req.onreadystatechange = function () {
		if (req.readyState == 4) {
			clearTimeout(timer);
		 	if (req.status == 200 || req.status == 0) {
				
				// debugging stuff:
				//console.log("called: "+url+"\nwith post: "+post+"\ngot response: "+req.responseText);
				
				callback(req.responseText);
			} else {
				fail();
			}
		}
	};
	req.send("json="+encodeURIComponent(post));
	timer = setTimeout(function () {
		req.abort();
		fail();
	}, timeout);
}


function parseServerResponse(s, expectedType) {
	if (!s) return undefined;
	if (typeOf(s) === "number") return s;
	var lit = parseLiteral(s);
	if (lit !== undefined) {
		return lit;
	} else {
		// TODO test this
		return makeRemoteObject(s, expectedType);
	}
}


var session = (function () {
	var sessionId = null;
	var queriesToAsk = [];
	var actionsToSend = [];
	var nextQueryId = 1;
	var nextActionId = 1;
	var lastMessageId = 0;
	var actionsPending = {};
	
	var cells = {};
	
	function addActions(actions, callback) {
		if (!sessionId) {
			newSession();
		}
		
		actionsToSend.push({
			actions: actions,
			callback: callback
		});
		sendAllActions();
	}
	function sendAllActions() {
		if (sessionId && sessionId !== "initializing") {
			if (actionsToSend.length > 0) {
				var actionId = nextActionId;
				nextActionId++;
				var sending = actionsToSend.shift();
				var json = JSON.stringify({
					sessionId: sessionId,
					messages: [
						{
							action: {
								actionId: actionId,
								actions: sending.actions
							}
						}
					]
				});

				actionsPending[actionId] = sending.callback;

				//TODO: store this callback with the actionId and call it from the pipeline when the actionResponse is received

				xhr(serverBaseUrl+"post", json, function (response) {
					response = JSON.parse(response);
					
					// TODO: respond to just true or an error
					if (response.result !== true) {
						debug.log("Action Error:", response.result);
					}
					
					sendAllActions();
				},
				function () {
					actionToSend = actionsToSend.concat(asking);
					sendAllActions();
				});

			}
		}
	}
	
	
	
	function addQuery(expr) {
		if (!sessionId) {
			newSession();
		}
		
		var queryId = nextQueryId;
		nextQueryId++;
		
		var type = getType(expr);
		var cell = makeCC(type);
		cell.expr = expr;
		
		cells[queryId] = cell;
		
		if (unparseExpr(getExpr(expr)).indexOf("local.") !== -1) {
			debug.error("Trying to send a local thing to the server", expr);
		}
		
		queriesToAsk.push({
			query: {
				expr: unparseExpr(getExpr(expr)),
				queryId: queryId
			}
		});
		
		return cell;
	}
	
	function askAllQueries() {
		if (sessionId && sessionId !== "initializing") {
			if (queriesToAsk.length > 0) {
				var asking = queriesToAsk;
				queriesToAsk = [];
				
				var json = JSON.stringify({
					sessionId: sessionId,
					messages: asking
				});
							
				xhr(serverBaseUrl+"post", json, function (text) {
					//TODO: response to error
				}, function () {
					queriesToAsk = queriesToAsk.concat(asking);
					askAllQueries();
				});
			}
		}
	}
	
	var updaterRunning = false;
	function startUpdater() {
		updaterRunning = true;
		var json = JSON.stringify({
			sessionId: sessionId,
			lastMessageId: lastMessageId
		});
		console.log("I'm pipelining", json);
		xhr(serverBaseUrl+"pipeline", json, function (text) {
			console.log("updater got a message", text);
			
			// TODO if text is blank, treat this as session closed
			
			// try {
				var o = JSON.parse(text);
				
				if (o.sessionClosed) {
					// TODO
					debug.error("SESSION CLOSED!");
					return;
				} else {
					lastMessageId = o.lastMessageId;
					forEach(o.responses, function (response) {
						//console.log("doing update", update, o.updates);
						if (response.queryUpdate) {
							var update = response.queryUpdate;
							var cell = cells[update.queryId];
						
							if (cell !== undefined) { // TODO do i need this?
								var keyType; // TODO test this
								var valueType;
								var cellType = getType(cell);
								if (cellType.left.kind === "typeApply") {
									keyType = cellType.left.right;
									valueType = cellType.right;
								} else {
									keyType = cellType.right;
								}

								if (update.action == "done") {
									cell.setDone();
								} else {
									var key = parseServerResponse(update.key, keyType);
									var value = parseServerResponse(update.value, valueType);
									cell.control[update.action](key, value);
								}
							}
						} else if (response.actionResponse) {
							var actionResponse = response.actionResponse;
							
							// TODO fill this with correct variables or whatever
							var callback = actionsPending[actionResponse.actionId];
							delete actionsPending[actionResponse.actionId];
							if (callback && actionResponse.success) {
								callback(actionResponse.created, actionResponse.returned); 
							} else if (!actionResponse.success){
								debug.log("Action failed, actionId:", actionResponse.actionId);
							}
						}
					});
					refreshScreen();
				}
				
			// } catch (e) {
			// 	console.log("had an error", e, cells, cells["1"]);
			// }

			setTimeout(startUpdater, 1);
		});
	}
	
	function newSession() {
		sessionId = "initializing";
		lastMessageId = 0;
		nextQueryId = 1;
		
		// TODO: move all cells' expr's into queriesToAsk
		// that is, do the right thing if you had a session, but it's now closed
		
		xhr(serverBaseUrl+"newSession", "", function (text) {
			var o = JSON.parse(text);
			sessionId = o.sessionId;

			askAllQueries();
			sendAllActions();
			if (!updaterRunning) startUpdater();
		});
	}
	
	return {
		query: addQuery,
		addActions: addActions,
		flush: askAllQueries,
		debugCells: cells
	};
})();

