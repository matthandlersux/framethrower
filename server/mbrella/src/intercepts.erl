-module (intercepts.erl).
-compile(export_all).

-include().

-ifdef( debug ).
-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X]) ).
-else.
-define( trace(X), void ).
-endif.

%% ====================================================
%% TYPES
%% ====================================================


%% ====================================================
%% External API
%% ====================================================

callIntercept(Name, Args, State, Messages) ->
	case erlang:apply(intercepts, Name, [ Args | State, Messages]) of
		{NewState, Elements} when is_list(Elements) -> 
			{NewState, Elements};
		{NewState, Elements} when is_tuple(Elements) ->
			{NewState, [Elements]}
	end.

%% ====================================================
%% Internal API
%% ====================================================

%	-the intercepts job is to take keyed/unkeyed input messages, do something to them, and return an 
%	updated state and the elements that result
%
%	interceptFunction :: Args -> InterceptState -> KeyedMessages -> Tuple InterceptState UnkeyedMessages

fold( Function, FunctionInverse, InterceptState, ListOfMessages ) ->
	
	{NewInterceptState, ElementsToAdd}.
	
%% 
%% reactiveAnd ::
%%	Message will look like {add, FromCellPointer, null}
%% 

reactiveAnd( CellPointer1, CellPointer2, {Cell1Val, Cell2Val}, Message ) ->
	case cellMessage:fromName(Message) of
		cellPointer:name(CellPointer1) -> 
			Cell1NewVal = cellMessage:modifier(Message),
			if 
				Cell2Val =:= undefined -> { {Cell1NewVal, Cell2Val}, [] };
				Cell1NewVal =:= add andalso Cell2Val =:= add -> { {Cell1NewVal, Cell2Val}, {add, null} };
				true -> { {Cell1NewVal, Cell2Val}, {remove, null} }
			end;
		cellPointer:name(CellPointer2) ->
			Cell2NewVal = cellMessage:modifier(Message),
			if 
				Cell1Val =:= undefined -> { {Cell1Val, Cell2NewVal}, [] };
				Cell1Val =:= add andalso Cell2NewVal =:= add -> { {Cell1Val, Cell2NewVal}, {add, null} };
				true -> { {Cell1Val, Cell2NewVal}, {remove, null} }
			end
	end.

%% ====================================================
%% Utilities
%% ====================================================

