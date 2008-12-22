
var localIds = makeGenerator("local.");

function unparseExpr(expr) {
	/*
	This should only be called on closed Expr's
	*/
	function helper(expr) {
		if (expr.kind === "exprApply") {
			return {cons: "apply", left: helper(expr.left), right: helper(expr.right)};
		} else if (expr.kind === "exprLambda") {
			return {cons: "lambda", left: helper(expr.left), right: helper(expr.right)};
		} else if (expr.kind === "var") {
			return expr.value;
		} else {
			var t = typeOf(expr);
			if (t === "string") {
				return '"' + expr.replace(/"/g, '\\"') + '"';
			} else if (t === "boolean" || t === "number") {
				return expr.toString();
			} else {
				if (!expr.name) {
					expr.name = localIds();
				}
				return expr.name;
			}
		}
	}
	return unparse(helper(expr));
}

var stringify = unparseExpr;

function getExpr(o) {
	/*
	this function takes a closed Expr, and returns the bottomed-out expression (Expr) that was used to make this object
	notice that Fun's and StartCap's created using evaluate() have their .expr field tagged already with such an expression
	*/
	var t = typeOf(o);
	if (basicTypes[t]) { // literals: Number, String, or Bool
		return o;
	} else { //object
		if (!o.expr) {
			if (o.kind === "exprApply" || o.kind === "exprLambda") {
				o.expr = {
					kind: o.kind,
					left: getExpr(o.left),
					right: getExpr(o.right)
				};
			} else if (o.kind === "var") {
				o.expr = o;
			} else {
				// this should only be the case for primitive functions, persistent StartCap's, and Object's
				o.expr = o;
			}
		}
		return o.expr;
	}
}

function uniqueExpr(expr) {
	/*
	this function first runs getExpr (to bottom out expr), normalizes the result, then converts it into a string using unparseExpr
	*/
	return unparseExpr(normalizeExpr(getExpr(expr)));
}