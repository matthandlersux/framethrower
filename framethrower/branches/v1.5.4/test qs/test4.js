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

window.addEventListener("load", function () {
	processThunk(mainAmbient, document.body.firstChild, {"predefined.realWorld": rw});
}, false);


