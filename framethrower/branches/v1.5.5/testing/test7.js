console.log("iw", importWorld);

var world = importWorld.importWorld(loadXMLNow(ROOTDIR + "xml/import/world2.xml"));

var PREDEF = world;

var rw = world.rw;


//make a corresponds anchor in ONT
var anchor = actions.makeIndividual(world.rw);
anchor.control.content.set('Test Anchor');

//make a corresponds infon between missRobinson and the anchor
var cor1 = actions.makeInfon(world.rw, world.corresponds, {corresponder:world.missRob, anchor:anchor});

//make a corresponds infon between crazyMissRobinson and the anchor
var cor2 = actions.makeInfon(world.rw, world.corresponds, {corresponder:world.crazyMissRob, anchor:anchor});


var panelLayer = layout.panelLayer.make();
panelLayer.control.properties.set(parseXML("<panelLayer addObject='0' />"));
panelLayer.control.addFocus.set(rw);

var zui = layout.zui.make();
zui.control.focus.set(rw);
zui.control.properties.set(parseXML("<zui view='situation' childrenSidebar='1' correspondSidebar='0'/>"));


var mainAmbient = makeAmbient();

processAllThunks(mainAmbient, document.getElementById("html_mainscreen"), {
	rw: rw,
	zui: zui,
	panelLayer: panelLayer,
	"uiStartCaps.windowSizeWidth": uiStartCaps.windowSizeWidth,
	"uiStartCaps.windowSizeHeight": uiStartCaps.windowSizeHeight
}, "");


/*var test = deriveForEach(rw.get.childObjects(), function (o) {
	return o.get.parentSituation();
}, kernel.situation);*/

//var test = deriveNonEmpty(rw.get.childObjects());

//var test = deriveSort(rw.get.childObjects());
//var test2 = deriveLimit(test);

//var ec = makeSimpleEndCap(mainAmbient, endCaps.log.list("test output"), test2);