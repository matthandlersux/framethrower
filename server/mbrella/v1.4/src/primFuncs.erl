-module (primFuncs).
-compile(export_all).

-include ("../../../lib/ast.hrl").

getPrimitives() ->
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
	