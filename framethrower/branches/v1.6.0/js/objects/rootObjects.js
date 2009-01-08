// ==================================================================
// Root Objects
// ==================================================================

// these are predefined objects, objects that the client and server both know about
// I imagine these will be replaced with remote objects on the server
// the r. stands for root

var rootObjects = {};

rootObjects["r.in"] = makeObject("K.object");


// add them to the baseEnv
forEach(rootObjects, function (v, k) {
	lookupTable[k] = v;
});