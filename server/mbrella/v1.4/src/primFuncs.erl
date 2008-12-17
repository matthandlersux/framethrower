-module (primFuncs).
-compile(export_all).

-include ("../../../lib/ast.hrl").

bindUnitOrSetHelper(Fun, Cell) ->
	OutputCell = cell:makeCell(),
	RemoveFunc = cell:injectFunc(Cell, fun(Val) ->
		ResultCell = cell:applyFunc(Fun, Val),
		cell:injectFunc(ResultCell, fun(InnerVal) ->
			cell:addLine(OutputCell, InnerVal) end
		)
	end),	
	OutputCell.


getPrimitives() ->
	[
	#exprFun{
	name = "returnUnit",
	type = "a -> Unit a",
	function = fun(Val) ->
		OutputCell = cell:makeCell(),
		cell:addLine(OutputCell, Val),
		OutputCell
	end},

returnUnitSet() ->
	Type = "Unit a -> Set a",
	Func = fun(Cell) ->
		OutputCell = cell:makeCell(),
		RemoveFunc = cell:injectFunc(Cell, fun(Val) ->
			cell:addLine(OutputCell, Val) end),
		OutputCell
	end,
	{Type, Func}.

returnUnitAssoc() ->
	Type = "a -> Unit b -> Assoc a b",
	Func = fun(Key, Cell) ->
		OutputCell = cell:makeCellAssocInput(),
		RemoveFunc = cell:injectFunc(Cell, fun(Val) ->
			cell:addLine(OutputCell, {Key, Val}) end),
		OutputCell
	end,
	{Type, Func}.
	
bindUnit() ->
	Type = "(a -> Unit b) -> Unit a -> Unit b",
	Func = fun bindUnitOrSetHelper/2,
	{Type, Func}.
	
bindSet() ->
	Type = "(a -> Set b) -> Set a -> Set b",
	Func = fun bindUnitOrSetHelper/2,
	{Type, Func}.

bindAssoc() ->
	Type = "(a -> b -> Assoc a c) -> Assoc a b -> Assoc a c",
	Func = fun(Fun, Cell) ->
		OutputCell = cell:makeCellAssocInput(),
		RemoveFunc = cell:injectFunc(Cell, fun({Key,Val}) ->
			ResultCell = cell:applyFunc(cell:applyFunc(Fun, Key),Val),
			cell:injectFunc(ResultCell, fun(InnerVal) ->
				cell:addLine(OutputCell, InnerVal) end
			)
		end),
		OutputCell
	end,
	{Type, Func}.
