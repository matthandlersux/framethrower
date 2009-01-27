var cell, cell2;

function initialize() {
	//var test = makeRemoteObject("Object:upLeft shared.realLife", parseType("Set Cons"));
	//cell = session.query(test);
	
	
	var expr = parseExpr("mapUnit Cons~Object (Cons::lookup shared.name shared.realLife)");
	
	console.log("expr should be of type:", unparseType(getType(expr)));
	
	//console.log("remote", getRemote(expr));
	
	cell = evaluate(expr);
	
	session.flush();
	
	
	//var realLife = makeRemoteObject("shared.realLife", parseType("Object"));
	
	//cell = evaluate()
}