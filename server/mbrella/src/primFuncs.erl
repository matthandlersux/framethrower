-module (primFuncs.erl).
-compile(export_all).

-include().

-ifdef( debug ).
-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X]) ).
-else.
-define( trace(X), void ).
-endif.

%% ====================================================
%% NOTES
%% ====================================================

%
%	-any functions that dont have the cellpointers as arguments need to know about their informants
%

%% ====================================================
%% TYPES
%% ====================================================


%% ====================================================
%% External API
%% ====================================================

% fold(Cell, Function, FunctionInverse, InitialValue) ->
% 	OutputCell = cell:makeLeashedCell(unit),
% 	cell:addElement(OutputCell, InitialValue),
% 	cell:injectIntercept(OutputCell, {fold, InitialValue, [Function, FunctionInverse]}),
% 	cell:injectOutput(Cell, OutputCell, send),
% 	cell:unleash(OutputCell).

%% 
%% isEmpty :: Set a -> Unit Null
%% 

isEmpty(CellPointer) ->
	OutputCell = cell:makeCellLeashed(unit),
	% need to add informant manually because it isn't an argument
	cell:addInformant(OutputCell, CellPointer),
	cell:addValue(OutputCell, null),
	cell:injectOutput(CellPointer, outputs:construct(OutputCell, isEmpty)),
	cell:unleash(OutputCell),
	OutputCell.
	
reactiveAnd(CellPointer1, CellPointer2) ->
	OutputCell = cell:makeLeashedCell(unit),
	cell:addInformant(OutputCell, CellPointer1),
	cell:addInformant(OutputCell, CellPointer2),
	InterceptState = {undefined, undefined},
	cell:injectIntercept(OutputCell, {reactiveAnd, InterceptState, [CellPointer1, CellPointer2]}),
	cell:injectOutput(CellPointer1, OutputCell),
	cell:injectOutput(CellPointer2, OutputCell),
	cell:unleash(OutputCell).
	
reactiveOr(CellPointer1, CellPointer2) ->
	OutputCell = cell:makeLeashedCell(set),
	cell:addInformant(OutputCell, CellPointer1),
	cell:addInformant(OutputCell, CellPointer2),
	% weighting of set handles the add null add null remove null -> true functionality
	% cell:injectIntercept(OutputCell, {reactiveOr, undefined, []}),
	% cell:injectIntercept(OutputCell, {stripName, undefined, []}),
	cell:injectOutput(CellPointer1, OutputCell),
	cell:injectOutput(CellPointer2, OutputCell),
	cell:unleash(OutputCell).
	
% takeOne(CellPointer) ->
% 	OutputCell = cell:makeCell(unit),
% 	.
	
invert(CellPointer) ->
	OutputCell = cell:makeLeashedCell(map),
	cell:addInformant(OutputCell, CellPointer),
	cell:injectIntercept(OutputCell, {invert, intercepts:invertBaseState(), [OutputCell, CellPointer]}),
	cell:injectOutput(CellPointer, OutputCell, {sideEffectInject, undefined, [OutputCell]}),
	cell:unleash(OutputCell).
	
setDifference(CellPointer1, CellPointer2) ->
	OutputCell = cell:makeLeashedCell(set),
	cell:addInformant(OutputCell, CellPointer1),
	cell:addInformant(OutputCell, CellPointer2),
	cell:injectIntercept(OutputCell, {setDifference, intercepts:setDifferenceState(), [CellPointer1, CellPointer2]}),
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
	
%% ====================================================
%% Utilities
%% ====================================================
