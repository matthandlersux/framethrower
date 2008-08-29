// create a little test world

var rw = actions.makeSituation();
rw.control.content.set("Real World");

var sc = actions.makeIndividual(rw);
sc.control.content.set("Sean Connery");

var gfmov = actions.makeSituation(rw);
gfmov.control.content.set("Goldfinger");

var jb = actions.makeIndividual(gfmov);
jb.control.content.set("James Bond");


var tmov = actions.makeSituation(rw);
tmov.control.content.set("Titanic");

var rose = actions.makeIndividual(tmov);
rose.control.content.set("Rose");


// some tests

var derivetest = loadXMLNow(ROOTDIR + "testing/xml/derivetest.xml");

console.log(derivetest);


var d = derive(derivetest, {focus: startCaps.unit(rw)});


var mainAmbient = makeAmbient();

var ec = makeSimpleEndCap(mainAmbient, endCaps.log.set("test query"), d);
ec.activate();


var combinerCom = combiner({focus: interfaces.unit(kernel.situation), childObjects: interfaces.set(kernel.ob)});

var out = combinerCom.makeApply({focus: startCaps.unit(rw), childObjects: d});

var ec2 = makeSimpleEndCap(mainAmbient, endCaps.log.unit("combiner output"), out.output);
ec2.activate();

var ec3 = makeSimpleEndCap(mainAmbient, endCaps.log.unit("combiner ids"), out.ids);
ec3.activate();




var custComTest = documents.get("testing/xml/printcontent.xml");
var custComTestOut = custComTest({focus: startCaps.unit(rw)});

var ec4 = makeSimpleEndCap(mainAmbient, endCaps.log.unit("custCom Test"), custComTestOut);
ec4.activate();