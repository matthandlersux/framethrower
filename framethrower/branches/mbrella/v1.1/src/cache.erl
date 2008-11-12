-module (cache).
-compile (export_all).

-include ("../include/scaffold.hrl").
-define(d(Msg, Var), io:format("Error in ~s (~p):~n~s ~p~n~n", [?MODULE, self(), Msg, Var])).

%% ====================================================
%% API
%% ====================================================


new() ->
	Parent = self(),
	spawn( fun() ->
		loop(Parent, [])
		end).
		
consult(Pid, Data) ->
	msg:send(Pid, return, {consult, Ref, Data}).
		
%% ====================================================
%% nitty gritty
%% ====================================================


	
loop(Parent, CacheList) ->
	receive
		{add, Pid} ->
			CacheList1 = addCache(Pid, CacheList),
			loop(Parent, CacheList1);
		{remove, Pid} ->
			CacheList1 = removeCache(Pid, CacheList),
			loop(Parent, CacheList);
		{consult, Data} ->
			PidList = consultCache(Data, CacheList),
			msg:send(Parent, return, PidList),
			CacheList1 = updateCache(Data, CacheList, PidList),
			loop(Parent, CacheList1);
		debug ->
			io:format("State of cache ~p with parent ~p:~n~n~p~n~n", [self(), Parent, CacheList]),
			loop(Parent, CacheList)
	end.
		

addCache(Pid, CacheList) ->
	case cacheMember(Pid, CacheList) of 
		true ->
			CacheList;
		false ->
			CacheList ++ [{Pid, []}]
	end.

removeCache(Pid, CacheList) ->
	{value, _, CacheList1} = lists:keytake(Pid, 1, CacheList),
	CacheList1.

%% 
%% consultCache returns a list of Pids for which Data has not been sent
%% 


consultCache(Data, CacheList) ->
	Connections = cacheToPidList(CacheList),
	Fun = fun(Pid) ->
		TargetCache = getCache(Pid, CacheList),
		case cacheMember(Data, TargetCache) of
			true -> false;
			false -> true
		end
	end,
	lists:filter(Fun, Connections).


%% 
%% updateCache takes the State and a list of caches to be updated with Data and returns updated Cache
%% 


updateCache(Data, CacheList, PidList) ->
	Fun = fun({Pid, DataList}, Acc) ->
			case lists:member(Pid, PidList) of
				true ->
					Acc ++ [{Pid, [Data] ++ DataList}];
				false ->
					Acc ++ [{Pid, Data}]
			end
		end,
		lists:foldl(Fun, [], CacheList).

%% ====================================================
%% utility functions
%% ====================================================

%% 
%% cacheMember checks if Data has been stored in a cache or if a Pid is a member of the cachelist
%% 


cacheMember(Data, {_, DataList}) ->
	lists:member(Data, DataList);
cacheMember(Pid, CacheList) ->
	lists:keymember(Pid, 1, CacheList).

getCache(Pid, CacheList) ->
	case lists:keysearch(Pid, 1, CacheList) of
		{value, Val} ->
			Val;
		Else ->
			Else
	end.
	
cacheToPidList(CacheList) ->
	{PidList, _} = lists:unzip(CacheList),
	PidList.

