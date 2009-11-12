function makeControlledCell(typeString, persist) {
	var type = parseType(typeString);
	return makeCC(type, persist);
}

function typeCheck(expr, type) {
	if (GLOBAL.typeCheck) {
		var exprType = getType(expr);
		if (!compareTypes(exprType, type)) {
			debug.error("Expected type `"+unparseType(type)+"` but got an Expr of type `"+unparseType(exprType)+"`.");
		}		
	}
}

function makeCC(type, persist) {
	var cell;
	var constructor = getTypeConstructor(type);
	
	// TODO: when adding an Object of the wrong type, we should cast the Object if possible instead of throwing a type error.
	// This would be consistent with how when we create Objects, we cast any Objects being used as properties

	
	// TODO test these and throw errors on erroneous calls
	if (constructor === "Unit") {
		cell = makeCellUnit();
		cell.control = {
			set: function (k) {
				try {
					cell.addLine(k);
				} catch (e) {
					console.log(cell);
					throw e;
				}
			},
			unset: function () {
				cell.removeLine();
			}
		};
		cell.control.add = cell.control.set;
		cell.control.remove = cell.control.unset;
	} else if (constructor === "Set") {
		cell = makeCellSet();
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
		cell = makeCellMap();
		cell.control = {
			add: function (k, v) {
				typeCheck(k, type.left.right);
				typeCheck(v, type.right);
				
				//TODO: make this more efficient
				var state = cell.getState();
				var length = state.length;
				for (var i = 0; i < length; i++) {
					if (state[i].key === k) {
						cell.removeLine(k);
						break;
					}
				}				
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
	if (persist !== undefined) {
		cell.persist = persist;
	} else {
		cell.persist = true;
	}
	
	cell.outsideScope = 0;
	cell.remote = remote.localOnly; // this gets overwritten if the cell isn't local
	
	return cell;
}