-module (cellElements).

-export([
	new/0, new/1,
	type/1,
	create/2,
	createMap/2, createMap/3, 
	createAdd/1, createRemove/1,
	createAddMap/2, createRemoveMap/2,
	modifier/1,
	switch/1,
	value/1,
	isMap/1, isMap/1,
	mapValue/1,	mapKey/1,
	process/2, process/2,
	toList/1, 
	toListOfRemoves/1,
	isEmpty/1, takeOne/1
]).

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X]) ).

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
%% type :: CellElements -> Atom
%% 		
%%		

type({Type, _}) ->
	Type.

%% 
%% create :: Atom -> Value -> Element
%% 
	
create(Modifier, Value) ->
	{Modifier, Value}.

%% 
%% createMap :: Value -> Value -> Value
%% 		used by unfold map... needed to create a map without a modifier
%%		

createMap(Key, Value) ->
	{map, Key, Value}.


%% 
%% createMap :: Atom -> Value -> Value -> Element
%% 

createMap(Modifier, Key, Value) ->
	create(Modifier, {map, Key, Value}).
	
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
%% createAddMap :: Value -> Value -> Element
%% 

createAddMap(Key, Value) ->
	createAdd({map, Key, Value}).

%% 
%% createRemoveMap :: Value -> Value -> Element
%% 

createRemoveMap(Key, Value) ->
	createRemove({map, Key, Value}).
%% 
%% modifier :: Element -> Atom
%% 
	
modifier({Modifier, _}) ->
	Modifier.

%% 
%% switch :: Element -> Element
%% 

switch({add, V}) -> {remove, V};
switch({remove, V}) -> {add, V}.

%% 
%% value :: Element -> Value
%% 
	
value({_, Value}) ->
	Value.

%% 
%% isMap :: Element -> Bool
%% 		
%%		

isMap({_, {map, _, _}}) -> true;
isMap(_) -> false.

%% 
%% mapValue :: Element -> MapValue
%% 

mapValue({_, {map, _, Value}}) ->
	Value.
	
%% 
%% mapKey :: Element -> MapKey
%% 

mapKey({_, {map, Key, _}}) ->
	Key.
	
%% 
%% process :: CellElements -> List Element -> Tuple CellElements (List Element)
%% 

process(CellElements, ListOfElements) when is_list(ListOfElements) ->
	Process = 	fun(Element, {OldCellElements, ElementsAcc}) ->
					{NewCellElements, Response} = processor(OldCellElements, Element),
					{NewCellElements, Response ++ ElementsAcc}
				end,
	lists:foldr(Process, {CellElements, []}, ListOfElements);
process(CellElements, Element) ->
	processor(CellElements, Element).
	
%% 
%% toList :: CellElements -> List Element
%% 

toList({unit, {Value, Weight}}) -> 
	valueToElementList(Value, Weight);
toList({set, ElementState}) ->
	ElementList = dict:to_list(ElementState),
	lists:flatmap(fun({V,W}) -> valueToElementList(V, W) end, ElementList);
toList({map, ElementState}) ->
	ElementList = dict:to_list(ElementState),
	lists:flatmap(fun({K,{V,W}}) -> valueToElementList({map, K, V}, W) end, ElementList).
	
%% 
%% toListOfRemoves :: CellElements -> List Element
%% 		
%%		

toListOfRemoves({unit, {Value, Weight}}) when Weight > 0 -> 
	valueToElementList(Value, -Weight);
toListOfRemoves({unit, _}) -> 
	[];
toListOfRemoves({set, ElementState}) ->
	ElementList = dict:to_list(ElementState),
	lists:flatmap(
		fun({V,W}) when W > 0 ->
			valueToElementList(V, -W);
		(_) ->
			[]
		end, ElementList
	);
toListOfRemoves({map, ElementState}) ->
	ElementList = dict:to_list(ElementState),
	lists:flatmap(
		fun({K, {map, V,W}}) when W > 0 ->
			valueToElementList({map, K, V}, -W);
		(_) ->
			[]
		end, ElementList
	).

%% 
%% rebuild :: CellElements -> CellElements
%% 		rebuilds elements, used by serialize to deal with screwup on internal Dict structure
%%		

rebuild({unit, _Data} = CellElements) ->
	CellElements;
rebuild({Type, Data}) ->
	{Type, dict:from_list(dict:to_list(Data))}.

%% ====================================================
%% External API For Outputs
%% ====================================================

isEmpty({unit, {_Value, Weight}}) when Weight =< 0 -> true;
isEmpty({unit, _UnitState}) -> false;
isEmpty({set, SetElements}) ->
	CheckEmpty = 	fun(_, Weight, _) ->
						if 
							Weight > 0 -> throw(false);
							true -> true
						end
					end,
	try dict:fold(CheckEmpty, true, SetElements)
	catch
		throw:false -> false
	end.

%% 
%% takeOne :: CellElements -> List Element
%% 

takeOne({set, SetElements}) ->
	TakeOne = 	fun(Key, Weight, _) ->
					if
						Weight > 0 -> throw({add, Key});
						true -> []
					end
				end,
	try dict:fold(TakeOne, [], SetElements)
	catch
		throw:Response -> Response
	end.
	
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

%% 
%% valueToElementList :: Value -> Number -> List a
%%  				a :: Nothing | Tuple Atom Value
%% 

valueToElementList(Value, 0) -> [];
valueToElementList(Value, Weight) when Weight > 0 -> [{add, Value}];
valueToElementList(Value, Weight) when Weight < 0 -> [{remove, Value}].

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
%% mapAdd :: Dict -> Tuple3 Atom Value Value -> Tuple Dict (List Element)
%% 

mapAdd(MapElements, {map, NewElementKey, NewElementValue}) ->
	case dict:is_key(NewElementKey, MapElements) of
		true ->
			{OldElementValue, Weight} = dict:fetch(NewElementKey, MapElements),
			if
				Weight =:= -1 -> {dict:erase(NewElementKey, MapElements), []};
				true -> {dict:store(NewElementKey, {OldElementValue, Weight + 1}, MapElements), []}
			end;
		false ->
			{dict:store(NewElementKey, {NewElementValue, 1}, MapElements), [{add, {map, NewElementKey, NewElementValue}}]}
	end.

%% 
%% mapRemove :: Dict -> Tuple Value Value -> Tuple Dict (List Element)
%% 

mapRemove(MapElements, {map, NewElementKey, NewElementValue}) ->
	case dict:is_key(NewElementKey, MapElements) of
		true ->
			{OldElementValue, Weight} = dict:fetch(NewElementKey, MapElements),
			if
				Weight =:= 1 -> {dict:erase(NewElementKey, MapElements), [{remove, {map, NewElementKey, OldElementValue}}]};
				true -> {dict:store(NewElementKey, {OldElementValue, Weight - 1}, MapElements), []}
			end;
		false ->
			{dict:store(NewElementKey, {NewElementValue, -1}, MapElements), [{remove, {map, NewElementKey, NewElementValue}}]}
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

