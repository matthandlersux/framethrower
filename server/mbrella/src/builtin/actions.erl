-module (actions).
-compile(export_all).

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X]) ).

set(Cell, Value) ->
	ast:makeActionMethod(actions, performAdd, [Cell, Value]).
	
unset(Cell) ->
	ast:makeActionMethod(actions, performUnset, [Cell]).

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


% performAdd :: Cell -> Term -> Void

performAdd(Cell, Value) ->
	cell:addValue(Cell, Value), 
	void.

% performUnset :: Cell -> Void

performUnset(Cell) ->
	cell:unset(Cell),
	void.

% performRemove :: Cell -> Term -> Void

performRemove(Cell, Value) ->
	cell:removeValue(Cell, Value),
	void.

% performRemove :: Term -> Term
performReturn(Value) ->
	Value.
