var cell;

function initialize() {
	cell = evaluate(parseExpr("Cons::lookup shared.in shared.realLife"));
	console.log("cell state", cell.getState());
	
	bootstrap(document.body);
}