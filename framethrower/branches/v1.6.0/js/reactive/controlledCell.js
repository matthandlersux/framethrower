function makeControlledCell(typeString) {
	var type = parseType(typeString);
	
	var cell;
	var lhs = type.left.value;
	
	if (lhs === "Unit" || lhs === "Set") {
		cell = makeCell();
		cell.control = {
			add: function (k) {
				cell.addLine(k);
			},
			remove: function (k) {
				cell.removeLine(k);
			}
		};
	} else if (lhs === "Assoc") {
		cell = makeCellAssocInput();
		cell.control = {
			add: function (k, v) {
				cell.addLine({key: k, value: v});
			},
			remove: function (k) {
				cell.removeLine(k);
			}
		};
	} else {
		console.error("Cannot make a cell of type: " + typeString);
	}
	
	cell.type = type;
	
	return cell;
}