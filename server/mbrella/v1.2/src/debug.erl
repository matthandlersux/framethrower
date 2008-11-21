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

% A = interface:new(set, a).
% B = interface:new(set, b).
% C = interface:new(unit, c).
% S1 = startcap:new([A, B, C]).
% B1 = box:new(1,1, fun process:filterListEvens/2).
% D1 = debug:new(matty).
% D2 = debug:new(toby).
% B1 ! {addInform, {1, D1}}.
% B1 ! {connect, {1, {boxPin, S1, b}}}.
% S1 ! {addInform, {b, D2}}.
% S1 ! {alter, {b, {add, 1}}}.
% S1 ! {alter, {b, {add, 2}}}.
% S1 ! {alter, {b, {add, 3}}}.
% B1 ! debug.

% Inf1 = object:new(infon),
% JB = object:new(individual),
% Sit1 = object:new(situation),
% Matty = debug:new(matty),
% object:control(JB, content, {set, james_bond}),
% object:control(JB, parentSituation, {set, Sit1}),
% object:control(Sit1, content, {set, 007}),
% JBInf = object:get(JB, involves),
% startcap:control(JBInf, {add, Inf1}),
% startcap:connect(JBInf, Matty).

%% ====================================================
%% test buildAssoc
%% ====================================================

% Ind1 = object:new(individual).
% Ind2 = object:new(individual).
% Ind3 = object:new(individual).
% Lin1 = object:new(individual).
% Lin2 = object:new(individual).
% Lin3 = object:new(individual).
% Matty = debug:new(matty).
% object:control(Ind1, corresponds, {add, Ind2}).
% object:control(Ind1, corresponds, {add, Ind3}).
% object:control(Lin1, corresponds, {add, Lin2}).
% object:control(Lin1, corresponds, {add, Lin3}).
% Set1 = startcap:new( interface:new(set, individuals) ).
% startcap:control( Set1, {add, Ind1}).
% startcap:control( Set1, {add, Lin1}).
% Set2 = startcap:new( interface:new(set, individuals) ).
% startcap:control( Set2, {add, Ind1}).
% Box = component:buildAssoc( fun component:buildAssocOfCorrespondences/1 ).
% startcap:connect( Set1, Box ).
% startcap:connect( Set2, Box ).
% box:connect( Box, Matty ).

%% ====================================================
%% test equals
%% ====================================================

Ind1 = object:new(individual).
Ind2 = object:new(individual).
Set1 = startcap:new( interface:new(set, individuals) ).
Matty = debug:new(matty).
startcap:control( Set1, {add, Ind1} ).
startcap:control( Set1, {add, Ind2} ).
Box = component:equals( Ind1 ).
startcap:connect( Set1, Box ).
box:connect( Box, Matty ).