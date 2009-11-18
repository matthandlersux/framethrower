%%% -------------------------------------------------------------------
%%% Author  : handler
%%% Description :
%%%
%%% Created : Tue Nov  3 12:54:06 EST 2009
%%% -------------------------------------------------------------------
-module(session).

-behaviour(gen_server).

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X]) ).
-define( colortrace(X), io:format("\033[40mTRACE \033[31m~p\033[39m:\033[95m~p\033[39m ~p\033[0m~n~n", [?MODULE, ?LINE, X])).

-define (ServerClientTimeout, 30000).
-define (AdjacentElementDelay, 30).
-define (AdjacentActionDelay, 30).
-define (PipelineWaitDelay, 30).
-define (MaxReruns, 20).
-define (AfterConnectDelay, 500).

%% --------------------------------------------------------------------
%% External exports
%% --------------------------------------------------------------------

-export([
	new/1,
	connect/3, disconnect/2,
	sendElements/3,
	sendActionUpdate/2,
	pipeline/2,
	getState/1
]).

%% gen_server callbacks
-export([init/1, handle_call/3, handle_cast/2, handle_info/2, terminate/2, code_change/3]).

-record (state, {
	name,
	queries = dict:new(),
	queue = [{0,[]}],
	openPipe = closed,
	clientLastMessageId = 1, % this is the last message as reported by the client
	outputTimer,
	reruns = 0
}).

%% ====================================================
%% Notes
%% ====================================================

% ServerClientTimeout: 		time the session waits to hear a message from the client before it dies
% AdjacentElementDelay: 	time the session waits after hearing a message from a cell just in case 
% 								there are more on their way
% AdjacentActionDelay: 		time the session waits after hearing a message from an action just in case 
% 								more messages are on their way
% PipelineWaitDelay:		time the session waits after opening a pipeline if there are already queued 
% 								messages to be sent
% MaxReruns:				max amount of times that consecutive messages can prevent the pipeline 
% 								from sending messages to the client

%% ====================================================
%% types
%% ====================================================

% Queue :: List (Tuple Number (List Struct))
% Queries :: Dict

%% ====================================================================
%% External API
%% ====================================================================

new(Name) -> start_link(Name).
start_link(Name) ->
	case gen_server:start_link(?MODULE, [Name], []) of
		{ok, Pid} -> Pid;
		Else -> Else
	end.

%% 
%% connect :: SessionPointer -> AST -> QueryId -> ok
%% 		evaluates an ast that results in a cellpointer, adds output to cellpointer that sends messages to session
%%		

connect(SessionPointer, AST, QueryId) ->
	gen_server:cast(sessionPointer:pid(SessionPointer), {connect, AST, QueryId}).

%% 
%% disconnect :: SessionPointer -> QueryId
%% 		
%%		

disconnect(SessionPointer, QueryId) ->
	gen_server:cast(sessionPointer:pid(SessionPointer), {disconnect, QueryId}).

%% 
%% sendElements :: SessionPointer -> From -> Elements -> ok
%% 		
%%		

sendElements(SessionPointer, _From, Elements) ->
	gen_server:cast(sessionPointer:pid(SessionPointer), {sendElements, Elements}).

%%
%% sendActionUpdate :: SessionPointer -> ActionUpdate -> ok
%%
%%

sendActionUpdate(SessionPointer, Update) ->
	gen_server:cast(sessionPointer:pid(SessionPointer), {sendActionUpdate, Update}).

%% 
%% pipeline :: SessionPointer -> Number -> Response
%% 		Response :: timeout | Tuple3 updates JSONStruct Number
%%		

pipeline(SessionPointer, ClientLastMessageId) ->
	gen_server:cast(sessionPointer:pid(SessionPointer), {pipeline, self(), ClientLastMessageId}),
	receive
		timeout -> timeout;
		JSON -> JSON
	after ?ServerClientTimeout ->
		timeout
	end.

%% 
%% getState :: SessionPointer -> SessionState
%% 		
%%		

