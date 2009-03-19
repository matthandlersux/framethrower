-module (primFuncs).
-compile(export_all).

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X])).
-include ("../include/scaffold.hrl").

primitives() ->
	[
	%% ============================================================================
	%% Monadic Operators
	%% ============================================================================
	#exprFun{
	name = "returnUnit",
	type = "a -> Unit a",
	function = fun(Val) ->
		OutputCell = cell:makeCell(),
		cell:addLine(OutputCell, Val),
		cell:done(OutputCell),
		OutputCell
	end},
	#exprFun{
	name = "returnFuture",
	type = "a -> Future a",
	function = fun(Val) ->
		OutputCell = cell:makeCell(),
		cell:addLine(OutputCell, Val),
		cell:done(OutputCell),
		OutputCell
	end},	
	#exprFun{
	name = "returnUnitSet",
	type = "Unit a -> Set a",
	function = fun(Cell) ->
		OutputCell = cell:makeCell(),
		cell:injectFunc(Cell, OutputCell, fun(Val) ->
			cell:addLine(OutputCell, Val) 
		end),
		OutputCell
	end},
	#exprFun{
	name = "returnUnitMap",
	type = "a -> Unit b -> Map a b",
	function = fun(Key, Cell) ->
		OutputCell = cell:makeCell(),
		cell:injectFunc(Cell, OutputCell, fun(Val) ->
			cell:addLine(OutputCell, {pair, Key, Val})
		end),
		OutputCell
	end},
	#exprFun{
	name = "returnFutureUnit",
	type = "Future a -> Unit a",
	function = fun(Cell) ->
		OutputCell = cell:makeCell(),
		cell:injectFunc(Cell, OutputCell, fun(Val) ->
			cell:addLine(OutputCell, Val)
		end),
		OutputCell
	end},
	#exprFun{
	name = "bindUnit",
	type = "(a -> Unit b) -> Unit a -> Unit b",
	function = fun bindUnitOrSetHelper/2},
	#exprFun{
	name = "bindSet",
	type = "(a -> Set b) -> Set a -> Set b",
	function = fun bindUnitOrSetHelper/2},
	#exprFun{
	name = "bindMap",
	type = "(a -> b -> Map a c) -> Map a b -> Map a c",
	function = fun(Fun, Cell) ->
		OutputCell = cell:makeCell(),
		cell:injectFunc(Cell, OutputCell, fun({pair, Key,Val}) ->
			applyAndInject(applyFun(Fun, Key), Val, OutputCell, fun(InnerVal) ->
				cell:addLine(OutputCell, InnerVal) end
			)
		end),
		OutputCell
	end},
	%% ============================================================================
	%% Set utility functions
	%% ============================================================================
	#exprFun{
	name = "union",
	type = "Set a -> Set a -> Set a",
	function = fun(Cell1, Cell2) ->
		OutputCell = cell:makeCell(),
		cell:injectFuncs(OutputCell, [
			{Cell1, fun(Val) -> cell:addLine(OutputCell, Val) end},
			{Cell2, fun(Val) ->	cell:addLine(OutputCell, Val) end}]),
		OutputCell
	end},
	#exprFun{
	name = "setDifference",
	type = "Set a -> Set a -> Set a",
	function = fun(Cell1, Cell2) ->
		OutputCell = cell:makeCell(),
		Intercept = cell:injectIntercept(OutputCell, fun(Message, State) ->
			case Message of
				{plus, Val} -> 
					NewEntry = try dict:fetch(Val, State) of
						{0, _} -> {1, cell:addLine(OutputCell, Val)};
						{Num, OnRemove} -> {Num+1, OnRemove}
					catch
						Type:Exception -> {1, cell:addLine(OutputCell, Val)}
					end,
					dict:store(Val, NewEntry, State);
				{minus, Val} ->
					NewEntry = try dict:fetch(Val, State) of
						{1, OnRemove} -> OnRemove(), {0, undefined};
						{Num, OnRemove} -> {Num-1, OnRemove}
					catch
						Type:Exception -> {-1, undefined}
					end,
					dict:store(Val, NewEntry, State)
			end
		end, dict:new()),
		cell:injectFuncs(Intercept, [{Cell1, fun(Val) ->
			intercept:sendIntercept(Intercept, {plus, Val}),
			fun() -> intercept:sendIntercept(Intercept, {minus, Val}) end
		end},
		{Cell2, fun(Val) ->
			intercept:sendIntercept(Intercept, {minus, Val}),
			fun() -> intercept:sendIntercept(Intercept, {plus, Val}) end
		end}]),
		OutputCell
	end},
	#exprFun{
	name = "takeOne",
	type = "Set a -> Unit a",
	function = fun(Cell) ->
		OutputCell = cell:makeCell(),
		Intercept = cell:injectIntercept(OutputCell, fun(Message, Cache) ->
			case Message of
				{add, Val} -> 
					case Cache of
						undefined -> 
							cell:addLine(OutputCell, Val),
							Val;
						_ -> Cache
					end;
				{remove, Val} ->
					case Cache of
						Val ->
							cell:removeLine(OutputCell, Val),
							case cell:getStateArray(Cell) of
								[First|_] -> 
									cell:addLine(OutputCell, First),
									First;
								[] -> undefined
							end;
						_ -> Cache
					end		
			end
		end, undefined),
		cell:injectFunc(Cell, Intercept, fun(Val) ->
			intercept:sendIntercept(Intercept, {add, Val}),
			fun() -> intercept:sendIntercept(Intercept, {remove, Val}) end
		end),
		OutputCell
	end},	
	%% ============================================================================
	%% Bool utility functions
	%% ============================================================================
	#exprFun{
	name = "equal",
	type = "a -> a -> Bool",
	function = fun(Val1, Val2) ->
		Val1 == Val2
	end},
	#exprFun{
	name = "not",
	type = "Bool -> Bool",
	function = fun(Val) ->
		not Val
	end},
	#exprFun{
	name = "and",
	type = "Bool -> Bool -> Bool",
	function = fun(Val1, Val2) ->
		Val1 and Val2
	end},
	#exprFun{
	name = "or",
	type = "Bool -> Bool -> Bool",
	function = fun(Val1, Val2) ->
		Val1 or Val2
	end},
	#exprFun{
	name = "boolToUnit",
	type = "Bool -> Unit Null",
	function = fun(Val) ->
		OutputCell = cell:makeCell(),
		case Val of
			true -> cell:addLine(OutputCell, null);
			false -> nosideeffect
		end,
		cell:done(OutputCell),
		OutputCell
	end},	
	%% ============================================================================
	%% Number utility functions
	%% ============================================================================
	#exprFun{
	name = "add",
	type = "Number -> Number -> Number",
	function = fun(Val1, Val2) ->
		Val1 + Val2
	end},
	#exprFun{
	name = "subtract",
	type = "Number -> Number -> Number",
	function = fun(Val1, Val2) ->
		Val1 - Val2
	end},
	%% ============================================================================
	%% Other functions?
	%% ============================================================================
	#exprFun{
	name = "oneTo",
	type = "Number -> Set Number",
	function = fun(Val) ->
		OutputCell = cell:makeCell(),
		for(1, Val, fun(X) -> cell:addLine(OutputCell, X) end),
		cell:done(OutputCell),
		OutputCell
	end},
	#exprFun{
	name = "oneToMap",
	type = "Number -> Number -> Map Number Number",
	function = fun(Val1, Val2) ->
		OutputCell = cell:makeCell(),
		for(1, Val1, fun(X) -> cell:addLine(OutputCell, {pair, X, Val2}) end),
		cell:done(OutputCell),
		OutputCell
	end},
	#exprFun{
	name = "reactiveApply",
	type = "Unit (a -> b) -> a -> Unit b",
	function = fun(Cell, Input) ->
		OutputCell = cell:makeCell(),
		cell:injectFunc(Cell, OutputCell, fun(Val) ->
			cell:addLine(OutputCell, applyFun(Val, Input))
		end),
		OutputCell
	end},
	%% ============================================================================
	%% Null Type Functions
	%% ============================================================================
	#exprFun{
	name = "reactiveNot",
	type = "Unit Null -> Unit Null",
	function = fun(Cell) ->
		OutputCell = cell:makeCell(),
		cell:addLine(OutputCell, null),
		cell:injectFunc(Cell, OutputCell, fun(Val) ->
			cell:removeLine(OutputCell, null),
			fun () -> cell:addLine(OutputCell, null) end
		end),
		OutputCell
	end},
	#exprFun{
	name = "reactiveAnd",
	type = "Unit Null -> Unit Null -> Unit Null",
	function = fun(Cell1, Cell2) ->
		OutputCell = cell:makeCell(),
		UpdateOutputCell = fun (State) ->
			{C1, C2, IsSet} = State,
			if
				C1 andalso C2 andalso (not IsSet) ->
					cell:addLine(OutputCell, null),
					{C1, C2, true};
				IsSet ->
					cell:removeLine(OutputCell, null),
					{C1, C2, false};
				true ->
					State
			end
		end,
		Intercept = cell:injectIntercept(OutputCell, fun(Message, State) ->
			{C1, C2, IsSet} = State,
			case Message of
				{cell1val, Val} -> 
					UpdateOutputCell({Val, C2, IsSet});
				{cell2val, Val} ->
					UpdateOutputCell({C1, Val, IsSet})
			end
		end, {false, false, false}),
		cell:injectFuncs(Intercept, [{Cell1, fun(Val) ->
			intercept:sendIntercept(Intercept, {cell1val, true}),
			fun() -> intercept:sendIntercept(Intercept, {cell1val, false}) end
		end},
		{Cell2, fun(Val) ->
			intercept:sendIntercept(Intercept, {cell2val, true}),
			fun() -> intercept:sendIntercept(Intercept, {cell2val, false}) end
		end}]),
		OutputCell
	end},
	#exprFun{
	name = "reactiveOr",
	type = "Unit Null -> Unit Null -> Unit Null",
	function = fun(Cell1, Cell2) ->
		OutputCell = cell:makeCell(),
		UpdateOutputCell = fun (State) ->
			{C1, C2, IsSet} = State,
			if
				(C1 orelse C2) andalso (not IsSet) ->
					cell:addLine(OutputCell, null),
					{C1, C2, true};
				(not C1) andalso (not C2) andalso IsSet ->
					cell:removeLine(OutputCell, null),
					{C1, C2, false};
				true ->
					State
			end
		end,
		Intercept = cell:injectIntercept(OutputCell, fun(Message, State) ->
			{C1, C2, IsSet} = State,
			case Message of
				{cell1val, Val} -> 
					UpdateOutputCell({Val, C2, IsSet});
				{cell2val, Val} ->
					UpdateOutputCell({C1, Val, IsSet})
			end
		end, {false, false, false}),
		cell:injectFuncs(Intercept, [{Cell1, fun(Val) ->
			intercept:sendIntercept(Intercept, {cell1val, true}),
			fun() -> intercept:sendIntercept(Intercept, {cell1val, false}) end
		end},
		{Cell2, fun(Val) ->
			intercept:sendIntercept(Intercept, {cell2val, true}),
			fun() -> intercept:sendIntercept(Intercept, {cell2val, false}) end
		end}]),
		OutputCell
	end},
	#exprFun{
	name = "isEmpty",
	type = "Set a -> Unit Null",
	function = fun(Cell) ->
		OutputCell = cell:makeCell(),
		cell:addLine(OutputCell, null),
		Intercept = cell:injectIntercept(OutputCell, fun(Message, State) ->
			case Message of
				plus -> 
					case State of
						0 -> cell:removeLine(OutputCell, null),
							 1;
						_ -> State+1
					end;
				minus ->
					case State of
						1 -> cell:addLine(OutputCell, null),
							 0;
						_ -> State-1
					end
			end
		end, 0),
		cell:injectFunc(Cell, Intercept, fun(Val) ->
			intercept:sendIntercept(Intercept, plus),
			fun() -> intercept:sendIntercept(Intercept, minus) end
		end),
		OutputCell
	end},
	
	#exprFun{
	name = "gate",
	type = "Unit b -> a -> Unit a",
	function = fun(GateKeeper, Passer) ->
		OutputCell = cell:makeCell(),
		Intercept = cell:injectIntercept(OutputCell, fun(C1, IsSet) ->
			if
				C1 andalso (not IsSet) ->
					cell:addLine(OutputCell, Passer),
					true;
				(not C1) andalso IsSet ->
					cell:removeLine(OutputCell, Passer),
					false;
				true ->
					IsSet
			end
		end, false),
		cell:injectFunc(GateKeeper, Intercept, fun(Val) ->
			intercept:sendIntercept(Intercept, true),
			fun() -> intercept:sendIntercept(Intercept, false) end
		end),
		OutputCell
	end},
	
	% #exprFun{
	% name = "any",
	% type = "(a -> Unit Bool) -> Set a -> Unit Bool",
	% function = fun(Fun, Cell) ->
	% 	OutputCell = cell:makeCell(),
	% 	cell:addLine(OutputCell, false),
	% 	Intercept = cell:injectIntercept(OutputCell, fun(Message, Count) ->
	% 		case {Message, Count} of
	% 			{plus, 0} ->
	% 				cell:removeLine(OutputCell, false),
	% 				cell:addLine(OutputCell, true),
	% 				1;
	% 			{plus, Num} ->
	% 				Num + 1;
	% 			{minus, 1} ->
	% 				cell:removeLine(OutputCell, true),
	% 				cell:addLine(OutputCell, false),
	% 				0;
	% 			{minus, Num} ->
	% 				Num - 1
	% 		end
	% 	end, 0),
	% 	cell:injectFunc(Cell, OutputCell, fun(Val) ->
	% 		applyAndInject(Fun, Val, fun(InnerVal) ->
	% 			case InnerVal of
	% 				true ->
	% 					intercept:sendIntercept(Intercept, plus),
	% 					fun() -> intercept:sendIntercept(Intercept, minus) end;
	% 				false ->
	% 					undefined
	% 			end
	% 		end)
	% 	end),
	% 	OutputCell
	% end},
	#exprFun{
	name = "fold",
	type = "(a -> b -> b) -> (a -> b -> b) -> b -> Set a -> Unit b",
	function = fun(Fun, FunInv, Init, Cell) ->
		OutputCell = cell:makeCell(),
		cell:addLine(OutputCell, Init),
		Intercept = cell:injectIntercept(OutputCell, fun(Message, Cache) ->
			case Message of
				{plus, Val} -> 
					cell:removeLine(OutputCell, Cache),
					NewCache = applyFun(applyFun(Fun, Val), Cache),
					cell:addLine(OutputCell, NewCache),
					NewCache;
				{minus, Val} ->
					cell:removeLine(OutputCell, Cache),
					NewCache = applyFun(applyFun(FunInv, Val), Cache),
					cell:addLine(OutputCell, NewCache),
					NewCache
			end
		end, Init),
		cell:injectFunc(Cell, Intercept, fun(Val) ->
			intercept:sendIntercept(Intercept, {plus, Val}),
			fun() -> intercept:sendIntercept(Intercept, {minus, Val}) end
		end),
		OutputCell
	end},
	#exprFun{
	name = "unfoldSet",
	type = "(a -> Set a) -> a -> Set a",
	function = fun(Fun, Init) ->
		OutputCell = cell:makeCell(),
		unfoldSetHelper(Init, Fun, OutputCell, dict:new()),
		OutputCell
	end},
	#exprFun{
	name = "unfoldMap",
	type = "(a -> Set a) -> a -> Map a Number",
	function = fun(Fun, Init) ->
		OutputCell = cell:makeCell(),
		unfoldMapHelper({Init, 0}, Fun, OutputCell, dict:new()),
		OutputCell
	end},
	%% ============================================================================
	%% Map Functions
	%% ============================================================================
	#exprFun{
	name = "buildMap",
	type = "(a -> b) -> Set a -> Map a b",
	function = fun(Fun, Cell) ->
		OutputCell = cell:makeCell(),
		cell:injectFunc(Cell, OutputCell, fun(Val) ->
			Result = applyFun(Fun, Val),
			cell:addLine(OutputCell, {pair, Val, Result})
		end),
		OutputCell
	end},
	%%REMOVE THIS LATER... JUST FOR TESTING
	#exprFun{
	name = "flattenSet",
	type = "Set (Set a) -> Set a",
	function = fun(Cell) ->
		OutputCell = cell:makeCell(),
		cell:injectFunc(Cell, OutputCell, fun(InnerCell) ->
			cell:injectFunc(InnerCell, OutputCell, fun(Val) ->
				cell:addLine(OutputCell, Val) end)
		end),
		OutputCell
	end},
	#exprFun{
	name = "invert",
	type = "Map a (Set b) -> Map b (Set a)",
	function = fun(Cell) ->
		%TAG: EVALNOTYPE
		%SetType = type:buildType(type:get(Cell), "Map a (Set b)", "Set a"),
		OutputCell = cell:makeCell(),
		Intercept = cell:injectIntercept(OutputCell, fun(Message, BHash) ->
			case Message of
				{bHashAdd, BVal} ->
					case dict:find(BVal, BHash) of
						{ok, {BCell, Num}} -> dict:store(BVal, {BCell, Num+1}, BHash);
						_ -> 
							NewCell = cell:makeCell(),
							TypedCell = NewCell,
							%TAG: EVALNOTYPE
							%TypedCell = NewCell#exprCell{type=SetType},
							%cell:update(TypedCell),
							cell:addLine(OutputCell, {pair, BVal, TypedCell}),
							dict:store(BVal, {TypedCell, 1}, BHash)
					end;
				{bHashRemove, BVal} ->
					case dict:find(BVal, BHash) of
						{ok, {BCell, 1}} ->
							cell:removeLine(OutputCell, BVal),
							dict:erase(BVal, BHash);
						{ok, {BCell, Num}} ->
							dict:store(BVal, {BCell, Num-1}, BHash);
						_ -> BHash
					end;
				{addInnerLine, InnerVal, Key} ->
					{BCell, _} = dict:fetch(InnerVal, BHash),
					cell:addLine(BCell, Key),
					BHash;
				{removeInnerLine, InnerVal, Key} ->
					{BCell, _} = dict:fetch(InnerVal, BHash),
					cell:removeLine(BCell, Key),
					BHash;
				done ->
					dict:map(fun(BVal, {BCell,_}) -> 
						cell:done(BCell) end, BHash),
					BHash
			end
		end, dict:new()),
		
		cell:injectFunc(Cell, Intercept, fun({pair, Key, Val}) ->
			cell:injectFunc(Val, Intercept, fun(InnerVal) ->
				intercept:sendIntercept(Intercept, {bHashAdd, InnerVal}),
				intercept:sendIntercept(Intercept, {addInnerLine, InnerVal, Key}),
				fun() ->
					intercept:sendIntercept(Intercept, {removeInnerLine, InnerVal, Key}),
					intercept:sendIntercept(Intercept, {bHashRemove, InnerVal})
				end
			end)
		end),	
		cell:injectFunc(OutputCell, 
		fun() ->
			intercept:sendIntercept(Intercept, done)
		end,
		fun(Val) -> 
			%this is to make Intercept depend on Cell for being 'done' 
			fun() -> nosideeffect end 
		end),
		OutputCell
	end},
	#exprFun{
	name = "mapMapValue",
	type = "(a -> b) -> Map c a -> Map c b",
	function = fun(Fun, Cell) ->
		OutputCell = cell:makeCell(),
		cell:injectFunc(Cell, OutputCell, fun({pair, Key, Val}) ->
			Result = applyFun(Fun, Val),
			cell:addLine(OutputCell, {pair, Key, Result})
		end),
		OutputCell
	end},
	#exprFun{
	name = "getKey",
	type = "a -> Map a b -> Unit b",
	function = fun(GetKey, Cell) ->
		OutputCell = cell:makeCell(),
		cell:injectFunc(Cell, OutputCell, fun(KeyVal) ->
			case KeyVal of
				{pair, GetKey, Val} -> cell:addLine(OutputCell, Val);
				_ -> undefined
			end
		end),
		OutputCell
	end},
	#exprFun{
	name = "keys",
	type = "Map a b -> Set a",
	function = fun(Cell) ->
		OutputCell = cell:makeCell(),
		cell:injectFunc(Cell, OutputCell, fun({pair, Key, Val}) ->
			cell:addLine(OutputCell, Key)
		end),
		OutputCell
	end},
	%% ============================================================================
	%% Range/Sorted functions
	%% ============================================================================
	#exprFun{
	name = "rangeByKey",
	type = "Unit a -> Unit a -> Set a -> Set a",
	function = fun(StartCell, EndCell, Cell) ->
		OutputCell = cell:makeCell(),
		rangeHelper(OutputCell, fun(Min, Max) -> cell:setKeyRange(OutputCell, Min, Max) end, StartCell, EndCell, Cell)
	end},
	#exprFun{
	name = "takeLast",
	type = "Set a -> Unit a",
	function = fun(Cell) ->
		OutputCell = cell:makeCell(),
		Intercept = cell:injectIntercept(OutputCell, fun(Message, Cache) ->
			case Message of
				change -> 
					StateArray = cell:getStateArray(Cell),
					case length(StateArray) of
						0 -> 
							case Cache of
								undefined -> undefined;
								_ -> cell:removeLine(OutputCell, Cache)
							end;
						_ ->
							Last = lists:last(StateArray),
							case Cache of
								Last -> 
									Last;
								undefined ->
									cell:addLine(OutputCell, Last),
									Last;
								_ ->
									cell:removeLine(OutputCell, Cache),
									cell:addLine(OutputCell, Last),
									Last
							end
					end
			end
		end, undefined),
		intercept:sendIntercept(Intercept, change),
		cell:injectFunc(Cell, Intercept, fun(Val) ->
			intercept:sendIntercept(Intercept, change),
			fun() -> intercept:sendIntercept(Intercept, change) end
		end),
		OutputCell
	end}
	].

