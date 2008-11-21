-module (pin).
-compile(export_all).
-import(startcap, [getField/2]).

-define(d(Msg, Var), io:format("Error in ~s (~p):~n~s ~p~n~n", [?MODULE, self(), Msg, Var])).

new(ParentPid) ->
	spawn_link(fun() -> process_flag(trap_exit, true), loop(ParentPid, [], []) end).
	
newInput(ParentPid) ->
	spawn_link(fun() -> process_flag(trap_exit, true), loop2(ParentPid) end).
% input pins in a box only have a connection to the process(es) in the box
% output pins in a box have connections to any other pins
% cache -> {cache, [{connection, Pid}], [Data1, Data2, ...]} (Data -> messages received)

loop2(ParentPid) ->
	% process_flag(trap_exit, true),
	receive 
		{data, Data} ->
			ParentPid ! {data, [{channelPid, self()}], Data},
			loop2(ParentPid);
		Msg ->
			?d("Random message: ", Msg),
			loop2(ParentPid)
	end.
	
loop(ParentPid, Connections, Cache) ->
	% process_flag(trap_exit, true),
	receive
		{connect, {Pid}} ->
			Cache1 = addCache(Pid, Cache),
			loop(ParentPid, Connections ++ [Pid], Cache1);
		{disconnect, {Pid}} ->
			Cache1 = removeCache(Pid, Cache),
			loop(ParentPid, Connections -- [Pid], Cache1);
		{data, Data} ->
			% may need to do some data type checking here
			Connections1 = consultCache(Data, Cache),
			stream(Data, Connections1),
			% adding Cache because Connections only contains some outputs, not all
			Cache1 = addDataToCache(Data, Cache, Connections1) ++ getCache(Cache, Connections -- Connections1),
			loop(ParentPid, Connections, Cache1);
		debug ->
			io:format("State of pin ~p is: ~n~n~n
				Cache:~n~p~n~n~n
				Connections:~n~p~n~n~n
				Parent: ~n~p~n~n", [self(), Cache, Connections, ParentPid]),
			loop(ParentPid, Connections, Cache);
		Any ->
			?d("Pin received: ", Any),
			loop(ParentPid, Connections, Cache)			
	end.

% must return new cache

addDataToCache(_, _, []) -> [];
addDataToCache(Data, CacheList, [H|T]) ->
	Cache = getCacheByPid(CacheList, H),
	Cache1 = updateCache(Cache, Data),
	[Cache1|addDataToCache(Data, CacheList, T)].

getCacheByPid([], _) -> [];
getCacheByPid([{cache, Attr, _} = Cache|T], Pid) ->
	case getConnection(Attr) =:= Pid of
		true ->
			Cache;
		false ->
			getCacheByPid(T, Pid)
	end.
	
updateCache({cache, Attr, Cache}, Data) ->
	{cache, Attr, Cache ++ [Data]}.
	
% get cache returns a list of caches based on connection
getCache(_, []) -> [];
getCache(Cache, [H|T]) ->
	[getCache(Cache, H)|getCache(Cache, T)];
getCache(Cache, Pid) ->
	getCacheByPid(Cache, Pid).
	
stream(_, []) -> [];
stream(Data, [H|T]) ->
	H ! {data, Data},
	stream(Data, T).
	
consultCache(Data, Cache) ->
	lists:flatten(consultCacheList(Data, Cache)).
	
consultCacheList(_, []) -> [];
consultCacheList(Data, [{cache, RawPid, DataList}|T]) ->
	Pid = getConnection(RawPid),
	case lists:member(Data, DataList) of
		false ->
			[Pid|consultCacheList(Data, T)];
		true ->
			[consultCacheList(Data, T)]
	end.

% takes a cache attribute list and returns the pid <-> connection attribute
getConnection(Pid) ->
	getField(Pid, connection).
	
addCache(Pid, CacheList) ->
	CacheList ++ [{cache, [{connection, Pid}], []}].

removeCache(Pid, CacheList) ->
	Fun = fun({cache, RawPid, _}) ->
				getConnection(RawPid) =/= Pid
			end,
	lists:filter(Fun, CacheList).