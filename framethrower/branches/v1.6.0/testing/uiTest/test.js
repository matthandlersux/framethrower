var cell;

function initialize() {
	//cell = evaluate(parseExpr("Cons::lookup shared.in shared.realLife"));
	//console.log("cell state", cell.getState());
	
	//console.profile();
	
	documents.preload("testing/uiTest/main/main.xml", function () {
		bootstrap(document.body);
	});
}