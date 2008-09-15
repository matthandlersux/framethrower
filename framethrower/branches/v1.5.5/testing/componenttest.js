// create a little test world
/*
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

// run some tests

var mainAmbient = makeAmbient();
*/

/*
var hasLetter = components.lift(interfaces.unit, basic.fun(basic.js, basic.js), function (x) {return x.indexOf(" ") >= 0;});
var getContent = components.lift(interfaces.unit, basic.fun(kernel.ob, interfaces.unit(basic.js)), function (x) {return x.get.content();});
var myPredCom = simpleCompose(getContent, components.collapse(interfaces.unit, interfaces.unit, basic.js), hasLetter);
var myPred = function (x) {
	return simpleApply(myPredCom, startCaps.unit(x));
}
var filterc = components.filterC(interfaces.set, kernel.ob, myPred);
*/

//var liftf = components.lift(interfaces.unit, basic.fun(basic.js, basic.js), function (x) {return x + " asdf";});

//var filtert = components.set.filterType(kernel.ob, kernel.individual);


//var out = simpleApply(filterc, rw.get.childObjects());



//var out2 = simpleApply(myPred, startCaps.unit(rw));

/*
var applyGetTest1 = applyGet(startCaps.unit(rw), "content");
var applyGetTest2 = applyGet(startCaps.unit(rw), "childObjects");

var filterCom = components.set.filterType(kernel.ob, kernel.situation);
var filtered = simpleApply(filterCom, applyGetTest2);
var applyGetTest3 = applyGet(filtered, "childObjects");

//var applyGetTest3 = applyGet(applyGetTest2, "childObjects");


var ec = makeSimpleEndCap(mainAmbient, endCaps.log.unit("test query"), applyGetTest1);
ec.activate();
*/

var root="root";
var child1="child1";
var child2="child2";
var a = interfaces.tree(basic.js).instantiate();
a.actions.addRoot(root);
a.actions.addChild(root, child1);
a.actions.addChild(root, child2);

var b = interfaces.tree(basic.js).instantiate();
