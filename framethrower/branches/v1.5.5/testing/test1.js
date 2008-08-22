// create a little test world

var rw = actions.makeSituation();
rw.control.content.set("Real World");

var sc = actions.makeIndividual(rw);
sc.control.content.set("Sean Connery");

var gfmov = actions.makeSituation(rw);
gfmov.control.content.set("Goldfinger");

var jb = actions.makeIndividual(gfmov);
jb.control.content.set("James Bond");


// run some tests

var mainAmbient = makeAmbient();



var liftf = components.lift(interfaces.unit, basic.fun(basic.js, basic.js), function (x) {return x + " asdf";});

var out = simpleApply(liftf, jb.get.content());




var ec = makeSimpleEndCap(mainAmbient, endCaps.log.unit("test query"), out);
ec.activate();