-module (cell).

-behaviour(gen_server).

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X]) ).
-define( colortrace(X), io:format("\033[40mTRACE \033[31m~p\033[39m:\033[95m~p\033[39m ~p\033[0m~n~n", [?MODULE, ?LINE, X])).

-export([init/1, handle_call/3, handle_cast/2, handle_info/2, terminate/2, code_change/3]).
-export ([
	makeCell/0, makeCell/1, makeLinkedCell/0, makeLinkedCell/1, makeCellLeashed/0, 
		makeCellLeashed/1, makeLinkedCellLeashed/0, makeLinkedCellLeashed/1,
	addValue/2, addValues/2, removeValue/2, removeValues/2,
	sendElements/2, sendElements/3,
	leash/1, unleash/1, setFlag/3,
	setBottom/2,
	injectOutput/2, injectOutput/3, injectOutput/4,
	uninjectOutput/2, uninjectOutput/3, uninjectOutput/4,
	injectIntercept/2, injectIntercept/3,
	addInformant/2, removeInformant/2,
	empty/1,
	kill/1,
	getState/1, elementsType/1
	]).
	
%% ====================================================
%% NOTES
%% ====================================================

% figure out what happens if you uninject an output while a cell is leashed

%% ====================================================
%% TYPES
%% ====================================================


%% ====================================================
%% External API
%% ====================================================

%% 
%% create cells
%% 

makeCell() -> makeCell(unit).

makeCell(CellType) ->
	Name = cellStore:getName(),
	{ok, Pid} = gen_server:start(?MODULE, [CellType, {name, Name}], []),
	cellStore:store(Name, Pid),
	cellPointer:new(Name, Pid).
	
makeLinkedCell() -> makeLinkedCell(unit).

makeLinkedCell(CellType) ->
	Name = cellStore:getName(),
	{ok, Pid} = gen_server:start_link(?MODULE, [CellType, {name, Name}], []),
	cellStore:store(Name, Pid),
	cellPointer:new(Name, Pid).

makeCellLeashed() -> makeCellLeashed(unit).

makeCellLeashed(CellType) ->
	Name = cellStore:getName(),
	{ok, Pid} = gen_server:start(?MODULE, [CellType, {leashed, true}, {name, Name}], []),
	cellStore:store(Name, Pid),
	cellPointer:new(Name, Pid).

makeLinkedCellLeashed() -> makeLinkedCellLeashed(unit).

makeLinkedCellLeashed(CellType) ->
	Name = cellStore:getName(),
	{ok, Pid} = gen_server:start_link(?MODULE, [CellType, {leashed, true}, {name, Name}], []),
	cellStore:store(Name, Pid),
	cellPointer:new(Name, Pid).

%% 
%% sendElements :: CellPointer -> CellPointer -> Elements -> ok
%% 		Elements :: List Tuple ("add" | "remove") Value
%%

sendElements(CellPointer, Elements) ->
	sendElements(CellPointer, cellPointer:dummy(), Elements).
	
sendElements(CellPointer, From, Elements) ->
	case cellPointer:isCellPointer(CellPointer) of
		true ->
			Pid = cellPointer:pid(CellPointer);
		_ ->
			Pid = sessionPointer:pid(CellPointer)
	end,
	gen_server:cast(Pid, {sendElements, From, Elements}).
	
%% 
%% addValue :: CellPointer -> Value -> ok
%% 

addValue(CellPointer, Value) ->
	addValues(CellPointer, [Value]).

%% 
%% addValues :: CellPointer -> List Value -> ok
%% 

addValues(CellPointer, Values) ->
	Elements = lists:map(fun(V) -> {add, V} end, Values),
	gen_server:cast(cellPointer:pid(CellPointer), {injectElements, Elements}).
	
%% 
%% removeValue :: CellPointer -> Value -> ok
%% 

removeValue(CellPointer, Value) ->
	removeValues(CellPointer, [Value]).

%% 
%% addValues :: CellPointer -> List Value -> ok
%% 

removeValues(CellPointer, Values) ->
	Elements = lists:map(fun(V) -> {remove, V} end, Values),
	gen_server:cast(cellPointer:pid(CellPointer), {injectElements, Elements}).
	
%% 
%% setFlag :: CellPointer -> Atom -> Bool -> ok
%% 

setFlag(CellPointer, Flag, Setting) ->
	gen_server:cast(cellPointer:pid(CellPointer), {setFlag, Flag, Setting}).

%% 
%% setBottom :: CellPointer -> AST -> ok
%% 		
%%		

