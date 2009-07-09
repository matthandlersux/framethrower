addFun("equal", "a -> a -> Bool", function (x, y) {return x === y;});

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

