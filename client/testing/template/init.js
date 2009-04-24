function initialize() {
	
}



var testCell = makeControlledCell("Set Number");

testCell.control.add(5);
testCell.control.add(2);
testCell.control.add(88);


base.add("testCell", testCell);