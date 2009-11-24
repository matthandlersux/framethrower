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
	filename = "mbrella/data/serialize.ets"
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
	?trace("Calling Unserialize"),
	gen_server:call(?MODULE, unserialize, 15000).

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
handle_call(unserialize, _From, State) ->
	case ets:file2tab(getFilename(State)) of
		{error, Reason} ->
			?colortrace({serialize_file_error, Reason}),
			{stop, Reason, State};
		{ok, ETS} ->
			RespawnObjects = 	fun({"object." ++ NumString = Name, ObjectData}, {ObjectMax, CellMax}) ->
									Object = dataToObject(ObjectData),
									respawnObject(Object, ETS),
									{ erlang:max(list_to_integer(NumString),ObjectMax), CellMax};									
								({"cell." ++ NumString = Name, CellStateData}, {ObjectMax, CellMax}) ->
									{ObjectMax, erlang:max(list_to_integer(NumString), CellMax)};
								({scope, ScopeState}, Acc) ->
									ScopeState1 = respawnScopeState(ScopeState, ETS),
									action:respawnScopeState(ScopeState1),
									Acc 
								end,
			{ObjectMax, CellMax} = ets:foldl(RespawnObjects, {0,0}, ETS),
			objectStore:setCounter(ObjectMax),
			cellStore:setCounter(CellMax),

			ets:delete(ETS),
			{reply, ok, State}
	end;
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
handle_cast(serialize, State) ->
	ETS = ets:new(serialize, [public]),
	
	SerializeAllCells = 	fun(CellPointer) ->
								ets:insert(ETS, {cellPointer:name(CellPointer), cellToData(CellPointer)})
							end,
	SerializeAllObjects = 	fun({ObjectName, Object}, _Acc) ->
								ets:insert(ETS, {ObjectName, objectToData(Object)}),
								ListOfCellPointers = getCellsFromObject(Object),
								lists:foreach(SerializeAllCells, ListOfCellPointers)
							end,
	objectStore:fold(SerializeAllObjects, []),
	
	ScopeState = action:getScopeState(),
	mblib:scour(
		fun cellPointer:isCellPointer/1,
		fun(CellPointer) ->
			ets:insert(ETS, {cellPointer:name(CellPointer), cellToData(CellPointer)})
		end,
		ScopeState
	),
	ets:insert(ETS, {scope, ScopeState}),
	
	ets:tab2file(ETS, getFilename(State)),
	ets:delete(ETS),
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
	?trace(Info),
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
%% respawnCell :: CellPointer -> ETS -> CellPointer
%% 		takes a cellpointer and respawns its state from serialized data
%%		

respawnCell(CellPointer, ETS) ->
	CellName = cellPointer:name(CellPointer),	
	case cellStore:lookup(CellName) of
		notfound ->
			case ets:lookup(ETS, CellName) of
				[{_Name, CellState}] ->
					CellState1 = dataToCell(CellState),
					CellState2 = cellState:removeSessionOutputs(CellState1),
					CellState3 = respawnCellState(CellState2, ETS),
					% LOOK FOR SELF REFERENCES OR MAKE RESPAWN CELL STATE SMARTER
					
					cell:respawn(CellState3);
				[] ->
					exit(cell_not_in_serialized_data)
			end;
		FoundCellPointer ->
			FoundCellPointer
	end.

%% 
%% respawnCellState :: CellState -> ETS -> CellState
%% 		looks for cellpointers in the cellstate, respawns and replaces those cells, returns updated state
%%		also removes session pointers
%%		

respawnCellState(CellState, ETS) ->
	mblib:scour(fun cellPointer:isCellPointer/1, fun(CellPointer) -> respawnCell(CellPointer, ETS) end, CellState).

%% 
%% respawnScopeState :: ScopeState -> ETS -> ScopeState
%% 		takes the state of the scope and respawns and replaces any cellpointers
%%		

respawnScopeState(ScopeState, ETS) ->
	mblib:scour(fun cellPointer:isCellPointer/1, fun(CellPointer) -> respawnCell(CellPointer, ETS) end, ScopeState).

%% 
%% respawnObject :: Object -> ok
%% 		
%%		

respawnObject(Object, ETS) ->
	Object1 = mblib:scour(fun cellPointer:isCellPointer/1, fun(CellPointer) -> respawnCell(CellPointer, ETS) end, Object),
	objects:respawn(Object1).
	
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
%% dataToCell :: a -> CellState
%% 		
%%		

dataToCell(CellState) ->
	CellState.
	
%% 
%% dataToObject :: a -> Object
%% 		
%%		

dataToObject(Object) ->
	Object.

%% 
%% getCellsFromObject :: Object -> List CellPointer
%% 		
%%		

getCellsFromObject(Object) ->
	Props = objects:getProps(Object),
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

%% ====================================================
%% utilities
%% ====================================================