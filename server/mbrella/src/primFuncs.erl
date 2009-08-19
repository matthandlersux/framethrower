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

isEmpty(CellPointer) ->
	OutputCell = cell:makeLeashedCell(),
	cell:addElement(OutputCell, null),
	cell:injectIntercept(OutputCell, {switch})
	cell:injectOutput(CellPointer, OutputCell).
	
reactiveAnd(CellPointer1, CellPointer2) ->
	OutputCell = cell:makeLeashedCell(),
	InterceptState = {undefined, undefined, undefined},
	cell:injectIntercept(OutputCell, {reactiveAnd, InterceptState, [CellPointer1, CellPointer2]}),
	cell:injectOutput(CellPointer1, OutputCell),
	cell:injectOutput(CellPointer2, OutputCell),
	cell:unleash(OutputCell).

%% ====================================================
%% Internal API
%% ====================================================

% -get message [{add, value1},{add, value2},{add, value3}] or [{add,value1}] or [{remove, value3}]
% -check if have intercept
% -if so, call intercept function with arguments, extra arguments are message and state
% 	-function returns {newstate, newmessage}
% -update interceptstate, send newmessage to elements
%
% interceptFunctions :: List Args -> State -> List Message -> {ok, NewInterceptState, List Elements}
% 
% interceptFunctions are called on cell:sendElements -> cellState:interceptElements and needs to return
%		the new intercept state, and the elements to be added to the cells elements, this way the 
%		cellState:interceptElements can update the intercept and add the elements to the cells elements, then it can return
%		the new whole state of the cell and the elements that are new, so that cell can send the new ones
%		through the output functions
%
%	-the intercepts job is to take keyed/unkeyed input messages, do something to them, and return an 
%	updated state and the elements that result
%
%	-cellstate will take the updated intercept state and update the intercept, it will take the new elements and
%	add them to the cells elements, keeping track of which ones actually are new/etc... and then
%	returns the new cellstate and new elements (the ones that need to be run through output functions)
%
%	-cell just has to pass the stuff along, but it takes the returned new elements and runs them through
%	the output functions, and replaces the state

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

