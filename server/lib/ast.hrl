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