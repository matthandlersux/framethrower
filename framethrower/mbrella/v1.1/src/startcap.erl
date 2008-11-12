-module (startcap).
-compile (export_all).

-include ("../include/scaffold.hrl").
-define(d(Msg, Var), io:format("Error in ~s (~p):~n~s ~p~n~n", [?MODULE, self(), Msg, Var])).

%% 
%% a startcap contains an interface and an output pin.  it can receive messages:
%% 		{alter, Data} where Data -> message to alter interface
%%		{connect, Pid} adds connection to Pid and streams data
%%		{disconnect, Pid} remove connection and decache
%%		connect/disconnect interface with the startcaps output pin
%% 
% -record (startcap, {
% 	type,
% 	parentObject,
% 	outputPin,
% 	cache,
% 	interface
% 	}).

new(Interface) ->
	From = self(),
	Type = interface:type(Interface),
	spawn( fun() -> 
		process_flag(trap_exit, true),
		S = #startcap{type = Type, parentObject = From, outputPin = new:outputPin(),
				interface = Interface},
		loop(Type, S)
	end).

loop(Type, S) ->
receive
	{connect, Pid} ->
		link(Pid),
		msg:send(S#startcap.outputPin, connect, Pid),
		msg:send(Pid, interface, S#startcap.interface),
		loop(Type, S);
	{disconnect, Pid} ->
		unlink(Pid),
		msg:send(S#startcap.outputPin, disconnect, Pid),
		loop(Type, S);
	{alter, Data} ->
		Interface = interface:alter(S#startcap.interface, Data),
		msg:send(S#startcap.outputPin, data, Data),
		loop(Type, S#startcap{interface = Interface});
	{'EXIT', Pid, Reason} ->
		unlink(Pid),
		msg:send(S#startcap.outputPin, disconnect, Pid),
		?d("Startcap received exit signal", Reason),
		loop(Type, S)
end.
	
%% ====================================================
%% initialization functions
%% ====================================================

