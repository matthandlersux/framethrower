%% @author Matt Handler <matt.handler@gmail.com>
%% @copyright 2009 author.

%% @doc Session backend for pipeline.

-module (session).
-compile (export_all).

-behaviour(gen_server).

-include ("../../mbrella/v1.4/include/scaffold.hrl").

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X])).
-define (this(Field), State#?MODULE.Field).

%% gen_server callbacks
-export([init/1, handle_call/3, handle_cast/2, handle_info/2, terminate/2, code_change/3]).

-export ([new/0, addCleanup/3, getQueryId/1]).


%% ====================================================
%% External API
%% ====================================================

%% @doc Spawns a new session and returns the Pid
%% @spec new() -> pid()

new () ->
	{ok, Pid} = gen_server:start(?MODULE, [], []),
	Pid.

addCleanup (SessionPid, QueryId, Fun) ->
	gen_server:cast(SessionPid, {addCleanup, QueryId, Fun}).
	
getQueryId (SessionPid) ->
	gen_server:call(SessionPid, getQueryId).

sendUpdate (SessionPid, Message) ->
	gen_server:cast(SessionPid, Message).

registerTemplate (SessionPid, Name, Template) ->
	gen_server:cast(SessionPid, {registerTemplate, {Name, Template}}).

serverAdviceRequest (SessionPid, ServerAdviceRequest) ->
	gen_server:cast(SessionPid, {serverAdviceRequest, ServerAdviceRequest}).

pipeline(SessionPid, LastMessageId) ->
	gen_server:cast(SessionPid, {pipeline, self(), LastMessageId}),
	receive 
		Json -> Json
	after 45000 ->
		timeout
	end.

queryDefine(SessionPid, Expr, QueryId) ->
	gen_server:call(SessionPid, {queryDefine, Expr, QueryId}).

checkQuery(SessionPid, Expr, QueryId) ->
	gen_server:call(SessionPid, {checkQuery, Expr, QueryId}).

%% ====================================================
%% Internal API
%% ====================================================

flush(SessionPid, To) ->
	gen_server:cast(SessionPid, {flush, To}).

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
	Reply = case dict:find(Expr, ?this(serverAdviceHash)) of
		{ok, _} -> 
			NewState = State,
			false;
		_ -> 
			NewState = State#session{
				openQueries = dict:store(QueryId, open, ?this(openQueries)),
				serverAdviceHash = dict:store(Expr, QueryId, ?this(serverAdviceHash)),
				clientState = waiting,
				msgQueue = addToQueue(wellFormedQueryDefine(Expr, QueryId), ?this(msgQueue))
			},
			true
	end,
	{reply, Reply, NewState, ?this(timeout)};
handle_call({checkQuery, Expr, QueryId}, _, State) ->
	OpenQueries = dict:store(QueryId, open, ?this(openQueries)),
	case dict:find(Expr, ?this(serverAdviceHash)) of
		{ok, ReferenceId} ->
			NewState = State#session{openQueries = OpenQueries, clientState = waiting},
			{reply, {false, ReferenceId}, NewState, ?this(timeout)};
		_ -> 
			ServerAdviceHash = dict:store(Expr, defined, ?this(serverAdviceHash)),
			NewState = State#session{serverAdviceHash = ServerAdviceHash, openQueries = OpenQueries, clientState = waiting},
			{reply, true, NewState, ?this(timeout)}
	end.


handle_cast({pipeline, From, ClientLastMessageId}, State) ->
	OutputTimer = outputTimer(self(), From),
	MsgQueue = updateBuffer(?this(msgQueue), ClientLastMessageId),
	NewState = State#session{msgQueue = MsgQueue, outputTimer = OutputTimer},
	{noreply, NewState, ?this(timeout)};
handle_cast({flush, To}, State) ->
	stream(To, ?this(msgQueue)),
	{noreply, State, ?this(timeout)};
