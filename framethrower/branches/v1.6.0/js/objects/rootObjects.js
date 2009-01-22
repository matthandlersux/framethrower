// ==================================================================
// Root Objects
// ==================================================================

// these are predefined objects, objects that the client and server both know about
// I imagine these will be replaced with remote objects on the server
// the r. stands for root

var rootObjects = {};

rootObjects["shared.in"] = objects.make("Object");
rootObjects["shared.ont"] = objects.make("Object");

rootObjects["shared.isA"] = objects.make("Object");
rootObjects["shared.name"] = objects.make("Object");
rootObjects["shared.relationTemplate"] = objects.make("Object");

rootObjects["shared.type.type"] = objects.make("Object");
rootObjects["shared.type.situation"] = objects.make("Object");
rootObjects["shared.type.entity"] = objects.make("Object");
rootObjects["shared.type.relation"] = objects.make("Object");

rootObjects["shared.realLife"] = objects.make("Object");




rootObjects["ui.prefs"] = objects.make("UI.prefs");








rootObjects["shared.thumbnailthumbnail"] = objects.make("Object");



rootObjects["debug.text"] = objects.make("X.text", {string:"hello world"});



// add them to the base environment
forEach(rootObjects, function (v, k) {
	base.add(k, v);
});