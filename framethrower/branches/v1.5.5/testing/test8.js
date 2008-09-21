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

var rose = actions.makeIndividual(tmov);
rose.control.content.set(parseXML("<html:i>Rose</html:i>"));




var mainAmbient = makeAmbient();

var controller = {};

//var scTest = makeSimpleStartCap(interfaces.set(interfaces.set(kernel.ob)), controller);
//controller.add(rw.get.childObjects());

//var scTest = makeSimpleStartCap(interfaces.assoc(kernel.ob, interfaces.set(kernel.ob)), controller);
//controller.set(rw, rw.get.childObjects());

var scTest = makeSimpleStartCap(interfaces.set(kernel.ob), controller);
controller.add(gfmov);

var groupTest = deriveGroupBy(scTest, function (x) {
	return x.get.parentSituation();
}, kernel.situation);

var xml = convertPinToXML(groupTest);

//var xml = convertPinToXML(deriveSort(rw.get.childObjects()));

//var xml = convertPinToXML(inftest.get.arcs());

//var xml = convertPinToXML(rw.get.childObjects());

var ec = makeSimpleEndCap(mainAmbient, endCaps.log.xmlids("test xml"), xml);