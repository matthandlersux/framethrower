%%% -------------------------------------------------------------------
%%% Author  : handler
%%% Description :
%%%
%%% Created : Wed Nov 18 12:05:29 EST 2009
%%% -------------------------------------------------------------------
-module(serialize).

-behaviour(gen_server).

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X]) ).
-define( colortrace(X), io:format("\033[40mTRACE \033[31m~p\033[39m:\033[95m~p\033[39m ~p\033[0m~n~n", [?MODULE, ?LINE, X])).

%% --------------------------------------------------------------------
%% Include files
%% --------------------------------------------------------------------

%% --------------------------------------------------------------------
%% External exports
-export([
	start/0,
	serialize/0,
	unserialize/0
]).

%% gen_server callbacks
-export([init/1, handle_call/3, handle_cast/2, handle_info/2, terminate/2, code_change/3]).

-record (state, {
	filename = "../../data/serialize",
	ets	
}).

%% ====================================================================
%% External functions
%% ====================================================================

%% 
%% new :: ok
%% 		
%%		

start() -> 
	case gen_server:start_link({local, ?MODULE}, ?MODULE, [], []) of
		{ok, Pid} -> Pid;
		Else -> Else
	end,
	ok.

%% 
%% serialize :: ok
%% 		
%%		

serialize() ->
	gen_server:cast(?MODULE, serialize).

%% 
%% unserialize :: ok
%% 		
%%		

unserialize() ->
	gen_server:cast(?MODULE, unserialize).

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
init([]) ->
    {ok, #state{ets = ets:new(serialize, [named_table])}}.

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
handle_cast(unserialize, State) ->
	case ets:file2tab(getFilename(State)) of
		{error, Reason} ->
			?colortrace({serialize_file_error, Reason}),
			{stop, Reason, State};
		{ok, ETS} ->
			State1 = replaceETS(ETS, State),			
			{noreply, State1}
	end;
	
handle_cast(serialize, State) ->
	ETS = getEts(State),
	
	SerializeAllCells = 	fun(CellPointer) ->
								ets:insert(ETS, {cellPointer:name(CellPointer), cellToData(CellPointer)})
							end,
	
	SerializeAllObjects = 	fun({ObjectName, Object}, _Acc) ->
								ets:insert(ETS, {ObjectName, objectToData(Object)}),
								ListOfCellPointers = getCellsFromObject(Object),
								lists:foreach(SerializeAllCells, ListOfCellPointers)
							end,
								
	objectStore:fold(SerializeAllObjects, []),

	Res = ets:tab2file(ETS, getFilename(State)),
	?colortrace(Res),
	{noreply, State};

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

%% ====================================================
%% Internal API
%% ====================================================

%% 
%% objectToData :: Object -> a
%% 		
%%		

objectToData(Object) ->
	Object.

%% 
%% cellToData :: CellPointer -> a
%% 		
%%		

cellToData(CellPointer) ->
	cell:getState(CellPointer).

%% 
%% getCellsFromObject :: Object -> List CellPointer
%% 		
%%		

getCellsFromObject(Object) ->
	Props = object:getProps(Object),
	GetCellPointers = 	fun({_Str, MaybeCellPointer}, ListOfCellPointers) ->
							case cellPointer:isCellPointer(MaybeCellPointer) of
								true ->
									[MaybeCellPointer] ++ ListOfCellPointers;
								_ ->
									ListOfCellPointers
							end
						end,
	lists:foldl(GetCellPointers, [], Props).
	
%% ---------------------------------------------
%% State Functions
%% ---------------------------------------------

%% 
%% getFilename :: SerializeState -> String
%% 		
%%		

getFilename(#state{filename = FileName}) -> 
	FileName.

%% 
%% getEts :: SerializeState -> ETS
%% 		
%%		

getEts(#state{ets = ETS}) ->
	ETS.

%% 
%% replaceETS :: ETS -> SerializeState -> SerializeState
%% 		
%%		

replaceETS(ETS, State) ->
	State#state{ets = ETS}.



