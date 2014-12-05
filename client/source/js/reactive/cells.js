//Cell Common Interface (more detail inline with code)
//Creation:
//  makeCell()        cell for Unit and Set
//  makeCellMap()    cell for Map
//Hooking Up:
//  cell.inject(depender, f)      depender is (cell to be informed when done OR function to be called when done).
//  cell.injectDependency(depender)    depender is (cell to be informed when done OR function to be called when done).
//  cell.leash()            cell won't be done until unleash is called
//   cell.unleash()
//Controlling:
//  cell.addLine()
//  cell.removeLine()

function graphCells() {
  console.log("digraph {");
  var connectedCells = {};
  forEach(CELLS, function(c) {
    forEach(c.getFuncs(), function(f) {
      if(f.depender.id) {
        console.log(c.id+" -> "+f.depender.id);
        connectedCells[c.id] = c;
        connectedCells[f.depender.id] = f.depender;
      }
    });
  });
  forEach(connectedCells, function(c) {
    console.log(c.id+' [tooltip="'+c.name+'"]');
  });
  console.log("}");
}

var CELLS = {};
var CELLCOUNT = 0;
var CELLSCREATED = 0;


function addUnitOnlyFunctions(cell, dots, funcs) {
  cell.addDot = function(key, dot) {
    var current = dots.getCurrent();

    // remove the current state, only 'undoing' its output for functions without 'gentleRemove'
    if(current !== undefined) {
      forEach(funcs, function (func, id) {
        if (!func.gentleRemove) {
          undoFunOnDot(current, id);
        }
      });
    }

    dots.set(key, dot);
  }

  cell.makeSorted = function() {};
  cell.addSameDot = function() {};
  cell.getDotToRemove = function () {
    return dots.getCurrent();
  }
}

function addSetMapOnlyFunctions(cell, dots) {
  cell.addDot = function (key, dot) {
    dots.set(key, dot);
  }

  cell.addSameDot = function (dot) {
    dot.num++;
  }

  cell.getDotToRemove = function (key) {
    return dots.get(key);
  }

  //pull through some range related functions from rangedSet to be used by some primFuncs (TODO: refactor)
  cell.makeSorted = function () {
    dots.makeSorted();
    cell.getIndex = function (key) {
      return dots.getIndex(key);
    };

    cell.getNearestIndexRight = function (key) {
      return dots.getNearestIndexRight(key);
    };

    cell.getNearestIndexLeft = function (key) {
      return dots.getNearestIndexLeft(key);
    };

    cell.getByIndex = function (index) {
      return dots.getByIndex(index);
    };

    cell.getKeyByIndex = function (index) {
      return dots.getKeyByIndex(index);
    };
  };
}

