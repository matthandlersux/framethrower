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

function typeCheck(expr, type) {
	var exprType = getType(expr);
	if (!compareTypes(exprType, type)) {
		debug.error("Expected type `"+unparseType(type)+"` but got an Expr of type `"+unparseType(exprType)+"`.");
	}
}

function makeCC(type) {
	var cell;
	var constructor = getTypeConstructor(type);

	
	// TODO test these and throw errors on erroneous calls
	if (constructor === "Unit") {
		cell = makeCell();
		cell.control = {
			set: function (k) {
				typeCheck(k, type.right);
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
				typeCheck(k, type.right);
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
				typeCheck(k, type.right);
				cell.addLine(k);
			},
			remove: function (k) {
				typeCheck(k, type.right);
				cell.removeLine(k);
			}
		};
	} else if (constructor === "Map") {
		cell = makeCellMapInput();
		cell.control = {
			add: function (k, v) {
				typeCheck(k, type.left.right);
				typeCheck(v, type.right);
				cell.addLine({key: k, val: v});
			},
			remove: function (k) {
				typeCheck(k, type.left.right);
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