handle_cast({data, {QueryId, Action, Data}}, State) ->
	MsgQueue = addToQueue(wellFormedUpdate(Data, QueryId, Action), ?this(msgQueue)),
	{noreply, State#session{msgQueue = MsgQueue}, ?this(timeout)};
handle_cast({done, QueryId}, State) ->
	MsgQueue = addToQueue(wellFormedUpdate(QueryId, done), ?this(msgQueue)),	
	OpenQueries = dict:erase(QueryId, ?this(openQueries)),
	ClientState = case dict:size(OpenQueries) of
		0 -> satisfied;
		_ -> ?this(clientState)
	end,
	NewState = State#session{openQueries = OpenQueries, clientState = ClientState, msgQueue = MsgQueue},
	{noreply, NewState, ?this(timeout)};
handle_cast({queryReference, QueryId, ReferenceId}, State) ->
	OpenQueries = dict:erase(QueryId, ?this(openQueries)),
	ClientState = case dict:size(OpenQueries) of
		0 -> satisfied;
		_ -> ?this(clientState)
	end,
	MsgQueue = addToQueue(wellFormedQueryReference(QueryId, ReferenceId), ?this(msgQueue)),
	NewState = State#session{openQueries = OpenQueries, clientState = ClientState, msgQueue = MsgQueue},
	{noreply, NewState, ?this(timeout)};
handle_cast({addCleanup, QueryId, CleanupFun }, State) ->
	NewState = State#session{
		openQueries = dict:store(QueryId, [], ?this(openQueries)),
		cleanup = [CleanupFun|?this(cleanup)] 
	},
	{noreply, NewState, ?this(timeout)};
handle_cast({actionResponse, ActionResponse}, State) ->
	MsgQueue = addToQueue(ActionResponse, ?this(msgQueue)),
	NewState = State#session{msgQueue = MsgQueue},
	{noreply, NewState, ?this(timeout)};
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



outputTimer(SessionPid, To) ->
	spawn_link( fun() -> outputTimer(satisfied, SessionPid, To) end).

outputTimer(State, SessionPid, To) ->
	WaitTime = case State of
		satisfied -> 500;
		waiting -> 200
	end,
	receive
		Update -> outputTimer(Update, To, SessionPid)
	after WaitTime ->
		session:flush(SessionPid, To)
	end.

	
%% ====================================================
%% utilities
%% ====================================================

addToQueue(Struct, MsgQueue) ->
	MessageId = case MsgQueue of 
		[] -> 0;
		[{LastMessageId, _}|_] -> LastMessageId
	end,
	[{MessageId + 1, Struct}|MsgQueue].

updateBuffer(MsgQueue, ClientLastMessageId) ->
	Predicate = fun({Id, _}) ->
		if
			Id > ClientLastMessageId -> true;
			true -> false
		end
	end,
	lists:takewhile(Predicate, MsgQueue).

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

% streamUntil(To, MsgQueue, Until) ->
% 	Predicate = fun({Id, _}) ->
% 		if
% 			Id > Until -> true;
% 			true -> false
% 		end
% 	end,
% 	[{LastMessageId, _}|_] = MsgQueueToSend = lists:takewhile(Predicate, MsgQueue),
% 	{_, Updates} = lists:unzip(MsgQueueToSend),
% 	ReverseUpdates = lists:reverse(Updates),
% 	stream(To, ReverseUpdates, LastMessageId),
% 	% ?trace({MsgQueue, Until}),
% 	% ?trace(MsgQueueToSend),
% 	MsgQueueToSend.

%% 
%% stream:: Pid -> List Struct -> Number -> Tuple
%% 
stream(To, Updates) when is_tuple(Updates) ->
	stream(To, [Updates]);
stream(To, MsgQueueToSend) ->
	case MsgQueueToSend of
		[{LastMessageId, _}|_] ->
			{_, Updates} = lists:unzip(MsgQueueToSend),
			ReverseUpdates = lists:reverse(Updates),
			To ! {updates, ReverseUpdates, LastMessageId};
		_ -> To ! timeout
	end.
