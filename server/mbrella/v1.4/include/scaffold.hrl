% %% ====================================================
% %% old records, maybe not needed now
% %% ====================================================
% 
% 
% -record (interface, {
% 	type,
% 	subType,
% 	data
% 	}).
% 	
% -record (ob, {
% 	type, %situation|infon|relation|individual
% 	subType, %individuals:person|place|etc...
% 	parentSituation,
% 	involves,
% 	corresponds,
% 	childObjects,
% 	properties,
% 	content
% 	}).
% 	
% -record (startcap, {
% 	type, %interface type
% 	subType, %interface subtype
% 	parentObject, % pid
% 	connections = [],
% 	cache = [],
% 	interface
% 	}).
% 	
% -record (cache, {
% 	parent,
% 	cacheList
% 	}).
% 	
% -record (pin, {
% 	connections, %list
% 	cache		%pid
% 	}).
% 	
% -record (endcap, {
% 	type,
% 	name = null,
% 	process, %function
% 	startcap,
% 	crossReference
% 	}).
% 
% -record (crossReference, {
% 	type = set,
% 	score = interface:new(bag, crossReference),
% 	controller = interface:new(map, crossReference)
% 	}).
% 	
% -record (process, {
% 	name,
% 	function,
% 	parentBox
% 	}).

%% ====================================================
%% object records
%% ====================================================

-record (object, {
	name,
	type,
	prop = dict:new(),
	castingDict
	}).

-record (classToMake, {
	name,
	inherit,
	prop,
	memoize
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
	type,
	name,
	function,
	bottom
}).

-record (exprVar, {
	value
}).


-record (exprCell, {
	name,
	pid,
	type,
	bottom
}).


%% ====================================================
%% pointer records
%% ====================================================
-record (objectPointer, {
	name
}).

-record (cellPointer, {
	name,
	pid
}).

%% ====================================================
%% gen_server records
%% ====================================================

-record (memoize, {
	ets = ets:new(memoizeTable, [])
}).

-record (serialize, {
	file,
	prepareState,
	variables
}).

-record(cellState, {
	funcs, 
	dots, 
	onRemoves=[], 
	funcColor=0, 
	intercept, 
	done=false
}).

%% ====================================================
%% session records
%% ====================================================

-record (session, {
	msgQueue = [],
	openQueries = dict:new(),
	cleanup = [],
	lastMessageId = 0,
	templates = dict:new(),
	queryIdCount = 0,
	serverAdviceHash = dict:new(),
	clientState = satisfied,
	serverAdviceCount = 0,
	outputTimer,
	timeout = 120000,
	debug = 0
}).