setBottom(CellPointer, AST) ->
	gen_server:cast(cellPointer:pid(CellPointer), {setBottom, AST}).
	
%% 
%% elementsType :: CellPointer -> Atom
%% 		
%%		

elementsType(CellPointer) ->
	gen_server:call(cellPointer:pid(CellPointer), elementsType).

%% ====================================================
%% PrimFun API
%% ====================================================

%create cell is defined above

leash(CellPointer) ->
	gen_server:cast(cellPointer:pid(CellPointer), {setFlag, leashed, true}).
	
unleash(CellPointer) ->
	gen_server:cast(cellPointer:pid(CellPointer), unleash).

%% 
%% injectOutput :: CellPointer -> CellPointer -> ok
%% 

injectOutput(CellPointer, OutputToCellPointer) ->
	injectOutput(CellPointer, OutputToCellPointer, send).

%% 
%% injectOutput :: CellPointer -> CellPointer -> Atom -> ok
%% 

injectOutput(CellPointer, OutputToCellPointer, OutputName) ->
	injectOutput(CellPointer, OutputToCellPointer, OutputName, []).

%% 
%% injectOutput :: CellPointer -> CellPointer -> Atom -> List a -> ok
%% 
	
injectOutput(CellPointer, OutputToCellPointer, OutputName, Arguments) ->
	OutputFunction = {OutputName, Arguments},
	gen_server:cast(
		cellPointer:pid(CellPointer),
		{injectOutput, OutputToCellPointer, OutputFunction}
	).
	
%% 
%% uninjectOutput :: CellPointer -> CellPointer -> ok
%% 		
%%		 

uninjectOutput(CellPointer, OutputToCellPointer) ->
	uninjectOutput(CellPointer, OutputToCellPointer, send).

%% 
%% uninjectOutput :: CellPointer -> CellPointer -> Atom -> ok
%% 		
%%		

uninjectOutput(CellPointer, OutputToCellPointer, OutputName) ->
	uninjectOutput(CellPointer, OutputToCellPointer, OutputName, []).
	
%% 
%% uninjectOutput :: CellPointer -> CellPointer -> Atom -> List a -> ok
%% 		
%%		

uninjectOutput(CellPointer, OutputToCellPointer, OutputName, Arguments) ->
	OutputFunction = {OutputName, Arguments},
	gen_server:cast(
		cellPointer:pid(CellPointer),
		{uninjectOutput, OutputToCellPointer, OutputFunction}
	).

%% 
%% injectIntercept :: CellPointer -> InterceptName -> ok
%% 

injectIntercept(CellPointer, InterceptName) ->
	injectIntercept(CellPointer, InterceptName, []).

%% 
%% injectIntercept :: CellPointer -> InterceptName -> List a -> ok
%% 

injectIntercept(CellPointer, InterceptName, Args) ->
	Intercept = intercepts:construct(InterceptName, Args),
	gen_server:cast(
		cellPointer:pid(CellPointer),
		{injectIntercept, Intercept}
	).
	
%% 
%% addInformant :: CellPointer -> CellPointer -> ok
%% 

addInformant(CellPointer, Informant) ->
	gen_server:cast(cellPointer:pid(CellPointer), {addInformant, Informant}).
	
%% 
%% removeInformant :: CellPointer -> CellPointer -> ok
%% 

removeInformant(CellPointer, Informant) ->
	gen_server:cast(cellPointer:pid(CellPointer), {removeInformant, Informant}).
	
%% 
%% kill :: CellPointer -> ok
%% 		
%%		

kill(CellPointer) ->
	gen_server:cast(cellPointer:pid(CellPointer), kill).

%% 
%% empty :: CellPointer -> ok
%% 		
%%		

empty(CellPointer) ->
	gen_server:cast(cellPointer:pid(CellPointer), empty).

%% ====================================================
%% Debug API
%% ====================================================

getState(CellPointer) ->
	gen_server:call(cellPointer:pid(CellPointer), getState).

%% ====================================================
%% gen_server callbacks
%% ====================================================


%% 
%% init :: List Atom | EmptyList -> Tuple Atom CellState
%% Flags :: List Tuple Atom b 
%%			b :: leashed | unleashed | etc...
%% 

init([]) ->
	process_flag(trap_exit, true),
    {ok, cellState:new()};
init([Type]) when is_atom(Type) ->
	process_flag(trap_exit, true),
	{ok, cellState:new(Type)};
init([Type|Flags]) ->
	process_flag(trap_exit, true),
    {ok, cellState:new(Type, Flags)}.


handle_call(elementsType, _From, State) ->
	CellElements = cellState:getElements(State),
	{reply, cellElements:type(CellElements), State};
