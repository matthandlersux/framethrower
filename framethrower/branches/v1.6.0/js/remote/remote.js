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
		if (!expr.remote) {
			if (expr.kind === "var") {
				expr.remote = 0;
			} else if (expr.kind === "exprLambda" || expr.kind === "exprApply") {
				expr.remote =  Math.max(expr.left, expr.right);
			} else {
				expr.remote = getRemote(getExpr(expr));
			}
		}
		return expr.remote;
	}
}

function makeRemoteObject(name, type) {
	var o = {
		kind: "remoteObject",
		remote: 1,
		name: name,
		type: type
	};
	return o;
}

function queryExpr(expr) {
	// TODO
	
	var type = getType(expr);
	var cell = makeCC(type);
	
	// TODO make it not persist, and proper onRemove handler to tell the server to stop updating
	
	
	return cell;
}












var maxCalls = 12;





var timeoutDefault = 30 * 1000; // 30 seconds
var serverBaseUrl = "http://localhost:8000/";
//var serverBaseUrl = "http://www.eversplosion.com/resources/servertest.php?";

function xhr(url, post, callback, failCallback, timeout) {
	
	maxCalls--;
	if (maxCalls <= 0) {
		console.error("Max calls exceeded");
		return;
	}
	
	// BROWSER: this is just to test from local files, will be removed
	netscape.security.PrivilegeManager.enablePrivilege("UniversalBrowserRead");
	
	if (!timeout) timeout = timeoutDefault;
	
	function fail() {
		//console.error("fail called", req);
		if (failCallback) {
			failCallback();
		} else {
			// retry
			xhr(url, post, callback, failCallback, timeout);
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
				console.log("called: "+url+"\nwith post: "+post+"\ngot response: "+req.responseText);
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
		// TODO
		makeRemoteObject();
	}
}


var session = (function () {
	var sessionId = null;
	var queriesToAsk = [];
	var actionsToSend = [];
	var nextQueryId = 1;
	var lastMessageId = 0;
	
	var cells = {};
	
	function addActions(actions) {
		if (!sessionId) {
			newSession();
		}
		
		actionsToSend = actionsToSend.concat(actions);
	}
	
	function sendAllActions() {
		if (actionsToSend.length > 0) {
			var sending = actionsToSend;
			actionsToSend = [];
			var json = JSON.stringify({
				sessionId: sessionId,
				actions: sending
			});
			
			xhr(serverBaseUrl+"action", json, function (text) {
				
			}, function () {
				actionsToSend = actionsToSend.concat(sending);
				sendAllActions();
			});
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
		
		queriesToAsk.push({
			expr: unparseExpr(expr),
			queryId: queryId
		});
		
		return cell;
	}
	
	function askAllQueries() {
		if (queriesToAsk.length > 0) {
			var asking = queriesToAsk;
			queriesToAsk = [];
			var json = JSON.stringify({
				sessionId: sessionId,
				queries: asking
			});
			
			xhr(serverBaseUrl+"query", json, function (text) {
				
			}, function () {
				queriesToAsk = queriesToAsk.concat(asking);
				askAllQueries();
			});
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
			
			try {
				var o = JSON.parse(text);
				
				if (o.sessionClosed) {
					// TODO
				} else {
					lastMessageId = o.lastMessageId;
					forEach(o.updates, function (update) {
						//console.log("doing update", update, o.updates);
						var cell = cells[update.queryId];
						var keyType; // TODO
						var valueType;
						var key = parseServerResponse(update.key);
						var value = parseServerResponse(update.value);
						cell.control[update.action](key, value);
					});
					refreshScreen();
				}
				


				
			} catch (e) {
				console.log("had an error", e, cells, cells["1"]);
			}

			
			//console.log("starting updater again", "last message id", lastMessageId);
			startUpdater();
		});
	}
	
	function newSession() {
		sessionId = "initializing";
		lastMessageId = 0;
		nextQueryId = 1;
		// TODO: move all cells' expr's into queriesToAsk
		xhr(serverBaseUrl+"newSession", "", function (text) {
			// console.log("newSession got back text: ", text);
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
		flushActions: sendAllActions,
		flush: askAllQueries,
		debugCells: cells
	};
})();

