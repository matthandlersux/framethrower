-module (actions).
-compile(export_all).

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X]) ).

makeActionMethod(Module, Name, Arguments) ->
	{actionMethod, {Module, Name, Arguments}}.

isActionMethod({actionMethod, _}) -> true;
isActionMethod(_) -> false.

set(Cell, Value) ->
	makeActionMethod(actions, performAdd, [Cell, Value]).
	
unset(Cell, Value) ->
	makeActionMethod(actions, performRemove, [Cell, Value]).

add(Cell, Value) ->
	makeActionMethod(actions, performAdd, [Cell, Value]).

remove(Cell, Value) ->
	makeActionMethod(actions, performRemove, [Cell, Value]).

addEntry(Cell, Key, Value) ->
	makeActionMethod(actions, performAdd, [Cell, cellElements:createMap(Key, Value)]).

removeEntry(Cell, Key) ->
	makeActionMethod(actions, performRemove, [Cell, cellElements:createMap(Key, dummyValue)]).

return(Value) ->
	makeActionMethod(actions, performReturn, [Value]).


performAdd(Cell, Value) ->
	cell:addValue(Cell, Value).

performRemove(Cell, Value) ->
	cell:removeValue(Cell, Value).
	
performReturn(Value) ->
	Value.
