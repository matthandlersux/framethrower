-module (primFuncs).
-compile(export_all).

-include ("../../../lib/ast.hrl").

getPrimitives() ->
	BindUnitOrSetHelper = fun(Fun, Cell) ->
		OutputCell = cell:makeCell(),
		RemoveFunc = cell:injectFunc(Cell, fun(Val) ->
			ResultCell = cell:applyFunc(Fun, Val),
			cell:injectFunc(ResultCell, fun(InnerVal) ->
				cell:addLine(OutputCell, InnerVal) end
			)
		end),
		cell:addOnRemove(OutputCell, RemoveFunc),
		OutputCell
	end,
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
	function = BindUnitOrSetHelper},
	#exprFun{
	name = "bindSet",
	type = "(a -> Set b) -> Set a -> Set b",
	function = BindUnitOrSetHelper},
	#exprFun{
	name = "bindAssoc",
	type = "(a -> b -> Assoc a c) -> Assoc a b -> Assoc a c",
	function = fun(Fun, Cell) ->
		OutputCell = cell:makeCellAssocInput(),
		RemoveFunc = cell:injectFunc(Cell, fun({Key,Val}) ->
			ResultCell = cell:applyFunc(cell:applyFunc(Fun, Key),Val),
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
		RemoveFunc1 = cell:injectFunc(Cell1, fun(Val) ->
			cell:addLine(OutputCell, Val) end
		),
		RemoveFunc2 = cell:injectFunc(Cell1, fun(Val) ->
			cell:addLine(OutputCell, Val) end
		),
		
		
		cell:addOnRemove(OutputCell, RemoveFunc1),
		cell:addOnRemove(OutputCell, RemoveFunc2),
		OutputCell
	end}
	].