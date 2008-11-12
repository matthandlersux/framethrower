-module (pin).
-compile (export_all).

-include ("../include/scaffold.hrl").

-define(d(Msg, Var), io:format("Error in ~s (~p):~n~s ~p~n~n", [?MODULE, self(), Msg, Var])).

output() ->
	Parent = self(),
	spawn(fun() ->
		process_flag(trap_exit, true),
		outputLoop(Parent, #pin{connections = initConnections(), cache = initCache()})
	end).
	
input() ->
	nyi.
	
%% 
%% an output pin receives messages of the following:
%% 		{data, Data}
%% 		{connect, Pid}
%%		{disconnect, Pid}
%%


outputLoop(Parent, State) ->
	receive
		{data, Data} ->
			PidList = consultCache(State, Data),
			Cache = updateCache(State#pin.cache, PidList, Data),
			msg:send(PidList, msg, Data),
			outputLoop(Parent, State#pin{cache = Cache});
		{connect, Pid} ->
			Connections = addConnection(Pid, State#pin.connections),
			Cache = addCache(Pid, State#pin.cache),
			outputLoop(Parent, State#pin{connections = Connections, cache = Cache});
		{disconnect, Pid} ->
			Connections = removeConnection(Pid, State#pin.connections),
			Cache = removeCache(Pid, State#pin.cache),
			outputLoop(Parent, State#pin{connections = Connections, cache = Cache});
		debug ->
			io:format("State of pin ~p (child of ~p) is:~n~n~p~n~n", [self(), Parent, State]),
			outputLoop(Parent, State)
	end.

addConnection(Pid, PidList) ->
	case lists:member(Pid, PidList) of
		true ->
			PidList;
		false ->
			PidList ++ [Pid]
	end.
	
removeConnection(Pid, PidList) ->
	PidList -- [Pid].
	
addCache(Pid, CacheList) ->
	case lists:keymember(Pid, 1, CacheList) of 
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


consultCache(#pin{cache = Cache, connections = Connections}, Data) ->
	Fun = fun(Pid) ->
		TargetCache = getCache(Pid, Cache),
		cacheMember(Data, TargetCache)
	end,
	lists:filter(Fun, Connections).

%% 
%% updateCache takes the State and a list of caches to be updated with Data and returns updated Cache
%% 


updateCache(CacheList, PidList, Data) ->
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
	
	
%% ====================================================
%% initialization functions
%% ====================================================

initConnections() ->
	[].

initCache() ->
	[].