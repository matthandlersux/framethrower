%%% -------------------------------------------------------------------
%%% Author  : handler
%%% Description :
%%%
%%% Created : Fri Dec 19 13:24:05 EST 2008
%%% -------------------------------------------------------------------
-module(memoize).

-behaviour(gen_server).

-define(d(Msg, Var), io:format("Error in ~s (~p):~n~s ~p~n~n", [?MODULE, self(), Msg, Var])).
% syntactic sugar babbbyyy
-define (ob(Field), mblib:getVal(Ob, Field)).
-define (this(Field), State#?MODULE.Field).
-define (TABFILE, "data/memoize.ets").

%% --------------------------------------------------------------------
%% Include files
%% --------------------------------------------------------------------

-include ("../include/scaffold.hrl").

%% --------------------------------------------------------------------
%% External exports
-export([add/2, get/1, start/0]).

%% gen_server callbacks
-export([init/1, handle_call/3, handle_cast/2, handle_info/2, terminate/2, code_change/3]).

-compile(export_all).



%% ====================================================================
%% External functions
%% ====================================================================

start() -> start_link().
start_link() ->
	case gen_server:start_link({local, ?MODULE}, ?MODULE, [], []) of
		{ok, Pid} -> Pid;
		Else -> Else
	end.
	
add( BottomExpr, Cell ) -> 
	gen_server:cast(?MODULE, {add, BottomExpr, Cell}),
	fun() -> erlang:apply(?MODULE, remove, [BottomExpr] ) end.

remove( BottomExpr ) -> 
	gen_server:cast(?MODULE, {remove, BottomExpr} ).
	
% ets:select can be used to get an expression with variable parameters... like
% 	a {lambda, apply, etc..} nesting with some variable parameters
get( BottomExpr ) -> 
	gen_server:call(?MODULE, {get, BottomExpr}).
	
die() ->
	gen_server:cast(?MODULE, {terminate, killed}).

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
	% case ets:file2tab(?TABFILE) of
	% 	{ok, Table} ->
	% 		State = #memoize{ets = Table};
	% 	{error, _Reason} ->
	% 		State = #memoize{}
	% end,
	State = #memoize{},
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
handle_call({get, Expr}, From, State) ->
	case ets:lookup(?this(ets), Expr) of
		[{_, Reply}] ->
			good;
		[] -> 
			Reply = key_does_not_exist
	end,
    {reply, Reply, State}.

%% --------------------------------------------------------------------
%% Function: handle_cast/2
%% Description: Handling cast messages
%% Returns: {noreply, State}          |
%%          {noreply, State, Timeout} |
%%          {stop, Reason, State}            (terminate/2 is called)
%% --------------------------------------------------------------------
handle_cast({add, Expr, Cell}, State) ->
	ets:insert(?this(ets), {Expr, Cell}),
    {noreply, State};
handle_cast({remove, Expr}, State) ->
	ets:delete(?this(ets), Expr),
    {noreply, State};
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
	%ets:tab2file(?this(ets), ?TABFILE),
	ets:delete(?this(ets)),
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