handle_call(getState, _From, State) ->
	{reply, State, State};
handle_call(Msg, From, State) ->
    Reply = ok,
    {reply, Reply, State}.


handle_cast({addInformant, InformantCellPointer}, State) ->
	{noreply, cellState:addInformant(State, InformantCellPointer)};

handle_cast({removeInformant, InformantCellPointer}, State) ->
	{noreply, cellState:removeInformant(State, InformantCellPointer)};

handle_cast({injectIntercept, InterceptPointer}, State) ->
	Informants = intercepts:getArguments(InterceptPointer),
	Informants1 = cellPointer:filterList(Informants),
	Informants2 = Informants1 -- [cellState:cellPointer(State)],
	State1 = cellState:addInformants(State, Informants2),
	{noreply, cellState:injectIntercept(State1, InterceptPointer)};

handle_cast({injectElements, Elements}, CellState) ->
	CellState1 = injectElements(CellState, Elements),
	{noreply, CellState1};
	
handle_cast({sendElements, From, Elements}, State) ->
	if
		Elements =:= [] ->
			{noreply, cellState:setDone(State, From)};
		true -> 
			State2 = 
				case cellState:getIntercept(State) of
					undefined ->
						NewElements = Elements,
						cellState:setDone(State, From);
					Intercept ->
						{InterceptState, NewElements} = intercepts:call(Intercept, From, Elements),
						State1 = cellState:updateInterceptState(State, InterceptState),
						cellState:setDone(State1, From)
				end,
	
			CellState = injectElements(State2, NewElements),
			
			% TODO!! IF FLAG IS SET, CHECK IF EMPTY, KILL CELL IF NECESSARY
			{noreply, CellState}
	end;

handle_cast({injectOutput, OutputTo, OutputFunction}, State) ->
	case cellPointer:isCellPointer(OutputTo) of
		true ->
			link(cellPointer:pid(OutputTo));
		_ ->
			link(sessionPointer:pid(OutputTo))
	end,
	NewState1 = cellState:injectOutput(State, OutputFunction, OutputTo),
	Outputs = cellState:getOutputs(NewState1),
	Output = outputs:getOutput(OutputFunction, Outputs),
	NewState2 = outputAllElements(NewState1, Output, OutputTo),
	{noreply, NewState2};

handle_cast({uninjectOutput, OutputTo, OutputFunction}, State) ->
	case cellPointer:isCellPointer(OutputTo) of
		true ->
			unlink(cellPointer:pid(OutputTo));
		_ ->
			unlink(sessionPointer:pid(OutputTo))
	end,
	Outputs = cellState:getOutputs(State),
	Output = outputs:getOutput(OutputFunction, Outputs),
	% NewState = unoutputAllElements(State, Output, OutputTo),
	State1 = cellState:uninjectOutput(State, OutputFunction, OutputTo),
	{noreply, State1};

handle_cast({setFlag, Flag, Setting}, State) ->
	{noreply, cellState:setFlag(State, Flag, Setting)};

handle_cast({setBottom, Bottom}, State) ->
	{noreply, cellState:updateBottom(State, Bottom)};

handle_cast(kill, State) ->
	{stop, normal, cellState:setFlag(State, leashed, true)};
	
handle_cast(empty, State) ->
	{noreply, cellState:emptyElements(State)};
	
handle_cast(unleash, CellState) ->
	% need to get the stash and do a bunch of shit here, damnit
	Elements = cellState:getStash(CellState),
	CellState1 = cellState:emptyStash(CellState),
	{CellState2, Elements1} = cellState:injectElements(CellState1, Elements),
	
	CellState3 = cellState:setFlag(CellState2, leashed, false),
	Dock = cellState:getDock(CellState3),
	CellState4 = cellState:emptyDock(CellState3),
	SelfPointer = cellState:cellPointer(CellState4),
	OutputDock = 	fun({CellPointer, ElementList}) ->
						sendElements(CellPointer, SelfPointer, ElementList)
					end,
	lists:foreach(OutputDock, Dock),
	
	CellState5 = runOutputs(CellState4, Elements1),
	{noreply, CellState5}.

terminate(normal, State) ->
	?trace(killed),
	% TODO: remove from mewpile and 
    Outputs = cellState:getOutputs(State),
	UnOutputAll = 	fun(Output) ->
						Connections = outputs:getConnections(Output),
						SendUnOutput = 	fun(Connection) ->
											unoutputAllElements(State, Output, Connection)
										end,
						lists:foreach(SendUnOutput, Connections)
					end,
	lists:foreach(UnOutputAll, Outputs);
	% tell all informants to remove you maybe?
