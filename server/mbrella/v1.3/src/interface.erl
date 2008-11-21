-module (interface).
-compile (export_all).

-import (bag, [new/0, add_element/2, del_element/2, to_list/1]).

-include ("../include/scaffold.hrl").

new(static, SubType) ->
	#interface{type = static, subType = SubType};
new(unit, SubType) ->
	#interface{type = unit, subType = SubType};
new(set, SubType) ->
	#interface{type = set, subType = SubType, data = sets:new()};
new(list, SubType) ->
	#interface{type = list, subType = SubType, data = []};
new(bag, SubType) ->
	#interface{type = bag, subType = SubType, data = bag:new()};
new(assoc, SubType) ->
	#interface{type = assoc, subType = SubType, data = dict:new()};
new(Type, SubType) ->
	#interface{type = Type, subType = SubType, data = []}.


	
control(#interface{type = Type, subType = SubType} = Interface, ControlMsg) ->
	control(Type, ControlMsg, Interface).
	
control(_, {changeType, Val}, Interface) ->
	Interface#interface{type = Val};
control(_, {changeSubType, Val}, Interface) ->
	Interface#interface{subType = Val};
control(static, Data, Interface) ->
	Interface#interface{data = Data};
control(unit, {add, Val}, Interface) ->
	Interface#interface{data = Val};
control(set, {add, Val}, #interface{data = Data} = Interface) ->
	Interface#interface{data = sets:add_element(Val, Data)};
control(set, {remove, Val}, #interface{data = Data} = Interface) ->
	Interface#interface{data = sets:del_element(Val, Data)};
control(bag, {add, Val}, #interface{data = Data} = Interface) ->
	Interface#interface{data = bag:add_element(Val, Data)};
control(bag, {remove, Val}, #interface{data = Data} = Interface) ->
	Interface#interface{data = bag:del_element(Val, Data)};
control(assoc, {add, {Key, Val}}, #interface{data = Data} = Interface) ->
	Interface#interface{data = dict:append(Key, Val, Data)};
control(assoc, {remove, {Key, Val}}, #interface{data = Data} = Interface) ->
	case dict:fetch(Key, Data) of
		List when is_list(List) ->
			NewVal = List -- [Val];
		Val ->
			NewVal = [];
		Else ->
			NewVal = Else
	end,
	case NewVal of
		[] -> Interface#interface{data = dict:erase(Key, Data)};
		_ -> Interface#interface{data = dict:store(Key, NewVal, Data)}
	end;
control(assoc, {remove, Key}, #interface{data = Data} = Interface) ->
	Interface#interface{data = dict:erase(Key, Data)}.

dataList(#interface{type = Type, subType = SubType} = Interface) ->
	dataList(Type, Interface).

%% ====================================================
%% dataList -> tobys stringify
%% ====================================================

dataList(static, #interface{data = Data} = Interface) ->
	Data;
dataList(unit, #interface{data = Data} = Interface) ->
	{add, Data};
dataList(set, #interface{data = Data} = Interface) ->
	lists:map(fun(A) -> {add, A} end, sets:to_list(Data));
dataList(bag, #interface{data = Data} = Interface) ->
	lists:map(fun(A) -> {add, A} end, bag:to_list(Data));
dataList(assoc, #interface{data = Data} = Interface) ->
	lists:flatten(lists:map(fun assocList/1, dict:to_list(Data)));
dataList(list, #interface{data = Data} = Interface) ->
	nyi.
	
get(#interface{type = Type, subType = SubType} = Interface, Val) ->
	get(Type, Val, Interface).

get(assoc, Key, #interface{data = Data} = Interface) ->
	try Val = dict:fetch(Key, Data)
	catch
		_:_ -> null
	end;
get(bag, Val, #interface{data = Data} = Interface) ->
	bag:get_score(Val, Data).
	
assocList({_, []}) -> [];
assocList({Key, [H|T]}) ->
	[{add, {Key, H}}|assocList({Key, T})];
assocList({Key, Elem}) ->
	{add, {Key, Elem}}.