%% @author Matt Handler <matt.handler@gmail.com>
%% @copyright 2009 author.

%% @doc Session backend for pipeline.

-module (session).
-compile (export_all).

-behaviour(gen_server).

-include ("../../mbrella/include/scaffold.hrl").

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

checkQuery(SessionPid, Expr, QueryId, ResponseFun) ->
	gen_server:cast(SessionPid, {checkQuery, Expr, QueryId, ResponseFun}).

serverAdviceDone(SessionPid) ->
	gen_server:cast(SessionPid, serverAdviceDone).

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
			sendToOutputTimer(?this(outputTimer), waiting),
			NewState = State#session{
				openQueries = dict:store(QueryId, open, ?this(openQueries)),
				serverAdviceHash = dict:store(Expr, QueryId, ?this(serverAdviceHash)),
				clientState = waiting
			},
			true
	end,
	{reply, Reply, NewState, ?this(timeout)};
handle_call(Other, _, State) ->
	?trace("WRONG CALL"),
	?trace(Other),
	{reply, ok, State}.


handle_cast({pipeline, From, ClientLastMessageId}, State) ->
	OutputTimer = startOutputTimer(?this(clientState), self(), From),
	MsgQueue = updateBuffer(?this(msgQueue), ClientLastMessageId),
	NewState = State#session{msgQueue = MsgQueue, outputTimer = OutputTimer},
	{noreply, NewState, ?this(timeout)};
handle_cast({flush, To}, State) ->
	stream(To, ?this(msgQueue)),
	ClientState = case ?this(clientState) of
		allDone -> satisfied;
		sendNow -> satisfied;
		waiting -> satisfied;
		CurrentState -> CurrentState
	end,
	{noreply, State#session{clientState = ClientState}, ?this(timeout)};
	
	
handle_cast({queryDefine, ExprString, QueryId}, State) ->
	?trace("Query Define"),
	MsgQueue = addToQueue(wellFormedQueryDefine(ExprString, QueryId), ?this(msgQueue)),
	{noreply, State#session{msgQueue = MsgQueue}, ?this(timeout)};
handle_cast({data, {QueryId, Action, Data}}, State) ->
	MsgQueue = addToQueue(wellFormedUpdate(Data, QueryId, Action), ?this(msgQueue)),
	case(?this(clientState)) of
		satisfied -> sendToOutputTimer(?this(outputTimer), waiting);
		_ -> nosideeffect
	end,	
	{noreply, State#session{msgQueue = MsgQueue, clientState = waiting}, ?this(timeout)};
handle_cast({done, QueryId}, State) ->
	MsgQueue = addToQueue(wellFormedUpdate(QueryId, done), ?this(msgQueue)),
	OpenQueries = dict:erase(QueryId, ?this(openQueries)),
	NewState = updateClientState(State#session{openQueries = OpenQueries}),
	NewerState = NewState#session{msgQueue = MsgQueue},
	{noreply, NewerState, ?this(timeout)};
handle_cast({queryReference, QueryId, ReferenceId}, State) ->
	OpenQueries = dict:erase(QueryId, ?this(openQueries)),
	NewState = updateClientState(State#session{openQueries = OpenQueries}),	
	MsgQueue = addToQueue(wellFormedQueryReference(QueryId, ReferenceId), ?this(msgQueue)),
	NewerState = NewState#session{msgQueue = MsgQueue},
	{noreply, NewerState, ?this(timeout)};
handle_cast({addCleanup, QueryId, CleanupFun }, State) ->
	NewState = State#session{
		openQueries = dict:store(QueryId, [], ?this(openQueries)),
		cleanup = [CleanupFun|?this(cleanup)] 
	},
	{noreply, NewState, ?this(timeout)};
handle_cast({actionResponse, ActionResponse}, State) ->
	MsgQueue = addToQueue(ActionResponse, ?this(msgQueue)),
	NewState = State#session{msgQueue = MsgQueue, clientState = waiting},
	sendToOutputTimer(?this(outputTimer), sendNow),
	{noreply, NewState, ?this(timeout)};
handle_cast({registerTemplate, {Name, Template}}, State) ->
	NewState = State#session{
		templates = dict:store(Name, Template, ?this(templates))
	},
	{noreply, NewState, ?this(timeout)};
handle_cast({serverAdviceRequest, ServerAdviceRequest}, State) ->
	sendToOutputTimer(?this(outputTimer), waiting),
	serverAdvice:processServerAdvice(ServerAdviceRequest, ?this(templates), self()),
	{noreply, State#session{clientState = waiting, serverAdviceCount = ?this(serverAdviceCount) + 1}, ?this(timeout)};
handle_cast(serverAdviceDone, State) ->
	ServerAdviceCount = ?this(serverAdviceCount) - 1,
	NewState = updateClientState(State#session{serverAdviceCount = ServerAdviceCount}),
	{noreply, NewState, ?this(timeout)};
handle_cast({checkQuery, Expr, QueryId, ResponseFun}, State) ->
	OpenQueries = dict:store(QueryId, open, ?this(openQueries)),
	% TODO: uncomment this stuff for serverAdvice
	% NewState = case dict:find(Expr, ?this(serverAdviceHash)) of
	% 	{ok, ReferenceId} ->
	% 		sendToOutputTimer(?this(outputTimer), waiting),
	% 		ResponseFun({false, ReferenceId}),
	% 		State#session{openQueries = OpenQueries, clientState = waiting};
	% 	_ ->
	sendToOutputTimer(?this(outputTimer), waiting),
	% ServerAdviceHash = dict:store(Expr, defined, ?this(serverAdviceHash)),
	ResponseFun(true),
	NewState = State#session{openQueries = OpenQueries, clientState = waiting},
	% end,
	{noreply, NewState, ?this(timeout)}.


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
%% Output Timer
%%
startOutputTimer(State, SessionPid, To) ->
	spawn_link( fun() -> outputTimer(State, SessionPid, To) end).

sendToOutputTimer(OutputTimer, State) ->
	case OutputTimer of
		undefined -> nosideeffect;
		Pid -> Pid ! State
	end.

outputTimer(State, SessionPid, To) ->
	WaitTime = case State of
		allDone -> 0;
		sendNow -> 30;
		satisfied -> 30000;
		waiting -> 200
	end,
	receive
		Update -> outputTimer(Update, SessionPid, To)
	after WaitTime ->
		session:flush(SessionPid, To)
	end.



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


%% ====================================================
%% utilities
%% ====================================================

updateClientState(State) ->
	ClientState = case {dict:size(?this(openQueries)), ?this(serverAdviceCount)} of
		{0,0} -> 
			sendToOutputTimer(?this(outputTimer), allDone),
			allDone;
		_ -> 
			?this(clientState)
	end,
	State#session{clientState = ClientState}.


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
	Data1 = case Data of
		%TODO: tag key/val pairs in cells as {pair, Key, Val} so it doesn't conflict with objectPointer
		{pair, Key, Value} -> [{"key", mblib:exprElementToJson(Key)},{"value", mblib:exprElementToJson(Value)}];
		_ -> [{"key", mblib:exprElementToJson(Data)}]
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