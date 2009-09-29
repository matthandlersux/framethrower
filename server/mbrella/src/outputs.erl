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

%% 
%% callOutput :: FunctionName -> Arguments -> OutputState -> Elements -> Tuple OutputState Elements
%%		used by a cell when adding a new outputFunction or receiving a new element
%%		returns the new state of that outputFunction and the elements to be sent
%% 
	
callOutput(Name, Args, State, Elements) ->
	case erlang:apply(outputs, Name, lists:merge( Args, [State, Elements] )) of
		{NewState, Elements} when is_list(Elements) -> 
			{NewState, Elements};
		{NewState, Elements} when is_tuple(Elements) ->
			{NewState, [Elements]}
	end.

%% 
%% sendTo :: Output -> Cellpointer -> List Elements -> void
%% 

sendTo(Output, From, Elements) ->
	CellPointers = sendTos(Output),
	Send = 	fun(CellPointer) ->
				cell:sendElements(CellPointer, From, Elements)
			end,
	lists:foreach(Send, Cellpointers).
	
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

