//addFun("equal", "a -> a -> Bool", function (x, y) {return x === y;});
addFun("equal", "a -> a -> Bool", function (x, y) {return stringify(x) === stringify(y);});

addFun("greaterThan", "a -> a -> Bool", function (x, y) {return x > y;});
addFun("lessThan", "a -> a -> Bool", function (x, y) {return x < y;});

// boolean
addFun("not", "Bool -> Bool", function (x) {return !x;});
addFun("and", "Bool -> Bool -> Bool", function (x, y) {return x && y;});
addFun("or", "Bool -> Bool -> Bool", function (x, y) {return x || y;});

// number
addFun("plus", "Number -> Number -> Number", function (x, y) {return x + y;});
addFun("subtract", "Number -> Number -> Number", function (x, y) {return x - y;});
addFun("multiply", "Number -> Number -> Number", function (x, y) {return x * y;});
addFun("divide", "Number -> Number -> Number", function (x, y) {return x / y;});
addFun("sign", "Number -> Number", function (x) {
  if (x === 0) return 0;
  else if (x > 0) return 1;
  else return -1;
});
addFun("clamp", "Number -> Number -> Number -> Number", function (x, min, max) {
  if (x < min) return min;
  else if (x > max) return max;
  else return x;
});
addFun("clampMin", "Number -> Number -> Number", function (x, min) {
  if (x < min) return min;
  else return x;
});
addFun("clampMax", "Number -> Number -> Number", function (x, max) {
  if (x > max) return max;
  else return x;
});
addFun("round", "Number -> Number", function (x) {return Math.round(x);});