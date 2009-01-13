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


















var timeoutDefault = 30 * 1000; // 30 seconds
var serverBaseUrl = "http://www.eversplosion.com/resources/servertest.php?";

function xhr(url, post, callback, failCallback, timeout) {
	
	// BROWSER: this is just to test from local files, will be removed
	netscape.security.PrivilegeManager.enablePrivilege("UniversalBrowserRead");
	
	url = url + Math.random();
	
	if (!timeout) timeout = timeoutDefault;
	
	function fail() {
		if (failCallback) {
			failCallback();
		} else {
			// retry
			xhr(url, post, callback, failCallback, timeout);
		}
	}
	
	var timer;
	
	var req = new XMLHttpRequest();
	req.open("POST", url, true);
	//req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	//req.setRequestHeader("Content-length", post.length);
	//req.setRequestHeader("Connection", "close");
	req.onreadystatechange = function () {
		if (req.readyState == 4) {
			clearTimeout(timer);
		 	if (req.status == 200 || req.status == 0) {
				callback(req.responseText);
			} else {
				fail();
			}
		}
	};
	req.send(post);
	timer = setTimeout(function () {
		req.abort();
		fail();
	}, timeout);
}



var session = (function () {
	var sessionId = null;
	var queriesToAsk = [];
	var nextQueryId = 1;
	var lastMessageId = 0;
	
	var cells = {};
	
	function addQuery(expr) {
		if (!sessionId) {
			newSession();
		}
		
		var queryId = nextQueryId;
		nextQueryId++;		
		
		queriesToAsk.push({
			expr: unparseExpr(expr),
			queryId: queryId
		});
		
		var type = getType(expr);
		var cell = makeCC(type);
		cell.expr = expr;
		
		cells[queryId] = cell;
		
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
		xhr(serverBaseUrl+"pipeline", json, function (text) {
			var o = JSON.parse(text);
			forEach(o.updates, function (update) {
				// TODO do update
			});
			lastMessageId = o.lastMessageId;
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
			if (!updaterRunning) startUpdater();
		});
	}
	
	return {
		query: addQuery,
		flush: askAllQueries
	};
})();

