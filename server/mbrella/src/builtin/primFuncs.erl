-module (primFuncs).

-export ([
	isEmpty/1, takeOne/1,
	gate/2,
	reactiveAnd/2, reactiveOr/2, reactiveNot/1,
	returnUnit/1, returnUnitSet/1, returnUnitMap/2, boolToUnit/1,
	bindUnit/2, bindSet/2, bindMap/2,
	union/2, setDifference/2, unfoldSet/2, unfoldMap/2, invert/1,
	equal/2, dOr/2, dNot/1, dAnd/2, plus/2, subtract/2,
	nil/0, cons/2, append/2, head/1, tail/1,
	oneTo/1, oneToMap/2, factors/1, split/1, debug/1, floodUntil/1, floodPump/2	
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

bindUnit(AST, CellPointer) ->
	OutputCell = cell:makeCell(unit),
	cell:setFlag(OutputCell, waitForDone, true),
	cell:injectOutput(CellPointer, OutputCell, applyAndInject, [AST, OutputCell]),
	OutputCell.

%% 
%% bindSet :: (a -> Set b) -> Set a -> Set b
%% 		
%%		

bindSet(AST, CellPointer) ->
	OutputCell = cell:makeCell(set),
	cell:setFlag(OutputCell, waitForDone, true),
	cell:injectOutput(CellPointer, OutputCell, applyAndInject, [AST, OutputCell]),
	OutputCell.

%% 
%% bindMap :: (a -> b -> Map a c) -> Map a b -> Map a c
%% 		
%%		

bindMap(AST, CellPointer) ->
	OutputCell = cell:makeCell(map),
	cell:setFlag(OutputCell, waitForDone, true),
	cell:injectOutput(CellPointer, OutputCell, applyAndInject, [AST, OutputCell]),
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
	cell:injectIntercept(OutputCell, invert, [OutputCell]),
	cell:injectOutput(CellPointer, OutputCell, invert, [OutputCell]),
	cell:unleash(OutputCell),
	OutputCell.
	
%% 
%% unfoldSet :: (a -> Set a) -> a -> Set a
%% 

unfoldSet(AST, Object) ->
	OutputCell = cell:makeCellLeashed(set),
	cell:setFlag(OutputCell, waitForDone, true),
	InitialSetCellPointer = eval:evaluate( ast:makeApply(AST, ast:termToAST(Object)) ),
	cell:injectIntercept(OutputCell, unfoldSet, [AST, Object, OutputCell]),
	cell:addValue(OutputCell, Object),
	cell:injectOutput(InitialSetCellPointer, OutputCell, becomeInformant, [OutputCell]),
	cell:unleash(OutputCell),
	OutputCell.

%% 
%% unfoldMap :: (a -> Set a) -> a -> Map a Number
%% 

unfoldMap(AST, Object) ->
	OutputCell = cell:makeCellLeashed(map),
	cell:setFlag(OutputCell, waitForDone, true),
	InitialSetCellPointer = eval:evaluate( ast:makeApply(AST, ast:termToAST(Object)) ),
	cell:injectIntercept(OutputCell, unfoldMap, [AST, Object, OutputCell]),
	cell:addValue( OutputCell, cellElements:createMap(Object, 0) ),
	cell:injectOutput(InitialSetCellPointer, OutputCell, becomeInformantMap, [OutputCell, 1]),
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

% sorry, we have moved!
% ------> family.erl

%% ---------------------------------------------
%% range functions
%% ---------------------------------------------

%% 
%% rangeByKey :: Unit Tuple2 -> Set a -> Set a
%% 		
%%		

rangeByKey(CellPointerKeys, CellPointerSet) ->
	OutputCell = cell:makeCell(set),
	cell:leash(CellPointerSet),
	RangeIdentifier = erlang:make_ref(),
	OutputFunction = outputs:makeFunction(rangeByKeys, [RangeIdentifier]),
	cell:injectOutput(CellPointerKeys, CellPointerSet, setRangeKeys, [CellPointerSet, OutputFunction]),
	cell:convertToRange(CellPointerSet),
	cell:injectOutput(CellPointerSet, OutputCell, rangeByKeys, [RangeIdentifier]),
	cell:unleash(CellPointerSet),
	OutputCell.
	
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
%% list functions
%% ---------------------------------------------

nil() ->
	{list, []}.

cons(Item, {list, List}) ->
	{list, [Item | List]}.

append({list, List1}, {list, List2}) ->
	{list, List1 ++ List2}.
	
head({list, List}) ->
	hd(List).
	
tail({list, List}) ->
	tl(List).


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
%% factors :: Number -> Set Number
%% 		
%%		

factors(Number) ->
	HalfNumber = Number div 2,
	OutputCell = cell:makeCell(set),
	IsFactor = 	fun(Num, Factors) ->
					if
						Number div Num == Number/Num -> 
							[Num] ++ Factors;
						true ->
							Factors
					end
				end,
	Factors = lists:foldl(IsFactor, [], lists:seq(1, HalfNumber)),
	cell:addValues(OutputCell, Factors),
	OutputCell.

%% 
%% floodUntil :: Number -> Set Number
%% 		
%%		

floodUntil(Number) ->
	OutputCell = cell:makeCell(set),
	spawn(primFuncs, floodPump, [OutputCell, Number]),
	OutputCell.

%% 
%% floodPump :: 
%% 		sends X messages to floodUntil and then dies
%%		

floodPump(_, 0) -> ok;
floodPump(OutputCell, Number) ->
	receive
		_ -> ok
	after
		10 ->
			cell:addValue(OutputCell, Number),
			floodPump(OutputCell, Number - 1)
	end.

%% 
%% split :: Number -> Unit Number	
%% 		
%%		

split(Number) ->
	OutputCell = cell:makeCell(unit),
	NewNum = Number div 2,
	if
		NewNum < 1 ->
			OutputCell;
		true ->
			cell:addValue(OutputCell, NewNum ),
			OutputCell
	end.

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
