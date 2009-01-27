var cell, cell2;

function initialize() {
	//var test = makeRemoteObject("Object:upLeft shared.realLife", parseType("Set Cons"));
	//cell = session.query(test);
	
	
	var expr = parseExpr("Cons::lookup shared.in shared.realLife");
	var expr2 = parseExpr("Object:upLeft shared.realLife");
	
	//console.log("remote", getRemote(expr));
	
	cell = evaluate(expr);
	cell2 = evaluate(expr2);
	
	session.flush();
	
	
	//var realLife = makeRemoteObject("shared.realLife", parseType("Object"));
	
	//cell = evaluate()
}