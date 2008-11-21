-module (msg).
-compile (export_all).

%% 
%% send module helps me keep my communication stardardized
%%		also lets me send to a list of pids
%% 


send([], _, _) ->
	[];
send([H|T], MsgType, Val) ->
	send(H, MsgType, Val),
	send(T, MsgType, Val);
send(Pid, return, Val) ->
	% Pid ! {ok, Val}.
	%return starts a process, waits for a response to the message, and sends it back to the parent
	Pid ! Val
	io:format("~nval:~p~n~n", [Val]);
send(Pid, control, Val) ->
	io:format("~ncontrol:~p~n~n", [Val]);
send(Pid, data, Data) ->
	Pid ! {data, Data}.