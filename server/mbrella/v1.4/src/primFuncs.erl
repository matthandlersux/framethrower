-module (primFuncs).
-compile(export_all).

-include ("../../../lib/ast.hrl").

getPrimitives() ->
	BuildEnv = fun(#exprFun{type = TypeString, name = Name} = Expr, {Suffix, Dict}) ->
			{Suffix + 1, dict:store(Name, Expr#exprFun{type = type:shiftVars( type:parse(TypeString), integer_to_list(Suffix) ++ "v")}, Dict)}
		end,
	% BuildEnv = fun({Name, TypeString, Fun}, {Suffix, Dict}) ->
	% 				{Suffix + 1, dict:store(Name, {type:shiftVars( type:parse(TypeString), integer_to_list(Suffix) ++ "v"), Fun}, Dict)}
	% 			end,
	FunList = primitives(),
	{_, FinalDict} = lists:foldl( BuildEnv, {1, dict:new()}, FunList),
	FinalDict.
				
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
			ResultCell = applyFunc(applyFunc(Fun, Key),Val),
			cell:injectFunc(ResultCell, fun(InnerVal) ->
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
		RemoveFunc2 = cell:injectFunc(Cell1, fun(Val) ->
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
		cell:injectIntercept(OutputCell, fun(Message, State) ->
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
			cell:sendIntercept(OutputCell, {plus, Val}),
			fun() -> cell:sendIntercept(OutputCell, {minus, Val}) end
		end),
		RemoveFunc2 = cell:injectFunc(Cell1, fun(Val) ->
			cell:sendIntercept(OutputCell, {minus, Val}),
			fun() -> cell:sendIntercept(OutputCell, {plus, Val}) end
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
			cell:addLine(OutputCell, applyFunc(Val, Input)) end),
		cell:addOnRemove(OutputCell, RemoveFunc),
		OutputCell
	end},
	#exprFun{
	name = "passThru",
	type = "(a -> Bool) -> a -> Unit a",
	function = fun(Fun, Input) ->
		OutputCell = cell:makeCell(),
		case applyFunc(Fun, Input) of
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
		cell:injectIntercept(OutputCell, fun(Message, {count, Count}) ->
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
		end, {count, 0}),
		RemoveFunc = cell:injectFunc(Cell, fun(Val) ->
			ResultCell = applyFunc(Fun, Val),
			cell:injectFunc(fun(InnerVal) ->
				case InnerVal of
					true ->
						cell:sendIntercept(OutputCell, plus),
						fun() -> cell:sendIntercept(OutputCell, minus) end;
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
		cell:injectIntercept(OutputCell, fun(Message, {cache, Cache}) ->
			case Message of
				{plus, Val} -> 
					cell:removeLine(OutputCell, Cache),
					NewCache = applyFunc(applyFunc(Fun, Val), Cache),
					cell:addLine(OutputCell, NewCache),
					NewCache;
				{minus, Val} ->
					cell:removeLine(OutputCell, Cache),
					NewCache = applyFunc(applyFunc(FunInv, Cache), Val),
					cell:addLine(OutputCell, NewCache),
					NewCache
			end
		end, {cache, Init}),
		RemoveFunc = cell:injectFunc(Cell, fun(Val) ->
			cell:sendIntercept(OutputCell, {plus, Val}),
			fun() -> cell:sendIntercept(OutputCell, {minus, Val}) end
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
			ResultCell = applyFunc(Fun, Val),
			cell:injectFunc(ResultCell, fun(InnerVal) ->
				cell:addLine(OutputCell, InnerVal) end)
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
			ResultCell = applyFunc(Fun, Key),
			cell:injectFunc(ResultCell, fun(InnerVal) ->
				cell:addLine(OutputCell, {InnerVal, Val+1}) end)
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
			Result = applyFunc(Fun, Val),
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
		cell:injectIntercept(OutputCell, fun(Message, {bHash, BHash}) ->
			case Message of
				{bHashAdd, BVal} -> 
					NewCell = cell:makeCell(),
					cell:addLine(OutputCell, {BVal, NewCell}),
					dict:store(BVal, NewCell, BHash);
				{bHashRemove, BVal} ->
					cell:removeLine(OutputCell, BVal),
					dict:remove(BVal, BHash);
				{addInnerLine, InnerVal, Key} ->
					cell:addLine(dict:fetch(InnerVal, BHash), Key),
					BHash;
				{removeInnerLine, InnerVal, Key} ->
					cell:removeLine(dict:fetch(InnerVal, BHash), Key),
					BHash
			end
		end, {bHash, dict:new()}),
		RemoveFunc1 = cell:injectFunc(BHashCell, fun(BVal) ->
			cell:sendIntercept(OutputCell, {bHashAdd, BVal}),
			fun() -> cell:sendIntercept(OutputCell, {bHashRemove, BVal}) end
		end),
		RemoveFunc2 = cell:injectFunc(Cell, fun({Key, Val}) ->
			cell:injectFunc(Val, fun(InnerVal) ->
				OnRemove1 = cell:addLine(BHashCell, InnerVal),
				cell:sendIntercept(OutputCell, {addInnerLine, InnerVal, Key}),
				fun() ->
					cell:sendIntercept(OutputCell, {removeInnerLine, InnerVal, Key}),
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
			Result = applyFunc(Fun, Val),
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
		ResultCell = applyFunc(Fun, Val),
		cell:injectFunc(ResultCell, fun(InnerVal) ->
			cell:addLine(OutputCell, InnerVal) end
		)
	end),
	cell:addOnRemove(OutputCell, RemoveFunc),
	OutputCell.

applyFunc(Func, Input) ->
	Func(Input).

for(Max, Max, F) -> [F(Max)];
for(I, Max, F) -> [F(I)|for(I+1, Max, F)].
	