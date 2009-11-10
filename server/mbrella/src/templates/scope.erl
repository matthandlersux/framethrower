%%% -------------------------------------------------------------------
%%% Author  : dailey
%%% Description :
%%%
%%% Created : Sep 23 2009
%%% -------------------------------------------------------------------


% This Module implements a Lazy Extendable Scope.

-module(scope).

-behaviour(gen_server).

-define(d(Msg, Var), io:format("Error in ~s (~p):~n~s ~p~n~n", [?MODULE, self(), Msg, Var])).
% syntactic sugar babbbyyy
% -define (ob(Field), mblib:getVal(Ob, Field)).
-define(this(Field), State#scopeState.Field).

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X])).

%% --------------------------------------------------------------------
%% Include files
%% --------------------------------------------------------------------

-include ("../../include/scaffold.hrl").

%% --------------------------------------------------------------------
%% External exports
-export([makeScope/0, makeScope/1, lookup/2, addLazyLet/3, addLet/3, getState/1, stop/1]).

%% gen_server callbacks
-export([init/1, handle_call/3, handle_cast/2, handle_info/2, terminate/2, code_change/3]).


%% ====================================================================
%% External functions
%% ====================================================================

% Makes a root scope
makeScope() ->
	start_link(noParent).

% Extends a parent scope
makeScope(Parent) -> 
	start_link(Parent).

start_link(Parent) ->
	case gen_server:start(?MODULE, [Parent], []) of
		{ok, Pid} -> Pid;
		Else -> Else
	end.

% GetValue is fun/0 to be run the first time Name is looked up
addLazyLet(Name, GetValue, ScopePid) ->
	gen_server:call(ScopePid, {addLazyLet, Name, GetValue}).

addLet(Name, Value, ScopePid) ->
	gen_server:call(ScopePid, {addLet, Name, Value}).

% Lookup will return error if Name is not found in this scope or any parent scope
lookup(Pid, Name) ->
	Response = gen_server:call(Pid, {lookup, Name, self(), Pid}),
	case Response of
		waitForResponse ->			
			receive
				{lookupResult, LookupResult} -> LookupResult
			end;
		Value -> Value
	end.

getState(Pid) ->
	gen_server:call(Pid, getState).

stop(Pid) ->
	gen_server:call(Pid, stop).



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
	process_flag(trap_exit, true),
	State = #scopeState{dict=dict:new(), parent=Parent},
    {ok, State}.

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
handle_call({addLazyLet, Name, GetValue}, _, State) ->
	NewDict = dict:store(Name, {notEvaluated, GetValue}, ?this(dict)),
	NewState = State#scopeState{dict=NewDict},
    {reply, ok, NewState};
handle_call({addLet, Name, Value}, _, State) ->
	NewDict = dict:store(Name, {evaluated, Value}, ?this(dict)),
	NewState = State#scopeState{dict=NewDict},
    {reply, ok, NewState};
handle_call({lookup, Name, From, ThisScope}, _, State) ->
	%look for Name within the local Scope, evaluating it if necessary and updating the scope
	Response = case dict:find(Name, ?this(dict)) of
		{ok, {notEvaluated, GetValue}} -> 
			%spawn a new process to evaluate GetValue
			spawn(fun() ->
				Value = GetValue(),
				updateLet(ThisScope, Name, Value),
				From ! {lookupResult, Value}
			end),
			waitForResponse;
		{ok, {evaluated, Value}} -> Value;
		error -> error
	end,
	%now look for Name in the parent Scope in case it was not found locally
	GlobalResponse = case Response of
		error -> lookupInParent(Name, ?this(parent));
		_ -> Response
	end,
    {reply, GlobalResponse, State};
handle_call(getState, _, State) ->
	{reply, State, State};
handle_call(stop, _, State) ->
	{stop, normal, stopped, State}.

%% --------------------------------------------------------------------
%% Function: handle_cast/2
%% Description: Handling cast messages
%% Returns: {noreply, State}          |
%%          {noreply, State, Timeout} |
%%          {stop, Reason, State}            (terminate/2 is called)
%% --------------------------------------------------------------------
handle_cast({updateLet, Name, Value}, State) ->
	DictWithVal = dict:store(Name, {evaluated, Value}, ?this(dict)),
	NewState = State#scopeState{dict=DictWithVal},
	{noreply, NewState};
handle_cast({terminate, Reason}, State) ->
	{stop, Reason, State}.


%% --------------------------------------------------------------------
%% Function: handle_info/2
%% Description: Handling all non call/cast messages
%% Returns: {noreply, State}          |
%%          {noreply, State, Timeout} |
%%          {stop, Reason, State}            (terminate/2 is called)
%% --------------------------------------------------------------------
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


updateLet(Pid, Name, Value) ->
	gen_server:cast(Pid, {updateLet, Name, Value}).

lookupInParent(Name, Parent) ->
	case Parent of
		noParent -> notfound;
		Pid -> lookup(Pid, Name)
	end.
