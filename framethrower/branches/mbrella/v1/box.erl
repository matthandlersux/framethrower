-module (box).
-compile( export_all).
-import(interface, [getName/1, stream/3, alter/3]).
-import(startcap, [initConnections/1]).

-define(d(Msg, Var), io:format("Error in ~s (~p):~n~s ~p~n~n", [?MODULE, self(), Msg, Var])).


new(InPins, OutPins, Process) when is_integer(InPins), is_integer(OutPins) ->
	spawn(fun() -> 
				process_flag(trap_exit, true),
				InPins1 = newInputList(InPins),
				OutPins1 = newPinList(OutPins),
				{_, InChannels} = lists:unzip(InPins1),
				OutChannels = OutPins1,
				Process1 = process:new(InChannels, OutChannels, Process),
				loop(InPins1, OutPins1, Process1, [], false)
			end).
	
loop(InPins, OutPins, Process, Connections, Active) ->
	% linkToPins(InPins ++ OutPins),
	receive
		activate ->
			loop(InPins, OutPins, Process, Connections, true);
		deactivate ->
			loop(InPins, OutPins, Process, Connections, false);
		{connect, {PinPidRaw, {boxPin, BoxPid, BoxPin}}} when Active =:= true ->
			% ?d("sending connectUp...", true),
			BoxPid ! {addInform, {BoxPin, pinPid(PinPidRaw, InPins)}},
			loop(InPins, OutPins, Process, Connections, Active);
		{addInform, {OutPin, ToPinPid}} ->
			% link(ToPinPid)
			OutPinPid = pinPid(OutPin, OutPins),
			OutPinPid ! {connect, {ToPinPid}},
			Connections1 = Connections ++ [{OutPin, ToPinPid}],
			loop(InPins, OutPins, Process, Connections1, true);
		{disconnect, {PinPidRaw, {boxPin, BoxPid, BoxPin}}} ->
			% unlink(InputPid),
			BoxPid ! {removeInform, {BoxPin, pinPid(PinPidRaw, InPins)}},
			loop(InPins, OutPins, Process, Connections, Active);
		{removeInform, {OutPin, ToPinPid}} ->
			OutPinPid = pinPid(OutPin, OutPins),
			OutPinPid ! {disconnect, {ToPinPid}},
			Connections1 = Connections -- [{OutPin, ToPinPid}],
			case Connections1 =:= [] of
				true -> Active1 = false;
				false -> Active1 = true
			end,
			loop(InPins, OutPins, Process, Connections1, Active1);
		{'EXIT', Pid, Reason} ->
			?d("exit from: ", {Pid, Reason}),
			% if process dies, write to tty, deactivate, and restart process
			loop(InPins, OutPins, Process, Connections, Active);
		debug ->
		io:format("State of box ~p is: ~n~n~nInPins:~n~p~n~n~nOutPins:~n~p~n~n~nConnections:~n~p~n~n~nActive: ~n~s~n~n", [self(), InPins, OutPins, Connections, Active]),
			debugPins(OutPins),
			Process ! debug,
			loop(InPins, OutPins, Process, Connections, Active);
		{data, Attributes, Data} when Active =:= true ->
			% ?d("========Received: ", {data, Attributes, Data}),
			Channel = pinNameFromPid(Attributes, InPins),
			Process ! {data, [{channel, Channel}], Data},
			loop(InPins, OutPins, Process, Connections, Active)
	end.
	
pinNameFromPid(Attributes, Pins) ->
	case lists:keysearch(channelPid, 1, Attributes) of
		{value, {_, Pid}} ->
			case lists:keysearch(Pid, 2, Pins) of
				{value, {Name, _}} ->
					Name;
				_ ->
					false
			end;
		_ ->
			false
	end.
	
pinPid(Pin, PinList) ->
	{value, {_, Pid}} = lists:keysearch(Pin, 1, PinList),
	Pid.
	
newPinList(0) -> [];
newPinList(Value) ->
	[{Value, pin:new(self())}|newPinList(Value - 1)].
	
newInputList(0) -> [];
newInputList(Value) ->
	[{Value, pin:newInput(self())}|newInputList(Value - 1)].

debugPins([]) -> [];
debugPins([{_, Pid}| T]) ->
	Pid ! debug,
	debugPins(T).
	
linkToPins([]) -> [];
linkToPins([{_, Pid}|T]) ->
	link(Pid),
	linkToPins(T).