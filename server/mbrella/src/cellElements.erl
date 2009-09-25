-module (cellElements.erl).
-compile(export_all).

-include().

-ifdef( debug ).
-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X]) ).
-else.
-define( trace(X), void ).
-endif.

%% ====================================================
%% notes
%% ====================================================

%the elements shouldn't think about add/remove, it should just keep an integer weighting
%for all elements

%% ====================================================
%% TYPES
%% ====================================================


%% ====================================================
%% External API
%% ====================================================

new() -> new(unit).
new(unit) ->
	{unit, {undefined, 0}};
new(set) ->
	{set, rangedict:new()};
new(map) ->
	{map, rangedict:new()}.
	
create(Modifier, Value) ->
	{Modifier, Value}.
	
createAdd(Value) ->
	{add, Value}.
	
createRemove(Value) ->
	{remove, Value}.
	
modifier({Modifier, _}) ->
	Modifier.
	
value({_, Value}) ->
	Value.
	

%% 
%% send :: List Elements -> ElementState -> Tuple NewElementState ReturnedElements
%% 

send(Elements, {Type, State}) ->
	case sendElements(Type, State, Elements) of
		[] ->
			{{Type, State}, []};
		Result ->
			Result
	end.

%% ====================================================
%% Internal API
%% ====================================================

sendElements(unit, {Value, Weight} = State, SentElement) ->
	case {modifier(SentElement), value(SentElement)} of
		{add, Value} ->
			{{Value, Weight + 1}, []}
		{remove, Value} ->
			case Weight of
				1 ->
					{{undefined, 0}, SentElement};
				_ ->
					{{Value, Weight - 1}, []}	
		{add, NewValue} ->
			{{NewValue, 1}, SentElement};
		{remove, NewValue} ->
			{State, []}
	end;
%% ====================================================
%% Utilities
%% ====================================================

