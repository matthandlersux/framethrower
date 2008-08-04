// create a little test world

var rw = makeSituation();
rw.setContent("Real World");

var sc = rw.makeIndividual();
sc.setContent("Sean Connery");

var gf = rw.makeSituation();
gf.setContent("Goldfinger");

var jb = gf.makeIndividual();
jb.setContent("James Bond");

var performs = rw.makeRelation();
performs.setContent("performs");

performs.makeInfon({performer: sc, performee: jb});


// run some tests

var mainAmbient = makeAmbient();

var jbset = startCaps.set(jb);

var qconcom = queryComponent("involves");

var cont = simpleApply(qconcom, jbset);

var ec = makeSimpleEndCap(mainAmbient, endCaps.log.set, cont);
ec.activate();