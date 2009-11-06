(function () {
	
	/*
	uses cell.getState() recursively to generate a string representation for the cell
	*/
	function convertStateToString(cell) {
		var lit = unparseLiteral(cell);
		if (lit !== undefined) {
			if (typeOf(cell) === "string") return cell;
			else return lit;
		} else {
			if (cell.kind === "cell") {
				
				cell.makeSorted();
				var state = cell.getState();
				
				if (cell.isMap) {
					var ret = [];
					forEach(state, function (entry) {
						ret.push(convertStateToString(entry.key) + ": " + convertStateToString(entry.val));
					});
					return "{" + ret.join(", ") + "}";
				} else if (state.length === 0) return "";
				else if (state.length === 1) return convertStateToString(state[0]);
				else {
					var ret = [];
					forEach(state, function (entry) {
						ret.push(convertStateToString(entry));
					});
					return "[" + ret.join(", ") + "]";
				}
			} else {
				//console.log("stringifying (shouldn't need to?)", cell);
				return stringify(cell);
			}
		}
	}


	/*
	uses cell.getState() recursively to generate a JSON-ish representation for the cell
		Units and Sets turn into arrays [],
		Maps turn into arrays of {key: --, value: --}
	*/
	function convertStateToJSON(cell) {
		if (cell.kind === "cell") {
			cell.makeSorted();
			var state = cell.getState();

			if (!cell.isMap) {
				var ret = [];
				forEach(state, function (entry) {
					ret.push(convertStateToJSON(entry));
				});
				return ret;
			} else {
				var ret = [];
				forEach(state, function (entry) {
					ret.push({key: convertStateToJSON(entry.key), value: convertStateToJSON(entry.val)});
				});
				return ret;
			}
		} else if (cell.kind === "tuple2") {
			return {kind: "tuple2", asArray: map(cell.asArray, convertStateToJSON)};
		} else if (cell.kind === "list") {
			// TODO
		} else {
			return cell;
		}
	}


	/*
	Sets up cell so that whenever cell is updated, or whenever one of its children cells is updated, callback gets called
	Returns a function to remove this behavior.
	*/
	function callOnUpdate(cell, depender, callback) {
		function listenToCell(c) {
			// TODO: at some point we need to do a total audit on whether things get removed correctly w.r.t. cells and injected functions

			// TODO: not sure how depender works...

			// returns a function to stop listening to the cell
			//c = evaluate(c);

			setTimeout(session.flush,0);

			var childRemovers = [];

			var injectedFunc = c.inject(depender, function (x) {
				callback();
				if (x && x.key !== undefined && x.val !== undefined) {
					// we have a Map entry
					var entryNums = [];

					if (x.key.kind === "cell") {
						var keyRemover = listenToCell(x.key);
						entryNums.push(childRemovers.length);
						childRemovers.push(keyRemover);
					}
					if (x.val.kind === "cell") {
						var valRemover = listenToCell(x.val);
						entryNums.push(childRemovers.length);
						childRemovers.push(valRemover);
					}
					return function () {
						callback();
						forEach(entryNums, function (entryNum) {
							childRemovers[entryNum]();
							childRemovers[entryNum] = null;
						});
					};
				} else {
					var entryNum;
					if (x.kind === "cell") {
						entryNum = childRemovers.length;
						childRemovers.push(listenToCell(x));
					}
					return function () {
						callback();
						if (entryNum) {
							childRemovers[entryNum]();
							childRemovers[entryNum] = null;
						}
					};
				}
			});
			var removeFunc = injectedFunc.unInject;
			return function () {
				forEach(childRemovers, function (childRemover) {
					if (childRemover) childRemover();
				});
				removeFunc.func();
			};
		}

		return listenToCell(cell);
	}


	function convertHelper(converter) {
		return function (cell) {
			var outputCell = makeControlledCell("Unit String");

			var called = false;
			function callback() {
				called = true;
				var s = converter(cell);
				outputCell.control.add(s);
			}

			callOnUpdate(cell, outputCell, callback);
			if (!called) callback(); // so that it's at least called once

			return outputCell;	
		};
	}


	addFun("serialize", "a -> Unit String", convertHelper(convertStateToString), undefined, remote.localOnly);

	addFun("jsonify", "a -> Unit JSON", function (cell) {
		var outputCell = makeControlledCell("Unit JSON");

		callOnUpdate(cell, outputCell, function () {
			var s = convertStateToJSON(cell);
			outputCell.control.add(s);
		});

		return outputCell;	
	}, undefined, remote.localOnly);
	
	
})();