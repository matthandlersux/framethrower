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
		OutputCell
	end},
	#exprFun{
	name = "returnUnitSet",
	type = "Unit a -> Set a",
	function = fun(Cell) ->
		OutputCell = cell:makeCell(),
		RemoveFunc = cell:injectFunc(Cell, fun(Val) ->
			cell:addLine(OutputCell, Val) end),
		cell:addOnRemove(OutputCell, RemoveFunc),
		OutputCell
	end},
	#exprFun{
	name = "returnUnitAssoc",
	type = "a -> Unit b -> Assoc a b",
	function = fun(Key, Cell) ->
		OutputCell = cell:makeCellAssocInput(),
		RemoveFunc = cell:injectFunc(Cell, fun(Val) ->
			cell:addLine(OutputCell, {Key, Val}) end),
		cell:addOnRemove(OutputCell, RemoveFunc),
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
	name = "bindAssoc",
	type = "(a -> b -> Assoc a c) -> Assoc a b -> Assoc a c",
	function = fun(Fun, Cell) ->
		OutputCell = cell:makeCellAssocInput(),
		RemoveFunc = cell:injectFunc(Cell, fun({Key,Val}) ->
			applyAndInject(applyFun(Fun, Key), Val, fun(InnerVal) ->
				cell:addLine(OutputCell, InnerVal) end
			)
		end),
		cell:addOnRemove(OutputCell, RemoveFunc),
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
		RemoveFunc1 = cell:injectFunc(Cell1, fun(Val) ->
			cell:addLine(OutputCell, Val) end
		),
		RemoveFunc2 = cell:injectFunc(Cell2, fun(Val) ->
			cell:addLine(OutputCell, Val) end
		),
		cell:addOnRemove(OutputCell, RemoveFunc1),
		cell:addOnRemove(OutputCell, RemoveFunc2),
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
		RemoveFunc1 = cell:injectFunc(Cell1, fun(Val) ->
			intercept:sendIntercept(Intercept, {plus, Val}),
			fun() -> intercept:sendIntercept(Intercept, {minus, Val}) end
		end),
		RemoveFunc2 = cell:injectFunc(Cell2, fun(Val) ->
			intercept:sendIntercept(Intercept, {minus, Val}),
			fun() -> intercept:sendIntercept(Intercept, {plus, Val}) end
		end),
		
		cell:addOnRemove(OutputCell, RemoveFunc1),
		cell:addOnRemove(OutputCell, RemoveFunc2),
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
		OutputCell
	end},
	#exprFun{
	name = "x2",
	type = "Number -> Set Number",
	function = fun(Val) ->
		OutputCell = cell:makeCell(),
		cell:addLine(OutputCell, Val*2),
		OutputCell
	end},
	#exprFun{
	name = "oneToAssoc",
	type = "Number -> Number -> Assoc Number Number",
	function = fun(Val1, Val2) ->
		OutputCell = cell:makeCellAssocInput(),
		for(1, Val1, fun(X) -> cell:addLine(OutputCell, {X, Val2}) end),
		OutputCell
	end},
	#exprFun{
	name = "x2ToAssoc",
	type = "Number -> Number -> Assoc Number Number",
	function = fun(Val1, Val2) ->
		OutputCell = cell:makeCellAssocInput(),
		cell:addLine(OutputCell, {Val1*2, Val2}),
		OutputCell
	end},
	#exprFun{
	name = "reactiveApply",
	type = "Unit (a -> b) -> a -> Unit b",
	function = fun(Cell, Input) ->
		OutputCell = cell:makeCell(),
		RemoveFunc = cell:injectFunc(Cell, fun(Val) ->
			cell:addLine(OutputCell, applyFun(Val, Input)) end),
		cell:addOnRemove(OutputCell, RemoveFunc),
		OutputCell
	end},
	#exprFun{
	name = "passThru",
	type = "(a -> Bool) -> a -> Unit a",
	function = fun(Fun, Input) ->
		OutputCell = cell:makeCell(),
		case applyFun(Fun, Input) of
			true -> cell:addLine(OutputCell, Input);
			_ -> false
		end,
		OutputCell
	end},
	#exprFun{
	name = "any",
	type = "(a -> Unit Bool) -> Set a -> Unit Bool",
	function = fun(Fun, Cell) ->
		OutputCell = cell:makeCell(),
		cell:addLine(OutputCell, false),
		Intercept = cell:injectIntercept(OutputCell, fun(Message, Count) ->
			case {Message, Count} of
				{plus, 0} ->
					cell:removeLine(OutputCell, false),
					cell:addLine(OutputCell, true),
					1;
				{plus, Num} ->
					Num + 1;
				{minus, 1} ->
					cell:removeLine(OutputCell, true),
					cell:addLine(OutputCell, false),
					0;
				{minus, Num} ->
					Num - 1
			end
		end, 0),
		RemoveFunc = cell:injectFunc(Cell, fun(Val) ->
			applyAndInject(Fun, Val, fun(InnerVal) ->
				case InnerVal of
					true ->
						intercept:sendIntercept(Intercept, plus),
						fun() -> intercept:sendIntercept(Intercept, minus) end;
					false ->
						undefined
				end
			end)
		end),
		cell:addOnRemove(OutputCell, RemoveFunc),
		OutputCell
	end},
	#exprFun{
	name = "fold",
	type = "(a -> b -> b) -> (b -> a -> a) -> b -> Set a -> Unit b",
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
					NewCache = applyFun(applyFun(FunInv, Cache), Val),
					cell:addLine(OutputCell, NewCache),
					NewCache
			end
		end, Init),
		RemoveFunc = cell:injectFunc(Cell, fun(Val) ->
			intercept:sendIntercept(Intercept, {plus, Val}),
			fun() -> intercept:sendIntercept(Intercept, {minus, Val}) end
		end),
		cell:addOnRemove(OutputCell, RemoveFunc),
		OutputCell
	end},
	#exprFun{
	name = "unfoldSet",
	type = "(a -> Set a) -> a -> Set a",
	function = fun(Fun, Init) ->
		OutputCell = cell:makeCell(),
		cell:addLine(OutputCell, Init),
		cell:injectFunc(OutputCell, fun(Val) ->
			applyAndInject(Fun, Val, fun(InnerVal) ->
				cell:addLine(OutputCell, InnerVal) 
			end)
		end),
		OutputCell
	end},
	#exprFun{
	name = "unfoldAssoc",
	type = "(a -> Set a) -> a -> Assoc a Number",
	function = fun(Fun, Init) ->
		OutputCell = cell:makeCellAssocInput(),
		cell:addLine(OutputCell, {Init, 0}),
		cell:injectFunc(OutputCell, fun({Key, Val}) ->
			applyAndInject(Fun, Key, fun(InnerVal) ->
				cell:addLine(OutputCell, {InnerVal, Val+1})
			end)
		end),
		OutputCell
	end},
	%% ============================================================================
	%% Assoc Functions
	%% ============================================================================
	#exprFun{
	name = "buildAssoc",
	type = "(a -> b) -> Set a -> Assoc a b",
	function = fun(Fun, Cell) ->
		OutputCell = cell:makeCellAssocInput(),
		RemoveFunc = cell:injectFunc(Cell, fun(Val) ->
			Result = applyFun(Fun, Val),
			cell:addLine(OutputCell, {Val, Result})
		end),
		cell:addOnRemove(OutputCell, RemoveFunc),
		OutputCell
	end},
	%%REMOVE THIS LATER... JUST FOR TESTING
	#exprFun{
	name = "flattenSet",
	type = "Set (Set a) -> Set a",
	function = fun(Cell) ->
		OutputCell = cell:makeCell(),
		RemoveFunc = cell:injectFunc(Cell, fun(InnerCell) ->
			cell:injectFunc(InnerCell, fun(Val) ->
				cell:addLine(OutputCell, Val) end)
		end),
		cell:addOnRemove(OutputCell, RemoveFunc),
		OutputCell
	end},
	#exprFun{
	name = "invert",
	type = "Assoc a (Set b) -> Assoc b (Set a)",
	function = fun(Cell) ->
		OutputCell = cell:makeCellAssocInput(),
		BHashCell = cell:makeCell(),
		Intercept = cell:injectIntercept(OutputCell, fun(Message, BHash) ->
			case Message of
				{bHashAdd, BVal} -> 
					NewCell = cell:makeCell(),
					cell:addLine(OutputCell, {BVal, NewCell}),
					dict:store(BVal, NewCell, BHash);
				{bHashRemove, BVal} ->
					cell:removeLine(OutputCell, BVal),
					dict:erase(BVal, BHash);
				{addInnerLine, InnerVal, Key} ->
					cell:addLine(dict:fetch(InnerVal, BHash), Key),
					BHash;
				{removeInnerLine, InnerVal, Key} ->
					cell:removeLine(dict:fetch(InnerVal, BHash), Key),
					BHash
			end
		end, dict:new()),
		RemoveFunc1 = cell:injectFunc(BHashCell, fun(BVal) ->
			intercept:sendIntercept(Intercept, {bHashAdd, BVal}),
			fun() -> intercept:sendIntercept(Intercept, {bHashRemove, BVal}) end
		end),
		RemoveFunc2 = cell:injectFunc(Cell, fun({Key, Val}) ->
			cell:injectFunc(Val, fun(InnerVal) ->
				OnRemove1 = cell:addLine(BHashCell, InnerVal),
				intercept:sendIntercept(Intercept, {addInnerLine, InnerVal, Key}),
				fun() ->
					intercept:sendIntercept(Intercept, {removeInnerLine, InnerVal, Key}),
					OnRemove1()
				end
			end)
		end),
		cell:addOnRemove(OutputCell, RemoveFunc1),
		cell:addOnRemove(OutputCell, RemoveFunc2),
		OutputCell
	end},
	#exprFun{
	name = "mapAssocValue",
	type = "(a -> b) -> Assoc c a -> Assoc c b",
	function = fun(Fun, Cell) ->
		OutputCell = cell:makeCellAssocInput(),
		RemoveFunc = cell:injectFunc(Cell, fun({Key, Val}) ->
			Result = applyFun(Fun, Val),
			cell:addLine(OutputCell, {Key, Result})
		end),
		cell:addOnRemove(OutputCell, RemoveFunc),
		OutputCell
	end},
	#exprFun{
	name = "getKey",
	type = "a -> Assoc a b -> Unit b",
	function = fun(GetKey, Cell) ->
		OutputCell = cell:makeCell(),
		RemoveFunc = cell:injectFunc(Cell, fun(KeyVal) ->
			case KeyVal of
				{GetKey, Val} -> cell:addLine(OutputCell, Val);
				_ -> undefined
			end
		end),
		cell:addOnRemove(OutputCell, RemoveFunc),
		OutputCell
	end},
	#exprFun{
	name = "keys",
	type = "Assoc a b -> Set a",
	function = fun(Fun, Cell) ->
		OutputCell = cell:makeCell(),
		RemoveFunc = cell:injectFunc(Cell, fun({Key, Val}) ->
			cell:addLine(OutputCell, Key)
		end),
		cell:addOnRemove(OutputCell, RemoveFunc),
		OutputCell
	end}
	].



bindUnitOrSetHelper(Fun, Cell) ->
	OutputCell = cell:makeCell(),
	RemoveFunc = cell:injectFunc(Cell, fun(Val) ->
		applyAndInject(Fun, Val, fun(InnerVal) ->
			cell:addLine(OutputCell, InnerVal) end
		)
	end),
	cell:addOnRemove(OutputCell, RemoveFunc),
	OutputCell.

for(Max, Max, F) -> [F(Max)];
for(I, Max, F) -> [F(I)|for(I+1, Max, F)].


applyFun(Fun, Input) ->
	eval:evaluate(#cons{type=apply, left=Fun, right=Input}).

applyAndInject(Fun, Input, InjectedFun) ->
	#exprCell{pid=Pid} = applyFun(Fun, Input),
	cell:injectFunc(Pid, InjectedFun).