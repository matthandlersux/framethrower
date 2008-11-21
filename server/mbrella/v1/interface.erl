-module (interface).
-compile (export_all).

% stream functions will always be called with one Pid, but all sorts of data

new(unit, Name) ->
	% data = {set, Value}	
	StreamFun = fun streamFun/2,
	% alterations = {set, ____}
	AlterFun = fun({interface, Attribs, _}, PidList, Alteration) ->
		stream(Attribs, PidList, Alteration),
		{interface, Attribs, Alteration}
	end,
	DisplayFun = fun({interface, _, {set, Value}}) ->
		Value
	end,
	Attributes = [{name, Name}, {type, unit}, {streamFun, StreamFun}, {alterFun, AlterFun}, {displayFun, DisplayFun}],
	Data = {set, undefined},	
	{interface, Attributes, Data};
new(set, Name) ->
	% data = sets:to_list(Data) -> [{add, Value}, ...]
	StreamFun = fun(Pid, Data) ->
			case sets:is_set(Data) of
				true ->
					Data1 = sets:to_list(Data),
					% Data2 = lists:zip(lists:duplicate(length(Data1), add), Data1),
					streamFun(Pid, Data1);
				false ->
					streamFun(Pid, Data)
			end
		end,
	% alterations = {add, Value} or {remove, Value}
	AlterFun = 
		fun({interface, Attribs, Data} = Interface, PidList, {add, _} = Alteration) ->
			case sets:is_element(Alteration, Data) of
				false ->
					stream(Attribs, PidList, Alteration),
					{interface, Attribs, sets:add_element(Alteration, Data)};
				true ->
					Interface
			end;
		({interface, Attribs, Data} = Interface, PidList, {remove, Value} = Alteration) ->
				case sets:is_element({add, Value}, Data) of
					true ->
						stream(Attribs, PidList, Alteration),
						{interface, Attribs, sets:del_element({add, Value}, Data)};
					false ->
						Interface
				end
		end,
	DisplayFun = fun({interface, _, Data}) ->
		sets:to_list(Data)
	end,
	Attributes = [{name, Name}, {type, set}, {streamFun, StreamFun}, {alterFun, AlterFun}, {displayFun, DisplayFun}],
	Data = sets:new(),
	{interface, Attributes, Data};
new(list, Name) ->
	nyi;
new(xml, Name) ->
	nyi.


streamFun(_, []) -> [];
streamFun(Pid, [H|T]) ->
	streamFun(Pid, H),
	streamFun(Pid, T);
streamFun(Pid, Data) ->
	Pid ! {data, Data}.

%% ====================================================
%% common functions
%% ====================================================

getNames([]) -> [];
getNames([H|T]) ->
	[getName(H)|getNames(T)].

getName(Interface) ->
	getAttr(Interface, name).

%% 
%% stream(Attributes, PidList, Data) will send the same message {data, Data} to each Pid in the list
%% 		messages may be broken up depending on the interface
%% 


stream(_, [], _) ->
	[];
stream(Attributes, [H|T], Data) ->
	stream(Attributes, H, Data),
	stream(Attributes, T, Data);
stream(Attributes, Pid, Data) ->
	StreamFun = getAttr(Attributes, streamFun),
	StreamFun(Pid, Data).
	
% alterFun needs to know how to take an interface, alter it according to payload, and send updates to connections
alter(Interface, PidList, Payload) when is_list(Payload) ->
	Fun = fun(Alteration, I) -> alter(I, PidList, Alteration) end,
	lists:foldl(Fun, Interface, Payload);
alter({interface, Attributes, _} = Interface, PidList, Payload) ->
	AlterFun = getAttr(Attributes, alterFun),
	AlterFun(Interface, PidList, Payload).

getAttr({interface, Attrs, _}, Field) ->
	getAttr(Attrs, Field);
getAttr(Attrs, Field) ->
	{value, {Field, Value}} = lists:keysearch(Field, 1, Attrs),
	Value.
	
% view returns the value of the data

view({interface, Attributes, _} = Interface) ->
	DisplayFun = getField( Attributes, displayFun ),
	DisplayFun(Interface).

getField(List, Field) ->
	{value, {Field, Value}} = lists:keysearch(Field, 1, List),
	Value.