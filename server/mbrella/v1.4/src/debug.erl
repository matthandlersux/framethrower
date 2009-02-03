-module(debug).

-include("../include/scaffold.hrl").

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X])).

-compile(export_all).

getDebugHTML(Name, BaseURL) ->
	GetElemHtml = fun (Elem) ->
		case Elem of
			Cell when is_record(Cell, exprCell) ->
				Id = binary_to_list(mblib:exprElementToJson(Elem)),
				"<a href=\"" ++ BaseURL ++ Id ++ "\">" ++ "Cell: " ++ Id ++ "</a>";
			Object when is_record(Object, object) ->
				Id = binary_to_list(mblib:exprElementToJson(Elem)),
				"<a href=\"" ++ BaseURL ++ Id ++ "\">" ++ "Object: " ++ Id ++ "</a>";
			Other ->
				binary_to_list(mblib:exprElementToJson(Elem))
		end
	end,
	
	GetPropHTML = fun (Prop) ->
		dict:fold(fun(PropName, PropVal, Acc) ->
			Acc ++ PropName ++ ": " ++ GetElemHtml(PropVal) ++ "<br />"
		end, "", Prop)
	end,
	
	GetStateArrayHTML = fun (StateArray) ->
		lists:foldr(fun(Elem, Acc) ->
			Acc ++ GetElemHtml(Elem) ++ ", "
		end, "", StateArray)
	end,

	GetCastingHtml = fun (CastingDict) ->
		dict:fold(fun(ClassName, Object, Acc) ->
			Acc ++ ClassName ++ ": " ++ GetElemHtml(Object) ++ "<br />"
		end, "", CastingDict)
	end,
	
	case env:lookup(Name) of
		Object when is_record(Object, object) ->
			Name ++ ": Object <br />" ++ 
			"Type: " ++ type:unparse(Object#object.type) ++"<br />" ++
			"Prop: <br />" ++ GetPropHTML(Object#object.prop) ++ "<br />" ++
			"Casting: <br />" ++ GetCastingHTML(Object#object.castingDict) ++ "<br />";
		Cell when is_record(Cell, exprCell) ->
			Name ++ ": Cell <br />" ++ 
			"Type: " ++ type:unparse(Cell#exprCell.type) ++"<br />" ++
			"State: " ++ GetStateArrayHTML(cell:getStateArray(Cell)) ++ "<br />";
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