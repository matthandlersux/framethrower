%%% -------------------------------------------------------------------
%%% Author  : handler
%%% Description :
%%%
%%% Created : Mon Sep  1 15:41:00 EDT 2008
%%% -------------------------------------------------------------------
-module(pin).

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
-export([new/0, start_link/0, data/2, connect/2, disconnect/2, die/2]).

%% gen_server callbacks
-export([init/1, handle_call/3, handle_cast/2, handle_info/2, terminate/2, code_change/3]).

%% ====================================================================
%% External functions
%% ====================================================================

new() -> start_link().
start_link() ->
	case gen_server:start_link(?MODULE, [], []) of
		{ok, Pid} -> Pid;
		Else -> Else
	end.
	
data(PinId, Data) ->
	gen_server:cast(PinId, {data, Data}).

connect(PinId, Pid) ->
	gen_server:cast(PinId, {connect, Pid}).

disconnect(PinId, Pid) ->
	gen_server:cast(PinId, {disconnect, Pid}).
	
die(PinId, Reason) ->
	gen_server:cast(PinId, {terminate, Reason}).


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
init([]) ->
	process_flag(trap_exit, true),
	Cache = cache:new(),
	link(Cache),
    {ok, #pin{connections = [], cache = Cache}}.

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
handle_cast({data, Data}, State) when is_list(Data) ->
	Fun = fun(D) ->
		PidList = cache:consult(?this(cache), D),
		msg:send(PidList, data, D)
	end,
	lists:foreach(Fun, Data),
	{noreply, State};
handle_cast({data, Data}, State) ->
	PidList = cache:consult(?this(cache), Data),
	msg:send(PidList, data, Data),
    {noreply, State};
handle_cast({connect, Pid}, State) ->
	link(Pid),
	Connections = addConnection(Pid, ?this(connections)),
	Cache = cache:add(?this(cache), Pid),
	{noreply, State#pin{connections = Connections}};
handle_cast({disconnect, Pid}, State) ->
	unlink(Pid),
	Connections = removeConnection(Pid, ?this(connections)),
	Cache = cache:remove(?this(cache), Pid),
	{noreply, State#pin{connections = Connections}};
handle_cast({terminate, Reason}, State) ->
	{stop, Reason, State}.

%% --------------------------------------------------------------------
%% Function: handle_info/2
%% Description: Handling all non call/cast messages
%% Returns: {noreply, State}          |
%%          {noreply, State, Timeout} |
%%          {stop, Reason, State}            (terminate/2 is called)
%% --------------------------------------------------------------------
handle_info({'EXIT', From, Reason}, State) ->
	case From of 
		OldCache ->
			unlink(OldCache),
			Cache = cache:new(),
			link(Cache)
	end,
    {noreply, State#pin{cache = Cache}};
handle_info({terminate, Reason}, State) ->
	{stop, Reason, State}.

%% --------------------------------------------------------------------
%% Function: terminate/2
%% Description: Shutdown the server
%% Returns: any (ignored by gen_server)
%% --------------------------------------------------------------------
terminate(Reason, State) ->
	cache:die(?this(cache), Reason),
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

addConnection(Pid, PidList) ->
	case lists:member(Pid, PidList) of
		true ->
			PidList;
		false ->
			PidList ++ [Pid]
	end.
	
removeConnection(Pid, PidList) ->
	PidList -- [Pid].