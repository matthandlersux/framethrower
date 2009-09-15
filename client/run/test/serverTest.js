var cell;

function initialize() {
	console.log("Starting!");
	
	var exprString = "rangeByKey (takeLast (oneTo 4)) (returnUnit 6) (oneTo 9)";
	var expr = parseExpr(exprString);
	cell = session.query(expr);
	session.flush();
	cell.injectDependency(function() {
		console.log(cell.getState());
	});
	
}