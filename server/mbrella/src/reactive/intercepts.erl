-module (intercepts).
-compile(export_all).

-include ("../../include/scaffold.hrl").


-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X]) ).


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
debug() -> [].

debug( _, From, Element ) ->
	io:format("\033[45mRECEIVED FROM: ~p: ~p\033[49m~n", [From, Element]),
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

%% 
%% invert :: 
%% 

invert() ->
	dict:new().
	
invert(SelfPointer, CellPointerParent, InvertState, From, Element) ->
	Modifier = cellElements:modifier(Element),
	{Word, Document} = cellElements:value(Element),
	if
		Modifier =:= add ->
			case dict:find(Word, InvertState) of
				error ->
					% need to be make linked cell
					SetOfDocsForWord = cell:makeCell(set),
					% no informants needed
					cell:sendElements(SetOfDocsForWord, SelfPointer, [cellElements:createAdd(Document)]),
					% could also do cell:addValues, not sure if it matters
					{dict:store(Word, {SetOfDocsForWord, 1}, InvertState), [cellElements:createAddMap(Word, SetOfDocsForWord)]};
				{ok, {SetOfDocsForWord, Weight}} ->
					cell:sendElements(SetOfDocsForWord, SelfPointer, [cellElements:createAdd(Document)]),
					{dict:store(Word, {SetOfDocsForWord, Weight + 1}, InvertState), [cellElements:createAddMap(Word, SetOfDocsForWord)]}
			end;
		true ->
			case dict:find(Word, InvertState) of 
				error ->
					exit(got_remove_before_add);
				{ok, {SetOfDocsForWord, Weight}} ->
					cell:sendElements(SetOfDocsForWord, SelfPointer, [cellElements:createRemove(Document)]),
					if 
						Weight =:= 1 ->
							cell:kill(SetOfDocsForWord),
							{dict:erase(Word, InvertState), [cellElements:createRemoveMap(Word, SetOfDocsForWord)]};
						true ->
							{dict:store(Word, {SetOfDocsForWord, Weight -1}, InvertState), [cellElements:createRemoveMap(Word, SetOfDocsForWord)]}
					end
			end
	end.

%% 
%% setDifference :: 
%% 

setDifference() ->
	dict:new().
	
setDifference(CellPointer1, CellPointer2, State, From, Element) ->
	Value = cellElements:value(Element),
	Modifier = cellElements:modifier(Element),
	Name1 = cellPointer:name(CellPointer1),
	Name2 = cellPointer:name(CellPointer2),
	case cellPointer:name(From) of
		% name2 comes first because we want the first set of messages to be the remove messages
		% this prevents items from being added, then removed immediately
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
	
%% 
%% unfoldSet ::
%% 

unfoldSet() -> cellElements:create(set).

unfoldSet(AST, InitialObject, SelfCellPointer, State, _From, Element) ->
	{NewState, ResponseElement} = cellElements:process(State, Element),
	ResponseModifier = cellElements:modifier(ResponseElement),
	ResponseValue = cellElements:value(ResponseElement),
	Value = cellElements:value(Element),
	if
		ResponseElement =:= [] orelse InitialObject =:= Value ->
			{NewState, ResponseElement};
		true ->
			if
				ResponseModifier =:= add ->
					NewSetPointer = eval:evaluate( ast:makeApply(AST, ResponseValue) ),
					cell:injectOutput(NewSetPointer, SelfCellPointer),
					{NewState, ResponseElement};
				true ->
					ExistingSetPointer = eval:evaluate( ast:makeApply(AST, ResponseValue) ),
					cell:uninjectOutput(ExistingSetPointer, SelfCellPointer),
					{NewState, ResponseElement}
			end
	end.
	
%% 
%% applyExpr :: 
%% 		used for mapunits
%%		

applyExpr() -> {undefined, orddict:new()}.

applyExpr(AST, ListOfCellPointers, {InnerValue, Params}, From, Element) ->
	Name = cellPointer:name(From),
	WhichParam = 	fun(CellPointer, Index) ->
						case cellPointer:name(CellPointer) of
							Name -> throw(Index);
							_ -> Index + 1
						end
					end,
	ParamNum = 	try lists:foldl(WhichParam, 1, ListOfCellPointers)
				catch 
					throw:Index -> Index
				end,

	Modifier = cellElements:modifier(Element),
	NewValue = cellElements:value(Element),
	
	if 
		Modifier =:= remove andalso InnerValue =:= undefined ->
			{{undefined, orddict:erase(ParamNum, Params)}, []};
		Modifier =:= remove ->
			{{undefined, orddict:erase(ParamNum, Params)}, [cellElements:createRemove(InnerValue)]};
		Modifier =:= add andalso InnerValue =:= undefined ->
			NewParams = orddict:store(ParamNum, NewValue, Params),
			NumberOfArguments = orddict:size(NewParams),
			if
				NumberOfArguments =:= length(ListOfCellPointers) ->
					ListOfArguments = lists:map( fun({_,V}) -> V end, orddict:to_list(NewParams) ),
					NewInnerValue = ast:apply(AST, ListOfArguments),
					{{NewInnerValue, NewParams}, [cellElements:createAdd(NewInnerValue)]};
				true ->
					{{undefined, NewParams}, []}
			end;
		true ->
			exit(received_add_before_remove)
	end.
	
%% 
%% gate :: 
%% 		
%%		

gate() -> empty.

gate(Value, State, _From, Element) ->
	case cellElements:modifier(Element) of
		add when State =:= empty ->
			{null, [cellElements:createAdd(Value)]};
		add ->
			{null, []};
		remove when State =:= null ->
			{empty, [cellElements:createRemove(Value)]};
		true ->
			{empty, []}
	end.



%% ====================================================
%% Intercept Function's Utilities
%% ====================================================

%% ====================================================
%% Utilities
%% ====================================================

