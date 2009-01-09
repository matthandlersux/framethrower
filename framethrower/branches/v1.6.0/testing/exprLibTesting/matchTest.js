var cell = makeControlledCell("Set K.cons");
var rootObj = makeObject("K.object", {upLeft:cell});


function initialize() {
	bootstrap(document.body, {rootObj:rootObj});
}


function test1() {
	cell.control.remove(6);
	refreshScreen();
}
function test2() {
	cell.control.add(2,"new");
	refreshScreen();
}