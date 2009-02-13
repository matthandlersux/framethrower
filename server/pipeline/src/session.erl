%% @author Matt Handler <matt.handler@gmail.com>
%% @copyright 2009 author.

%% @doc Session backend for pipeline.

-module (session).
-compile (export_all).

-include ("../../mbrella/v1.4/include/scaffold.hrl").

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X])).
-define (this(Field), State#?MODULE.Field).
-define (pipelineBufferTime, 50).


-export ([new/0, lookup/1, startManager/0, inject/3]).

%% ====================================================
%% TYPES
%% ====================================================


%% ====================================================
%% External API
%% ====================================================

%% @doc Starts the Session Manager which is responsible for keeping track of sessions
%% 		and interfacing with the pipeline frontend
%% @spec startManager() -> ok

startManager() ->
	Pid = spawn(fun() -> manager() end),
	register(sessionManager, Pid).

%% @doc Spawns a new session, registers it with the sessionManager, and returns the Pid
%% @spec new() -> pid()

new() ->
	Pid = spawn(fun() -> session() end),
	SessionId = sessionId(),
	sessionManager ! {register, {SessionId, Pid}},
	SessionId.

%% @doc Used to lookup a session's Pid from its name, this is a hack
%% @spec lookup( string() ) -> pid()

lookup(SessionId) ->
	sessionManager ! {lookup, self(), SessionId},
	receive Response -> Response end.
	
inject( SessionPid, QueryId, Fun ) ->
	SessionPid ! {inject, QueryId, Fun}.
	
%% ====================================================
%% Internal API
%% ====================================================
	
manager() ->
	process_flag(trap_exit, true),
	State = ets:new(sessionManagerState, []),
	ets:insert(State, {sessionIds, 1}),
	manager(State).
	
manager(State) ->
	receive
		{register, {Id, Pid}} ->
			link(Pid),
			ets:insert(State, {Id, Pid}),
			manager(State);
		{unregister, {Id, Pid}} ->
			unlink(Pid),
			ets:delete(State, Id),
			manager(State);
		{newId, From} ->
			[{_, LastId}] = ets:lookup(State, sessionIds),
			ets:insert(State, {sessionIds, LastId + 1}),
			From ! list_to_binary( "session." ++ integer_to_list(LastId + 1) ),
			manager(State);
		{lookup, From, SessionId} ->
			case ets:lookup(State, SessionId) of
				[{_, Pid}] ->
					From ! Pid;
				_ ->
					From ! session_closed
			end,
			manager(State);
		{pipeline, From, {SessionId, LastMessageId}} ->
			case ets:lookup(State, SessionId) of
				[{_, Pid}] ->
					spawn( fun() -> timer:sleep(?pipelineBufferTime), Pid ! {pipeline, From, LastMessageId} end);
				[] ->
					From ! {struct, [{"sessionClosed", true}] }
			end,
			manager(State);
		{'EXIT', From, _Reason} ->
			case ets:match(State, {'$1', From}) of
				[[SessionId]] ->
					% io:format("Exit signal from session: ~p~n~p~n~n", [SessionId, Reason]),
					unlink(From),
					ets:delete(State, SessionId);
				[] ->
					io:format("Exit signal from random: ~p~n~n", [From])
			end,
			manager(State);
		Any ->
			io:format("Session Manager Received: ~p~n~n", [Any]),
			manager(State)
	end.

%% 
%% session is a process that acts as the intermediary between server and client, it keeps track of cleanupFunctions
%%		and also makes sure that messages from "open" queries don't get sent to the client until the query is done via
%%		the msgQueue process
%%
%% 		session dies after 2 minutes of inactivity 
%% 
	
session() ->
	session( #session{} ).
session( State ) ->
	receive 
		{pipeline, From, ClientLastMessageId} ->
			?this(msgQueue) ! {pipeline, From, ClientLastMessageId},
			session( State );
		{data, {QueryId, _Action, _Data} = Msg} ->
			case dict:is_key(QueryId, ?this(openQueries) ) of
				true -> 
					session( State#session{ openQueries = dict:append(QueryId, Msg, ?this(openQueries) ) } );
				false ->
					?this(msgQueue) ! { data, Msg },
					session( State )
			end;
		{done, QueryId} ->
			try dict:fetch(QueryId, ?this(openQueries) ) of
				Msgs -> 
					% NOTE: dict:append places new elements at the end of the list, but they get reversed by the foldl in msgQueue()
					?this(msgQueue) ! {dataList, Msgs ++ [{QueryId, done}]},
					session( State#session{ openQueries = dict:erase( QueryId, ?this(openQueries) ) } )
			catch 
				_:_ -> 
					io:format("queryId not found in session, perhaps already finished?~n", []),
					session( State )
			end;
		{inject, QueryId, InjectFun } ->
			session(
				State#session{
					openQueries = dict:store(QueryId, [], ?this(openQueries)),
					cleanup = [InjectFun()|?this(cleanup)] }
				);
		{'EXIT', From, Reason} ->
			?trace({"process crapped out :(", From, Reason}),
			session( State )
	after
		120000 ->
			case ?this(cleanup) of
				[] -> true;
				_ -> 
					lists:foreach( fun(Fun) -> Fun() end, ?this(cleanup) )
			end,
			exit(timed_out)
	end.

%% 
%% msgQueue is a process that holds only the messages that are ready to be delivered to the client
%%		it switches between on and off, on being when there is a client with the /pipeline page open
%% 

msgQueue() ->
	spawn_link( fun() -> msgQueueLoop( [{0, null}], off ) end).

msgQueueLoop( [{LastMessageId, _}|_] = MsgQueue, off ) ->
	receive
		{data, {QueryId, Action, Data}} ->
			Struct = wellFormedUpdate(Data, QueryId, Action),
			msgQueueLoop( [{LastMessageId + 1, Struct}|MsgQueue], off);
		{dataList, Msgs} ->
			Msgs1 = lists:foldl( 
						fun({Q, A, D}, [{L,_}|_] = Acc) -> 
							Struct = wellFormedUpdate(D, Q, A),
							[{L + 1, Struct}|Acc];
						({Q, A}, [{L,_}|_] = Acc) -> 
							Struct = wellFormedUpdate(Q, A),
							[{L + 1, Struct}|Acc]
						end,
						MsgQueue, Msgs),
			msgQueueLoop( Msgs1, off);
		{pipeline, To, ClientLastMessageId} ->
			msgQueueLoop( MsgQueue, {To, ClientLastMessageId})
	end;
msgQueueLoop( [{LastMessageId, _}|_] = MsgQueue, {To, ClientLastMessageId}) ->
	% ?trace({"serverId", LastMessageId, "clientLastHeardId", ClientLastMessageId}),
	if
		LastMessageId > ClientLastMessageId ->
			MsgQueue2 = streamUntil(To, MsgQueue, ClientLastMessageId),
			msgQueueLoop( MsgQueue2, off );
		LastMessageId =:= ClientLastMessageId ->
			receive
				{data, {QueryId, Action, Data}} ->
					Struct = wellFormedUpdate(Data, QueryId, Action),
					stream(To, Struct, LastMessageId + 1),
					msgQueueLoop( [{LastMessageId + 1, Struct}], off);
				{dataList, Msgs} ->
					Updates = lists:foldl( 
								fun({Q, A, D}, [{L,_}|_] = Acc) -> 
									Struct = wellFormedUpdate(D, Q, A),
									[{L + 1, Struct}|Acc];
								({Q, A}, [{L,_}|_] = Acc) -> 
									Struct = wellFormedUpdate(Q, A),
									[{L + 1, Struct}|Acc]
								end,
								MsgQueue, Msgs),
					MsgQueue1 = streamUntil(To, Updates, ClientLastMessageId),
					msgQueueLoop( MsgQueue1, off )
			after
				30000 ->
					msgQueueLoop( MsgQueue, off)
			end;
		true ->
			?trace("Session error"),
			msgQueueLoop( MsgQueue, off )
	end.
	
%% ====================================================
%% utilities
%% ====================================================


%% 
%% wellFormedUpdate takes a message from a cell and converts it to the proper form for mochijson2 to encode
%%		and send it to the client
%% wellFormedUpdate:: {ExprElement, ExprElement} | ExprElement -> Number -> String -> Struct
%% 

wellFormedUpdate(QueryId, Action) ->
	{struct, [{"queryId",QueryId},{"action", Action}]}.
	
wellFormedUpdate(Data, QueryId, Action) ->
	case Data of
		{Key, Value} -> Data1 = [{"key", mblib:exprElementToJson(Key)},{"value", mblib:exprElementToJson(Value)}];
		_ -> Data1 = [{"key", mblib:exprElementToJson(Data)}]
	end,
	{struct, [{"queryId",QueryId},{"action", Action}|Data1]}.

%% 
%% streamUntil:: Pid -> {Number, Struct}
%% 

streamUntil(To, MsgQueue, Until) ->
	Predicate = fun({Id, _}) ->
		if
			Id > Until -> true;
			true -> false
		end
	end,
	[{LastMessageId, _}|_] = MsgQueueToSend = lists:takewhile(Predicate, MsgQueue),
	{_, Updates} = lists:unzip(MsgQueueToSend),
	ReverseUpdates = lists:reverse(Updates),
	stream(To, ReverseUpdates, LastMessageId),
	% ?trace({MsgQueue, Until}),
	% ?trace(MsgQueueToSend),
	MsgQueueToSend.

%% 
%% stream:: Pid -> List Struct -> Number -> Tuple
%% 
stream(To, Updates, LastMessageId) when is_tuple(Updates) ->
	stream(To, [Updates], LastMessageId);
stream(To, Updates, LastMessageId) ->
	To ! {updates, Updates, LastMessageId}.

%% 
%% sessionId:: SessionName
%%		creates a new session and returns the name
%% 

sessionId() ->
	sessionManager ! {newId, self()},
	receive 
		SessionId ->
			SessionId
	end.