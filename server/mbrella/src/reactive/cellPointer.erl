-module (cellPointer).
-export([
  create/2,
  new/2,
  name/1,
  pid/1,
  filterList/1,
  isCellPointer/1
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
  {cellPointer, Name, Pid}.

name({cellPointer, Name, _Pid}) ->
  Name.

pid({cellPointer, _Name, Pid}) ->
  Pid.

filterList(ListOfArguments) ->
  lists:filter(fun({cellPointer, N, P}) -> (is_list(N) andalso is_pid(P)); (_) -> false end, ListOfArguments).

isCellPointer({cellPointer, _Name, Pid}) when is_pid(Pid) -> true;
isCellPointer(_) -> false.

%% ====================================================
%% Internal API
%% ====================================================


%% ====================================================
%% Utilities
%% ====================================================

