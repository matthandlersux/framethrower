-module (intercepts).
-compile(export_all).

% -include().

-ifdef( debug ).
-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X]) ).
-else.
-define( trace(X), void ).
-endif.

%% ====================================================
%% TYPES
%% ====================================================

% Intercept :: Tuple InterceptFunction InterceptState
%
% InterceptFunction :: Tuple Atom (List Argument)
% InterceptState :: a
% Argument :: b

%% ====================================================
%% External API
%% ====================================================

%% 
%% callIntercept :: String -> List a -> b -> List Message -> Tuple b (List Element)
%% 

call(Intercept, From, Elements) ->
	Name = getName(Intercept),
	Args = getArgs(Intercept),
	State = getState(Intercept),
	callIntercept(Name, Args, State, From, Elements).

callIntercept(_, _, _, _, []) -> {undefined, []};
callIntercept(Name, Args, State, From, Elements) ->
	Process = fun(Element, {OldState, OldElements}) ->
		{NewState, ProcessedElements} = processMessage(Name, Args, OldState, From, Element),
		{NewState, ProcessedElements ++ OldElements}
	end,
	?trace(Elements),
	lists:foldr(Process, {State, []}, Elements).

callIntercept(Name, From, Elements) ->
	callIntercept(Name, [], [], From, Elements).
	
callIntercept(Name, Args, From, Elements) ->
	callIntercept(Name, Args, [], From, Elements).
	
getArguments(Intercept) -> getArgs(Intercept).

%% ====================================================
%% Internal API
%% ====================================================

processMessage(Name, Args, State, From, Element) ->
	case erlang:apply(intercepts, Name, Args ++ [State] ++ [From] ++ [Element]) of
		{NewState, Elements} when is_list(Elements) ->
			{NewState, Elements};
		{NewState, Elements} when is_tuple(Elements) ->
			{NewState, [Elements]}
	end.
	
getName({{Name, _Args}, _State}) -> Name.
	
getArgs({{_Name, Args}, _State}) -> Args.
	
getState({{_Name, _Args}, State}) -> State.

%% ====================================================
%% Intercept Functions
%% ====================================================

%	-the intercepts job is to take keyed/unkeyed input messages, do something to them, and return an 
%	updated state and the elements that result
%	interceptFunction :: Args -> InterceptState -> KeyedMessages -> Tuple InterceptState UnkeyedMessages

debug( _, From, Element ) ->
	io:format("RECEIVED FROM: ~p: ~p~n", [From, Element]),
	{[],Element}.

fold( Function, FunctionInverse, InterceptState, From, Element ) ->
	
	{todo_NewInterceptState, todo_ElementsToAdd}.
	
%% 
%% reactiveAnd ::
%%	Message will look like {add, FromCellPointer, null}
%% 

reactiveAnd( CellPointer1, CellPointer2, {Cell1Val, Cell2Val}, From, Element ) ->
	CellName1 = cellPointer:name(CellPointer1),
	CellName2 = cellPointer:name(CellPointer2),
	case cellPointer:name(From) of
		CellName1 -> 
			Cell1NewVal = cellElements:modifier(Element),
			if 
				Cell2Val =:= undefined -> { {Cell1NewVal, Cell2Val}, [] };
				Cell1NewVal =:= add andalso Cell2Val =:= add -> { {Cell1NewVal, Cell2Val}, {add, null} };
				true -> { {Cell1NewVal, Cell2Val}, {remove, null} }
			end;
		CellName2 ->
			Cell2NewVal = cellElements:modifier(Element),
			if 
				Cell1Val =:= undefined -> { {Cell1Val, Cell2NewVal}, [] };
				Cell1Val =:= add andalso Cell2NewVal =:= add -> { {Cell1Val, Cell2NewVal}, {add, null} };
				true -> { {Cell1Val, Cell2NewVal}, {remove, null} }
			end
	end.
	

invert( SelfPointer, CellPointerParent, State, From, Element ) ->
	CellName1 = cellPointer:name(CellPointerParent),
	case cellPointer:name(From) of
		CellName1 ->
			% message is {add, {map, {key, value}}}, or remove
			% create cell for that key if it doesnt exist
			% key/value then gets used to tag incoming messages
			NewState = invertStateProcess(State, Element),
			% check if any messages in holding and return them
			{NewState1, Elements} = todo; %invert( CellPointerParent, NewState, Message );
		CellPointerInformant ->
			case invertStateGetValue(CellPointerInformant) of
				{ok, Value} ->
					ElementValue = cellElements:setValue(Element),
					case invertStateGetCellpointer(ElementValue) of
						{ok, CellPointer} ->
							%send Value to cellpointer using the modifier from message
							cell:sendElements(
								CellPointer,
								SelfPointer, 
								cellElements:set(cellElements:modifier(Element), Value),
							{State, [must_return_elements_for_weighting]});
						error ->
							%create cell associated with cellMessage:setValue(Message)
							%add Value to that new cell
							%store location of cell, return {state, {map, {MessageElement, cell}}}
							todo
					end;
				error ->
					todo %invertStateHoldMessage(Element)
			end
	end.

%% 
%% Message should be like {add, {map, {a1, cellpointerb's}}}
%% 

invertStateProcess(State, Element) ->
	case cellElements:modifier(Element) of
		add ->
			CellPointerSetOfAs = cell:makeCell(set),
			invertStateStoreKeydInput(
				cellPointer:name(cellMessage:mapValue(Element)),
				cellMessage:mapKey(Element)
			),
			todo;
		remove ->
			todo
	end.
	
invertBaseState() ->
	dict:new().
	
%if b comes from cellname, store tag in cell associated with b
invertStateStoreKeydInput(CellFromName, Tag) ->
	todo.
	
invertStateGetValue(_) -> todo.
invertStateGetCellpointer(_) -> todo.


setDifference(CellPointer1, CellPointer2, State, From, Element) ->
	Value = cellElements:value(Element),
	Name1 = cellPointer:name(CellPointer1),
	Name2 = cellPointer:name(CellPointer2),
	case cellPointer:name(From) of
		Name1 ->
			case cellElements:modifier(Element) of
				add ->
					setDifferenceStateAdd(State, Value);
				remove ->
					setDifferenceStateSubtract(State, Value)
			end;
		Name2 ->
			case cellElements:modifier(Element) of
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
			{dict:store(Value, 1, SetDifferenceState), cellElements:createAdd(Value)};
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
			{dict:store(Value, Weight-1, SetDifferenceState), cellElements:createRemove(Value)}
	end.

%% ====================================================
%% Utilities
%% ====================================================

