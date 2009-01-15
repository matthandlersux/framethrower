function makeControlledCell(typeString) {
	var type = parseType(typeString);
	return makeCC(type);
}

function makeFuture(value) {
	var type = getType(value);
	var cell = makeCC(makeTypeApply(makeTypeName("Future"), type));
	cell.control.add(value);
	return cell;
}

function makeCC(type) {
	var cell;
	var constructor = getTypeConstructor(type);

	
	// TODO test these and throw errors on erroneous calls
	if (constructor === "Unit") {
		cell = makeCell();
		cell.control = {
			set: function (k) {
				var state = cell.getState();
				if (state.length === 0) {
					cell.addLine(k);
				} else {
					cell.removeLine(state[0]);
					cell.addLine(k);
				}
			},
			unset: function () {
				var state = cell.getState();
				if (state.length === 0) {
					
				} else {
					cell.removeLine(state[0]);
				}
			}
		};
		cell.control.add = cell.control.set;
		cell.control.remove = cell.control.unset;
	} else if (constructor === "Future") {
		cell = makeCell();
		cell.control = {
			add: function (k) {
				cell.addLine(k);
				cell.control.add = function () {
					debug.error("Future already set.");
				};
			}
		};		
	} else if (constructor === "Set") {
		cell = makeCell();
		cell.control = {
			add: function (k) {
				cell.addLine(k);
			},
			remove: function (k) {
				cell.removeLine(k);
			}
		};
	} else if (constructor === "Map") {
		cell = makeCellMapInput();
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
	cell.persist = true;
	
	return cell;
}