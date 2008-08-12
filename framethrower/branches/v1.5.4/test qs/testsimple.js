
var mainAmbient = makeAmbient();

var sc = startCaps.unit(22);

var com = components.unit.map(function (x) {return x+2;});
var out = simpleApply(com, sc);

var ec = makeSimpleEndCap(mainAmbient, endCaps.log.unit("test 22 + 2"), out);
ec.activate();