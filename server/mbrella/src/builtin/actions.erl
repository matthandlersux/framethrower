-module (actions).
-compile(export_all).

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X]) ).



add(Cell, Value) ->
	ast:makeActionMethod(actions, performAdd, [Cell, Value]).

performAdd(Cell, Value) ->
	cell:addValue(Cell, Value).

return(Value) ->
	ast:makeActionMethod(actions, performReturn, [Value]).
	
performReturn(Value) ->
	Value.