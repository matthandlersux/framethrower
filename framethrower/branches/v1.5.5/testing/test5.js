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
performs.control.content.set(parseXML('<pseudo><role role="performer" /> performs <role role="performee" /></pseudo>'));

var tmov = actions.makeSituation(rw);
tmov.control.content.set("Titanic");


var inftest = actions.makeInfon(rw, performs, {performer: sc, performee: jb});



var mainAmbient = makeAmbient();

var xml = convertPinToXML(inftest.get.arcs());

var ec2 = makeSimpleEndCap(mainAmbient, endCaps.log.unit("xml output"), xml);


var rep = xml.getState();

var paramSim = document.createElementNS("", "with-param");
appendCopy(paramSim, rep.xml);

var pin = convertXMLToPin(paramSim, rep.ids, {});

console.log(pin.getState());