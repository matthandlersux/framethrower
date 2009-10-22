-module (primFuncs).

-export ([
	isEmpty/1, takeOne/1,
	gate/2,
	reactiveAnd/2, reactiveOr/2, reactiveNot/1,
	returnUnit/1, returnUnitSet/1, returnUnitMap/2, boolToUnit/1,
	bindUnit/2, bindSet/2, bindMap/2,
	union/2, setDifference/2, unfoldSet/2, invert/1,
	equal/2, dOr/2, dNot/1, dAnd/2, plus/2, subtract/2,
	oneTo/1, oneToMap/2, debug/1	
]).

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X]) ).
-define( colortrace(X), io:format("\033[40mTRACE \033[31m~p\033[39m:\033[95m~p\033[39m ~p\033[0m~n~n", [?MODULE, ?LINE, X])).

%% ====================================================
%% NOTES
%% ====================================================

%
% any function that doesnt have the cellpointer it depends on as arguments needs to know about its informants
%

%% ====================================================
%% TYPES
%% ====================================================


%% ====================================================
%% External API
%% ====================================================

%% ---------------------------------------------
%% functions that act on the whole element structure
%% ---------------------------------------------


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
%% takeOne :: Set a -> Unit a
%% 

takeOne(CellPointer) ->
	OutputCell = cell:makeCell(unit),
	cell:injectOutput(CellPointer, OutputCell, takeOne),
	OutputCell.

%% ---------------------------------------------
%% reactive boolean functions
%% ---------------------------------------------


%% 
%% reactiveNot :: Unit Null -> Unit Null
%% 		
%%		

reactiveNot(CellPointer) ->
	OutputCell = cell:makeCell(unit),
	cell:addValue(OutputCell, null),
	cell:injectIntercept(OutputCell, reactiveNot),
	cell:injectOutput(CellPointer, OutputCell),
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

unfoldSet(AST, Object) ->
	OutputCell = cell:makeCellLeashed(set),
	% cell:setFlag(OutputCell, waitForDone, true),
	InitialSetCellPointer = eval:evaluate( ast:makeApply(AST, ast:makeLiteral(Object)) ),
	cell:injectIntercept(OutputCell, unfoldSet, [AST, OutputCell]),
	cell:addValue(OutputCell, Object),
	% cell:injectOutput(InitialSetCellPointer, OutputCell, becomeInformant, [OutputCell]),
	cell:unleash(OutputCell),
	OutputCell.

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
	OutputCell = cell:makeCell(set),
	cell:setFlag(OutputCell, waitForDone, true),
	cell:injectIntercept(OutputCell, setDifference, [CellPointer1, CellPointer2]),
	% inject cellpointer2 first so that the initial sending doesnt flicker
	cell:injectOutput(CellPointer2, OutputCell),
	cell:injectOutput(CellPointer1, OutputCell),
	cell:unleash(OutputCell),
	OutputCell.

%% ---------------------------------------------
%% map unit functions
%% ---------------------------------------------

% moved to family.erl
	
%% ---------------------------------------------
%% non reactive functions
%% ---------------------------------------------

%% 
%% equal :: a -> a -> Bool
%% 		
%%		

equal(A, B) ->
	A =:= B.

%% 
%% dNot :: Bool -> Bool
%% 		
%%		

dNot(Bool) ->
	not Bool.
	
%% 
%% dOr :: Bool -> Bool -> Bool
%% 		
%%		

dOr(Bool1, Bool2) ->
	Bool1 orelse Bool2.
	
%% 
%% dAnd :: Bool -> Bool -> Bool
%% 		
%%		

dAnd(Bool1, Bool2) ->
	Bool1 andalso Bool2.
	
%% 
%% plus :: Number -> Number -> Number
%% 		
%%		

plus(Number1, Number2) ->
	Number1 + Number2.
	
%% 
%% subtract :: Number -> Number -> Number
%% 		
%%		

subtract(Number1, Number2) ->
	Number1 - Number2.

%% ---------------------------------------------
%% other functions
%% ---------------------------------------------

%% 
%% boolToUnit :: Bool -> Unit Null
%% 		
%%		

boolToUnit(Bool) ->
	OutputCell = cell:makeCell(unit),
	Bool andalso cell:addValue(OutputCell, null),
	OutputCell.
	
%% 
%% gate :: Unit b -> a -> Unit a
%% 		
%%		

gate(CellPointer, InnerValue) ->
	OutputCell = cell:makeCell(unit),
	cell:injectIntercept(OutputCell, gate, [InnerValue]),
	cell:injectOutput(CellPointer, OutputCell),
	OutputCell.

%% ---------------------------------------------
%% functions used for debugging
%% ---------------------------------------------

%% 
%% oneTo :: Number -> Set Number
%% 		
%%		

oneTo(Number) ->
	OutputCell = cell:makeCell(set),
	cell:addValues(OutputCell, lists:seq(1, Number)),
	OutputCell.

%% 
%% oneToMap :: Number -> Number -> Map Number Number
%% 		
%%		

oneToMap(Number1, Number2) ->
	OutputCell = cell:makeCell(map),
	ListOfMaps = lists:map(fun(N) -> {N, Number2} end, lists:seq(1, Number1)),
	cell:addValues(OutputCell, ListOfMaps),
	OutputCell.
	
%% 
%% debug :: CellPointer -> CellPointer
%% 		prints out the contents of any cell
%%		

debug(CellPointer) ->
	OutputCell = cell:makeCell(set),
	cell:injectIntercept(OutputCell, debug),
	cell:injectOutput(CellPointer, OutputCell),
	OutputCell.

%% ====================================================
%% Internal API
%% ====================================================
	
%% ====================================================
%% Utilities
%% ====================================================
