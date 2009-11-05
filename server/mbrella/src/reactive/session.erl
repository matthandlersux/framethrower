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

%% --------------------------------------------------------------------
%% External exports
-export([
	new/1,
	connect/3,
	sendElements/3,
	pipeline/2
]).

%% gen_server callbacks
-export([init/1, handle_call/3, handle_cast/2, handle_info/2, terminate/2, code_change/3]).

-record (state, {
	name,
	queries = dict:new(),
	queue,
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
%% sendElements :: SessionPointer -> From -> Elements -> ok
%% 		
%%		

sendElements(SessionPointer, _From, Elements) ->
	gen_server:cast(sessionPointer:pid(SessionPointer), {sendElements, Elements}).
	
%% 
%% pipeline :: SessionPointer -> Number -> Response
%% 		Response :: timeout | Tuple3 updates JSONStruct Number
%%		

pipeline(SessionPointer, LastMessageId) ->
	gen_server:cast(sessionPointer:pid(SessionPointer), {pipeline, self(), LastMessageId}),
	receive
		JSON -> JSON
	after 45000 ->
		timeout
	end.


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
			State1 = updateLastMessageId(State, LastMessageId),
			{noreply, updateOpenPipe(State1, From)};
		_ ->
			{Queue1, JSONToSend} = processQueue(Queue, LastMessageId),
			From ! JSONToSend,
			State1 = closeOpenPipe(State),
			{noreply, replaceQueue(State1, Queue1)}
	end;
handle_cast({connect, AST, QueryId}, State) ->
	CellPointer = eval:evaluate( parse:parse(AST) ),
	SessionPointer = sessionPointer(State),
	cell:injectOutput(CellPointer, SessionPointer, sessionOutput, [QueryId]),
	State1 = updateQueries(QueryId, CellPointer, State),
	{noreply, State1};
handle_cast({sendElements, Elements}, State) ->
	UnpackElements = 	fun(PackedElement, ListOfQueryUpdates) ->
							QueryId = cellElements:mapKey(PackedElement),
							Value = cellElements:mapValue(PackedElement),
							Modifier = cellElements:modifier(PackedElement),
							[queryUpdate(QueryId, Modifier, Value)|ListOfQueryUpdates]
						end,
	NewQueryUpdates = lists:foldr(UnpackElements, [], Elements),
	State1 = updateQueue(State, NewQueryUpdates),
	
	case getOpenPipe(State) of
		closed ->
			{noreply, State1};
		Pid ->
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
%%% Internal functions
%% --------------------------------------------------------------------

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
%% 	
%%		

processQueue(Queue, LastMessageId) ->
	HasBeenSent = 	fun({MessageId, _ListOfStructs}) when MessageId >= LastMessageId ->
						true;
					(_) ->
						false
					end,
	Queue1 = lists:takewhile(HasBeenSent, Queue),
	{_MessageIds, ListOfListOfStructs} = lists:unzip(Queue1),
	{Queue1, lists:flatten(ListOfListOfStructs)}.

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
%% updateQueue :: SessionState -> List Struct -> SessionState
%% 		places well formed JSON elements into the queue to be sent to the client, returns new state
%%		

updateQueue(#state{queue = []} = State, ListOfStructs) ->
	State#state{queue = [{1, ListOfStructs}]};
updateQueue(#state{queue = [{LastMessageId, _ListOfOldStructs}|_RestOfQueue] = Queue} = State, ListOfStructs) ->
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