terminate(Reason, State) ->
	Reason.

handle_info(Info, State) ->
    {noreply, State}.

code_change(OldVsn, State, Extra) ->
    {ok, State}.

%% ====================================================
%% Internal API
%% ====================================================

%% 
%% runOutputs :: CellState -> List Elements -> CellState
%%		runOutputs takes the cellState and Elements to be sent
%%		it runs the elements through each output, then sends the results to the connections of that output
%%		it then updates the states of all the outputs, and returns a new cellstate
%% 

runOutputs(State, NewElements) ->
	ListOfOutputs = cellState:getOutputs(State),
	AllElements = cellState:getElements(State),
	From = cellState:cellPointer(State),
	Processor = 	fun(Output, ListOfNewStates) ->
						{NewOutputState, ElementsToSend} = outputs:call(Output, AllElements, NewElements),
						ListOfConnections = outputs:getConnections(Output),
						sendTo(ListOfConnections, From, ElementsToSend),
						[NewOutputState] ++ ListOfNewStates
					end,
	ListOfNewStates = lists:foldr(Processor, [], ListOfOutputs),
	%% NOTE: needs to be in the same order as the outputs are in getOutputs above, which means
	%% 		may need to add the name of the output along with the state in the future (if List Output changes)
	cellState:updateOutputStates(ListOfNewStates, State).

%% 
%% sendTo :: List CellPointer -> CellPointer -> List Element -> void
%% 

sendTo(CellPointers, From, Elements) ->
	Send = 	fun(Pointer) ->
				sendToProcess(Pointer, From, Elements)
			end,
	lists:foreach(Send, CellPointers).

%% 
%% sendToProcess :: Pointer -> Pid -> List Element -> ok
%% 		
%%		

sendToProcess(Pointer, From, Elements) ->
	case cellPointer:isCellPointer(Pointer) of
		true ->
			cell:sendElements(Pointer, From, Elements);
		_ ->
			session:sendElements(Pointer, From, Elements)
	end.

%% 
%% outputAllElements :: CellState -> Output -> CellPointer -> CellState
%% 

outputAllElements(CellState, Output, OutputTo) ->
	AllElements = cellState:getElements(CellState),
	ElementsList = cellElements:toList(AllElements),
	ThisCell = cellState:cellPointer(CellState),
	{OutputState, NewElements} = outputs:call(Output, AllElements, ElementsList),
	NewCellState = cellState:updateOutputState(CellState, Output, OutputState),
	
	IsDone = cellState:isDone(CellState),
	WaitForDone = cellState:getFlag(CellState, waitForDone),
	IsLeashed = cellState:getFlag(CellState, leashed),
	
	if
		IsLeashed orelse (WaitForDone andalso (not IsDone)) ->
			cellState:updateDock(NewCellState, OutputTo, NewElements);
		true ->
			ExtraElements = cellState:getDock(NewCellState, OutputTo),
			NewCellState1 = cellState:emptyDock(NewCellState, OutputTo),
			sendToProcess(OutputTo, ThisCell, NewElements ++ ExtraElements),
			NewCellState1
	end.

%% 
%% unoutputAllElements :: CellState -> Output -> CellPointer -> CellState
%% 		
%%		

unoutputAllElements(CellState, Output, OutputTo) ->
	AllElements = cellState:getElements(CellState),
	ElementsList = cellElements:toListOfRemoves(AllElements),
	ThisCell = cellState:cellPointer(CellState),
	{OutputState, NewElements} = outputs:call(Output, AllElements, ElementsList),
	NewCellState = cellState:updateOutputState(CellState, Output, OutputState),
	cell:sendElements(OutputTo, ThisCell, NewElements),
	NewCellState.


%% 
%% injectElements :: CellState -> List Element -> CellState
%% 

injectElements(CellState, Elements) ->
	IsDone = cellState:isDone(CellState),
	WaitForDone = cellState:getFlag(CellState, waitForDone),
	IsLeashed = cellState:getFlag(CellState, leashed),
	
	if
		IsLeashed orelse (WaitForDone andalso (not IsDone)) ->
			cellState:updateStash(CellState, Elements);
		true ->
			Elements1 = cellState:getStash(CellState),
			CellState1 = cellState:emptyStash(CellState),
			{CellState2, Elements2} = cellState:injectElements(CellState1, Elements ++ Elements1),
			runOutputs(CellState2, Elements2)
	end.
		
%% ====================================================
%% Utilities
%% ====================================================