%%% -------------------------------------------------------------------
%%% Author  : handler
%%% Description :
%%%
%%% Created : Wed Sep  3 16:37:08 EDT 2008
%%% -------------------------------------------------------------------
-module(startcap).

-behaviour(gen_server).

-define(d(Msg, Var), io:format("Error in ~s (~p):~n~s ~p~n~n", [?MODULE, self(), Msg, Var])).
% syntactic sugar babbbyyy
-define (ob(Field), mblib:getVal(Ob, Field)).
-define (this(Field), State#?MODULE.Field).

%% --------------------------------------------------------------------
%% Include files
%% --------------------------------------------------------------------
-include ("../include/scaffold.hrl").
%% --------------------------------------------------------------------
%% External exports
-export([new/1, start_link/1, connect/2, disconnect/2, control/2, die/2]).

%% gen_server callbacks
-export([init/1, handle_call/3, handle_cast/2, handle_info/2, terminate/2, code_change/3]).
	
%% ====================================================================
%% External functions
%% ====================================================================

new(Interface) -> start_link(Interface).
start_link(Interface) ->
	case gen_server:start_link(?MODULE, [self(), Interface], []) of
		{ok, Pid} -> Pid;
		Else -> Else
	end.
	
connect(StartcapPid, Pid) ->
	gen_server:cast(StartcapPid, {connect, Pid}).

disconnect(StartcapPid, Pid) ->
	gen_server:cast(StartcapPid, {disconnect, Pid}).

control(_, {nodata}) ->
	nodata;
control(StartcapPid, Data) ->
	gen_server:cast(StartcapPid, {control, Data}).

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
init([Parent, Interface]) ->
	process_flag(trap_exit, true),
    {ok, #startcap{
		type = Interface#interface.type,
		subType = Interface#interface.subType,
		parentObject = Parent,
		interface = Interface
	}}.

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
handle_call(Msg, From, State) ->
    Reply = ok,
    {reply, Reply, State}.

%% --------------------------------------------------------------------
%% Function: handle_cast/2
%% Description: Handling cast messages
%% Returns: {noreply, State}          |
%%          {noreply, State, Timeout} |
%%          {stop, Reason, State}            (terminate/2 is called)
%% --------------------------------------------------------------------
handle_cast({connect, Pid}, State) ->
	link(Pid),
	Connections = addConnection(Pid, ?this(connections)),
	Cache = addCache(Pid, ?this(cache)),
	Cache1 = stream(?this(interface), Cache),
	{noreply, State#startcap{connections = Connections, cache = Cache1}};
handle_cast({disconnect, Pid}, State) ->
	unlink(Pid),
	Connections = removeConnection(Pid, ?this(connections)),
	Cache = removeCache(Pid, ?this(cache)),
	{noreply, State#startcap{connections = Connections, cache = Cache}};
handle_cast({control, Data}, State) ->
	Interface = interface:control(?this(interface), Data),
	Cache = stream(Data, ?this(cache)),
	{noreply, State#startcap{interface = Interface, cache = Cache}};
handle_cast({terminate, Reason}, State) ->
	{stop, Reason, State}.

%% --------------------------------------------------------------------
%% Function: handle_info/2
%% Description: Handling all non call/cast messages
%% Returns: {noreply, State}          |
%%          {noreply, State, Timeout} |
%%          {stop, Reason, State}            (terminate/2 is called)
%% --------------------------------------------------------------------
% handle_info({'EXIT', From, Reason}, State) ->
% 	if
% 		From =:= ?this(outputPin) ->
% 			unlink(?this(outputPin)),
% 			NewPin = pin:new(),
% 			link(NewPin),
% 			{noreply, State#startcap{outputPin = NewPin}};
% 		true ->
% 			{noreply, State}
% 	end;
handle_info(Info, State) ->
    {noreply, State}.

%% --------------------------------------------------------------------
%% Function: terminate/2
%% Description: Shutdown the server
%% Returns: any (ignored by gen_server)
%% --------------------------------------------------------------------
terminate(Reason, State) ->
	% nyi -- output cleanup data depending on reason,
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

%% 
%% stream takes the list of data from interface, consults the cache, and streams the data down the line
%%		it returns the updated cache
%% 
stream(Interface, Cache) when is_record(Interface, interface) ->
	DataList = interface:dataList(Interface),
	stream(DataList, Cache);
stream([], Cache) ->
	Cache;
stream([H|T], Cache) ->
	stream(T, stream(H, Cache));
stream(Data, Cache) ->
	PidList = consultCache(Data, Cache),
	msg:send(PidList, data, Data),
	updateCache(Data, Cache, PidList).

%% 
%% add connection adds a wire in which the startcap will send out its interface along
%% 

addConnection(Pid, PidList) ->
	case lists:member(Pid, PidList) of
		true ->
			PidList;
		false ->
			PidList ++ [Pid]
	end.

%% 
%% opposite of addConnection
%% 

removeConnection(Pid, PidList) ->
	PidList -- [Pid].
	

%% ====================================================
%% cache functions
%% ====================================================

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

