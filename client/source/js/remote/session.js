var timeoutDefault = 30 * 1000; // 30 seconds

try {	//try catch is a hack so this can work in rhino
	if (!window.serverBaseUrl) {
		window.serverBaseUrl = "http://clever.eversplosion.com:8000/";
	}
} catch (err) {}


function xhr(url, post, callback, failCallback, timeout) {
	if (LOCAL) return;
	
	// BROWSER: this is just to test from local files, will be removed
	if (window.netscape){
		try {
			netscape.security.PrivilegeManager.enablePrivilege("UniversalBrowserRead");
		} catch (err){}
	}
	
	if (!timeout) timeout = timeoutDefault;
	
	function fail() {
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
	if (post.length > 300) console.log("sending big post, length: "+post.length);
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
	var messages = [];
	var nextQueryId = 1;
	var nextActionId = 1;
	var lastMessageId = 0;
	var actionsPending = {};
	var sending = false;
	
	var cells = {};
	
	function addActions(actions, callback) {
		if (!sessionId) {
			newSession();
		}

		var actionId = nextActionId;
		nextActionId++;

		messages.push({
			action: {
				actionId: '' + actionId,
				actions: actions
			}
		});

		actionsPending[actionId] = callback;
		sendAllMessages();
	}
	
	function addQuery(expr) {
		var queryId = nextQueryId;
		nextQueryId++;
		
		var type = getType(expr);
		var cell = makeCC(type);
		cell.remote = 1;
		cell.name = stringify(expr);
		
		cells[queryId] = cell;
		
		// if (unparseExpr(getExpr(expr)).indexOf("local.") !== -1) {
		// 	debug.error("Trying to send a local thing to the server", expr);
		// }

		var newExpr = stringifyForServer(expr);

		//console.log("Query", queryId, {expr:newExpr});
		
		messages.push({
			query: {
				expr: newExpr,
				queryId: '' + queryId
			}
		});
		
		return cell;
	}
	
	function sendAllMessages() {
		if(!sending) {
			if (!sessionId) {
				newSession();
			} else if (sessionId && sessionId !== "initializing") {
				if (messages.length > 0) {
					var json = JSON.stringify({
						sessionId: sessionId,
						messages: messages
					});
					var asking = messages;
					messages = [];
					sending = true;
					xhr(serverBaseUrl+"post", json, function (response) {
						sending = false;
						response = JSON.parse(response);
					
						// TODO: respond to just true or an error
						if (response.result !== true) {
							debug.log("Action Error:", response.result);
						}
					
						sendAllMessages();
					},
					function () {
						sending = false;
						messages = messages.concat(asking);
						sendAllMessages();
					});

				}
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
		//console.log("I'm pipelining", json);
		xhr(serverBaseUrl+"pipeline", json, function (text) {
			//console.log("updater got a message", text);
			
			
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
									//console.log("Update:", update.key, update.value);
									cell.control[update.action](key, value);
								}
							} else {
								var key = parseServerResponse(update.key, keyType);
								var value = parseServerResponse(update.value, valueType);
								//console.log("Update:", update.key, update.value);
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
						} else if (response.queryDefine) {
							try {
								var queryDefine = response.queryDefine;
								var expr = parseExpr(queryDefine.expr, remoteObjectsEnv);
								var type = getType(expr);
								var cell = makeCC(type);
								cell.expr = expr;
							
								cells[queryDefine.queryId] = cell;
								//add this expr and cell to local hashtable
								resultExprStringified = stringify(expr);
								evalCache[resultExprStringified] = cell;
							} catch (e) {
								console.log(e, response.queryDefine);
							}
						} else if (response.queryReference) {
							var queryReference = response.queryReference;
							var refCell = cells[queryReference.queryId];
							cells[queryReference.referenceId].inject(refCell,
								function (val) {
									return refCell.addLine(val);
								}
							);
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
		
		// TODO: move all cells' expr's into queriesToAsk
		// that is, do the right thing if you had a session, but it's now closed
		
		xhr(serverBaseUrl+"newSession", "", function (text) {
			var o = JSON.parse(text);
			sessionId = o.sessionId;

			sendAllMessages();

			if (!updaterRunning) startUpdater();
		});
	}
	
	return {
		query: addQuery,
		addActions: addActions,
		flush: sendAllMessages,
		debugCells: cells
	};
})();