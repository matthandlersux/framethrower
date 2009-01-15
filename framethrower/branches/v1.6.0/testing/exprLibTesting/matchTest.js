var cell = makeControlledCell("Set Cons");
var rootObj = objects.make("Object", {upLeft:cell});


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