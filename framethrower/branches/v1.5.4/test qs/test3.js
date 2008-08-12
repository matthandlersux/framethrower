// create a little test world

var rw = makeSituation();
rw.setContent("Real World");

var sc = rw.makeIndividual();
sc.setContent("Sean Connery");

var gfmov = rw.makeSituation();
gfmov.setContent("Goldfinger");

var jb = gfmov.makeIndividual();
jb.setContent("James Bond");

var performs = rw.makeRelation();
performs.setContent("performs");

var infon0 = performs.makeInfon({performer: sc, performee: jb});
infon0.setContent("sean connery performs james bond");


var gf = gfmov.makeIndividual();
gf.setContent("Auric Goldfinger");

var oj = gfmov.makeIndividual();
oj.setContent("Odd Job");

var pg = gfmov.makeIndividual();
pg.setContent("Pussy Galore");


var kills = gfmov.makeRelation();
kills.setContent("kills");

var sleepsWith = gfmov.makeRelation();
sleepsWith.setContent("sleeps with");

var infon1 = kills.makeInfon({killer: jb, killee: gf});
infon1.setContent("james bond kills gold finger");
var infon2 = kills.makeInfon({killer: jb, killee: oj});
infon2.setContent("james bond kills odd job");
var infon3 = sleepsWith.makeInfon({lover1: jb, lover2: pg});
infon3.setContent("james bond sleeps with pussy galore");


// run some tests

var mainAmbient = makeAmbient();

var sc = startCaps.unit(jb);

/*
var jbflat = simpleApply(queryComponent("content"), sc);

var ec = makeSimpleEndCap(mainAmbient, endCaps.log.unit("jb content"), jbflat);

ec.activate();



var testxml = loadXMLNow("testxml/testxsl.xml");
var xslcom = customCom.xsl(testxml);

var sc2 = startCaps.unit({p: "test"});

var proc = simpleApply(xslcom, sc2);

var ec2 = makeSimpleEndCap(mainAmbient, endCaps.log.unit("test processing"), proc);
ec2.activate();*/


/*var testquery = loadXMLNow("testxml/testquery.xml");

var out = derive(testquery, {start: startCaps.unit(jb), rel: startCaps.unit(kills)});

var ec = makeSimpleEndCap(mainAmbient, endCaps.log.set("test query"), out);
ec.activate();*/



var testcustom = loadXMLNow("xml/testcustom.xml");

var out = applyCustom(testcustom, {start: startCaps.unit(jb), rel: startCaps.unit(kills)});

var ec = makeSimpleEndCap(mainAmbient, endCaps.log.unit("test custom"), out.output);
ec.activate();

var ec2 = makeSimpleEndCap(mainAmbient, endCaps.log.unit("test custom ids"), out.ids);
ec2.activate();