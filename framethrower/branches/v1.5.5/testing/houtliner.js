
var world = importWorld.importWorld(loadXMLNow(ROOTDIR + "xml/import/outlinerworld.xml"));
var PREDEF = world;
var rw = world.rw;

var panelLayer = layout.panelLayer.make();
panelLayer.control.properties.set(parseXML("<panelLayer addObject='0' addCorresponds='0' addInfon='0'/>"));
panelLayer.control.addFocus.set(rw);

var addPanel = layout.addPanel.make();
addPanel.control.properties.set(parseXML("<addPanel newName='' newType=''/>"));
addPanel.control.expanded.set(false);
//addPanel.control.infonArgs.insert(rw, 0);
//addPanel.control.infonArgs.set(1, world.missRob);

var zui = layout.zui.make();
zui.control.focus.set(rw);
zui.control.properties.set(parseXML("<zui view='situation' childrenSidebar='1' correspondSidebar='0' />"));
zui.control.leftChildInView.set(0);
zui.control.leftRailChild.set(0);

PREDEF["zui"] = zui;
PREDEF["panelLayer"] = panelLayer;
PREDEF["addPanel"] = addPanel;


mergeInto(PREDEF, uiStartCaps);

var mainAmbient = makeAmbient();

var focus = {};
focus.name = "test focus name";
focus.value = "test focus value";

var outline = outliner.outline.make();
outline.control.focus.set(rw);
outline.control.childType.set(PREDEF['childrelation1']);

var outlineRoot = outliner.root.make();
outlineRoot.control.focus.set(rw);
outlineRoot.control.childOutline.set(outline);
outlineRoot.control.expanded.set(false);

processAllThunks(mainAmbient, document.getElementById("html_mainscreen"), {
	outlineRoot: outlineRoot
}, "");