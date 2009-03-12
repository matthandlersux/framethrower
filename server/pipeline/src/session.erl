%% @author Matt Handler <matt.handler@gmail.com>
%% @copyright 2009 author.

%% @doc Session backend for pipeline.

-module (session).
-compile (export_all).

-behaviour(gen_server).

-include ("../../mbrella/v1.4/include/scaffold.hrl").

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X])).
-define (this(Field), State#?MODULE.Field).
-define (pipelineBufferTime, 10).


%% gen_server callbacks
-export([init/1, handle_call/3, handle_cast/2, handle_info/2, terminate/2, code_change/3]).

-export ([new/0, inject/3, getQueryId/1]).


%% ====================================================
%% External API
%% ====================================================

%% @doc Spawns a new session and returns the Pid
%% @spec new() -> pid()

new () ->
	{ok, Pid} = gen_server:start(?MODULE, [], []),
	Pid.

inject (SessionPid, QueryId, Fun) ->
	gen_server:cast(SessionPid, {inject, QueryId, Fun}).
	
getQueryId (SessionPid) ->
	gen_server:call(SessionPid, getQueryId).

sendUpdate (SessionPid, Message) ->
	gen_server:cast(SessionPid, Message).

registerTemplate (SessionPid, Name, Template) ->
	gen_server:cast(SessionPid, {registerTemplate, {Name, Template}}).

serverAdviceRequest (SessionPid, ServerAdviceRequest) ->
	gen_server:cast(SessionPid, {serverAdviceRequest, ServerAdviceRequest}).

pipeline(SessionPid, From, LastMessageId) ->
	gen_server:cast(SessionPid, {pipeline, From, LastMessageId}).

queryDefine(SessionPid, Expr, QueryId) ->
	gen_server:call(SessionPid, {queryDefine, Expr, QueryId}).

checkQuery(SessionPid, Expr) ->
	gen_server:call(SessionPid, {checkQuery, Expr}).

%% ====================================================
%% Internal API
%% ====================================================
	

%% 
%% session is a process that acts as the intermediary between server and client, it keeps track of cleanupFunctions
%%		and also makes sure that messages from "open" queries don't get sent to the client until the query is done via
%%		the msgQueue process
%%
%% 		session dies after 2 minutes of inactivity 
%% 
	

%% ====================================================================
%% Server functions
%% ====================================================================

init([]) ->
	process_flag(trap_exit, true),
	State = #session{},
    {ok, State, ?this(timeout)}.

handle_call(getQueryId, _, State) ->
	NewQueryId = ?this(queryIdCount) + 1,
	Reply = "server." ++ integer_to_list(NewQueryId),
	{reply, Reply, State#session{queryIdCount = NewQueryId}, ?this(timeout)};
handle_call({queryDefine, Expr, QueryId}, _, State) ->
	{Reply, ServerAdviceHash} = case dict:find(Expr, ?this(serverAdviceHash)) of
		{ok, _} -> {false, ?this(serverAdviceHash)};
		_ -> 
			?this(msgQueue) ! {queryDefine, Expr, QueryId},
			{true, dict:store(Expr, QueryId, ?this(serverAdviceHash))}
	end,
	{reply, Reply, State#session{serverAdviceHash = ServerAdviceHash}, ?this(timeout)};
handle_call({checkQuery, Expr}, _, State) ->
	{Reply, ServerAdviceHash} = case dict:find(Expr, ?this(serverAdviceHash)) of
		{ok, QueryId} -> {{false, QueryId}, ?this(serverAdviceHash)};
		_ -> 
			{true, dict:store(Expr, defined, ?this(serverAdviceHash))}
	end,
	{reply, Reply, State#session{serverAdviceHash = ServerAdviceHash}, ?this(timeout)}.



handle_cast({pipeline, From, ClientLastMessageId}, State) ->
	?this(msgQueue) ! {pipeline, From, ClientLastMessageId},
	{noreply, State, ?this(timeout)};
handle_cast({data, {QueryId, _Action, _Data} = Msg}, State) ->
	NewState = case dict:is_key(QueryId, ?this(openQueries) ) of
		true -> 
			State#session{ openQueries = dict:append(QueryId, Msg, ?this(openQueries) )};
		false ->
			?this(msgQueue) ! { data, Msg },
			State
	end,
	{noreply, NewState, ?this(timeout)};
handle_cast({done, QueryId}, State) ->
	NewState = try dict:fetch(QueryId, ?this(openQueries) ) of
		Msgs -> 
			% NOTE: dict:append places new elements at the end of the list, but they get reversed by the foldl in msgQueue()
			?this(msgQueue) ! {dataList, Msgs ++ [{QueryId, done}]},
			State#session{ openQueries = dict:erase( QueryId, ?this(openQueries) ) }
	catch 
		_:_ -> 
			io:format("queryId not found in session, perhaps already finished?~n", []),
			State
	end,
	{noreply, NewState, ?this(timeout)};
handle_cast({queryReference, QueryId, ReferenceId}, State) ->
	?this(msgQueue) ! { queryReference, QueryId, ReferenceId },
	{noreply, State, ?this(timeout)};
handle_cast({inject, QueryId, InjectFun }, State) ->
	NewState = State#session{
		openQueries = dict:store(QueryId, [], ?this(openQueries)),
		cleanup = [InjectFun()|?this(cleanup)] 
	},
	{noreply, NewState, ?this(timeout)};
handle_cast({actionResponse, ActionResponse}, State) ->
	?this(msgQueue) ! { actionResponse, ActionResponse },
	{noreply, State, ?this(timeout)};
handle_cast({registerTemplate, {Name, Template}}, State) ->
	NewState = State#session{
		templates = dict:store(Name, Template, ?this(templates))
	},
	{noreply, NewState, ?this(timeout)};
handle_cast({serverAdviceRequest, ServerAdviceRequest}, State) ->
	serverAdvice:processServerAdvice(ServerAdviceRequest, ?this(templates), self()),
	{noreply, State, ?this(timeout)}.

handle_info(timeout, State) ->
	case ?this(cleanup) of
		[] -> true;
		_ -> 
			lists:foreach( fun(Fun) -> Fun() end, ?this(cleanup) )
	end,
	{stop, normal, empty};
handle_info(_, State) -> {noreply, State}.
terminate(_, _) -> ok.
code_change(_, State, _) -> {ok, State}.



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
		{actionResponse, ActionResponse} ->
			msgQueueLoop( [{LastMessageId + 1, ActionResponse}|MsgQueue], off);
		{queryDefine, DExpr, QueryId} ->
			Struct = wellFormedQueryDefine(DExpr, QueryId),
			msgQueueLoop( [{LastMessageId + 1, Struct}|MsgQueue], off);
		{ queryReference, QueryId, ReferenceId } ->
			Struct = wellFormedQueryReference(QueryId, ReferenceId),
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
	{struct, [{"queryUpdate", 
		{struct, [{"queryId", list_to_binary(QueryId)},{"action", Action}]}
	}]}.
	
wellFormedUpdate(Data, QueryId, Action) ->
	case Data of
		{Key, Value} -> Data1 = [{"key", mblib:exprElementToJson(Key)},{"value", mblib:exprElementToJson(Value)}];
		_ -> Data1 = [{"key", mblib:exprElementToJson(Data)}]
	end,
	{struct, [{"queryUpdate",
		{struct, [{"queryId",list_to_binary(QueryId)},{"action", Action}|Data1]}
	}]}.

wellFormedQueryDefine(DExpr, QueryId) ->
	{struct, [{"queryDefine",
		{struct, [{"queryId",list_to_binary(QueryId)},{"expr", list_to_binary(DExpr)}]}
	}]}.
	
wellFormedQueryReference(QueryId, ReferenceId) ->
	{struct, [{"queryReference",
		{struct, [{"queryId",list_to_binary(QueryId)},{"referenceId", list_to_binary(ReferenceId)}]}
	}]}.

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
