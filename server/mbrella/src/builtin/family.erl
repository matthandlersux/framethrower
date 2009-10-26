-module (family).
-compile(export_all).

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X]) ).
-define( colortrace(X), io:format("\033[40mTRACE \033[31m~p\033[39m:\033[95m~p\033[39m ~p\033[0m~n~n", [?MODULE, ?LINE, X])).

%% ====================================================
%% TYPES
%% ====================================================


%% ====================================================
%% External API
%% ====================================================

%% 
%% makeTuple :: Number -> (a1 -> ... -> aN) -> TupleN a1 ... aN
%% 		
%%		

makeTuple(N) ->
	makeTuple(N,[]).

%% 
%% tupleGet :: 
%% 		
%%		

tupleGet(ElementIndex) ->
	fun(Tuple) ->
		element(ElementIndex, Tuple)
	end.

%% 
%% mapUnit :: Number -> (t1 -> ... -> tN) -> Unit t1 -> ... -> Unit tN
%% 		comment
%%		

mapUnit(N) ->
	mapUnit(N+1, []).


	
%% ====================================================
%% Internal API
%% ====================================================

mapUnit(0, Args) ->
	[AST|ListOfUnitCellPointers] = lists:reverse(Args),
	OutputCell = cell:makeCell(unit),
	InjectOutput = 	fun(CellPointer) ->
						cell:injectOutput(CellPointer, OutputCell)
					end,
	cell:injectIntercept(OutputCell, applyExpr, [AST, ListOfUnitCellPointers]),
	lists:foreach(InjectOutput, ListOfUnitCellPointers),
	OutputCell;
mapUnit(Arity, Args) ->
	fun(X) ->
		mapUnit(Arity - 1, [X] ++ Args)
	end.

%% 
%% makeTuple :: 0 -> List a -> Tuple a1 ... aN
%% 		| Number -> List a -> (a -> makeTuple)
%%		this is a tough type signature to write out
%%		


makeTuple(0, Args) ->
	makeTupleFromList(Args);
makeTuple(Arity, Args) ->
	fun(X) ->
		makeTuple(Arity - 1, [X] ++ Args)
	end.
	
%% 
%% makeTupleFromList :: List a1 ... aN -> TupleN a1 ... aN
%% 		
%%		

makeTupleFromList(ListOfElements) ->
	list_to_tuple(lists:reverse(ListOfElements)).

%% ====================================================
%% Utilities
%% ====================================================

