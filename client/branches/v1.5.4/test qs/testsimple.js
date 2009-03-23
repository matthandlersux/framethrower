
var mainAmbient = makeAmbient();

var sc = startCaps.unit(22);
var sc2 = startCaps.unit(23);

var com = components.unit.map(function (x) {return x+2;});
var out = simpleApply(com, sc);

var com2 = components.unit.map(function (x) {return x+2;});
var out2 = simpleApply(com2, sc);

var ec = makeSimpleEndCap(mainAmbient, endCaps.log.unit("test 22 + 2"), out);
ec.activate();

var ec2 = makeSimpleEndCap(mainAmbient, endCaps.log.unit("test 22 + 2"), out2);
ec2.activate();