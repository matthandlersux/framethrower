-module (cellElements).
-compile(export_all).

%-include().

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

%% WHEN AN ELEMENT IS A CELLPOINTER, THE PID CAN BECOME STALE, ALWAYS NEED TO KEEP THIS IN MIND AND
%%		CHECK THE ENVIRONMENT

%% ====================================================
%% TYPES
%% ====================================================

% Element :: Tuple Atom Value
% 	Value :: 	String 
%			| 	Number 
%			| 	Atom 
%			| 	CellPointer 
%			|	ObjectPointer 
%			|	FunctionPointer 
%			|	ExpressionFunction 
%			|	Tuple Value Value
% CellElements :: Tuple Atom DataStructure
%	DataStructure :: 	Tuple Value Number 
%					|	Tuple Atom Dict
%					|	Tuple Atom RangeDict

%% ====================================================
%% External API
%% ====================================================

%% 
%% new :: Atom -> CellElements
%% 

new() -> new(unit).
new(unit) ->
	{unit, {undefined, 0}};
new(set) ->
	{set, dict:new()};
new(map) ->
	{map, dict:new()};
new(setRange) ->
	{setRange, rangedict:new()};
new(mapRange) ->
	{mapRange, rangedict:new()}.

%% 
%% create :: Atom -> Value -> Element
%% 
	
create(Modifier, Value) ->
	{Modifier, Value}.

%% 
%% createAdd :: Value -> Element
%% 
	
createAdd(Value) ->
	{add, Value}.

%% 
%% createRemove :: Value -> Element
%% 

createRemove(Value) ->
	{remove, Value}.

%% 
%% modifier :: Element -> Atom
%% 
	
modifier({Modifier, _}) ->
	Modifier.

%% 
%% value :: Element -> Value
%% 
	
value({_, Value}) ->
	Value.

%% 
%% process :: CellElements -> List Element -> Tuple CellElements (List Element)
%% 

process(CellElements, ListOfElements) when is_list(ListOfElements) ->
	Process = 	fun(Element, {OldCellElements, ElementsAcc}) ->
					{NewCellElements, Response} = processor(OldCellElements, Element),
					{NewCellElements, Response ++ ElementsAcc}
				end,
	lists:foldr(Process, {CellElements, []}, ListOfElements).

%% ====================================================
%% Internal API
%% ====================================================

%% 
%% processor :: CellElements -> Element -> Tuple CellElements (List Element)
%% 

processor({unit, {Element, Weight}}, {add, NewElement}) ->
	if
		Element =:= NewElement ->
			if 
				Weight =:= -1 -> {{unit, {undefined, 0}}, []};
				Weight =:= 0 -> {{unit, {NewElement, 1}}, [{add, NewElement}]};
				true -> {{unit, {NewElement, Weight + 1}}, []}
			end;
		Element =:= undefined -> {{unit, {NewElement, 1}}, [{add, NewElement}]};
		% other element?
		true -> {{unit, {NewElement, 1}}, [{add, NewElement}, {remove, Element}]}
	end;
processor({unit, {Element, Weight}}, {remove, NewElement}) ->
	if
		Element =:= NewElement ->
			if 
				Weight =:= 1 -> {{unit, {undefined, 0}}, [{remove, Element}]};
				%leaving this following line in to see if it ever catches on trace
				Weight =:= 0 -> {{unit, {NewElement, -1}}, []};
				true -> {{unit, {NewElement, Weight - 1}}, []}
			end;
		Element =:= undefined -> {{unit, {NewElement, -1}}, []};
		% other element?... this is the case that i am very not sure about the behavior, will be clear after testing
		true -> {{unit, {NewElement, -1}}, [{remove, Element}]}
	end;
processor({set, SetElements}, {add, NewElement}) ->
	{NewSetElements, Response} = setAdd(SetElements, NewElement),
	{{set, NewSetElements}, Response};
