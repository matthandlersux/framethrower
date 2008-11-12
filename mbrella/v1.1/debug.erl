-module (debug).
-compile(export_all).

new(Name) ->
	spawn(fun() -> process_flag(trap_exit, true), loop(Name) end).
	
loop(Name) ->
	receive
		die ->
			io:format("~s is shutting down~n~n", [Name]);
		{link, Pid} ->
			link(Pid),
			loop(Name);
		Msg ->
			io:format("~s received ~p~n~n", [Name, Msg]),
			loop(Name)
	end.

% 	debugging startcap and interfaces
% Matt = debug:new(matt).
% Andrew = debug:new(andrew).
% Toby = debug:new(toby).
% A = interface:new(set, a).
% B = interface:new(set, b).
% C = interface:new(unit, c).
% S1 = startcap:new([A, B, C]).
% S1 ! {addInform, {a, Matt}}.
% S1 ! {addInform, {a, Andrew}}.
% S1 ! {addInform, {c, Toby}}.
% S1 ! {alter, {c, {set, jamesbond}}}.
% S1 ! {alter, {a, {add, octopussy}}}.
% S1 ! {alter, {a, {add, jaws}}}.
% S1 ! {alter, {a, {add, someguy}}}.
% S1 ! {alter, {a, {remove, someguy}}}.
% 
% Pid = fun(X) -> list_to_pid(X) end.
% B1 = box:new(1,2,process).
% B2 = box:new(1,2,process).
% B2 ! {connect, {1, {boxPin, B1, 2}}}.
% B2 ! activate.

% debugging pins
% P1 = pin:new(self).
% P2 = pin:new(self).
% P3 = pin:new(self).
% P1 ! {connect, {P2}}.
% P1 ! {data, somedata}.
% P1 ! debug.
% P1 ! {connect, {P3}}.
% P1 ! debug.

A = interface:new(set, a).
B = interface:new(set, b).
C = interface:new(unit, c).
S1 = startcap:new([A, B, C]).
B1 = box:new(1,1, fun process:filterListEvens/2).
D1 = debug:new(matty).
D2 = debug:new(toby).
B1 ! {addInform, {1, D1}}.
B1 ! {connect, {1, {boxPin, S1, b}}}.
S1 ! {addInform, {b, D2}}.
S1 ! {alter, {b, {add, 1}}}.
S1 ! {alter, {b, {add, 2}}}.
S1 ! {alter, {b, {add, 3}}}.
B1 ! debug.