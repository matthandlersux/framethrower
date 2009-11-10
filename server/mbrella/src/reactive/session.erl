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

-define( ServerClientTimeout, 30000 ).
-define( MaxReruns, 100 ).
-define( TimeWindow, 30 ).

%% --------------------------------------------------------------------
%% External exports
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
	lastMessageId = 1 % this is the last message as reported by the client
}).

%% ====================================================
%% Notes
%% ====================================================

% TODO: figure out how we are going to uninject outputs for a queryid, and when that happens

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

pipeline(SessionPointer, LastMessageId) ->
	gen_server:cast(sessionPointer:pid(SessionPointer), {pipeline, self(), LastMessageId}),
	pipelineTimeout(?TimeWindow, LastMessageId).

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

handle_cast({pipeline, From, LastMessageId}, State) ->
	Queue = getQueue(State),
	case Queue of
		[{LastMessageId, _ListOfStructs}|_RestOfQueue] ->
			{noreply, updateOpenPipe(State, From)};
		_ ->
			{[{NewLastMessageId, _ListOfStructs1}|_RestOfQueue1] = Queue1, JSONToSend} = processQueue(Queue, LastMessageId),
			From ! {updates, JSONToSend, NewLastMessageId},
			% State1 = closeOpenPipe(State),
			State2 = updateLastMessageId(State, LastMessageId),
			{noreply, replaceQueue(State2, Queue1)}
	end;
handle_cast({connect, AST, QueryId}, State) ->
	CellPointer = eval:evaluate( AST ),
	SessionPointer = sessionPointer(State),
	cell:injectOutput(CellPointer, SessionPointer, sessionOutput, [QueryId]),
	State1 = updateQueries(State, QueryId, CellPointer),
	{noreply, State1};
handle_cast({disconnect, QueryId}, State) ->
	CellPointer = getQueryCellPointer( State, QueryId ),
	SessionPointer = sessionPointer(State),
	cell:uninjectOutput(CellPointer, SessionPointer, sessionOutput, [QueryId]),
	State1 = removeQuery(State, QueryId),
	{noreply, State1};
handle_cast({sendElements, []}, State) ->
	% handle donemessage stuff here
	{noreply, State};
handle_cast({sendElements, Elements}, State) ->
	UnpackElements = 	fun(PackedElement, ListOfQueryUpdates) ->
							QueryId = cellElements:mapKey(PackedElement),
							Value = cellElements:mapValue(PackedElement),
							Modifier = cellElements:modifier(PackedElement),
							[queryUpdate(QueryId, Modifier, cellElements:create(Modifier, Value))|ListOfQueryUpdates]
						end,
	NewQueryUpdates = lists:foldl(UnpackElements, [], Elements),
	State1 = updateQueue(State, NewQueryUpdates),
	case getOpenPipe(State1) of
		closed ->
			{noreply, State1};
		Pid ->
			% if is_process_alive(Pid) ->
			handle_cast({pipeline, Pid, getLastMessageId(State1)}, State1)
	end;
handle_cast({sendActionUpdate, Update}, State) ->
	State1 = updateQueue(State, [Update]),
	case getOpenPipe(State1) of
		closed ->
			{noreply, State1};
		Pid ->
			% if is_process_alive(Pid) ->
			handle_cast({pipeline, Pid, getLastMessageId(State1)}, State1)
	end;
handle_cast(Msg, State) ->
    {noreply, State}.

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
    ok.

%% --------------------------------------------------------------------
%% Func: code_change/3
%% Purpose: Convert process state when code is changed
%% Returns: {ok, NewState}
%% --------------------------------------------------------------------
code_change(OldVsn, State, Extra) ->
    {ok, State}.

%% --------------------------------------------------------------------
%%% Internal API
%% --------------------------------------------------------------------

%% 
%% pipelineTimeout :: Number -> Number -> Updates | timeout
%% 		Updates :: Tuple3 updates (List Struct) Number
%% 		pipelineTimeout keeps the pipeline open for some small amount of time incase there are multiple 
%%			messages coming in rapid succession.  this way you dont need x pipeline calls from the client for x messages
%%		
	
pipelineTimeout(TimeWindow, LastMessageId) ->
	pipelineTimeout(TimeWindow, {updates, [], LastMessageId}, 0).
pipelineTimeout(TimeWindow, {updates, JSONStructs, LastMessageId}, Reruns) ->
	receive
		{updates, JSONStructs1, LastMessageId1} ->
			receive
				{updates, JSONStructs2, LastMessageId2} when Reruns =< ?MaxReruns -> 
					pipelineTimeout(TimeWindow, {updates, JSONStructs1 ++ JSONStructs2 ++ JSONStructs, LastMessageId2}, Reruns + 1)
			after TimeWindow ->
				{updates, JSONStructs1 ++ JSONStructs, LastMessageId1}
			end
	after ?ServerClientTimeout ->
		timeout
	end.

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
%% updateQueries :: SessionState -> QueryId -> CellPointer -> SessionState
%% 		
%%		

updateQueries(#state{queries = Queries} = State, QueryId, CellPointer) ->
	State#state{queries = dict:store(QueryId, CellPointer, Queries)}.
	
%% 
%% getQueryCellPointer :: SessionState -> QueryId -> CellPointer
%% 		
%%		

getQueryCellPointer( #state{queries = Queries} = State, QueryId ) ->
	dict:fetch(QueryId, Queries).
	
%% 
%% removeQuery :: SessionState -> QueryId -> SessionState
%% 		
%%		

removeQuery(#state{queries = Queries} = State, QueryId) ->
	State#state{queries = dict:erase(QueryId, Queries)}.

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
%% getQueue :: SessionState -> Queue
%% 		
%%		

getQueue(#state{queue = Queue}) ->
	Queue.
	
%% 
%% replaceQueue :: SessionState -> Queue -> SessionState
%% 		
%%		

replaceQueue(State, Queue) ->
	State#state{queue = Queue}.

%% 
%% updateOpenPipe :: SessionState -> Pid -> SessionState
%% 		openpipe contains the pid of an open pipeline session
%%		

updateOpenPipe(State, Pid) ->
	State#state{openPipe = Pid}.
	
%% 
%% closeOpenPipe :: SessionState -> SessionState
%% 		closes the openpipe session
%%		

closeOpenPipe(State) ->
	State#state{openPipe = closed}.

%% 
%% updateLastMessageId :: SessionState -> Number -> SessionState
%% 		
%%		

updateLastMessageId(State, LastMessageId) ->
	State#state{lastMessageId = LastMessageId}.


%% 
%% getOpenPipe :: SessionState -> Pid | Atom
%% 		
%%		

getOpenPipe(#state{openPipe = Pipe}) -> Pipe.

%% 
%% getLastMessageId :: SessionState -> Number
%% 		
%%		

getLastMessageId(#state{lastMessageId = Number}) -> Number.


