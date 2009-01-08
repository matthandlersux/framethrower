var cell = makeControlledCell("Map Number String");

cell.control.add(7, "hello");
cell.control.add(6, "goodbye");

function testInjection() {
	return testInjection;
}

cell.injectFunc(testInjection);

cell.getState();

cell.control.add(2, "new");