processor({set, SetElements}, {remove, NewElement}) ->
	{NewSetElements, Response} = setRemove(SetElements, NewElement),
	{{set, NewSetElements}, Response};
	
processor({setRange, SetElements}, {add, NewElement}) ->
	todo;
processor({setRange, SetElements}, {remove, NewElement}) ->
	todo;
	
processor({map, SetElements}, {add, NewElement}) ->
	{NewSetElements, Response} = mapAdd(SetElements, NewElement),
	{{map, NewSetElements}, Response};
	
processor({map, SetElements}, {remove, NewElement}) ->
	{NewSetElements, Response} = mapRemove(SetElements, NewElement),
	{{map, NewSetElements}, Response};
	
processor({mapRange, SetElements}, {add, NewElement}) ->
	todo;
processor({mapRange, SetElements}, {remove, NewElement}) ->
	todo.

%% ====================================================
%% we will need special set of functions for cellpointers due to distributed...
%%		storage will be on the "name" of the cell, but will retain the pid, but the pid can change or something
%% ====================================================

%% 
%% setAdd :: Dict -> Value -> Tuple Dict (List Element)
%% 
	
setAdd(SetElements, NewElement) ->
	case dict:is_key(NewElement, SetElements) of
		true ->
			Weight = dict:fetch(NewElement, SetElements),
			if
				Weight =:= -1 -> {dict:erase(NewElement, SetElements), []};
				true -> {dict:store(NewElement, Weight + 1, SetElements), []}
			end;
		false ->
			{dict:store(NewElement, 1, SetElements), [{add, NewElement}]}
	end.
				
%% 
%% setRemove :: Dict -> Value -> Tuple Dict (List Element)
%% 
	
setRemove(SetElements, NewElement) ->
	case dict:is_key(NewElement, SetElements) of
		true ->
			Weight = dict:fetch(NewElement, SetElements),
			if
				Weight =:= 1 -> {dict:erase(NewElement, SetElements), [{remove, NewElement}]};
				true -> {dict:store(NewElement, Weight - 1, SetElements), []}
			end;
		false ->
			{dict:store(NewElement, -1, SetElements), []}
	end.

%% 
%% mapAdd :: Dict -> Tuple Value Value -> Tuple Dict (List Element)
%% 

mapAdd(MapElements, {NewElementKey, NewElementValue}) ->
	case dict:is_key(NewElementKey, MapElements) of
		true ->
			{OldElementValue, Weight} = dict:fetch(NewElementKey, MapElements),
			if
				Weight =:= -1 -> {dict:erase(NewElementKey, MapElements), []};
				true -> {dict:store(NewElementKey, {OldElementValue, Weight + 1}, MapElements), []}
			end;
		false ->
			{dict:store(NewElementKey, {NewElementValue, 1}, MapElements), [{add, {NewElementKey, NewElementValue}}]}
	end.

%% 
%% mapAdd :: Dict -> Tuple Value Value -> Tuple Dict (List Element)
%% 

mapRemove(MapElements, {NewElementKey, NewElementValue}) ->
	case dict:is_key(NewElementKey, MapElements) of
		true ->
			{OldElementValue, Weight} = dict:fetch(NewElementKey, MapElements),
			if
				Weight =:= 1 -> {dict:erase(NewElementKey, MapElements), []};
				true -> {dict:store(NewElementKey, {OldElementValue, Weight + 1}, MapElements), []}
			end;
		false ->
			{dict:store(NewElementKey, {NewElementValue, -1}, MapElements), [{remove, {NewElementKey, NewElementValue}}]}
	end.
	
	
setRangeAdd(SetElements, NewElement) ->
	todo.
setRangeRemove(SetElements, NewElement) ->
	todo.
mapRangeAdd(SetElements, NewElement) ->
	todo.
mapRangeRemove(SetElements, NewElement) ->
	todo.
	
%% ====================================================
%% Utilities
%% ====================================================

