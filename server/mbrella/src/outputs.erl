-module (outputs).
-compile(export_all).

%-include().

-ifdef( debug ).
-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X]) ).
-else.
-define( trace(X), void ).
-endif.

%% ====================================================
%% NOTES
%% ====================================================

%any function that makes use of elements that are cellpointers needs to lookup the pid of the cell
%or send a message with a "i think you are this guy" message, or needs some quick pingback to make sure
%that the cell exists still and is the cell that it thinks it is

%% ====================================================
%% TYPES
%% ====================================================

% Output :: Tuple3 SendTo OutputFunction OutputState
% Outputs :: List Output (maybe will change to a dict or something else)
%
% SendTo :: List CellPointer
% OutputFunction :: Tuple Atom (List Arguments)
% OutputState :: a
% Arguments :: b

% example: Outputs: [ { [CellPointer1, Cellpointer2], {takeOne, []}, {add, Element} }, {...} ]

%% ====================================================
%% External API
%% ====================================================

call(OutputFunction, Elements, ElementsToAdd) ->
	Name = getName(OutputFunction),
	Args = getArgs(OutputFunction),
	State = getState(OutputFunction),
	callOutput(Name, Args, State, Elements, ElementsToAdd).

%% 
%% callOutput :: FunctionName -> Arguments -> OutputState -> ElementState -> Elements -> Tuple OutputState Elements
%%		used by a cell when adding a new outputFunction or receiving a new element
%%		returns the new state of that outputFunction and the elements to be sent
%% 
	
callOutput(Name, Args, State, ElementsState, Elements) ->
	Process = fun(Element, {OldState, OldElements}) ->
		{NewState, Elements} = processElement(Name, Args, OldState, ElementsState, Element),
		{NewState, Elements ++ OldElements}
	end,
	lists:foldr(Process, {State, []}, Elements).

callOutput(Name, ElementsState, Elements) ->
	callOutput(Name, [], [], ElementsState, Elements).
	
callOutput(Name, Args, ElementsState, Elements) ->
	callOutput(Name, Args, [], ElementsState, Elements).

%% ====================================================
%% External API for dealing with Output State
%% ====================================================

%% 
%% newState :: Outputs
%% 

newState() ->
	[{newSendTos(), standard(), undefined}].
	
%% 
%% standard :: OutputFunction
%%   this is the standard output function, it has no functional part, it sends elements straight through
%% 

standard() -> {send, []}.

%% 
%% newSendTos :: SendTo
%% 

newSendTos() -> [].

%% 
%% injectOutput :: OutputFunction -> CellPointer -> Outputs -> Outputs
%% 

injectOutput(OutputFunction, SendTo, OutputState) ->
	case getOutput(OutputFunction, OutputState) of
		error ->
			todo;
		Output ->
			SendTos = getSendTos(Output),
			todo
	end.
			

%% 
%% getSendTos :: Output -> List CellPointer
%% 

getSendTos({SendTos, _NameAndArgs, _State}) ->
	SendTos.
	
%% 
%% toList :: Outputs -> List Output
%% 

toList(Outputs) -> Outputs.

%% 
%% updateOutputStates :: List OutputStates -> Outputs -> Outputs
%% 

updateOutputStates(NewOutputStates, Outputs) ->
	Combine = fun(OutputState, Output) -> setelement(3, Output, OutputState) end,
	lists:zipwith(Combine, NewOutputStates, Outputs).
	
%% 
%% getOutput :: OutputFunction -> OutputState -> Output
%% 

getOutput(OutputFunction, OutputState) ->
	lists:keyfind(OutputFunction, 2, OutputState).

%% ====================================================
%% Internal API
%% ====================================================

processElement(Name, Args, OutputState, ElementsState, Element) ->
	case erlang:apply(outputs, Name, Args ++ OutputState ++ ElementsState ++ Element) of
		{NewState, Elements} when is_list(Elements) ->
			{NewState, Elements};
		{NewState, Elements} when is_tuple(Elements) ->
			{NewState, [Elements]}
	end.

getName({_SendTo, {Name, _Args}, _State}) -> Name.
	
getArgs({_SendTo, {_Name, Args}, _State}) -> Args.
	
getState({_SendTo, {_Name, _Args}, State}) -> State.

%% ====================================================
%% Outputs For Primfuncs
%% ====================================================


%% 
%% calling the function without any parameters is the constructor for the state
%% 

takeOne() -> undefined.
	
takeOne(undefined, [{add, Element}|_]) ->
	{ Element, {add, Element} };
takeOne(OutputState, [{add, Element}|_]) ->
	{ OutputState, [] };
takeOne(OutputState, [{remove, Element}|Rest]) ->
	if
		OutputState =:= Element andalso length(Rest) =:= 0 -> 
			{ undefined, {remove, OutputState} };
		% OutputState =:= Element ->
		% 	[{add, NewElement}|_] = Rest,
		% 	{ NewElement, [{remove, Element},{add, NewElement}] };
		true ->
			{Removes, Adds} = lists:partition(fun({Modifier, _}) -> Modifier =:= remove end, Rest),
			case lists:keyfind(OutputState, 2, Removes) of
				
				
				
				{ OutputState, [] } -> todo
			end
	end.
		
%% 
%%	sideEffectInject :: CellPointer -> Element -> Element
%% 		takes a {map, {Key, CellPointerSet}} and injects a send into CellPointerSet, returns element
%% 
	
sideEffectInject(CellPointerOutput, {add, {map, {Key, CellPointerSet}}} = Element) ->
	cell:injectOutput(CellPointerSet, CellPointerOutput),
	{ undefined, Element };
sideEffectInject(CellPointerOutput, {remove, {map, {Key, CellPointerSet}}} = Element) ->
	cell:uninjectOutput(CellPointerSet, CellPointerOutput),
	{ undefined, Element }.


%% ====================================================
%% Utilities
%% ====================================================

