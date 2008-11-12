%%% -------------------------------------------------------------------
%%% Author  : handler
%%% Description :
%%%
%%% Created : Mon Sep  1 15:12:24 EDT 2008
%%% -------------------------------------------------------------------
-module(cache).

-behaviour(gen_server).

-define(d(Msg, Var), io:format("Error in ~s (~p):~n~s ~p~n~n", [?MODULE, self(), Msg, Var])).
% syntactic sugar babbbyyy
-define (ob(Field), mblib:getVal(Ob, Field)).

%% --------------------------------------------------------------------
%% Include files
%% --------------------------------------------------------------------

-include ("../include/scaffold.hrl").

%% --------------------------------------------------------------------
%% External exports
-export([new/0, start_link/0, consult/2, add/2, remove/2, die/2]).

%% gen_server callbacks
-export([init/1, handle_call/3, handle_cast/2, handle_info/2, terminate/2, code_change/3]).


%% ====================================================================
%% External functions
%% ====================================================================

new() -> start_link().
start_link() ->
	case gen_server:start_link(?MODULE, [self()], []) of
		{ok, Pid} -> Pid;
		Else -> Else
	end.
	
consult(CacheId, Data) ->
	gen_server:call(CacheId, {consult, Data}).

add(CacheId, Pid) ->
	gen_server:cast(CacheId, {add, Pid}).

remove(CacheId, Pid) ->
	gen_server:cast(CacheId, {remove, Pid}).
	
die(CacheId, Reason) ->
	gen_server:cast(CacheId, {terminate, Reason}).


%% ====================================================================
%% Server functions
%% ====================================================================

%% --------------------------------------------------------------------
%% Function: init/1
%% Description: Initiates the server
%% Returns: {ok, State}          |
%%          {ok, State, Timeout} |
%%          ignore               |
%%          {stop, Reason}
%% --------------------------------------------------------------------
init([Parent]) ->
    {ok, #cache{parent = Parent, cacheList = []}}.

%% --------------------------------------------------------------------
%% Function: handle_call/3
%% Description: Handling call messages
%% Returns: {reply, Reply, State}          |
%%          {reply, Reply, State, Timeout} |
%%          {noreply, State}               |
%%          {noreply, State, Timeout}      |
%%          {stop, Reason, Reply, State}   | (terminate/2 is called)
%%          {stop, Reason, State}            (terminate/2 is called)
%% --------------------------------------------------------------------
handle_call({consult, Data}, _From, #cache{cacheList = CacheList} = State) ->
    PidList = consultCache(Data, CacheList),
    {reply, PidList, State#cache{cacheList = updateCache(Data, CacheList, PidList)}}.

%% --------------------------------------------------------------------
%% Function: handle_cast/2
%% Description: Handling cast messages
%% Returns: {noreply, State}          |
%%          {noreply, State, Timeout} |
%%          {stop, Reason, State}            (terminate/2 is called)
%% --------------------------------------------------------------------
handle_cast({add, Pid}, #cache{cacheList = CacheList} = State) ->
    {noreply, State#cache{cacheList = addCache(Pid, CacheList)}};
handle_cast({remove, Pid}, #cache{cacheList = CacheList} = State) ->
	{noreply, State#cache{cacheList = removeCache(Pid, CacheList)}};
handle_cast({terminate, Reason}, State) ->
	{stop, Reason, State}.

%% --------------------------------------------------------------------
%% Function: handle_info/2
%% Description: Handling all non call/cast messages
%% Returns: {noreply, State}          |
%%          {noreply, State, Timeout} |
%%          {stop, Reason, State}            (terminate/2 is called)
%% --------------------------------------------------------------------
handle_info({terminate, Reason}, State) ->
	{stop, Reason, State};
handle_info(Info, State) ->
    {noreply, State}.

%% --------------------------------------------------------------------
%% Function: terminate/2
%% Description: Shutdown the server
%% Returns: any (ignored by gen_server)
%% --------------------------------------------------------------------
terminate(Reason, State) ->
    ok.

%% --------------------------------------------------------------------
%% Func: code_change/3
%% Purpose: Convert process state when code is changed
%% Returns: {ok, NewState}
%% --------------------------------------------------------------------
code_change(OldVsn, State, Extra) ->
    {ok, State}.

%% --------------------------------------------------------------------
%%% Internal functions
%% --------------------------------------------------------------------



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
	Fun = fun({Pid, DataList}) ->
			case lists:member(Pid, PidList) of
				true ->
					{Pid, [Data] ++ DataList};
				false ->
					{Pid, DataList}
			end
		end,
		lists:map(Fun, CacheList).

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