unfoldSetHelper(Val, Fun, OutputCell, Done) ->
	try dict:fetch(Val, Done) of
		Found -> fun() -> noSideEffect end
	catch _:_ ->
		applyAndInject(Fun, Val, OutputCell, fun(InnerVal) ->
			unfoldSetHelper(InnerVal, Fun, OutputCell, dict:store(Val, Val, Done))
		end),
		cell:addLine(OutputCell, Val)
	end.

unfoldMapHelper({Key, Val}, Fun, OutputCell, Done) ->
	try dict:fetch(Key, Done) of
		Found -> fun() -> noSideEffect end
	catch _:_ ->
		applyAndInject(Fun, Key, OutputCell, fun(InnerVal) ->
			unfoldMapHelper({InnerVal, Val+1}, Fun, OutputCell, dict:store(Key, Key, Done))
		end),
		cell:addLine(OutputCell, {pair, Key, Val})
	end.


bindUnitOrSetHelper(Fun, Cell) ->
	OutputCell = cell:makeCell(),
	cell:injectFunc(Cell, OutputCell, fun(Val) ->
		applyAndInject(Fun, Val, OutputCell, fun(InnerVal) ->
			cell:addLine(OutputCell, InnerVal) end
		)
	end),
	OutputCell.


rangeHelper(OutputCell, SetRangeFunc, StartCell, EndCell, Cell) ->
	%cell:makeSorted(outputCell)

	UpdateRange = fun(Start, End) ->
		if 
			not((Start =:= undefined) orelse (End =:= undefined)) -> SetRangeFunc(Start, End);
			(Start =:= undefined) andalso (End =:= undefined) -> cell:clearRange();
			true -> nochange
		end
	end,

	Intercept = cell:injectIntercept(OutputCell, fun(Message, {Start, End}) ->
		case Message of
			{startAdd, Val} ->
				UpdateRange(Val, End),
				{Val, End};
			startRemove ->
				UpdateRange(undefined, End),
				{undefined, End};
			{endAdd, Val} ->
				UpdateRange(Start, Val),
				{Start, Val};
			endRemove ->
				UpdateRange(Start, undefined),
				{Start, undefined}
		end
	end, {undefined, undefined}),
	
	cell:injectFuncs(Intercept, [{StartCell, fun(Val) ->
		intercept:sendIntercept(Intercept, {startAdd, Val}),
		fun() -> intercept:sendIntercept(Intercept, startRemove) end
	end},
	{EndCell, fun(Val) ->
		intercept:sendIntercept(Intercept, {endAdd, Val}),
		fun() -> intercept:sendIntercept(Intercept, endRemove) end
	end},
	{Cell, fun(Val) ->
		cell:addLine(OutputCell, Val)
	end}]),
	OutputCell.


for(Max, Max, F) -> [F(Max)];
for(I, Max, F) -> [F(I)|for(I+1, Max, F)].


applyFun(Fun, Input) ->
	eval:evaluate(#cons{type=apply, left=Fun, right=Input}).

applyAndInject(Fun, Input, OutputCell, InjectedFun) ->
	cell:injectFunc(applyFun(Fun, Input), OutputCell, InjectedFun).