// ==================================================================
// Root Objects
// ==================================================================

// these are predefined objects, objects that the client and server both know about
// I imagine these will be replaced with remote objects on the server
// the r. stands for root

var rootObjects = {};

(function () {
	function m(name, className, props) {
		if (!className) className = "Object";
		
		if (!LOCAL && name.substr(0, 7) === "shared.") {
			rootObjects[name] = makeRemoteObject(name, parseType(className));
		} else {
			rootObjects[name] = objects.make(className, props);
			rootObjects[name].name = name;
		}
		
		base.add(name, rootObjects[name]);
	}
	
	m("shared.in");
	m("shared.ont");
	
	m("shared.isA");
	m("shared.name");
	m("shared.relationTemplate");
	
	m("shared.type.type");
	m("shared.type.situation");
	m("shared.type.entity");
	m("shared.type.infon");
	m("shared.type.relation");  // this will itself be used as a binary relation to make relation types
	
	m("shared.realLife");
	
	
	m("ui.ui", "UI.ui");
	
	m("ui.prefs", "UI.prefs");
	
	
	m("test.pane", "UI.pane.pane");
	rootObjects["test.pane"].prop["focus"].control.add(rootObjects["shared.realLife"]);
	
	m("test.pane2", "UI.pane.pane");
	rootObjects["test.pane2"].prop["focus"].control.add(rootObjects["shared.type.entity"]);
	
	m("test.paneset", "UI.pane.set");
	rootObjects["test.paneset"].prop["panes"].control.add("b", objects.cast(rootObjects["test.pane"], "UI.pane"));
	rootObjects["test.paneset"].prop["panes"].control.add("bb", objects.cast(rootObjects["test.pane2"], "UI.pane"));
	
	m("ui.main", "UI.main", {"pane": objects.cast(rootObjects["test.paneset"], "UI.pane")});
	
	
	
	//m("test.consIP", "UI.consIP");
	m("test.objectIP1", "UI.objectIP");
	m("test.objectIP2", "UI.objectIP");
	m("test.objectIP3", "UI.objectIP");
	
	rootObjects["test.objectIP1"].prop["object"].control.add(rootObjects["shared.in"]);
	
	
	m("test.consIP2", "UI.consIP", {left: rootObjects["test.objectIP1"], right: rootObjects["test.objectIP2"]});
	m("test.consIP", "UI.consIP", {left: rootObjects["test.consIP2"], right: rootObjects["test.objectIP3"]});
	//rootObjects["test.consIP"].prop["left"].control.add(rootObjects["shared.in"]);
	//rootObjects["test.consIP"].prop["right"].control.add(rootObjects["shared.realLife"]);
	
})();








/*

ui.prefs displayTypes can be put in by converting an object to a Map Number (Map Object XML)

*/