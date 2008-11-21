-record (interface, {
	type,
	subType,
	data
	}).
	
-record (ob, {
	type, %situation|infon|relation|individual
	subType, %individuals:person|place|etc...
	parentSituation,
	involves,
	corresponds,
	childObjects,
	properties,
	content
	}).
	
-record (startcap, {
	type, %interface type
	subType, %interface subtype
	parentObject, % pid
	connections = [],
	cache = [],
	interface
	}).
	
-record (cache, {
	parent,
	cacheList
	}).
	
-record (pin, {
	connections, %list
	cache		%pid
	}).
	
-record (endcap, {
	type,
	name = null,
	process, %function
	startcap,
	crossReference
	}).

-record (crossReference, {
	type = set,
	score = interface:new(bag, crossReference),
	controller = interface:new(assoc, crossReference)
	}).
	
-record (process, {
	name,
	function,
	parentBox
	}).