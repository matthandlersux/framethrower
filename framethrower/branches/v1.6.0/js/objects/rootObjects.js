// ==================================================================
// Root Objects
// ==================================================================

// these are predefined objects, objects that the client and server both know about
// I imagine these will be replaced with remote objects on the server
// the r. stands for root

var rootObjects = {};

rootObjects["shared.in"] = makeObject("K.object");
rootObjects["shared.ont"] = makeObject("K.object");
rootObjects["shared.name"] = makeObject("K.object");
rootObjects["shared.thumbnail"] = makeObject("K.object");
rootObjects["shared.test"] = makeObject("K.cons", {left:rootObjects["shared.in"], right:rootObjects["shared.ont"]});

// add them to the baseEnv
forEach(rootObjects, function (v, k) {
	lookupTable[k] = v;
});