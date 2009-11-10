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

% for serveradvice
% 	
% getQueryId (SessionPid) ->
% 	gen_server:call(SessionPid, getQueryId).

sendUpdate (SessionPid, Message) ->
	gen_server:cast(SessionPid, Message).

pipeline(SessionPid, LastMessageId) ->
	gen_server:cast(SessionPid, {pipeline, self(), LastMessageId}),
	receive 
		Json -> Json
	after 45000 ->
		timeout
	end.

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
	% process_flag(trap_exit, true),
	State = #session{},
    {ok, State, ?this(timeout)}.

handle_call(getQueryId, _, State) ->
	NewQueryId = ?this(queryIdCount) + 1,
	Reply = "server." ++ integer_to_list(NewQueryId),
	{reply, Reply, State#session{queryIdCount = NewQueryId}, ?this(timeout)};
handle_call({queryDefine, Expr, QueryId}, _, State) ->
	sendToOutputTimer(?this(outputTimer), waiting),
	NewState = State#session{
		openQueries = dict:store(QueryId, [], ?this(openQueries)),
		clientState = waiting
	},
	{reply, true, NewState, ?this(timeout)}.



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
	ClientState = case dict:size(?this(openQueries)) of
		0 -> 
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