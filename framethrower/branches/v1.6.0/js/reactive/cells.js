function makeBaseCell () {
	var cell = {kind: "startCap"};
	cell.funcs = makeObjectHash();
	cell.contFuncs = makeObjectHash();
	cell.inputLines = makeObjectHash(); // keeps a map from keys to values and a count of how many input lines are going to the key
	cell.outputLines = {}; // keeps a mapping from func id to hashes of key to output value
	
	cell.UpdateLines = function (lineResponse, fun, id) {
		cell.inputLines.forEach(function (keyVal, key) {
			if(keyVal.num > 0) {
				lineResponse(keyVal.val, fun, id);
			}
		});
	};

	cell.injectFunc = function (id, outputCell, f, returnsPairs) {
		if (returnsPairs == undefined) returnsPairs = false;
		var fun = {func:f, outputCell:outputCell, returnsPairs:returnsPairs};
		cell.funcs.set(id, fun);
		cell.outputLines[id] = makeObjectHash();
		cell.UpdateLines(cell.addLineResponse, fun, id);
	};
	
	cell.injectContFunc = function (id, f) {
		var fun = {func:f, innerId:'inner' + id};
		cell.contFuncs.set(id, fun);
		cell.outputLines[id] = makeObjectHash();
		cell.UpdateLines(cell.addContLineResponse, fun, id);
	};
	
	cell.removeFun = function (id) {
		var fun = cell.funcs.get(id);
		cell.funcs.remove(id);
		cell.inputLines.forEach(function (keyVal, key) {
			cell.removeLineResponse(key, fun, id);
		});
	};

	cell.removeContFun = function (id) {
		var fun = cell.contFuncs.get(id);
		cell.contFuncs.remove(id);
		cell.inputLines.forEach(function (keyVal, key) {
			cell.removeContLineResponse(key, fun, id);
		});
	};

	//GetState for DEBUG
	cell.getState = function () {
		return cell.inputLines.toArray();
	};
	
	cell.remove = function (hash, key) {
		hash.remove(key);
	};

	cell.addNewLine = function (value) {
		cell.set(cell.inputLines, value, 1);			
		cell.funcs.forEach(function (func, id) {
			cell.addLineResponse(value, func, id);
		});
		cell.contFuncs.forEach(function (func, id) {
			cell.addContLineResponse(value, func, id);
		});
	};

	cell.addLine = function (value) {
		var keyVal = cell.get(cell.inputLines, value);
		if (keyVal !== undefined && keyVal.num != 0) {
			keyVal.num++;
		} else {
			cell.addNewLine(value);
		}
	};
	
	cell.removeLastLine = function (key) {
		cell.remove(cell.inputLines, key);
		cell.funcs.forEach(function (func, id) {
			cell.removeLineResponse(key, func, id);
		});
		cell.contFuncs.forEach(function (func, id) {
			cell.removeContLineResponse(key, func, id);
		});
	};
	
	cell.removeLine = function (key) {
		var value = cell.inputLines.get(key);
		if(value !== undefined) {
			value.num--;
			if(value.num == 0) {
				cell.removeLastLine(key);
			}
		}
	};
	
	cell.removeLineResponse = function (key, func, id) {
		var result = cell.outputLines[id].get(key);
		if (result != undefined) {
			if (func.returnsPairs) {
				func.outputCell.removeLine(result.key);
			} else {
				func.outputCell.removeLine(result);
			}
			cell.outputLines[id].remove(key);
		}
	};
	
	cell.removeContLineResponse = function (key, func, id) {
		var result = cell.outputLines[id].get(key);
		if (result != undefined) {
			cell.outputLines[id].remove(key);
			// if func is a contFunc, pass remove message to inner cell
			result.removeFun(func.innerId);
		}
	};
	
	cell.injectCustomRemoveLineResponse = function (id, f) {
		var oldRemoveLineResponse = cell.removeLineResponse;
		cell.removeLineResponse = function (key, func, innerId) {
			if (id == innerId) {
				f(key, func, innerId);
			} else {
				oldRemoveLineResponse(key, func, innerId);
			}
		};
	};

	return cell;
}

function makeCell () {
	var cell = makeBaseCell();
	
	cell.set = function (hash, value, num) {
		hash.set(value, {val:value, num:num});
	};
	
	cell.get = function (hash, value) {
		return hash.get(value);
	};
	
	cell.addLineResponse = function (value, func, id) {
		var result = func.func(value);
		if (result != undefined) {
			func.outputCell.addLine(result);
			cell.outputLines[id].set(value, result);
		}
	};
	
	cell.addContLineResponse = function (value, func, id) {
		var result = func.func(value, func.innerId);
		if (result != undefined) {
			cell.outputLines[id].set(value, result);
		}
	};
	
	return cell;
}

function makeCellCountNegatives () {
	var cell = makeCell();
	cell.remove = function (){};
	
	cell.removeLine = function (key) {
		var value = cell.inputLines.get(key);
		if(value !== undefined) {
			value.num--;
			if(value.num == 0) {
				cell.removeLastLine(key);
			}
		} else {
			cell.set(cell.inputLines, key, -1);
		}
	};
	
	return cell;
}

