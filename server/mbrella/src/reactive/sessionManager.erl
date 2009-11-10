%% @author Matt Handler <matt.handler@gmail.com>
%% @copyright 2009 author.

%% @doc SessionManager.

-module (sessionManager).
-compile (export_all).

-behaviour(gen_server).

-include ("../../mbrella/include/scaffold.hrl").

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X])).
-define (this(Field), State#?MODULE.Field).

%% gen_server callbacks
-export([init/1, handle_call/3, handle_cast/2, handle_info/2, terminate/2, code_change/3]).

-export ([newSession/0, lookup/1, start/0]).


%% ====================================================
%% External API
%% ====================================================

%% @doc Starts the Session Manager which is responsible for keeping track of sessions
%% 		and interfacing with the pipeline frontend
%% @spec startManager() -> ok

start() ->
	gen_server:start({local, ?MODULE}, ?MODULE, [], []).

%% @doc Spawns a new session, registers it with the sessionManager, and returns the Pid
%% @spec new() -> pid()

newSession () ->
	SessionName = sessionId(),	
	Pid = session:new(SessionName),
	SessionPointer = sessionPointer:create(SessionName, Pid),
	gen_server:cast(?MODULE, {register, SessionPointer}),
	SessionPointer.

%% 
%% sessionId:: SessionName
%%		creates a new session and returns the name
%% 

sessionId () ->
	gen_server:call(?MODULE, newId).

%% @doc Used to lookup a session's Pid from its name, this is a hack
%% @spec lookup( string() ) -> pid()

lookup (SessionName) ->
	gen_server:call(?MODULE, {lookup, SessionName}).


%% ====================================================================
%% Server functions
%% ====================================================================

init([]) ->
	process_flag(trap_exit, true),
	State = ets:new(sessionManagerState, []),
	ets:insert(State, {sessionIds, 0}),	
    {ok, State}.

handle_call(newId, _, State) ->
	[{_, LastId}] = ets:lookup(State, sessionIds),
	ThisId = LastId + 1,
	ets:insert(State, {sessionIds, ThisId}),
	Reply = list_to_binary( "session." ++ integer_to_list(ThisId) ),
	{reply, Reply, State};
handle_call({lookup, SessionName}, _, State) ->
	Reply = case ets:lookup(State, SessionName) of
		[{_, SessionPointer}] ->
			SessionPointer;
		_ ->
			session_closed
	end,
	{reply, Reply, State}.

handle_cast({register, SessionPointer}, State) ->
	SessionName = sessionPointer:name(SessionPointer),
	Pid = sessionPointer:pid(SessionPointer),
	link(Pid),
	ets:insert(State, {SessionName, SessionPointer}),
	{noreply, State}.
% handle_cast({unregister, {Id, Pid}}, State) ->
% 	unlink(Pid),
% 	ets:delete(State, Id),
% 	{noreply, State}.

% TODO:Verify This Works

% handle_info({'EXIT', From, _Reason}, State) ->
% 	case ets:match(State, {'$1', From}) of
% 		[[SessionId]] ->
% 			% io:format("Exit signal from session: ~p~n~p~n~n", [SessionId, Reason]),
% 			unlink(From),
% 			ets:delete(State, SessionId);
% 		[] ->
% 			io:format("Exit signal from random: ~p~n~n", [From])
% 	end,
% 	{noreply, State};
handle_info(Any, State) ->
	io:format("Session Manager Received: ~p~n~n", [Any]),
	{noreply, State}.

terminate(_, _) -> ok.
code_change(_, State, _) -> {ok, State}.