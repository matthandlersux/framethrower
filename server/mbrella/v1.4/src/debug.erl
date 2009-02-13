-module(debug).

-include("../include/scaffold.hrl").

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X])).

-compile(export_all).

-record(cellState, {funcs, dots, toKey, onRemoves=[], funcColor=0, intercept, done=false}).
-record(onRemove, {function, cell, id, done}).
-record(func, {function, outputCellOrIntOrFunc}).
-record(interceptState, {function, state, ownerCell}).

toList(X) when is_list(X) -> X;
toList(X) -> binary_to_list(mblib:exprElementToJson(X)).

getDebugHTML(Name, BaseURL) ->
	GetElemHtml = fun (Elem) ->
		case Elem of
			Cell when is_record(Cell, exprCell) ->
				Id = toList(Elem),
				"<a href=\"" ++ BaseURL ++ Id ++ "\">" ++ "Cell: " ++ Id ++ "</a>";
			Object when is_record(Object, object) ->
				Id = toList(Elem),
				"<a href=\"" ++ BaseURL ++ Id ++ "\">" ++ "Object: " ++ Id ++ "</a>";
			Intercept when is_pid(Intercept) ->
				OwnerCell = (intercept:getState(Intercept))#interceptState.ownerCell,
				Id = toList(OwnerCell),
				"<a href=\"" ++ BaseURL ++ Id ++ "\">" ++ "Intercept OwnerCell: " ++ Id ++ "</a>";
			Other ->
				toList(Elem)
		end
	end,
	
	GetPropHTML = fun (Prop) ->
		dict:fold(fun(PropName, PropVal, Acc) ->
			Acc ++ PropName ++ ": " ++ GetElemHtml(PropVal) ++ "<br />"
		end, "", Prop)
	end,
	
	GetStateArrayHTML = fun (StateArray) ->
		lists:foldr(fun(Elem, Acc) ->
			case Elem of
				{Key, Val} -> Acc ++ "{Key: " ++ GetElemHtml(Key) ++ ", Val: " ++ GetElemHtml(Val) ++ "}, ";
				_ -> Acc ++ GetElemHtml(Elem) ++ ", "
			end
		end, "", StateArray)
	end,

	GetCastingHTML = fun (CastingDict) ->
		dict:fold(fun(ClassName, ObjectString, Acc) ->
			Acc ++ ClassName ++ ": " ++ GetElemHtml(env:lookup(ObjectString)) ++ "<br />"
		end, "", CastingDict)
	end,
	
	GetDependenciesHTML = fun (CellState) ->
		OnRemoves = CellState#cellState.onRemoves,
		lists:foldr(fun(OnRemove, Acc) ->
			Acc ++ "Cell: " ++ GetElemHtml(OnRemove#onRemove.cell) ++ ", Id: " ++ toList(OnRemove#onRemove.id) ++ ", Done: " ++ toList(OnRemove#onRemove.done) ++ "<br />"
		end, "", OnRemoves)
	end,
	
	GetDependersHTML = fun (CellState) ->
		Funcs = CellState#cellState.funcs,
		dict:fold(fun(Id, Func, Acc) ->
			Acc ++ "FuncId: " ++ toList(Id) ++ ", OutputCellOrInt: " ++ GetElemHtml(Func#func.outputCellOrIntOrFunc) ++ "<br />"
		end, "", Funcs)
	end,

	case env:lookup(Name) of
		Object when is_record(Object, object) ->
			Name ++ ": Object <br />" ++ 
			"Type: " ++ type:unparse(Object#object.type) ++"<br />" ++
			"Prop: <br />" ++ GetPropHTML(Object#object.prop) ++ "<br />" ++
			"Casting: <br />" ++ GetCastingHTML(Object#object.castingDict) ++ "<br />";
		Cell when is_record(Cell, exprCell) ->
			Name ++ ": Cell <br />" ++ 
			"Type: " ++ toList(type:unparse(Cell#exprCell.type)) ++"<br />" ++
			"State: " ++ GetStateArrayHTML(cell:getStateArray(Cell)) ++ "<br />" ++ 
			"Done: " ++ toList((cell:getState(Cell))#cellState.done) ++ "<br /><br />" ++
			"Dependencies: " ++ GetDependenciesHTML(cell:getState(Cell)) ++ "<br />" ++
			"Dependers: " ++ GetDependersHTML(cell:getState(Cell)) ++ "<br />";
		notfound ->
			notfound
	end.
	

httpSearchPage() ->
	"
	<html>
	<body>
		<form method='get' action='debug'>
			<input type='text' name='name' />
			<input type='submit' />
		</form>
	<body>
	</html>
	".