/*
expr's are tagged with a remoteLevel in their 'remote' field
remoteLevel is one of the 4 entries in this latice:

    	shared
		/	\
serverOnly  localOnly
		\	/
    	neither

remoteLevel is used on evaluate of expr:
	if remoteLevel is serverOnly and expr is a cell, query the server for it
	if remoteLevel is serverOnly and expr is not a cell, evaluate like normal
	if remoteLevel is shared or localOnly, evaluate locally
*/

var remote = {};

//
// remoteLevel :: {local:Bool, server:Bool}. 
//	local = true means this expr can be evaluated on client
//	server = true means this expr can be evaluated on the server
remote.shared = {local: true, server: true};
remote.localOnly = {local: true, server: false};
remote.serverOnly = {local: false, server: true};
remote.neither = {local: false, server: false};


//
// maxRemote returns the most broad remoteLevel that can evaluate r1 and r2
// remote.shared is the most broad, remote.neither is the least broad
function maxRemoteLevel(r1, r2) {
	return {local: r1.local && r2.local, server: r1.server && r2.server};
}



//
// getRemoteLevel returns the broadest remoteLevel of expr
//	side effect: sets expr.remote to that remoteLevel
//	side effect: sets (any sub expression of expr).remote to its remoteLevel if unset
function getRemoteLevel(expr) {
	// if literal, remote is shared
	if (typeOf(expr) !== "object") {
		return remote.shared;
	} else {
		if (expr.remote === undefined) {
			if (expr.kind === "exprVar") {
				expr.remote = remote.shared;
			} else if (expr.kind === "exprApply") {
				expr.remote = maxRemoteLevel(getRemoteLevel(expr.left), getRemoteLevel(expr.right));
			} else if (expr.kind === "exprLambda") {
				expr.remote = getRemoteLevel(expr.expr);
			} else {
				expr.remote = remote.localOnly;
			}
		}
		return expr.remote;
	}
}


function isServerOnly(remoteLevel) {
	return (!remoteLevel.local && remoteLevel.server);
}

// remoteEquals checks if two remoteLevels are the same
function remoteEquals(remoteLevel1, remoteLevel2) {
	return ((remoteLevel1.local === remoteLevel2.local) && remoteLevel1.server === remoteLevel2.server);
}


function makeRemoteCell(name, type) {
	var o = {
		kind: "remoteCell",
		remote: remote.serverOnly,
		name: name,
		type: type,
		outsideScope: 0
	};
	return o;
}