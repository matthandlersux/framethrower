// create a little test world

var rw = actions.makeSituation();
rw.control.content.set("Real World");

var sc = actions.makeIndividual(rw);
sc.control.content.set("Sean Connery");

var gfmov = actions.makeSituation(rw);
gfmov.control.content.set("Goldfinger");

var jb = actions.makeIndividual(gfmov);
jb.control.content.set("James Bond");

var performs = actions.makeRelation(rw);
performs.control.content.set("Performs");


var tmov = actions.makeSituation(rw);
tmov.control.content.set("Titanic");

var rose = actions.makeIndividual(tmov);
rose.control.content.set("Rose");


// some tests

var mainAmbient = makeAmbient();




var custComTest = documents.get("testing/xml/printsituation.xml");
var custComTestOut = custComTest({focus: startCaps.unit(rw)});

domEndCap(mainAmbient, custComTestOut.output, document.getElementById("html_mainscreen"), "testing/xml/printsituation.xml");

//var ec4 = makeSimpleEndCap(mainAmbient, endCaps.log.unit("custCom Test"), custComTestOut.output);



// infon test

var inftest = actions.makeInfon(rw, performs, {performer: sc, performee: jb});