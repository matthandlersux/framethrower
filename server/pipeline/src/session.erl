%% @author Matt Handler <matt.handler@gmail.com>
%% @copyright 2009 author.

%% @doc Session backend for pipeline.

-module (session).
-compile (export_all).

-include ("../../mbrella/v1.4/include/scaffold.hrl").

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X])).

-export ([new/0, lookup/1, startManager/0]).
-define (pipelineBufferTime, 50).

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

% perhaps dont do the second part of rcv statement and just have the switch be part of the state:
%	listening for pipeline msg, get msg, switch to stream mode, process inbox, after 0, switch back

session() ->
	session([{0, null}]).
session([{LastMessageId, _}|_] = MsgQueue) ->
	receive 
		{pipeline, From, LastMessageId2} ->
			% io:format("pid=~p~n", [self()]),
			if
				LastMessageId > LastMessageId2 ->
					MsgQueue2 = streamUntil(From, MsgQueue, LastMessageId2),
					session(MsgQueue2);
				LastMessageId =:= LastMessageId2 ->
					receive
						{data, {QueryId, Action, Data}} ->
							Struct = [ wellFormedUpdate(Data, QueryId, Action) ],
							stream(From, Struct, LastMessageId + 1),
							session([{LastMessageId + 1, Struct}])
					after 
						30000 ->
							session([{LastMessageId, null}])
					end;
				true ->
					io:format("Session error ~n~n", []),
					session(MsgQueue)
			end;
		{data, {QueryId, Action, Data}} ->
			% ?trace(QueryId),
			Struct = wellFormedUpdate(Data, QueryId, Action),
			session([{LastMessageId + 1, Struct}|MsgQueue]);
		{done, QueryId} ->
			% ?trace(QueryId),
			session(MsgQueue)
	after
		120000 ->
			exit(timed_out)
	end.
	
%% ====================================================
%% utilities
%% ====================================================


%% 
%% wellFormedUpdate takes a message from a cell and converts it to the proper form for mochijson2 to encode
%%		and send it to the client
%% wellFormedUpdate:: {ExprElement, ExprElement} | ExprElement -> Number -> String -> Struct
%% 

wellFormedUpdate(Data, QueryId, Action) ->
		case Data of
			{Key, Value} -> Data1 = [{"key", mblib:exprElementToJson(Key)},{"value", mblib:exprElementToJson(Value)}];
			_ -> Data1 = [{"key", mblib:exprElementToJson(Data)}]
		end,
		{struct, [{"queryId",QueryId},{"action", Action}|Data1]}.


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
	MsgQueueToSend.

stream(To, Updates, LastMessageId) ->
	%io:format("message in: ~p ~n~n", [Updates]),
	To ! {updates, Updates, LastMessageId}.

sessionId() ->
	sessionManager ! {newId, self()},
	receive 
		SessionId ->
			SessionId
	end.