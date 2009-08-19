-module (cellState.erl).
-compile(export_all).

-include("../include/scaffold.hrl").

-ifdef( debug ).
-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X]) ).
-else.
-define( trace(X), void ).
-endif.

%% ====================================================
%% notes
%% ====================================================

% all functions in the api should return at least #cellState, possibly a message too

%% ====================================================
%% TYPES
%% ====================================================


%% ====================================================
%% External API
%% ====================================================

%% 
%% injectOutput :: #cellState -> #outputFunction -> #cellPointer -> #cellState
%% 

injectOutput(State, OutputFunction, OutputTo) ->
	State1 = addOutput(State, OutputFunction),
	connectOutput(State, OutputFunction, OutputTo).

%% 
%% addElement :: #cellState -> #element -> {ok, #cellState} | {first, #cellState}
%% 

addElement(State, Element) -> 
	Elements = state(State, elements),
	CellType = state(State, cellType),
	case elementsAdd(CellType, Element, Elements) of
		{ok, Elements1} -> {ok, replace(State, elements, Elements1)};
		{first, Elements1} -> {first, replace(State, elements, Elements1)}
	end.

%% 
%% removeElement :: #cellState -> #element -> {ok, #cellState} | {last, #cellState}
%% 
	
removeElement() -> 
	Elements = state(State, elements),
	case elementsRemove(Element, Elements) of
		{ok, Elements1} -> {ok, replace(State, elements, Elements1)};
		{last, Elements1} -> {last, replace(State, elements, Elements1)}
	end.
	
%% 
%% interceptElements :: #cellState -> CellName -> Elements -> {NewState, NewElements}
%% 
% interceptFunctions :: List Args -> State -> List Message -> {ok, NewState, List Elements}

interceptElements(CellState, FromName, Elements) ->
	Intercept = state(State, intercept),
	{ok, NewIntercept, Elements1} = runInterceptOnElements(),
	doElements()
	
%% ====================================================
%% Internal API
%% ====================================================

elementsAdd(unit, Element, Elements) ->
	case rangedict:find(Element, Elements) of
		{ok, FoundElement} ->
			rangedict:addWeight(Element, Elements);
		error -> rangedict:add(Element, Elements)
	end;
elementsAdd(set, Element, Elements) ->
	case rangedict:find(Element, Elements) of
		{ok, FoundElement} ->
			rangedict:addWeight(Element, Elements);
		error -> rangedict:add(Element, Elements)
	end;
elementsAdd(map, Element, Elements) ->
	case rangedict:find(Element, Elements) of
		{ok, FoundElement} ->
			rangedict:addWeight(Element, Elements);
		error -> rangedict:add(Element, Elements)
	end.

	
%% ====================================================
%% Utilities
%% ====================================================

