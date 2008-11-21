-module (startcap).
-compile(export_all).
-import(interface, [getName/1, stream/3, alter/3]).

-define(d(Msg, Var), io:format("Error in ~s (~p):~n~s ~p~n~n", [?MODULE, self(), Msg, Var])).

% OutputInterfaces will be a list of interface data objects, [Interface1, Interface2, ...]
% Interfaces will be named and typed data objects, 
% 		I1 = {interface, [{name, Name}, {type, Type}, {alterFun, Fun1}, {streamFun, Fun2}], Data}
% 		{interface, [AttrList], Data}
% 		Fun1({alter, Payload}, I1, C1) -> I2
% 			makes changes, sends changes, returns altered interface
% 		Fun2(Pid, Data) -> Bool()
% 			sends data down the chain, knows how to handle specific Data to that type of interface
% 
% Connections are of the form:
% 		C1 = [{Name, [Pid1, Pid2, ...]}, ...]

new(OutputInterfaces) ->
	PinList = initPinList(OutputInterfaces),
	spawn(fun() -> loop(OutputInterfaces, PinList) end).
	
loop(OutputInterfaces, PinList) ->
	process_flag(trap_exit, true),
	receive
		{alter, {Name, Payload}} ->
			{OutputInterfaces1, PinList1} = alterStartcap(OutputInterfaces, PinList, Name, Payload),
			loop(OutputInterfaces1, PinList1);
		{addInform, {OutputName, InputPid}} ->
			% don't add twice
			link(InputPid),
			addInform(PinList, InputPid, OutputName),
			streamData(OutputName, InputPid, OutputInterfaces),
			loop(OutputInterfaces, PinList);
		{removeInform, {OutputName, InputPid}} ->
			unlink(InputPid),
			removeInform(PinList, InputPid, OutputName),
			loop(OutputInterfaces, PinList);
		{'EXIT', Pid, _} ->
			?d("exit from: ", Pid),
			removeInform(PinList, Pid),
			loop(OutputInterfaces, PinList);
		debug ->
			io:format("State of startcap ~p is: ~n~n~nInterfaces:~n~p~n~n~nPinList:~n~p~n~n", [self(), OutputInterfaces, PinList]),
			debugPins(PinList),
			loop(OutputInterfaces, PinList);
		Multi when is_list(Multi) ->
			nyi;
		Any ->
			?d("Received: ", Any),
			loop(OutputInterfaces, PinList)		
	end.
	
streamData(Name, Pid, OutputInterfaces) ->
	{interface, StreamFun, Data} = chooseInterface(Name, OutputInterfaces),
	stream(StreamFun, Pid, Data).

% takes the list of pins, a new pid, and an interface name and tells the appropriate pin to add pid
% 		to its connection
addInform(PinList, Pid, Name) ->
	case lists:keysearch(Name, 1, PinList) of
		{value, {_, PinPid}} ->
			PinPid ! {connect, {Pid}};
		_ ->
			?d("No Interface by that name.", false)
	end.

removeInform(PinList, Pid) ->
	Fun = fun({_, PinPid}) ->
		PinPid ! {disconnect, {Pid}}
	end,
	lists:foreach(Fun, PinList).

removeInform(PinList, Pid, Name) ->
	case lists:keytake(Name, 1, PinList) of
		{value, {_, PinPid}} ->
			PinPid ! {connect, {Pid}};
		_ ->
			?d("No Connection", Name)
	end.

% create a pin:new() for each interface and store it in a list
initPinList([]) -> [];
initPinList([H|T]) ->
	[{getName(H), pin:new(self())}|initPinList(T)].
	
% altering the state of a startcap may need to be a composition of alterations to make erl-js interfacing easier
% altering Payload should be {alter, [{name, Name}], Payload}
	
alterStartcap(OutputInterfaces, PinList, Name, Payload) ->
	PinPid = getPinPid(PinList, Name),
	case takeInterface(Name, OutputInterfaces) of
		{Interface, Rest} ->
			Interface1 = alter(Interface, PinPid, Payload),
			{Rest ++ [Interface1], PinList};
		_ ->
			?d("Couldn't find interface: ", Name)
	end.

getPinPid(List, Name) ->
	getField(List, Name).
	
getField(List, Field) ->
	{value, {Field, Value}} = lists:keysearch(Field, 1, List),
	Value.
	
chooseInterface(Name, OutputInterfaces) ->
	Fun = fun(Interface) -> Name == interface:getName(Interface) end,
	[Int1|_] = lists:filter(Fun, OutputInterfaces),
	Int1.
	
takeInterface(Name, OutputInterfaces) ->
	Fun = fun(I) -> Name == interface:getName(I) end,
	{[Interface], Rest} = lists:partition(Fun, OutputInterfaces),
	{Interface, Rest}.
	
debugPins([]) -> [];
debugPins([{_, Pid}| T]) ->
	Pid ! debug,
	debugPins(T).