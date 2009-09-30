-module (outputs.erl).
-compile(export_all).
-export ([callOutput/4, sendTo/3]).
-include().

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
% Outputs :: List Output
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
	
%% 
%% standard :: OutputFunction
%%   this is the standard output function, it has no functional part, it sends elements straight through
%% 

standard() -> {send, []}.

%% ====================================================
%% External API for dealing with Output State
%% ====================================================

%% 
%% injectOutput :: OutputFunction -> CellPointer -> Outputs -> Outputs
%% 

injectOutput(OutputFunction, SendTo, OutputState) ->
	case getOutput(OutputFunction, OutputState) of
		error ->
			;
		Output ->
			SendTos = getSendTos(Output),
			

%% 
%% getSendTos :: Output -> List CellPointer
%% 

getSendTos({SendTos, _NameAndArgs, _State}) ->
	SendTos.

%% ====================================================
%% Internal API
%% ====================================================

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
				
				
				
				{ OutputState, [] }
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

