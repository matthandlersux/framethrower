-module (primFuncs.erl).
-compile(export_all).

-include().

-ifdef( debug ).
-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X]) ).
-else.
-define( trace(X), void ).
-endif.

%% ====================================================
%% TYPES
%% ====================================================


%% ====================================================
%% External API
%% ====================================================

fold(Cell, Function, FunctionInverse, InitialValue) ->
	OutputCell = cell:makeLeashedCell(unit),
	cell:addElement(OutputCell, InitialValue),
	cell:injectIntercept(OutputCell, {interceptFold, InitialValue, [Function, FunctionInverse]}),
	cell:inject(Cell, OutputCell, send),
	cell:unleash(OutputCell).
	
% -get message [{add, value1},{add, value2},{add, value3}] or [{add,value1}] or [{remove, value3}]
% -check if have intercept
% -if so, call intercept function with arguments, extra arguments are message and state
% 	-function returns {newstate, newmessage}
% -update interceptstate, send newmessage to elements
%
% interceptFunctions :: List Args -> State -> List Message -> {ok, NewState, List Elements}

isEmpty(Cell) ->
	OutputCell = cell:makeLeashedCell(),
	cell:addElement(OutputCell, null),
	cell:injectIntercept(OutputCell, {switch})
	cell:inject(Cell, OutputCell, send).
	
reactiveAnd(Cell1, Cell2) ->
	OutputCell = cell:makeLeashedCell(),
	InterceptKeys = cell:makeInterceptKeys(Cell1, Cell2),
	InterceptState = {undefined, undefined, undefined}
	%need to designate that Cell1 -> reactiveAnd's Cell1 always
	cell:createIntercept(OutputCell, InterceptKeys, funs:pointer(intercepts, reactiveAnd, [state, key]), State),
	cell:unleash(OutputCell).

%% ====================================================
%% Internal API
%% ====================================================

interceptFold(_, _, _, []) ->
	[];
interceptFold(Function, FunctionInverse, InitialValue, [H|T]) ->
	[interceptFold(Function, FunctionInverse, InitialValue, H)]
interceptFold(Function, _, InitialValue, {add, Value}) ->
	;
interceptFold(_, FunctionInverse, InitialValue, {remove, Value}) ->
	.
	
%% ====================================================
%% Utilities
%% ====================================================

