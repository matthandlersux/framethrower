var cell;

function initialize() {
	//var test = makeRemoteObject("Object:upLeft shared.realLife", parseType("Set Cons"));
	//cell = session.query(test);
	
	
	var expr = parseExpr("Cons::lookup shared.in shared.realLife");
	
	console.log("remote", getRemote(expr));
	
	cell = evaluate(expr);
	
	session.flush();
	
	
	//var realLife = makeRemoteObject("shared.realLife", parseType("Object"));
	
	//cell = evaluate()
}