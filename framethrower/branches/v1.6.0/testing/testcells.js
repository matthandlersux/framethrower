var type = parseType("Map Number (Set String)");
var cell = makeCell();
cell.type = type;



lookupTable['cell'] = cell;

var othercells = [];
othercells[0] = makeCell();
othercells[1] = makeCell();
othercells[2] = makeCell();

othercells[0].addLine("andrew");
othercells[1].addLine("matt");
othercells[2].addLine("toby");
othercells[2].addLine("andrew");

cell.addLine(0, othercells[0]);
cell.addLine(1, othercells[1]);
cell.addLine(2, othercells[2]);

var cell2 = evaluate(parseExpr("invert cell"));

//othercells[2].removeLine("andrew");

console.dir(cell2.getState());