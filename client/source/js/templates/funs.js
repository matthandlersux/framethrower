

// takes a function and returns a function that takes the same arguments but all as Unit's and returns its value (of type outputType) as a Unit.
// Then whenever all the Unit's are occupied, the output Unit is occupied. If any input is not occupied, output is not occupied.
// numArgs is optional
function mapUnitJS(f, outputType, numArgs) {
  if (numArgs === undefined) numArgs = f.length;
  return function () {
    var args = arguments;

    var outputCell = makeCellUnit();
    outputCell.type = makeTypeApply(parseType("Unit"), outputType);

    var inputs = [];

    function update() {
      var allDone = all(args, function (arg, i) {
        return inputs[i] !== undefined;
      });
      if (allDone) {
        outputCell.addLine(f.apply(null, inputs));
      }
    }

    forEach(args, function (arg, i) {
      arg.inject(outputCell, function (val) {
        inputs[i] = val;
        update();
        return function () {
          inputs[i] = undefined;
          outputCell.removeLine();
        };
      }, undefined, true);
    });

    if (numArgs === 0) {
      update(); // for mapUnit0
    }

    return outputCell;
  };
}

// // takes a predicate (function that returns a bool), and returns a function that takes the same arguments but all as Unit's and returns type Unit Null.
// // Then whenever all the Unit's are occupied, and the predicate is true, the output Unit is occupied. Otherwise, the output is not occupied.
// // numArgs is optional
// function (pred, numArgs) {
//   if (numArgs === undefined) pred = f.length;
//   return function () {
//     var args = arguments;
//
//     var currentValue = false;
//     var outputCell = makeCellUnit();
//     outputCell.type = parseType("Unit Null");
//
//     var inputs = [];
//
//     function update() {
//       var allDone = all(args, function (arg, i) {
//         return inputs[i] !== undefined;
//       });
//       if (allDone) {
//         var newValue = f.apply(null, inputs);
//         if (currentValue !== newValue) {
//           currentValue = newValue;
//           if (currentValue) {
//             outputCell.addLine(nullObject);
//           } else {
//             outputCell.removeLine(nullObject);
//           }
//         }
//       }
//     }
//
//     forEach(args, function (arg, i) {
//       arg.inject(outputCell, function (val) {
//         inputs[i] = val;
//         update();
//         return function () {
//           inputs[i] = undefined;
//           update();
//         };
//       });
//     });
//
//     if (numArgs === 0) {
//       update(); // for mapUnit0
//     }
//
//     return outputCell;
//   };
// }



function arrayToSet(array, type) {
  var outputCell = makeCellSet();
  outputCell.type = makeTypeApply(parseType("Set"), type);
  forEach(array, function(element) {
    outputCell.addLine(element);
  });
  return outputCell;
}


function arrayToList(array, type) {
  return makeList(array);
}

function makeApplyWith() {
  var ret = arguments[0];
  forEach(arguments, function (arg, i) {
    if (i > 0) {
      ret = makeApply(ret, arg);
    }
  });
  return ret;
}