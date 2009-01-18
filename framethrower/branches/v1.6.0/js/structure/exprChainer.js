
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
		"Future": 1,
		"Unit": 2,
		"Set": 3
	};



	var compose = parseExpr("compose");

	function makeCompose(f, g) {
		return makeApply(makeApply(compose, f), g);
	}

	var returnFuture = parseExpr("returnFuture");
	var returnUnit = parseExpr("returnUnit");
	var returnSet = parseExpr("compose returnUnitSet returnUnit");
	var returnFutureUnit = parseExpr("returnFutureUnit");
	var returnFutureSet = parseExpr("compose returnUnitSet returnFutureUnit");
	var returnUnitSet = parseExpr("returnUnitSet");

	var convertStartConstructor = [
		[null, returnFuture, returnUnit, returnSet],
		[null, null, returnFutureUnit, returnFutureSet],
		[null, null, null, returnUnitSet]
	];


	var bindFuture = parseExpr("bindFuture");
	var bindUnit = parseExpr("bindUnit");
	var bindSet = parseExpr("bindSet");
	var bindUnitSet = parseExpr("f -> bindSet (compose f returnUnit)");
	var bindFutureUnit = parseExpr("f -> bindUnit (compose f returnFuture)");
	var bindFutureSet = parseExpr("f -> bindSet (compose f returnFuture)");

	var convertFunConstructor = [
		[null, bindFuture, bindUnit, bindSet],
		[null, null, bindFutureUnit, bindFutureSet],
		[null, null, null, bindUnitSet]
	];



	function getNext(startType, expr) {
		var start = getCandC(startType);
		var input = getCandC(getType(expr).left);
	
		var startClass = start.className;
		var inputClass = input.className;
	
		if (startClass === inputClass) {
			return convertConstructor(startType, expr);
		} else if (objects.inherits(startClass, inputClass) || objects.inherits(inputClass, startClass)) {
			var classT = convertConstructor(startType, parseExpr(startClass+"~"+inputClass));
			var newType = getType(classT).right;
			var constructorT = convertConstructor(newType, expr);
			return makeCompose(constructorT, classT);
		} else {
			debug.error("Cannot convert between classes `"+startClass+"` and `"+inputClass+"`.");
		}
	}

	function convertConstructor(startType, expr) {
		var start = getCandC(startType);
		var input = getCandC(getType(expr).left);
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
		chain: function (startType, exprs) {
			var myVar = makeVar("x");
			var ret = myVar;
			forEach(exprs, function (expr) {
				var f = getNext(startType, expr);
				ret = makeApply(f, ret);
				startType = getType(f).right;
			});
			return makeLambda(myVar, ret);
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
