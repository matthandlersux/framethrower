var cell, cell2;

function initialize() {
	
	// ===== Works =====
	
	//var expr = parseExpr("Object:upLeft shared.realLife");
	
	//var expr = parseExpr("mapUnit (compose Object:upLeft Cons~Object) (Cons::lookup shared.name shared.realLife)");
	//var expr = parseExpr("bindUnit (compose returnUnit Cons~Object) (Cons::lookup shared.name shared.realLife)");
	
	//var expr = parseExpr("(x1 -> bindUnit ((f -> g -> x -> f (g x)) returnUnit x1)) Cons~Object (Cons::lookup shared.name shared.realLife)");
	//var expr = parseExpr("(x1 -> bindUnit ((x2 -> x3 -> x4 -> x2 (x3 x4)) returnUnit x1)) Cons~Object (Cons::lookup shared.name shared.realLife)");
	
	//var expr = parseExpr("getOntInfons shared.name shared.realLife");
	
	//var expr = parseExpr("(mapUnit (Cons:right)) (Cons::lookup shared.name shared.realLife)");
	
	//var expr = parseExpr("(mapUnit (compose returnFutureUnit Cons:right)) (Cons::lookup shared.name shared.realLife)");
	
	// testing variable shadowing:
	// var expr = parseExpr("(bindSet -> returnUnit bindSet) shared.realLife");
	
	
	//var expr = parseExpr("oldGetOntProp shared.name shared.realLife");

	//var expr = parseExpr("oldGetName shared.realLife");
	
	// ===== Doesn't Work =====
	
	
	var expr = parseExpr("getName shared.realLife");
	
	
	
	
	
	
	//var expr = makeRemoteObject("thisDoesntExist", parseType("Unit Cons"));
	//expr = makeApply(parseExpr("returnUnit"), expr);
	
	console.log("expr should be of type:", unparseType(getType(expr)));
	
	//console.log("remote", getRemote(expr));
	
	cell = evaluate(expr);
	
	session.flush();
	
	
	//var realLife = makeRemoteObject("shared.realLife", parseType("Object"));
	
	//cell = evaluate()
}