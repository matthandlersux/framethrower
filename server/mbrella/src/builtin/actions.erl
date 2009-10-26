-module (actions).
-compile(export_all).

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X]) ).

set(Cell, Value) ->
	ast:makeActionMethod(actions, performAdd, [Cell, Value]).
	
unset(Cell, Value) ->
	ast:makeActionMethod(actions, performRemove, [Cell, Value]).

add(Cell, Value) ->
	ast:makeActionMethod(actions, performAdd, [Cell, Value]).

remove(Cell, Value) ->
	ast:makeActionMethod(actions, performRemove, [Cell, Value]).

addEntry(Cell, Key, Value) ->
	ast:makeActionMethod(actions, performAdd, [Cell, cellElements:createMap(Key, Value)]).

removeEntry(Cell, Key) ->
	ast:makeActionMethod(actions, performRemove, [Cell, cellElements:createMap(Key, dummyValue)]).

return(Value) ->
	ast:makeActionMethod(actions, performReturn, [Value]).


performAdd(Cell, Value) ->
	cell:addValue(Cell, Value).

performRemove(Cell, Value) ->
	cell:removeValue(Cell, Value).
	
performReturn(Value) ->
	Value.
