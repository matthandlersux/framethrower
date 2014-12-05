/*
This file is for doing the "chain"s in exprLib.
The idea is you give it a start type, an end type, and a list of functions (to be applied in order, left-to-right)
The chainer will automatically put in the correct object conversions and monadic combinators
*/
var exprChainer = (function () {

  function getCandC(type) {
    var constructor = "";
    var className = type.value;
    if (isReactive(type)) {
      constructor = type.left.value;
      className = type.right.value;
    }

    return {
      constructor: constructor,
      className: className
    };
  }


  var constructorOrd = {
    "": 0,
    "Unit": 2,
    "Set": 3
  };



  var compose = parseExpr("compose");
  var identity = parseExpr("x -> x");

  function makeCompose(f, g) {
    return makeApply(makeApply(compose, f), g);
  }

  var returnUnit = parseExpr("returnUnit");
  var returnSet = parseExpr("compose returnUnitSet returnUnit");
  var returnUnitSet = parseExpr("returnUnitSet");

  var convertStartConstructor = [
    [null, returnUnit, returnSet],
    [null, null, returnUnitSet]
  ];


  var bindUnit = parseExpr("bindUnit");
  var bindSet = parseExpr("bindSet");
  var bindUnitSet = parseExpr("f -> bindSet (compose f returnUnit)");

  var convertFunConstructor = [
    [null, bindUnit, bindSet],
    [null, null, bindUnitSet]
  ];



  function getNext(startType, expr, input) {
    var start = getCandC(startType);
    if (!input) input = getCandC(getType(expr).left);

    var startClass = start.className;
    var inputClass = input.className;

    if (startClass === inputClass) {
      return convertConstructor(startType, expr, input);
    } else if (objects.inherits(startClass, inputClass) || objects.inherits(inputClass, startClass)) {
      var classT = convertConstructor(startType, parseExpr(startClass+"~"+inputClass));
      var newType = getType(classT).right;
      var constructorT = convertConstructor(newType, expr, input);
      return makeCompose(constructorT, classT);
    } else {
      debug.error("Cannot convert between classes `"+startClass+"` and `"+inputClass+"`.");
    }
  }

  function convertConstructor(startType, expr, input) {
    var start = getCandC(startType);
    if (!input) input = getCandC(getType(expr).left);
    var output = getCandC(getType(expr).right);

    var startCons = constructorOrd[start.constructor];
    var inputCons = constructorOrd[input.constructor];
    var outputCons = constructorOrd[output.constructor];

    if (startCons < inputCons) {
      var startT = convertStartConstructor[startCons][inputCons];
      return makeCompose(expr, startT);
    } else if (startCons === inputCons) {
      return expr;
    } else if (startCons > inputCons) {
      if (startCons < outputCons) {
        var startT = convertStartConstructor[startCons][outputCons];
        var funT = convertFunConstructor[inputCons][outputCons];
        return makeCompose(makeApply(funT, expr), startT);
      } else if (startCons === outputCons) {
        var funT = convertFunConstructor[inputCons][outputCons];
        return makeApply(funT, expr);
      } else if (startCons > outputCons) {
        var afterFunT = convertStartConstructor[outputCons][startCons];
        var funT = convertFunConstructor[inputCons][startCons];
        return makeApply(funT, makeCompose(afterFunT, expr));
      }
    }
  }

  return {
    chain: function (startType, exprs, endType) {
      var myVar = makeVar(1);
      var ret = myVar;
      forEach(exprs, function (expr) {
        var f = getNext(startType, expr);
        ret = makeApply(f, ret);
        startType = getType(f).right;
      });
      if (endType) {
        var f = getNext(startType, identity, getCandC(endType));
        ret = makeApply(f, ret);
      }
      return makeLambda("x", ret);
    },
    chainOn: function (startExpr, exprs) {
      var ret = startExpr;
      var startType = getType(startExpr);
      forEach(exprs, function (expr) {
        var f = getNext(startType, expr);
        ret = makeApply(f, ret);
        startType = getType(f).right;
      });
      return ret;
    }
  };

})();
