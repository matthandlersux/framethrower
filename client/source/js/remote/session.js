var timeoutDefault = 45 * 1000; // 45 seconds

var globalTest;

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

//
// parseServerResponse :: JSON -> Type -> Expr (RemoteCell | Object | Literal)
//
function parseServerResponse(s, expectedType) {
	if (s === undefined) return undefined;
	if (typeOf(s) === "object") {
		if (s.kind === "cell") {
			// TODO test this
			return makeRemoteCell(s.name, s.constructorType);
		} else if (s.kind === "object") {
			var propTypes = objects.getPropTypes(s.type);
			var prop = map(s.props, function(value, name) {
				return parseServerResponse(value, propTypes[name]);
			});
			var obj = makeObject(parseType(s.type), s.name, prop, remote.serverOnly);
			return obj;
		}
	} else {
		if (s === null) return nullObject;
		return s;
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
	
	function addAction(actionName, params, callback) {
		if (!sessionId) {
			newSession();
		}

		var actionId = nextActionId;
		nextActionId++;

		params = map(params, stringifyForServer);

		messages.push({
			action: {
				actionId: '' + actionId,
				actionName: actionName,
				params: params
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
		
		//TODO: make this not use controlled cells
		cell.persist = false;
		
		cell.remote = remote.shared;
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

		//add cleanup to tell server when this cell is destroyed
		cell.addOnRemove(function() {
			console.log("Cleaning up", queryId);
			messages.push({
				remove: {
					queryId: '' + queryId
				}
			});
			delete cells[queryId];
		});

		
		return cell;
	}
	
	function sendAllMessages() {
		if(!sending) {
			if (!sessionId) {
				newSession();
			} else if (sessionId && sessionId !== "initializing") {
				if (messages.length > 0) {
					globalTest = {
						sessionId: sessionId,
						messages: messages
					};
					var json = JSON.stringify(globalTest);
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
						
			try {
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
								callback(actionResponse.created, parseServerResponse(actionResponse.returned));
							} else if (!actionResponse.success) {
								debug.log("Action failed, actionId:", actionResponse.actionId);
							}
						}
					});
				}
				setTimeout(startUpdater, 1);
			} catch (e) {
			 	console.log("had an error", e, cells, cells["1"]);
			}

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
	
	
	
	function getSharedLets(sharedLetStruct, callBack) {
		xhr(serverBaseUrl+"sharedLets", "", function (response) {
			if (!response) {
				console.log("Error getting Shared Lets, no server response");
			} else {
				response = JSON.parse(response);

				var sharedLets = map(sharedLetStruct, function(let, name) {
					if (let.kind === "lineTemplate") {
						//this let is an action
						var actionFunction = function() {
							//have to convert arguments into another array because arguments is not a real array (javascript quirk)
							var args = Array.prototype.slice.call(arguments);
							return makeRemoteInstruction(name, args);
						}
						return makeFun(let.type, actionFunction, let.params.length, name, remote.localOnly, true);
					} else {
						//this let will have been delivered from the server
						return parseServerResponse(response[name]);
					}
				});				
				callBack(sharedLets);
			}
		},
		function () {
			console.log("Error getting Shared Lets");
		});
	}
	
	return {
		query: addQuery,
		perform: addAction,
		flush: sendAllMessages,
		debugCells: cells,
		getSharedLets: getSharedLets
	};
})();