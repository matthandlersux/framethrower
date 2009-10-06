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

callIntercept(_, _, State, _, []) -> {State, []};
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

%% 
%% construct :: Atom -> List a -> Intercept
%% 

construct(Name, Arguments) ->
	{{Name, Arguments}, construct(Name)}.
	
%% 
%% construct :: Atom -> Intercept State
%% 

construct(Name) ->
	erlang:apply(intercepts, Name, []).
	
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
%% 

reactiveAnd() -> {remove, remove}.

reactiveAnd( CellPointer1, CellPointer2, {Cell1Val, Cell2Val}, From, Element ) ->
	CellName1 = cellPointer:name(CellPointer1),
	CellName2 = cellPointer:name(CellPointer2),
	case cellPointer:name(From) of
		CellName1 -> 
			Cell1NewVal = cellElements:modifier(Element),
			if 
				Cell2Val =:= remove -> { {Cell1NewVal, Cell2Val}, [] };
				Cell1Val =:= remove andalso Cell1NewVal =:= add andalso Cell2Val =:= add -> 
					{ {Cell1NewVal, Cell2Val}, {add, null} };
				Cell1NewVal =:= remove andalso (Cell1Val =:= add andalso Cell2Val =:= add) ->
					{ {Cell1NewVal, Cell2Val}, {remove, null} };
				true -> { {Cell1NewVal, Cell2Val}, [] }
			end;
		CellName2 ->
			Cell2NewVal = cellElements:modifier(Element),
			if 
				Cell1Val =:= remove -> { {Cell1Val, Cell2NewVal}, [] };
				Cell2Val =:= remove andalso Cell1Val =:= add andalso Cell2NewVal =:= add -> 
					{ {Cell1Val, Cell2NewVal}, {add, null} };
				Cell2NewVal =:= remove andalso (Cell1Val =:= add andalso Cell2Val =:= add) ->
					{ {Cell1Val, Cell2NewVal}, {remove, null} };
				true -> { {Cell1Val, Cell2NewVal}, [] }
			end
	end.

invert() ->
	% tags, b's locations, stash of messages that maybe havent shown up in the right order
	{dict:new(), dict:new(), dict:new()}.
	
invert(SelfPointer, CellPointerParent, {Tags, BLocations, Stash} = InvertState, From, Element) ->
	Parent = cellPointer:name(CellPointerParent),
	Modifier = cellElements:modifier(Element),

	case cellPointer:name(From) of
		ATag = cellElements:mapKey(Element),
		SetOfBCellPointer = cellElements:mapValue(Element),
		SetOfBCellName = cellPointer:name(SetOfBCellPointer),
		% Parent ->
		% 	if
		% 		Modifier =:= add ->
		% 			% check stash for elements that arrived before tag was set up
		% 			% note, dict:find(key, Stash) returns List of Lists
		% 			{{dict:store(SetOfBCellName, ATag, Tags), BLocations, Stash}, []};
		% 		true ->
		% 			% remove from stash with BCellName
		% 			{{dict:erase(SetOfBCellName, Tags), BLocations, Stash}, []}
		% 	end;
		SetOfBCellName ->
			case dict:find(SetOfBCellName, Tags) of
				error ->
					{{Tags, BLocations, dict:append(SetOfBCellName, [Element])}, []}
				{ok, FoundATag} ->
					BValue = cellElements:value(Element),
					if
						Modifier =:= add ->
							case dict:find(BValue, BLocations) of
								error ->
									createCell,
									make this cell an informant for it,
									add foundatag to it,
									return;
								{ok, BCellPointer} ->
									cell:sendElements(BCellPointer, SelfPointer, cellElements:create)
							end;
						true ->
							
					end
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

% there should be a way to make this work easily like the following, it would just require some clever
% flag or something, work on it some more later

% setDifference() -> undefined.
% 
% setDifference(_CellPointer1, CellPointer2, _, From, Element) ->
% 	Name = cellPointer:name(CellPointer2),
% 	case cellPointer:name(From) of
% 		Name ->
% 			{undefined, cellElements:switch(Element)};
% 		_ ->
% 			{undefined, Element}
% 	end.
	
setDifference() ->
	dict:new().
	
setDifference(CellPointer1, CellPointer2, State, From, Element) ->
	Value = cellElements:value(Element),
	Modifier = cellElements:modifier(Element),
	Name1 = cellPointer:name(CellPointer1),
	Name2 = cellPointer:name(CellPointer2),
	case cellPointer:name(From) of
		% name2 comes first because we want the first set of messages to be the remove messages
		% this sets up the blocking beforehand
		Name2 ->
			case Modifier of
				add ->
					case dict:find(Value, State) of 
						error ->
							{dict:store(Value, {false, true}, State), []};
						{ok, {true, false}} ->
							{dict:store(Value, {true, true}, State), {remove, Value}}
						% {ok, {false, false}} ->
						% 	{dict:store(Value, {false, true}, State), []}
					end;
				remove ->
					case dict:find(Value, State) of 
						error ->
							{State, []};
						{ok, {true, true}} ->
							{dict:store(Value, {true, false}, State), {add, Value}};
						{ok, {false, true}} ->
							{dict:erase(Value, State), []}
					end
			end;
		Name1 ->
			case Modifier of
				add ->
					case dict:find(Value, State) of 
						error ->
							{dict:store(Value, {true, false}, State), [{add, Value}]};
						{ok, {false, true}} ->
							{dict:store(Value, {true, true}, State), []}
						% {ok, {false, false}} ->
						% 	{dict:store(Value, {true, false}, State), [{add, Value}]}
					end;
				remove ->
					case dict:find(Value, State) of
						% error ->
						% 	{State, [{remove, Value}]};
						{ok, {true, false}} ->
							{dict:erase(Value, State), [{remove, Value}]};
						{ok, {true, true}} ->
							{dict:store(Value, {false, true}, State), []}
					end
			end
	end.

%% ====================================================
%% Utilities
%% ====================================================

