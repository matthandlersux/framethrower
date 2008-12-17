-module (primfunctions).
-compile(export_all).

-include ("../../../lib/ast.hrl").

getPrimitives() ->
	BindUnitOrSetHelper = fun(Fun, Cell) ->
		OutputCell = cell:makeCell(),
		Removefunction = cell:injectfunction(Cell, fun(Val) ->
			ResultCell = cell:applyfunction(Fun, Val),
			cell:injectfunction(ResultCell, fun(InnerVal) ->
				cell:addLine(OutputCell, InnerVal) end
			)
		end),
		OutputCell
	end,
	[
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
		Removefunction = cell:injectfunction(Cell, fun(Val) ->
			cell:addLine(OutputCell, Val) end),
		OutputCell
	end},
	#exprFun{
	name = "returnUnitAssoc",
	type = "a -> Unit b -> Assoc a b",
	function = fun(Key, Cell) ->
		OutputCell = cell:makeCellAssocInput(),
		Removefunction = cell:injectfunction(Cell, fun(Val) ->
			cell:addLine(OutputCell, {Key, Val}) end),
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
		Removefunction = cell:injectfunction(Cell, fun({Key,Val}) ->
			ResultCell = cell:applyfunction(cell:applyfunction(Fun, Key),Val),
			cell:injectfunction(ResultCell, fun(InnerVal) ->
				cell:addLine(OutputCell, InnerVal) end
			)
		end),
		OutputCell
	end}
	].