getState(SessionPointer) ->
	gen_server:call(sessionPointer:pid(SessionPointer), getState).



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
init([Name]) ->
    {ok, #state{name = Name}}.

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

handle_call(getState, _From, State) ->
	{reply, State, State};
handle_call(Msg, From, State) ->
    Reply = ok,
    {reply, Reply, State}.

%% --------------------------------------------------------------------
%% Function: handle_cast/2
%% Description: Handling cast messages
%% Returns: {noreply, State}          |
%%          {noreply, State, Timeout} |
%%          {stop, Reason, State}            (terminate/2 is called)
%% --------------------------------------------------------------------

handle_cast({pipeline, From, ClientLastMessageId}, State) ->
	QueueLastMessageId = getQueueLastMessageId(State),
	WaitTime = 	if
					QueueLastMessageId > ClientLastMessageId ->
						?PipelineWaitDelay;
					true ->
						?ServerClientTimeout
				end,
	State1 = updateLastMessageId(State, ClientLastMessageId),
	State2 = updateOpenPipe(State1, From),
	{noreply, State2, WaitTime};
	
handle_cast({connect, AST, QueryId}, State) ->
	CellPointer = eval:evaluate( AST ),
	SessionPointer = sessionPointer(State),
	cell:injectOutput(CellPointer, SessionPointer, sessionOutput, [QueryId]),
	State1 = updateQueries(State, QueryId, CellPointer),
	flushOrWait(State1, ?AfterConnectDelay);
	
handle_cast({disconnect, QueryId}, State) ->
	CellPointer = getQueryCellPointer( State, QueryId ),
	SessionPointer = sessionPointer(State),
	cell:uninjectOutput(CellPointer, SessionPointer, sessionOutput, [QueryId]),
	State1 = removeQuery(State, QueryId),
	flushOrWait(State1, ?AfterConnectDelay);
	
handle_cast({sendElements, []}, State) ->
	% handle donemessage stuff here
	flushOrWait(State, ?AdjacentElementDelay);
	
handle_cast({sendElements, Elements}, State) ->
	UnpackElements = 	fun(PackedElement, ListOfQueryUpdates) ->
							QueryId = cellElements:mapKey(PackedElement),
							Value = cellElements:mapValue(PackedElement),
							Modifier = cellElements:modifier(PackedElement),
							[queryUpdate(QueryId, Modifier, cellElements:create(Modifier, Value))|ListOfQueryUpdates]
						end,
	NewQueryUpdates = lists:foldl(UnpackElements, [], Elements),
	State1 = updateQueue(State, NewQueryUpdates),
	flushOrWait(State1, ?AdjacentElementDelay);
	
handle_cast({sendActionUpdate, Update}, State) ->
	State1 = updateQueue(State, [Update]),
	flushOrWait(State1, ?AdjacentActionDelay);
	
handle_cast(Msg, State) ->
    {noreply, State, ?ServerClientTimeout}.

%% --------------------------------------------------------------------
%% Function: handle_info/2
%% Description: Handling all non call/cast messages
%% Returns: {noreply, State}          |
%%          {noreply, State, Timeout} |
%%          {stop, Reason, State}            (terminate/2 is called)
%% --------------------------------------------------------------------
handle_info(timeout, State) ->
	case getOpenPipe(State) of
		closed ->
			{stop, session_timed_out, State};
		_ ->
			State1 = flush(State),
			{noreply, State1, ?ServerClientTimeout}
	end;
handle_info(Info, State) ->
    {noreply, State}.

%% --------------------------------------------------------------------
%% Function: terminate/2
%% Description: Shutdown the server
%% Returns: any (ignored by gen_server)
%% --------------------------------------------------------------------
terminate(Reason, State) ->
    cleanupSession(State),
	ok.

%% --------------------------------------------------------------------
%% Func: code_change/3
%% Purpose: Convert process state when code is changed
%% Returns: {ok, NewState}
%% --------------------------------------------------------------------
code_change(OldVsn, State, Extra) ->
    {ok, State}.

%% ====================================================
%% Internal API
%% ====================================================

%% 
%% flushOrWait :: SessionState -> Number -> GenServerResponse
%%		GenServerResponse :: Tuple3 noreply SessionState Number
%% 		either flushes data to the client or sets the session to wait the right amount
%%		

flushOrWait(State, Delay) ->
	Reruns = getReruns(State),
	case getOpenPipe(State) of
		closed ->
			{noreply, State, ?ServerClientTimeout};
		_ when Reruns >= ?MaxReruns ->
			State1 = flush(State),
			{noreply, State1, ?ServerClientTimeout};
		_ ->
			State1 = incrementReruns(State),
			{noreply, State1, Delay}
	end.

%% 
%% cleanupSession :: SessionState -> ok
%% 		
%%		

cleanupSession(State) ->
	?colortrace(session_timed_out_need_to_die_ughhhh),
	AllQueryIds = getQueryIds(State),
	lists:foreach(fun(QueryId) -> handle_cast({disconnect, QueryId}, State) end, AllQueryIds),
	ok.

%% 
%% flush :: SessionState -> SessionState
%% 		
%%		

flush(State) ->
	ClientLastMessageId = getLastMessageId(State),
	OpenPipe = getOpenPipe(State),
	State1 = closeOpenPipe(State),
	
	Queue = getQueue(State),
	case Queue of
		[{ClientLastMessageId, _ListOfStructs}|_RestOfQueue] ->
			OpenPipe ! timeout,
			State2 = replaceQueue(State1, [{ClientLastMessageId, []}]);
		_ ->
			{[{NewLastMessageId, _ListOfStructs1}|_RestOfQueue1] = Queue1, JSONToSend} = processQueue(Queue, ClientLastMessageId),
			OpenPipe ! {updates, JSONToSend, NewLastMessageId},
			State2 = replaceQueue(State1, Queue1)
	end,
	
	resetReruns(State2).

%% 
%% queryUpdate :: Number -> Element -> JSONStruct
%% 		used to convert an element to a queryupdate
%%		

queryUpdate(QueryId, Modifier, Element) ->
	Fields = 	case cellElements:isMap(Element) of
					true ->
						Key = cellElements:mapKey(Element),
						Value = cellElements:mapValue(Element),
						[{"key", mblib:exprElementToJson(Key)}, {"value", mblib:exprElementToJson(Value)}];
					_ ->
						[{"key", mblib:exprElementToJson( cellElements:value(Element) ) }]
				end,
	{struct, [{"queryUpdate",
		{struct, [{"queryId", list_to_binary(QueryId)},{"action", Modifier}|Fields]}	
	}]}.
	
%% 
%% processQueue :: Queue -> Number -> Tuple Queue (List Struct)
%% 		there should be at least 2 messages in the queue, ensured by case clause in pipeline
%%		

processQueue(Queue, LastMessageId) ->
	HasBeenSent = 	fun({MessageId, ListOfStructs}, NewQueue) when MessageId >= LastMessageId ->
						[{MessageId, ListOfStructs}|NewQueue];
					(_, NewQueue) ->
						throw(NewQueue)
					end,
	[OldQueueElement|Queue1] = 	try lists:foldl(HasBeenSent, [], Queue)
								catch throw:NewQueue -> NewQueue
								end,
	QueueToSend = lists:reverse(Queue1),
	QueueToStore = QueueToSend ++ [OldQueueElement],
	{_MessageIds, ListOfListOfStructs} = lists:unzip(QueueToSend),
	{QueueToStore, lists:flatten(ListOfListOfStructs)}.

%% ---------------------------------------------
%% state functions
%% ---------------------------------------------

%% 
%% sessionPointer :: SessionState -> SessionPointer
%% 		
%%		

sessionPointer(#state{name = Name}) ->
	sessionPointer:create(Name, self()).

%% 
%% removeQuery :: SessionState -> QueryId -> SessionState
%% 		
%%		

removeQuery(#state{queries = Queries} = State, QueryId) ->
	State#state{queries = dict:erase(QueryId, Queries)}.

%% 
%% getQueryCellPointer :: SessionState -> QueryId -> CellPointer
%% 		
%%		

getQueryCellPointer( #state{queries = Queries} = State, QueryId ) ->
	dict:fetch(QueryId, Queries).
	
%% 
%% getQueryIds :: SessionState -> List Number
%% 		
%%		

getQueryIds(#state{queries = Queries}) ->
	{Ids, _CellPointers} = lists:unzip( dict:to_list(Queries) ),
	Ids.

%% 
%% getReruns :: SessionState -> Number
%% 		
%%		

getReruns(#state{reruns = Reruns}) ->
	Reruns.

%% 
%% incrementReruns :: SessionState -> SessionState
%% 		
%%		

incrementReruns(#state{reruns = Reruns} = State) ->
	State#state{reruns = Reruns + 1}.

%% 
%% resetReruns :: SessionState -> SessionState
%% 		
%%		

resetReruns(#state{reruns = Reruns} = State) ->
	State#state{reruns = 0}.

%% 
%% getQueue :: SessionState -> Queue
%% 		
%%		

getQueue(#state{queue = Queue}) ->
	Queue.
	
%% 
%% getName :: SessionState -> String
%% 		
%%		

getName(#state{name = Name}) -> 
	Name.

%% 
%% getOutputTimer :: SessionState -> Pid
%% 		
%%		

getOutputTimer(#state{outputTimer = OutputTimer}) ->
	OutputTimer.

%% 
%% getQueueLastMessageId :: SessionState -> Number
%% 		
%%		

getQueueLastMessageId(#state{queue = [{LastMessageId, _ListOfStructs1}|_RestOfQueue1]}) ->
	LastMessageId.

%% 
%% getOpenPipe :: State
%% 		
%%		

getOpenPipe(#state{openPipe = OpenPipe}) -> OpenPipe.


%% 
%% getLastMessageId :: SessionState -> Number
%% 		
%%		

getLastMessageId(#state{clientLastMessageId = Number}) -> Number.

%% 
%% replaceQueue :: SessionState -> Queue -> SessionState
%% 		
%%		

replaceQueue(State, Queue) ->
	State#state{queue = Queue}.

%% 
%% updateLastMessageId :: SessionState -> Number -> SessionState
%% 		
%%		

updateLastMessageId(State, LastMessageId) ->
	State#state{clientLastMessageId = LastMessageId}.
	
%% 
%% updateQueries :: SessionState -> QueryId -> CellPointer -> SessionState
%% 		
%%		

updateQueries(#state{queries = Queries} = State, QueryId, CellPointer) ->
	State#state{queries = dict:store(QueryId, CellPointer, Queries)}.

%% 
%% updateQueue :: SessionState -> List Struct -> SessionState
%% 		places well formed JSON elements into the queue to be sent to the client, returns new state
%%		

updateQueue(#state{queue = []} = State, ListOfStructs) ->
	State#state{queue = [{1, ListOfStructs}]};
updateQueue(#state{queue = Queue} = State, ListOfStructs) ->
	[{LastMessageId, _ListOfOldStructs}|_RestOfQueue] = Queue,
	State#state{queue = [{LastMessageId + 1, ListOfStructs}|Queue]}.
	
%% 
%% updateOpenPipe :: SessionState -> Pid -> SessionState
%% 		
%%		

updateOpenPipe(State, Pid) ->
	State#state{openPipe = Pid}.

%% 
%% closeOpenPipe :: SessionState -> SessionState
%% 		
%%		

closeOpenPipe(State) ->
	State#state{openPipe = closed}.

%% 
%% setOutputTimer :: SessionState -> Pid -> SessionState
%% 		
%%		

setOutputTimer(State, OutputTimer) ->
	State#state{outputTimer = OutputTimer}.