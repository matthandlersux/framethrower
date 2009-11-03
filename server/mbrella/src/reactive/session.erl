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
-export([]).

%% gen_server callbacks
-export([init/1, handle_call/3, handle_cast/2, handle_info/2, terminate/2, code_change/3]).

-record (state, {
	name,
	queries = dict:new(),
	queryId = 0,
	lastMessageId = 0,
	msgQueue
}).

%% ====================================================
%% Notes
%% ====================================================

% session is a hybrid cell that dies if it doesnt hear messages from the client
% TODO: figure out how to uninject outputs for a queryid

%% ====================================================================
%% External API
%% ====================================================================

new() -> start_link().
start_link() ->
	case gen_server:start_link(?MODULE, [], []) of
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
	try gen_server:call(sessionPointer:pid(SessionPointer), {pipeline, LastMessageId}, 45000)
	catch
		Exit:Reason -> 
			?colortrace({Exit,Reason}),
			timeout;
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
init() ->
    {ok, #state{}}.

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
							Modifer = cellElements:modifier(PackedElement),
							[queryUpdate(QueryId, Modifier, Value)|ListOfQueryUpdates]
						end,
	NewQueryUpdates = lists:foldr(UnpackElements, [], Elements),
	{noreply, updateQueue(State, NewQueryUpdates)};
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

queryUpdate(QueryId, Element) ->
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

updateQueries(#state{queries = Queries}, QueryId, CellPointer) ->
	#state{queries = dict:store(QueryId, CellPointer, Queries)}.

%% 
%% updateQueue :: SessionState -> List Struct -> SessionState
%% 		places well formed JSON elements into the queue to be sent to the client, returns new state
%%		

updateQueue(#state{queue = []}, ListOfStructs) ->
	#state{queue = [{1, ListOfStructs}]};
updateQueue(#state{queue = [{LastMessageId, _ListOfOldStructs}|_RestOfQueue] = Queue}, ListOfStructs) ->
	#state{queue = [{LastMessageId + 1, ListOfStructs}|Queue]}.

