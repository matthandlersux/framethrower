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
}