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

callIntercept(Name, [], undefined, Messages) ->
	callIntercept(Name, Messages);
callIntercept(Name, Args, undefined, Messages) ->
	callIntercept(Name, Args, Messages);
callIntercept(Name, Args, State, Messages) ->
	case erlang:apply(intercepts, Name, lists:merge(Args, [State, Messages]) of
		{NewState, Elements} when is_list(Elements) -> 
			{NewState, Elements};
		{NewState, Elements} when is_tuple(Elements) ->
			{NewState, [Elements]}
	end.
	
callIntercept(Name, Args, Messages) ->
	case erlang:apply(intercepts, Name, lists:merge(Args, [Messages]) of
		Elements when is_list(Elements) ->
			{undefined, Elements};
		Elements when is_tuple(Elements) ->
			{undefined, [Elements]}
	end.

callIntercept(Name, Messages) ->
	case erlang:apply(intercepts, Name, [Messages]) of
		Elements when is_list(Elements) ->
			{undefined, Elements};
		Elements when is_tuple(Elements) ->
			{undefined, [Elements]}
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
	
%% 
%% stripName :: KeyedMessage -> UnkeyedMessage
%% 

stripName( Message ) ->
	cellMessage:toElement(Message).


invert( SelfPointer, CellPointerParent, State, Message ) ->
	case cellMessage:fromName(Message) of
		cellPointer:name(CellPointerParent) ->
			% message is {add, {map, {key, value}}}, or remove
			% create cell for that key if it doesnt exist
			% key/value then gets used to tag incoming messages
			NewState = invertStateProcess(State, Message),
			% check if any messages in holding and return them
			{NewState1, Elements} = invert( CellPointerParent, NewState, Message );
		CellPointerInformant ->
			case invertStateGetValue(CellPointerInformant) of
				{ok, Value} ->
					MessageElement = cellMessage:setValue(Message),
					case invertStateGetCellpointer(MessageElement) of
						{ok, CellPointer} ->
							%send Value to cellpointer using the modifier from message
							cell:sendElements(
								CellPointer,
								Selfpointer, 
								cellElement:set(cellMessage:modifier(Message), Value),
							{State, [must return elements for weighting]};
						error ->
							%create cell associated with cellMessage:setValue(Message)
							%add Value to that new cell
							%store location of cell, return {state, {map, {MessageElement, cell}}}
				error ->
					invertStateHoldMessage(Message)
			end
	end.

%% 
%% Message should be like {add, {map, {a1, cellpointerb's}}}
%% 

invertStateProcess(State, Message) ->
	case cellMessage:modifier(Message) of
		add ->
			CellPointerSetOfAs = cell:makeCell(set),
			invertStateStoreKeydInput(
				cellPointer:name(cellMessage:mapValue(Message)),
				cellMessage:mapKey(Message)
			),
			
		remove ->
	end.
	
invertBaseState() ->
	dict:new().
	
%if b comes from cellname, store tag in cell associated with b
invertStateStoreKeydInput(CellFromName, Tag) ->
	.
	

setDifference(CellPointer1, CellPointer2, State, {done...})
setDifference(CellPointer1, CellPointer2, State, Message) ->
	Value = cellElement:value(cellMessage:toElement(Message)),
	case cellMessage:fromName(Message) of
		cellPointer:name(CellPointer1) ->
			case cellElement:modifier(Element) of
				add ->
					setDifferenceStateAdd(State, Value);
				remove ->
					setDifferenceStateSubtract(State, Value)
			end;
		cellPointer:name(CellPointer2) ->
			case cellElement:modifier(Element) of
				add ->
					setDifferenceStateSubtract(State, Value);
				remove ->
					setDifferenceStateAdd(State, Value)
			end
	end.
	
setDifferenceState() ->
	dict:store(done, {false, false}, dict:new()).
	
%% 
%% setDifferenceStateAdd :: SetDifferenceState -> Element -> Tuple SetDifferenceState Element
%% 

setDifferenceStateAdd(SetDifferenceState, Value) ->
	case dict:find(Value, SetDifferenceState) of
		Result when 
		Result =:= {ok, 0};
		Result =:= error ->
			{dict:store(Value, 1, SetDifferenceState), cellElement:modifyAdd(Value)};
		{ok, Weight} ->
			{dict:store(Value, Weight+1, SetDifferenceState), []}
	end.
	
setDifferenceStateSubtract(SetDifferenceState, Value) ->
	case dict:find(Value, SetDifferenceState) of
		Result when 
		Result =:= {ok, 0};
		Result =:= error ->
			{dict:store(Value, -1, SetDifferenceState), []};
		{ok, Weight} ->
			{dict:store(Value, Weight-1, SetDifferenceState), cellElement:modifyRemove(Value)}
	end.

%% ====================================================
%% Utilities
%% ====================================================

