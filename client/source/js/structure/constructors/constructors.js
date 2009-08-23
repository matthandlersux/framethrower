
/*
Make those tags universal
Make constructor functions for Fun's, StartCap's, and Objects

Make full beta reduction thing


Tags on expr's:
	name (stringify)
	remote (getRemote)
	type
	outsideScope

*/

var localIds = makeGenerator("local.");


function makeFun(type, fun, name, remote) {
	if (name === undefined) name = localIds();
	if (remote === undefined) remote = 2;
	return {
		kind: "fun",
		type: type,
		fun: fun,
		name: name,
		remote: remote,
		outsideScope: 0
	};
}

function makeObject(type) {
	return {
		kind: "object",
		type: type,
		name: localIds(),
		prop: {},
		remote: 2,
		outsideScope: 0
	};
}

function makeStartCap() {
	
}

function makeVar(deBruijn) {
	return {
		kind: "exprVar",
		deBruijn: deBruijn,
		name: "/" + deBruijn,
		outsideScope: deBruijn
	};
}
// function makeApply(left, right, type) {
// 	// type is an optional optimization
// 	var app = {
// 		kind: "exprApply",
// 		left: left,
// 		right: right,
// 		name: "(" + stringify(left) + " " + stringify(right) + ")",
// 		outsideScope: Math.max(getOutsideScope(left), getOutsideScope(right))
// 	};
// 	if (type) app.type = type;
// 	//else if (app.outsideScope === 0) getType(app);
// 	return app;
// }
function makeApply(left, right) {
	return {
		kind: "exprApply",
		left: left,
		right: right,
		//name: "(" + stringify(left) + " " + stringify(right) + ")",
		outsideScope: Math.max(getOutsideScope(left), getOutsideScope(right))
	};
}
function makeLambda(varName, expr, type) {
	// type is an optional optimization
	var lam = {
		kind: "exprLambda",
		varName: varName,
		expr: expr,
		name: "(\\ " + stringify(expr) + ")",
		outsideScope: Math.max(0, getOutsideScope(expr) - 1)
	};
	if (type) lam.type = type;
	//else if (lam.outsideScope === 0) getType(lam);
	return lam;
}






function getOutsideScope(expr) {
	if (expr.outsideScope !== undefined) return expr.outsideScope;
	else return 0;
}





// TODO: stringify should stringify lists properly
function stringify(expr) {
	if (expr.name) {
		return expr.name;
	} else if (expr.kind === "exprApply") {
		expr.name = "(" + stringify(expr.left) + " " + stringify(expr.right) + ")";
	 	return expr.name;
	// } else if (expr.kind === "exprLambda") {
	// 	expr.name = "(\\ " + stringify(expr.expr) + ")";
	// 	return expr.name;
	// } else if (expr.kind === "exprVar") {
	// 	expr.name = "/" + expr.deBruijn;
	// 	return expr.name;
	} else {
		var lit = unparseLiteral(expr);
		if (lit !== undefined) {
			return lit;
		} else {
			if (!expr.name) {
				expr.name = localIds();
			}
			return expr.name;
		}
	}
}


// TODO: make this compute automatically like name/stringify...
function stringifyForServer(expr) {
	if (expr.stringifyForServer) {
		return expr.stringifyForServer;
	} else if (expr.kind === "exprApply") {
		return "(" + stringifyForServer(expr.left) + " " + stringifyForServer(expr.right) + ")";
	} else if (expr.kind === "exprLambda") {
		return "(\\ " + stringifyForServer(expr.expr) + ")";
	} else {
		return stringify(expr);
	}
}