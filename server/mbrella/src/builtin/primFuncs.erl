-module (primFuncs).
-compile(export_all).

-include ("../../include/scaffold.hrl").

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

%% 
%% isEmpty :: Set a -> Unit Null
%%		waitForDone = false
%% 

isEmpty(CellPointer) ->
	OutputCell = cell:makeCellLeashed(unit),
	% need to add informant manually because it isn't an argument
	cell:addInformant(OutputCell, CellPointer),
	cell:addValue(OutputCell, null),
	cell:injectOutput(CellPointer, OutputCell, isEmpty),
	cell:unleash(OutputCell),
	OutputCell.

%% 
%% reactiveAnd :: Unit Null -> Unit Null -> Unit Null
%%		waitForDone = false
%% 

reactiveAnd(CellPointer1, CellPointer2) ->
	OutputCell = cell:makeCellLeashed(unit),
	cell:setFlag(OutputCell, waitForDone, true),
	cell:injectIntercept(OutputCell, reactiveAnd, [CellPointer1, CellPointer2]),
	cell:injectOutput(CellPointer1, OutputCell),
	cell:injectOutput(CellPointer2, OutputCell),
	cell:unleash(OutputCell),
	OutputCell.
	
%% 
%% reactiveOr :: Unit Null -> Unit Null -> Unit Null
%%		waitForDone = false
%% 

reactiveOr(CellPointer1, CellPointer2) ->
	OutputCell = cell:makeCellLeashed(unit),
	cell:setFlag(OutputCell, waitForDone, true),
	% the weighting of units takes care of all the reactive-or functionality
	cell:injectOutput(CellPointer1, OutputCell),
	cell:injectOutput(CellPointer2, OutputCell),
	cell:unleash(OutputCell).
	
%% 
%% takeOne :: Set a -> Unit a
%% 

takeOne(CellPointer) ->
	OutputCell = cell:makeCell(unit),
	cell:injectOutput(CellPointer, OutputCell, takeOne),
	OutputCell.
	
%% 
%% invert :: Map a (Set b) -> Map b (Set a)
%% 

invert(CellPointer) ->
	OutputCell = cell:makeCellLeashed(map),
	cell:setFlag(OutputCell, waitForDone, true),
	cell:injectIntercept(OutputCell, invert, [OutputCell, CellPointer]),
	cell:injectOutput(CellPointer, OutputCell, invert, [OutputCell]),
	cell:unleash(OutputCell),
	OutputCell.
	
%% 
%% unfoldSet :: (a -> Set a) -> a -> Set a
%% 

unfoldSet(ExprString, Object) ->
	OutputCell = cell:makeCellLeashed(set),
	cell:setFlag(OutputCell, waitForDone, true),
	InitialSetPointer = eval:evaluate( expr:apply(ExprString, Object) ),
	cell:injectIntercept(OutputCell, unfoldSet, [ExprString, OutputCell]),
	cell:sendElements(OutputCell, [cellElements:createAdd(Object)]),
	cell:injectOutput(InitialSetPointer, OutputCell, becomeInformant),
	cell:unleash(OutputCell),
	OutputCell.


%% ---------------------------------------------
%% return
%% ---------------------------------------------


%% 
%% returnUnit :: a -> Unit a
%% 		
%%		

returnUnit(Value) ->
	OutputCell = cell:makeCell(unit),
	cell:addValue(OutputCell, Value),
	OutputCell.
	
%% 
%% returnUnitSet :: Unit a -> Set a
%% 		
%%		

returnUnitSet(CellPointer) ->
	OutputCell = cell:makeCell(set),
	cell:injectOutput(CellPointer, OutputCell),
	OutputCell.
	
%% 
%% returnUnitMap :: a -> Unit b - > Map a b
%% 		
%%		

returnUnitMap(Key, CellPointer) ->
	OutputCell = cell:makeCell(map),
	cell:injectOutput(CellPointer, OutputCell, sendMap, [Key]),
	OutputCell.


%% ---------------------------------------------
%% bind
%% ---------------------------------------------


%% 
%% bindUnit :: (a -> Unit b) -> Unit a -> Unit b
%% 		
%%		

bindUnit(ExprString, CellPointer) ->
	OutputCell = cell:makeCell(unit),
	cell:setFlag(OutputCell, waitForDone, true),
	cell:injectOutput(CellPointer, OutputCell, applyAndInject, [ExprString, OutputCell]),
	OutputCell.

%% 
%% bindSet :: (a -> Set b) -> Set a -> Set b
%% 		
%%		

bindSet(ExprString, CellPointer) ->
	OutputCell = cell:makeCell(set),
	cell:setFlag(OutputCell, waitForDone, true),
	cell:injectOutput(CellPointer, OutputCell, applyAndInject, [ExprString, OutputCell]),
	OutputCell.

%% 
%% bindMap :: (a -> b -> Map a c) -> Map a b -> Map a c
%% 		
%%		

bindMap(ExprString, CellPointer) ->
	OutputCell = cell:makeCell(map),
	cell:setFlag(OutputCell, waitForDone, true),
	cell:injectOutput(CellPointer, OutputCell, applyAndInject, [ExprString, OutputCell]),
	OutputCell.

%% ---------------------------------------------
%% set functions
%% ---------------------------------------------

%% 
%% union :: Set a -> Set a -> Set a
%% 		
%%		

union(CellPointer1, CellPointer2) ->
	OutputCell = cell:makeCell(set),
	cell:setFlag(OutputCell, waitForDone, true),
	cell:addInformant(OutputCell, CellPointer1),
	cell:addInformant(OutputCell, CellPointer2),
	cell:injectOutput(CellPointer1, OutputCell),
	cell:injectOutput(CellPointer2, OutputCell),
	OutputCell.

%% 
%% setDifference :: Set a -> Set a -> Set a
%% 
	
setDifference(CellPointer1, CellPointer2) ->
	OutputCell = cell:makeCellLeashed(set),
	cell:setFlag(OutputCell, waitForDone, true),
	cell:injectIntercept(OutputCell, setDifference, [CellPointer1, CellPointer2]),
	% inject cellpointer2 first so that the initial sending doesnt flicker
	cell:injectOutput(CellPointer2, OutputCell),
	cell:injectOutput(CellPointer1, OutputCell),
	cell:unleash(OutputCell).

%% ---------------------------------------------
%% map unit functions
%% ---------------------------------------------



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
