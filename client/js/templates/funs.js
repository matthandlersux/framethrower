

// takes a function and returns a function that takes the same arguments but all as Unit's and returns its value (of type outputType) as a Unit.
// Then whenever all the Unit's are occupied, the output Unit is occupied. If any input is not occupied, output is not occupied.
// numArgs is optional
function mapUnitJS(f, outputType, numArgs) {
	if (numArgs === undefined) numArgs = f.length;
	return function () {
		var args = arguments;
		
		var currentValue;
		var outputCell = makeCell();
		outputCell.type = makeTypeApply(parseType("Unit"), outputType);
		
		var inputs = [];
		
		function update() {
			var allDone = all(args, function (arg, i) {
				return inputs[i] !== undefined; 
			});
			if (allDone) {
				if (currentValue !== undefined) outputCell.removeLine(currentValue);
				currentValue = f.apply(null, inputs);
				outputCell.addLine(currentValue);
			} else {
				if (currentValue !== undefined) {
					outputCell.removeLine(currentValue);
					currentValue = undefined;
				}
			}
		}
		
		forEach(args, function (arg, i) {
			arg.inject(outputCell, function (val) {
				inputs[i] = val;
				update();
				return function () {
					inputs[i] = undefined;
					update();
				};
			});
		});
		
		return outputCell;
	};
}