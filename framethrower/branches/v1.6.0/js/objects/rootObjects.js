// ==================================================================
// Root Objects
// ==================================================================

// these are predefined objects, objects that the client and server both know about

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
	m("shared.type.poly.a"); // unknown how we want to do polymorphic types.
							// For now, we only allow one polymorphic type per relation type and it has to be the output. For example: in :: Situation -> a -> a
	
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
	m("test.objectIP1", "UI.consIP");
	m("test.objectIP2", "UI.consIP");
	m("test.objectIP3", "UI.consIP");
	
	rootObjects["test.objectIP1"].prop["object"].control.add(rootObjects["shared.in"]);
	
	m("test.consIP2", "UI.consIP");
	rootObjects["test.consIP2"].prop["left"].control.add(rootObjects["test.objectIP1"]);
	rootObjects["test.consIP2"].prop["right"].control.add(rootObjects["test.objectIP2"]);
	
	m("test.consIP", "UI.consIP");
	rootObjects["test.consIP"].prop["left"].control.add(rootObjects["test.consIP2"]);
	rootObjects["test.consIP"].prop["right"].control.add(rootObjects["test.objectIP3"]);
	
	
	//rootObjects["test.consIP"].prop["left"].control.add(rootObjects["shared.in"]);
	//rootObjects["test.consIP"].prop["right"].control.add(rootObjects["shared.realLife"]);
	
})();








/*

ui.prefs displayTypes can be put in by converting an object to a Map Number (Map Object XML)

*/