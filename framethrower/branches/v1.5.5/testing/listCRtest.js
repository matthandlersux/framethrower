
var mainAmbient = makeAmbient();

var controller = {};

var list = startCaps.list([1, 2, 3, 4]);

var list2 = makeSimpleStartCap(interfaces.list(layout.zui), controller);

var l = layout.zui.make();
l.control.minimized.set(true);

var l2 = layout.zui.make();
l2.control.minimized.set(false);

var l3 = layout.zui.make();
l3.control.minimized.set(true);

controller.append(l);
controller.append(l2);
controller.append(l3);



processAllThunks(mainAmbient, document.getElementById("html_mainscreen"), {
	list: list2
}, "");


l3.control.minimized.set(false);
l3.control.minimized.PACKETCLOSE();

/*var test = deriveForEach(rw.get.childObjects(), function (o) {
	return o.get.parentSituation();
}, kernel.situation);*/

//var test = deriveNonEmpty(rw.get.childObjects());

//var test = deriveSort(rw.get.childObjects());
//var test2 = deriveLimit(test);

//var ec = makeSimpleEndCap(mainAmbient, endCaps.log.list("test output"), test2);