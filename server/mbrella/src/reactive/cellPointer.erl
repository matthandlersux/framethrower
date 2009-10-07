-module (cellPointer).
-compile(export_all).

%-include().

-ifdef( debug ).
-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X]) ).
-else.
-define( trace(X), void ).
-endif.

%% ====================================================
%% TYPES
%% ====================================================


%% ====================================================
%% External API
%% ====================================================

create(Name, Pid) -> new(Name, Pid).
new(Name, Pid) ->
	{Name, Pid}.

name({Name, _Pid}) ->
	Name.

pid({_Name, Pid}) ->
	Pid.
	
filterList(ListOfArguments) ->
	lists:filter(fun({N, P}) -> (is_list(N) andalso is_pid(P)); (_) -> false end, ListOfArguments).
%% ====================================================
%% Internal API
%% ====================================================


%% ====================================================
%% Utilities
%% ====================================================

