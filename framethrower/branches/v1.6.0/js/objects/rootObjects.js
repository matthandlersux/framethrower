// ==================================================================
// Root Objects
// ==================================================================

// these are predefined objects, objects that the client and server both know about
// I imagine these will be replaced with remote objects on the server
// the r. stands for root

var rootObjects = {};

rootObjects["shared.in"] = objects.make("Object");
rootObjects["shared.ont"] = objects.make("Object");
rootObjects["shared.name"] = objects.make("Object");

rootObjects["shared.realLife"] = objects.make("Object");

rootObjects["shared.thumbnailthumbnail"] = objects.make("Object");


// add them to the baseEnv
forEach(rootObjects, function (v, k) {
	lookupTable[k] = v;
});