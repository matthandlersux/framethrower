-module (sessionPointer).
-export([
	create/2,
	new/2,
	name/1,
	pid/1,
	filterList/1,
	isSessionPointer/1
]).

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X]) ).

%% ====================================================
%% TYPES
%% ====================================================


%% ====================================================
%% External API
%% ====================================================

create(Name, Pid) -> new(Name, Pid).
new(Name, Pid) ->
	{sessionPointer, Name, Pid}.

name({sessionPointer, Name, _Pid}) ->
	Name.

pid({sessionPointer, _Name, Pid}) ->
	Pid.
	
filterList(ListOfArguments) ->
	lists:filter(fun({sessionPointer, N, P}) -> (is_list(N) andalso is_pid(P)); (_) -> false end, ListOfArguments).
	
isSessionPointer({sessionPointer, _Name, _Pid}) -> true;
isSessionPointer(_) -> false.

%% ====================================================
%% Internal API
%% ====================================================


%% ====================================================
%% Utilities
%% ====================================================

