%% ====================================================
%% expression records
%% ====================================================


-record (cons, {
	type, % lambda | apply
	left, % ast | fun
	right % ast | fun | nat | bool |
}).

-record (exprFun, {
	kind,
	type,
	name,
	function
}).

-record (exprVar, {
	kind,
	value
}).

%-----------------------------------------------------

-record (constraint, {
	type, % equals, lambda
	left,
	right
}).

%% ====================================================
%% type records
%% ====================================================


-record (type, {
	type, % typeFun: X -> Y | typeVar: a | typeName: Set
	value
}).