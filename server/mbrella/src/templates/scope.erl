%%% -------------------------------------------------------------------
%%% Author  : dailey
%%% Description :
%%%
%%% Created : Sep 23 2009
%%% -------------------------------------------------------------------

-module(scope).

-behaviour(gen_server).

-define(d(Msg, Var), io:format("Error in ~s (~p):~n~s ~p~n~n", [?MODULE, self(), Msg, Var])).
-define(this(Field), State#scopeState.Field).
-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X])).

%% --------------------------------------------------------------------
%% Include files
%% --------------------------------------------------------------------

-include ("../../include/scaffold.hrl").

%% --------------------------------------------------------------------
%% External exports
-export([makeScope/0, extendScope/1, lookup/2, addLazyLet/3, addLet/3, getState/1, getStateDict/1, respawn/1, stop/1]).


%% gen_server callbacks
-export([init/1, handle_call/3, handle_cast/2, handle_info/2, terminate/2, code_change/3]).

%% ====================================================
%% TYPES
%% ====================================================
%
%		a Scope is a Lazy Extendable Scope.
%
% Scope	:: PID
%






%% ====================================================================
%% External functions
%% ====================================================================

% Makes a root scope
makeScope() ->
	case gen_server:start(?MODULE, [], []) of
		{ok, Pid} -> 
			Pointer = gen_server:call(Pid, {extendScope, noParent}),
			{Pid, Pointer};
		Else -> Else
	end.

% Extends a parent scope
extendScope({Pid, Parent}) -> 
	{Pid, gen_server:call(Pid, {extendScope, Parent})}.

% GetValue is fun/0 to be run the first time Name is looked up
addLazyLet(Name, GetValue, {Pid, Pointer}) ->
	gen_server:call(Pid, {addLazyLet, Name, GetValue, Pointer}).

addLet(Name, Value, {Pid, Pointer}) ->
	gen_server:call(Pid, {addLet, Name, Value, Pointer}).

% Lookup will return error if Name is not found in this scope or any parent scope
lookup(Name, {Pid, Pointer}) ->
	Response = gen_server:call(Pid, {lookup, Name, self(), {Pid, Pointer}}),
	case Response of
		waitForResponse ->			
			receive
				{lookupResult, LookupResult} -> LookupResult
			end;
		Value -> Value
	end.

respawn(ScopeState) ->
	case gen_server:start(?MODULE, [], []) of
		{ok, Pid} -> 
			gen_server:call(Pid, {respawn, ScopeState}),
			{Pid, 0};
		Else -> Else
	end.

getStateDict({Pid, Pointer}) ->
	Dict = gen_server:call(Pid, {getStateDict, Pointer}),
	dict:map(fun(_, {_, Value}) ->
		Value
	end, Dict).
	
getState({Pid, _}) ->
	gen_server:call(Pid, getState).

stop({Pid, _Pointer}) ->
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
init([]) ->
	process_flag(trap_exit, true),
	State = #scopeState{dict=dict:new(), pointerCount=0},
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
handle_call({extendScope, Pointer}, _, State) ->
	NewPointer = ?this(pointerCount),
	Dict1 = dict:store(NewPointer, {dict:new(), Pointer}, ?this(dict)),
	NewState = #scopeState{dict=Dict1, pointerCount = NewPointer+1},
	{reply, NewPointer, NewState};
handle_call({addLazyLet, Name, GetValue, Pointer}, _, State) ->
	{Scope, Parent} = case dict:find(Pointer, ?this(dict)) of
		{ok, Found} -> Found;
		_ -> throw(["Error finding scope pointer: ", Pointer])
	end,
	Scope1 = dict:store(Name, {notEvaluated, GetValue}, Scope),
	Dict1 = dict:store(Pointer, {Scope1, Parent}, ?this(dict)),
	NewState = State#scopeState{dict=Dict1},
    {reply, ok, NewState};
handle_call({addLet, Name, Value, Pointer}, _, State) ->
	{Scope, Parent} = case dict:find(Pointer, ?this(dict)) of
		{ok, Found} -> Found;
		_ -> throw(["Error finding scope pointer: ", Pointer])
	end,
	Scope1 = dict:store(Name, {evaluated, Value}, Scope),
	Dict1 = dict:store(Pointer, {Scope1, Parent}, ?this(dict)),
	NewState = State#scopeState{dict=Dict1},
    {reply, ok, NewState};
handle_call({lookup, Name, From, ThisScope}, _, State) ->
	GlobalResponse = lookupHelper(Name, From, ThisScope, State),
    {reply, GlobalResponse, State};
handle_call({respawn, State}, _, _) ->
	{reply, ok, State};
handle_call(getState, _, State) ->
	{reply, State, State};
handle_call({getStateDict, Pointer}, _, State) ->
	{Scope, _Parent} = case dict:find(Pointer, ?this(dict)) of
		{ok, Found} -> Found;
		_ -> throw(["Error finding scope pointer: ", Pointer])
	end,
	{reply, Scope, State};
handle_call(stop, _, State) ->
	{stop, normal, stopped, State}.

lookupHelper(Name, From, {Pid, Pointer}, State) ->
	%look for Name within the local Scope, evaluating it if necessary and updating the scope
	{Scope, Parent} = case dict:find(Pointer, ?this(dict)) of
		{ok, Found} -> Found;
		_ -> throw(["Error finding scope pointer: ", Pointer])
	end,
	Response = case dict:find(Name, Scope) of
		{ok, {notEvaluated, GetValue}} -> 
			%spawn a new process to evaluate GetValue
			spawn(fun() ->
				Value = GetValue(),
				addLet(Name, Value, {Pid, Pointer}),
				From ! {lookupResult, Value}
			end),
			waitForResponse;
		{ok, {evaluated, Value}} -> Value;
		error -> error
	end,
	%now look for Name in the parent Scope in case it was not found locally
	case Response of
		error -> 
			case Parent of
				noParent -> notfound;
				_ -> lookupHelper(Name, From, {Pid, Parent}, State)
			end;
		_ -> Response
	end.


%% --------------------------------------------------------------------
%% Function: handle_cast/2
%% Description: Handling cast messages
%% Returns: {noreply, State}          |
%%          {noreply, State, Timeout} |
%%          {stop, Reason, State}            (terminate/2 is called)
%% --------------------------------------------------------------------

	
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