function makeCellWithDefault () {
	var cell = makeCell();
	var usingDefault = false;
	
	cell.setDefault = function (defaultVal) {
		cell.defaultVal = defaultVal;
		if(cell.inputLines.isEmpty()) {
			cell.addLine(cell.defaultVal);
			usingDefault = true;
		}
	};
	
	cell.addLine = function (value) {
		var keyVal = cell.inputLines.get(key);
		if (keyVal !== undefined) {
			keyVal.num++;
		} else {
			if (usingDefault) {
				cell.removeLine (cell.defaultVal);
				usingDefault = false;
			}
			cell.addNewLine(value);
		}
	};
	
	cell.removeLine = function (key) {
		var value = cell.inputLines.get(key);
		if(value !== undefined) {
			if(value.num == 1) {
				cell.removeLastLine(key);
				if(cell.defaultVal != undefined && cell.inputLines.isEmpty() && !usingDefault) {
					cell.addLine(cell.defaultVal);
					usingDefault = true;
				}
			} else {
				value.num--;
			}
		}
	};
	
	return cell;
}

function makeCellAssocInput () {
	var cell = makeBaseCell();
	
	cell.set = function (hash, value, num) {
		hash.set(value.key, {val:value, num:num});
	};
	
	cell.get = function (hash, keyVal) {
		return hash.get(keyVal.key);
	};
	
	cell.addLineResponse = function (keyVal, func, id) {
		var result = func.func(keyVal);		
		if (result != undefined) {
			func.outputCell.addLine(result);
			cell.outputLines[id].set(keyVal.key, result);
		}
	};
	
	cell.addContLineResponse = function (keyVal, func, id) {
		var result = func.func(keyVal, func.innerId);
		if (result != undefined) {
			cell.outputLines[id].set(keyVal.key, result);
		}
	};
	
	return cell;
}

function makeCellWithDuplicateKeys () {
	var cell = makeCellAssocInput();
	var secFuncs = makeObjectHash();
	
	cell.UpdateLines = function (lineResponse, fun, id) {
		cell.inputLines.forEach(function (keyVal, key) {
			lineResponse(keyVal.val[0], fun, id);
		});
	};
	
	cell.injectSecFunc = function (primFuncId, id, f, returnsPairs) {
		if (returnsPairs == undefined) returnsPairs = false;
		var fun = {func:f, primFuncId:primFuncId, returnsPairs:returnsPairs};
		secFuncs.set(id, fun);
		cell.outputLines[id] = makeObjectHash();
		cell.inputLines.forEach(function (keyVal, key) {
			cell.outputLines[id].set(key, []);
			forEach(keyVal.val, function(val) {
				cell.addSecLineResponse({key:key, val:val}, fun, id);
			});
		});
	};
	
	cell.removeSecFunc = function () {
		
	};
	
	cell.addSecLineResponse = function (keyVal, func, id) {
		value = keyVal.val;
		var result = func.func(value);
		
		if (result != undefined) {
			var outCell = cell.outputLines[func.primFuncId].get(keyVal.key);
			if(cell.funcs.get(func.primFuncId).returnsPairs) {
				outCell.val.addLine(result);
			} else {
				outCell.addLine(result);
			}
			cell.outputLines[id].get(keyVal.key).push(result);
		}
	};
	
	cell.removeSecLineResponse = function () {
		
	};
	
	cell.set = function (hash, value, num) {
		hash.set(value.key, {val:[value], num:num});
	};
	
	cell.addLine = function (value) {
		var keyVal = cell.inputLines.get(value.key);
		if (keyVal !== undefined) {
			keyVal.num++;
			keyVal.val.push(value);

			secFuncs.forEach(function (func, id) {
				cell.addLineResponse({key:value.key, val:value}, func, id);
			});
		} else {
			cell.addNewLine(value);

			secFuncs.forEach(function (func, id) {
				cell.outputLines[id].set(key, []);
				cell.addSecLineResponse(value, func, id);
			});
		}
	};
	
	cell.removeLine = function (key) {
		var keyVal = cell.inputLines.get(key);
		if(keyVal !== undefined) {
			if(keyVal.num == 1) {
				cell.removeLastLine(key);
				secFuncs.forEach(function (func, id) {
					cell.removeSecLineResponse(key, func, id);
				});
			} else {
				keyVal.num--;
				secFuncs.forEach(function (func, id) {
					if (cell.funcs.get(func.primFuncId).returnsPairs) {
						cell.removeSecLineResponse(keyVal.val[keyVal.num].key, func, id);
					} else {
						cell.removeSecLineResponse(keyVal.val[keyVal.num], func, id);
					}
				});
				keyVal.val.splice(keyVal.num);
			}
		}
	};
	
	return cell;
}



function applyFunc (func, input) {
	//this will be changed...
	return evaluate(makeApply(func, input));
}