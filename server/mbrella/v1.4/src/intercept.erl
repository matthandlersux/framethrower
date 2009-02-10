%%% -------------------------------------------------------------------
%%% Author  : andrew dailey
%%% Description : an intercept provides a way to react to messages from multiple cells with a shared state
%%%
%%% -------------------------------------------------------------------
-module(intercept).
-behaviour(gen_server).
-include("../include/scaffold.hrl").

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X])).
-define (this(Field), State#interceptState.Field).

%% gen_server callbacks
-export([init/1, handle_call/3, handle_cast/2, handle_info/2, terminate/2, code_change/3]).
%%For now, export all
-compile(export_all).


%% ====================================================================
%% Intercept internal data structure record
%% ====================================================================
-record(interceptState, {function, state, ownerCell}).
-record(onRemove, {function, cell, id, done}).

%% ====================================================================
%% External functions
%% ====================================================================

makeIntercept(Fun, State, OwnerCell) -> 
	{ok, Pid} = gen_server:start(?MODULE, [Fun, State, OwnerCell], []),
	Pid.
	
sendIntercept(IntPid, Message) ->
	gen_server:cast(IntPid, {sendIntercept, Message}).


%FunOrOnRemove can be a function, or #onRemove
%#onRemove will also be used as dependencies, so this cell can know when it has received all current updates
addOnRemove(IntPid, FunOrOnRemove) ->
	OnRemove = case FunOrOnRemove of
		OnRemRecord when is_record(OnRemRecord, onRemove) -> 
			OnRemRecord;
		Function -> 
			#onRemove{
				function=Function,
				done=true
			}
	end,
	gen_server:cast(IntPid, {addOnRemove, OnRemove}).

removeDependency(IntPid, Cell, Id) ->
	gen_server:cast(IntPid, {removeDependency, Cell, Id}).	

done(IntPid, DoneCell, Id) ->
	gen_server:cast(IntPid, {done, DoneCell, Id}).

getState(IntPid) ->
	gen_server:call(IntPid, getState).
	
%% ====================================================================
%% Server functions
%% ====================================================================
init([Fun, State, OwnerCell]) ->
	process_flag(trap_exit, true),
    {ok, #interceptState{function=Fun, state=State, ownerCell=OwnerCell}}.

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
handle_call(getState, From, State) ->
    {reply, State, State}.

handle_cast({sendIntercept, Value}, State) ->
	NewState = State#interceptState{state=(?this(function))(Value, ?this(state))},
	{noreply, NewState};
handle_cast({addOnRemove, OnRemove}, State) ->
	cell:addOnRemove(?this(ownerCell), OnRemove),
    {noreply, State};
handle_cast({removeDependency, Cell, Id}, State) ->
	cell:removeDependency(?this(ownerCell), Cell, Id),
	{noreply, State};
handle_cast({done, DoneCell, Id}, State) ->
	cell:done(?this(ownerCell), DoneCell, Id),
    {noreply, State}.


handle_info(_, State) -> {noreply, State}.
terminate(Reason, State) -> ok.
code_change(OldVsn, State, Extra) -> {ok, State}.