function makeBaseCell (toKey, dots, funcs) {
  CELLCOUNT++;
  CELLSCREATED++;
  var cell = makeStartCap();
  cell.id = CELLSCREATED;
  CELLS[cell.id] = cell;

  //dependencies are stored as a hash from (string,number) to true
  //the (string,number) is usually (cell name, id of the function within that cell that informs this cell)
  //but can also be (leash, 1) for the special case of the leash function
  var dependencies = {};
  var onRemoves = []; //onRemoves is a list of functions to call when this cell is destroyed
  var funcColor = 0; //counter for coloring injected functions
  var isDone = true;

  //temp debug functions

  //GetState for DEBUG (and for convertExprXML.js)
  cell.getState = function () {
    return map(dots.toArray(), function (x) {return x.v.val;});
  };

  cell.getDependencies = function() {
    return dependencies;
  };

  cell.getLength = function () {
    return dots.getLength();
  };

  //========================================
  // Hook-up Functions
  //========================================

  // ----------------------------------------------------------------------
  //  Function: inject
  //  Purpose: Injects a function to be run on all dots in the cell, and a depender to inform when the cell is done
  //        If the depender is a cell, this also injects on onRemove into depender to inform this cell when depender dies
  //  Args: Depender is cell | function (use an empty function if there is no dependency behavior))
  //      f is the function being injected
  //      initializeRange is an optional function to be run on the rangedView after it is created (to set the range)
  //      gentleRemove is an optional boolean flag, if true for Units, undo functions will not be called when setting a new value
  //  Returns: An object {rView: rangedView, unInject: function to remove this injected function}
  // ----------------------------------------------------------------------
  //if cell is of type Unit a or Set a, f is a function that takes one argument key::a
  //if cell is of type Map a b, f is a function that takes one javascript object: {key::a, val::b}
  //f(k) or f({key=k,val=v}) returns a callback function that will be called when k is removed from the Unit/Set/Map
  cell.inject = function (depender, f, initializeRange, gentleRemove) {
    var id = funcColor++;
    if (depender.addDependency) {
      depender.addDependency(cell, id);
    }
    var addFirstLine = function (dot) {
      runFunOnDot(dot, f, id);
    };
    var removeLastLine = function (dot) {
      undoFunOnDot(dot, id);
    };

    var rView = makeRangedView(addFirstLine, removeLastLine, dots);
    if (initializeRange !== undefined) {
      initializeRange(rView);
    }
    funcs[id] = {func:f, depender:depender, rView:rView, gentleRemove:gentleRemove};
    if (f !== undefined) {
      rView.forRange(function (dot, key) {
        if(dot.num > 0) {
          runFunOnDot(dot, f, id);
        }
      });
    }

    if (isDone) {
      informDepender(depender, cell, id);
    }

    //return callback to remove the injected function
    var unInject = function () {
      if (funcs[id] !== undefined) {
        var depender = funcs[id].depender;
        if (depender.done !== undefined) {
          depender.done(cell, id);
        }
        funcs[id].rView.forRange(function (dot, key) {
          undoFunOnDot(dot, id);
        });
        delete funcs[id];
        if (isEmpty(funcs) && !cell.persist) {
          // console.log("removing a cell");
          CELLCOUNT--;
          delete CELLS[cell.id];
          forEach(onRemoves, function(onRemove) {
            onRemove();
          });
        }
      }
    };

    if (depender.addOnRemove !== undefined) {
      depender.addOnRemove(unInject);
    }

    return {
      unInject:unInject,
      rView:rView
    };
  };

  // ----------------------------------------------------------------------
  //  Function: injectDependency
  //  Purpose: Set up the same dependency behavior as with inject, but not tied to any injected function
  //  Args: Depender is cell | function
  //  Returns: An object {rView: rangedView, unInject: function to remove this dependency}
  // ----------------------------------------------------------------------
  cell.injectDependency = function (depender) {
    return cell.inject(depender, function(){});
  };

  //Prevents the cell from being 'done' until unleash is called
  //Useful when injecting multiple functions into a cell
  cell.leash = function() {
    cell.addDependency("leash", 1);
  };

  //Allows a cell that leash was called on to be 'done'
  cell.unleash = function() {
    cell.done("leash", 1);
  };

  //Add a function to the cell to be called when the cell is destroyed
  //This is only being used by memoize, not a normal part of cell functionality
  cell.addOnRemove = function (onRemove) {
    onRemoves.push(onRemove);
  };



  //========================================
  // Control Functions
  //========================================

  //add a line to an element of the cell
  //if this element is not currently in the cell, it will be added
  cell.addLine = function (value) {
    var key = toKey(value);
    var dot = dots.get(key);
    if (dot !== undefined && dot.num != 0) {
      cell.addSameDot(dot);
    } else {
      dot = {val:value, num:1, lines:{}};
      cell.addDot(key, dot);
      forEach(funcs, function (func, id) {
        if (func.rView.inRange(key)) {
          runFunOnDot(dot, func.func, id);
        }
      });
    }
  };

  //remove a line from an element of the cell
  //if this was the last line going to this element, it will be removed from the cell
  cell.removeLine = function (key) {
    var dot = cell.getDotToRemove(key);
    if(dot != undefined) {
      dot.num--;
      if(dot.num == 0) {
        dots.remove(key);
        forEach(funcs, function (func, id) {
          if (func.rView.inRange(key)) {
            undoFunOnDot(dot, id);
          }
        });
      }
    }
  };

  //==================================
  // Inter-Cell Functions
  //==================================

  //tells a cell that one of its dependencies is done
  //dependencies are stored by cell name and the id of the function within that cell
  cell.done = function (doneCell, id) {
    if(doneCell.name !== undefined) {
      delete dependencies[doneCell.name + "," + id];
    } else {
      delete dependencies[doneCell + "," + id];
    }
    checkDone();
  };

  //tells a cell that it cannot be 'done' until cell.done(depCell, id) is called
  cell.addDependency = function (depCell, id) {
    isDone = false;
    if(depCell.name !== undefined) {
      dependencies[depCell.name + "," + id] = true;
    } else {
      dependencies[depCell + "," + id] = true;
    }
  };

  //==================================
  // Internal Functions
  //==================================

  function informDepender(depender, cell, funcId) {
    if (depender.done) {
      depender.done(cell, funcId);
    } else {
      //depender is a function
      depender();
    }
  }

  function checkDone() {
    if (isEmpty(dependencies)) {
      isDone = true;
      forEach(funcs, function(func, funcId) {
        informDepender(func.depender, cell, funcId);
      });
    }
  };


  return cell;
}

function undoFunOnDot (dot, id) {
  if (dot !== undefined) {
    var removeFunc = dot.lines[id];
    if (removeFunc) {
      removeFunc();
    }
    delete dot.lines[id];
  }
};

function runFunOnDot (dot, func, id) {
  var value = dot.val;
  var onRemove = func(value);
  if (onRemove !== undefined) {
    dot.lines[id] = onRemove;
  }
};


function makeCellUnit() {
  var toKey = function (value) {
    return value;
  };
  var dots = makeUnitHash();
  var funcs = {};
  var cell = makeBaseCell(toKey, dots, funcs);
  cell.isMap = false;
  addUnitOnlyFunctions(cell, dots, funcs);
  return cell;
}

function makeCellSet() {
  var toKey = function (value) {
    return value;
  };

  var dots = makeConSortedSetStringify();
  var cell = makeBaseCell(toKey, dots, {});
  addSetMapOnlyFunctions(cell, dots);

  cell.isMap = false;
  return cell;
}

function makeCellMap() {
  var toKey = function (value) {
    return value.key;
  };

  var dots = makeConSortedSetStringify();
  var funcs = {};
  var cell = makeBaseCell(toKey, dots, {});
  addSetMapOnlyFunctions(cell, dots);

  cell.isMap = true;
  return cell;
}