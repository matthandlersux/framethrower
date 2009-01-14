-module (session).
-compile (export_all).

startManager() ->
	Pid = spawn(fun() -> manager() end),
	register(sessionManager, Pid).

new() ->
	Pid = spawn(fun() -> session() end),
	SessionId = sessionId(),
	sessionManager ! {register, {SessionId, Pid}},
	SessionId.
	
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
					Pid ! {pipeline, From, LastMessageId};
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
							% case Data of
							% 	{Key, Value} -> Data1 = [{"key", <<Key>>},{"value",<<Value>>}];
							% 	_ -> Data1 = [{"key", Data}]
							% end,
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
			% case Data of
			% 	{Key, Value} -> Data1 = [{"key", <<Key>>},{"value", <<Value>>}];
			% 	_ -> Data1 = [{"key", Data}]
			% end,
			% Struct = {struct, [{"queryId",QueryId},{"action", Action}|Data1]},
			Struct = wellFormedUpdate(Data, QueryId, Action),
			session([{LastMessageId + 1, Struct}|MsgQueue])
	after
		120000 ->
			exit(timed_out)
	end.
	
%% ====================================================
%% utilities
%% ====================================================

wellFormedUpdate(Data, QueryId, Action) ->
		case Data of
			{Key, Value} -> Data1 = [{"key", to_atom(Key)},{"value", to_atom(Value)}];
			_ -> Data1 = [{"key", to_atom(Data)}]
		end,
		{struct, [{"queryId",QueryId},{"action", Action}|Data1]}.

to_atom(X) when is_integer(X) -> X1 = integer_to_list(X), list_to_binary(X1);
to_atom(X) when is_boolean(X) -> list_to_binary(atom_to_list(X));
to_atom(X) when is_list(X) ->
	Fun = fun(XX) ->         
		if XX < 0 -> false;  
			XX > 255 -> false;
			true -> true      
		end                  
	end,
	case lists:all(Fun, X) of
		true -> list_to_binary($" ++ X ++ $");
		false -> X
	end;
to_atom(X) -> X.


streamUntil(To, MsgQueue, Until) ->
	Predicate = fun({Id, _}) ->
		if
			Id > Until -> true;
			true -> false
		end
	end,
	[{LastMessageId, _}|_] = MsgQueueToSend = lists:takewhile(Predicate, MsgQueue),
	{_, Updates} = lists:unzip(MsgQueueToSend),
	stream(To, Updates, LastMessageId),
	MsgQueueToSend.

stream(To, Updates, LastMessageId) ->
	To ! {updates, Updates, LastMessageId}.

sessionId() ->
	sessionManager ! {newId, self()},
	receive 
		SessionId ->
			SessionId
	end.