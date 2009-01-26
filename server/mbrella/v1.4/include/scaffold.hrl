%% ====================================================
%% old records, maybe not needed now
%% ====================================================


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
	controller = interface:new(map, crossReference)
	}).
	
-record (process, {
	name,
	function,
	parentBox
	}).

%% ====================================================
%% object records
%% ====================================================

-record (object, {
	name,
	origType,
	type,
	prop = dict:new()
	}).
	
%% ====================================================
%% expression records
%% ====================================================


-record (cons, {
	type, % lambda | apply
	left, % ast | fun
	right % ast | fun | nat | bool |
}).

-record (exprFun, {
	kind = "fun",
	type,
	name,
	function,
	bottom
}).

-record (exprVar, {
	kind,
	value
}).


-record (exprCell, {
	name,
	pid,
	type,
	bottom
}).
	
%% ====================================================
%% gen_server records
%% ====================================================

-record (memoize, {
	ets = ets:new(memoizeTable, [])
}).

-record (serialize, {
	ets = ets:new(serializeTable, [])
}).