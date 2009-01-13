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
	// TODO
}

function queryExpr(expr) {
	// TODO
	
	var type = getType(expr);
	var cell = makeCC(type);
	
	// TODO make it not persist, and proper onRemove handler to tell the server to stop updating
	
	
	return cell;
}















var currentSession;
function initializeSession() {
	var sessionId = null;
	var queriesToAsk = [];
	var nextQueryId = 1;
	
	function addQuery(expr) {
		queriesToAsk.push({
			exprString: unparseExpr(expr),
			queryId: nextQueryId
		});
		nextQueryId++;
	}
	
	function askAllQueries() {
		var asking = queriesToAsk;
		queriesToAsk = [];
		
	}
	
	xhr(serverBaseUrl+"newSession", "", function (text) {
		
	});
	
	return {
		addQuery: addQuery
	};
}


var timeoutDefault = 30 * 1000; // 30 seconds
var serverBaseUrl = "http://www.eversplosion.com/resources/servertest.php?";

function xhr(url, post, callback, failCallback, timeout) {
	
	// BROWSER: this is just to test from local files, will be removed
	netscape.security.PrivilegeManager.enablePrivilege("UniversalBrowserRead");
	
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
