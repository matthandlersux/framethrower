-module (object).
-compile (export_all).

-include ("../include/scaffold.hrl").

-define(d(Msg, Var), io:format("Error in ~s (~p):~n~s ~p~n~n", [?MODULE, self(), Msg, Var])).
% syntactic sugar babbbyyy
-define (ob(Field), getVal(Ob, Field)).

%% 
%% become(State) can take the state of an old process and take over for it (in terms of child processes)
%% 

become(#ob{type = Type} = State) ->
	spawn(fun() ->
		process_flag(trap_exit, true),
		% link to child processes
		loop(Type, State)
	end).
		
%% 
%% new(situation|individual|relation|infon) -> PID of object
%% 

new(Type) -> 
	Parent = self(),
	spawn(fun() ->
		process_flag( trap_exit, true),
		Ob = new:ob(Parent),
		loop(Type, Ob#ob{type = Type})
	end).
	
loop(Type, Ob) ->
	receive
		{get, From, Element} ->
			msg:send(From, return, ?ob(Element)),
			loop(Type, Ob);
		{control, Element, Msg} ->
			msg:send(?ob(Element), control, Msg),
			loop(Type, Ob);
		debug ->
			io:format("State of Process: ~p~n~n~p~n~n", [self(), Ob]),
			loop(Type, Ob)
	end.
	
%% ====================================================
%% utility functions
%% ====================================================


%% 
%% getVal pulls an element out of a record so that you can access record elements using variables
%% 


getVal(Record, Element) ->
	Fields = record_info(fields, ob),
	Pos = which(Element, Fields),
	element(Pos + 1, Record).

%% 
%% which figures out the placement of an element in a record
%% 


which(E, F) ->
	case lists:member(E, F) of
		true ->
			which(E, F, 1);
		false ->
			0
	end.
	
which(_, [], Pos) ->
	Pos;
which(E, [H|T], Pos) ->
	if
		H =:= E ->
			Pos;
		true ->
			which(E, T, Pos + 1)
	end.