%%% -------------------------------------------------------------------
%%% Author  : andrew dailey
%%% Description : an intercept provides a way to react to messages from multiple cells with a shared state
%%%
%%% -------------------------------------------------------------------
-module(intercept).
-behaviour(gen_server).
-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X])).
%% gen_server callbacks
-export([init/1, handle_call/3, handle_cast/2, handle_info/2, terminate/2, code_change/3]).
%%For now, export all
-compile(export_all).

%% ====================================================================
%% External functions
%% ====================================================================

makeIntercept(Fun, State) -> 
	{ok, Pid} = gen_server:start(?MODULE, [Fun, State], []),
	Pid.
	
sendIntercept(IntPid, Message) ->
	gen_server:cast(IntPid, {sendIntercept, Message}).

%% ====================================================================
%% Server functions
%% ====================================================================
init([Fun, State]) ->
	process_flag(trap_exit, true),
    {ok, {Fun, State}}.

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
handle_call(Message, From, State) ->
    {noreply, State}.

handle_cast({sendIntercept, Value}, {Fun, State}) ->
	{noreply, {Fun, Fun(Value, State)}}.

handle_info(_, State) -> {noreply, State}.
terminate(Reason, State) -> ok.
code_change(OldVsn, State, Extra) -> {ok, State}.