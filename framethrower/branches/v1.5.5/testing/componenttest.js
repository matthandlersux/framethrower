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


startCaps.controllableSet = memoize(function (set) {
	var controller = {};
	var type = getSuperType(set);
	var sc = makeSimpleStartCap(interfaces.set(type), controller);
	forEach(set, function (arg) {
		controller.add(arg);
	});
	return {sc:sc, controller:controller};
});



var controlSet = startCaps.controllableSet([sc, jb, gfmov, rose]);
var customset = controlSet.sc;

var controller = controlSet.controller;


// this is all we need to get started
var mainAmbient = makeAmbient();
processAllThunks(mainAmbient, document.getElementById("html_mainscreen"), {rw: rw, customset: customset}, "");


//load a transaction thunk xml

var transPerforms = loadXMLNow(ROOTDIR + 'testing/xml/toplevelperforms.xml');

processAllPerforms(mainAmbient, transPerforms, {rw:rw, rose:rose, gfmov:gfmov, sc:sc}, {}, "testing/xml/toplevelperforms.xml");



// run some tests

/*
var mainAmbient = makeAmbient();

var treecom = components.treeify(basic.fun(interfaces.set(kernel.ob), interfaces.tree(kernel.ob)), "parentSituation");


var customSet = startCaps.set([rw, jb, sc, gfmov, rose]);

var sa2 = simpleApply(treecom, customSet);

var ec = makeSimpleEndCap(mainAmbient, endCaps.log.tree("testTree"), sa2);
ec.activate();

*/